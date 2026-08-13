import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase.js";

const SESSION_ALARM = "focusShieldSessionEnd";

async function getBlockingState() {
  const { manualBlocking = false, timerBlocking = false } = await chrome.storage.local.get([
    "manualBlocking",
    "timerBlocking"
  ]);
  return { manualBlocking, timerBlocking };
}

async function fetchBlockedSites() {
  const snapshot = await getDocs(collection(db, "blockedSites"));
  const blockedSites = snapshot.docs[0]?.data()?.sites || [];
  return convertToReusableURL(blockedSites);
}

function convertToReusableURL(urlList) {
  return urlList.flatMap((oldURL) => {
    try {
      const normalized = /^https?:\/\//i.test(oldURL) ? oldURL : `https://${oldURL}`;
      const { hostname } = new URL(normalized);
      return [`*://*.${hostname.replace(/^www\./, "")}/*`];
    } catch {
      return [];
    }
  });
}

async function enableBlocking() {
  const urlPatterns = await fetchBlockedSites();
  const rules = urlPatterns.map((pattern, index) => ({
    id: 1000 + index,
    priority: 1,
    action: { type: "redirect", redirect: { extensionPath: "/block.html" } },
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
  if (!existingRules.length) return;
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingRules.map((rule) => rule.id)
  });
}

async function syncBlocking() {
  const { manualBlocking, timerBlocking } = await getBlockingState();
  if (manualBlocking || timerBlocking) await enableBlocking();
  else await disableBlocking();
}

async function scheduleSessionEnd(endTime) {
  await chrome.alarms.clear(SESSION_ALARM);
  if (endTime) chrome.alarms.create(SESSION_ALARM, { when: endTime });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== SESSION_ALARM) return;

  const { pomodoroState } = await chrome.storage.local.get("pomodoroState");
  if (!pomodoroState?.isRunning) return;

  const nextIsWorkSession = !pomodoroState.isWorkSession;
  const nextLength = nextIsWorkSession
    ? pomodoroState.workDuration || 1500
    : pomodoroState.breakDuration || 300;

  await chrome.storage.local.set({
    timerBlocking: false,
    pomodoroState: {
      ...pomodoroState,
      isWorkSession: nextIsWorkSession,
      isRunning: false,
      endTime: null,
      remainingSeconds: nextLength
    }
  });
  await syncBlocking();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handleMessage = async () => {
    if (message?.type === "setManualBlocking") {
      await chrome.storage.local.set({ manualBlocking: message.enabled });
      await syncBlocking();
    } else if (message?.type === "setTimerBlocking") {
      await chrome.storage.local.set({ timerBlocking: message.enabled });
      await syncBlocking();
    } else if (message === "refreshBlocklist") {
      await syncBlocking();
    } else if (message?.type === "scheduleSessionEnd") {
      await scheduleSessionEnd(message.endTime);
    } else if (message?.type === "cancelSessionEnd") {
      await chrome.alarms.clear(SESSION_ALARM);
    }
  };

  handleMessage().then(() => sendResponse({ ok: true })).catch((error) => {
    console.error("FocusShield background error:", error);
    sendResponse({ ok: false, error: error.message });
  });
  return true;
});
