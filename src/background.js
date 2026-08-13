import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase.js";

const SESSION_ALARM = "focusShieldSessionEnd";

async function fetchBlockedSites() {
  try {
    const snapshot = await getDocs(collection(db, "blockedSites"));
    const blockedSites = snapshot.docs[0]?.data()?.sites || [];
    setupBlocking(convertToReusableURL(blockedSites));
  } catch (error) {
    console.error("Failed to fetch blocked sites:", error);
  }
}

function convertToReusableURL(urlList) {
  const formatted = [];

  for (const oldURL of urlList) {
    try {
      const normalized = /^https?:\/\//i.test(oldURL) ? oldURL : `https://${oldURL}`;
      const { hostname } = new URL(normalized);
      formatted.push(`*://*.${hostname.replace(/^www\./, "")}/*`);
    } catch (error) {
      console.warn("Invalid blocked URL:", oldURL, error);
    }
  }

  return formatted;
}

async function setupBlocking(urlPatterns) {
  const rules = urlPatterns.map((pattern, index) => ({
    id: 1000 + index,
    priority: 1,
    action: {
      type: "redirect",
      redirect: { extensionPath: "/block.html" }
    },
    condition: {
      urlFilter: pattern.replace("*://*.", "").replace("/*", ""),
      resourceTypes: ["main_frame"]
    }
  }));

  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingRules.map((rule) => rule.id),
    addRules: rules
  });
}

async function disableBlocking() {
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  if (existingRules.length === 0) return;

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingRules.map((rule) => rule.id)
  });
}

async function scheduleSessionEnd(endTime) {
  await chrome.alarms.clear(SESSION_ALARM);
  if (endTime) {
    chrome.alarms.create(SESSION_ALARM, { when: endTime });
  }
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== SESSION_ALARM) return;

  const { pomodoroState } = await chrome.storage.local.get("pomodoroState");
  if (!pomodoroState?.isRunning) return;

  const nextIsWorkSession = !pomodoroState.isWorkSession;
  const nextLength = nextIsWorkSession
    ? pomodoroState.workDuration || 1500
    : pomodoroState.breakDuration || 300;

  const nextState = {
    ...pomodoroState,
    isWorkSession: nextIsWorkSession,
    isRunning: false,
    endTime: null,
    remainingSeconds: nextLength
  };

  await chrome.storage.local.set({ pomodoroState: nextState });
  await disableBlocking();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handleMessage = async () => {
    if (message === "refreshBlocklist") {
      await fetchBlockedSites();
    } else if (message === "disableBlocklist") {
      await disableBlocking();
    } else if (message?.type === "scheduleSessionEnd") {
      await scheduleSessionEnd(message.endTime);
    } else if (message?.type === "cancelSessionEnd") {
      await chrome.alarms.clear(SESSION_ALARM);
    }
  };

  handleMessage()
    .then(() => sendResponse({ ok: true }))
    .catch((error) => {
      console.error("FocusShield background error:", error);
      sendResponse({ ok: false, error: error.message });
    });

  return true;
});
