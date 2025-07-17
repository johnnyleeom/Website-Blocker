import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase.js";

async function fetchBlockedSites() {
    // getDocs returns special FireBase QuerySnapShot (like an array) of 
    // blocked sites from 'blockedSites'
    const arrayOfBlockedSites = await getDocs(collection(db, 'blockedSites'));

    // now blockedSites contains all of the blocked sites
    const blockedSites = arrayOfBlockedSites.docs[0].data().sites;

    for (const i of blockedSites) {
        console.log(i);
    }
    
    const formattedURLArray = convertToReusableURL(blockedSites);
    setupBlocking(formattedURLArray);
}

// converts messy url to resuable URL: ex. *://*.youtube.com/*`
function convertToReusableURL(urlList) {
    let toReturn = []
    for (const oldURL of urlList) {
        try {
            // new URL can extract just the host name 
            const {hostname} = new URL(oldURL);
            const newURL = `*://*.${hostname}/*`;
            toReturn.push(newURL);
            console.log(newURL);
        } 
        catch(err) {
            console.log('this url is not valid:', oldURL);
        }
    }
    return toReturn;
}

// function setupBlocking(urlPatterns) {
//   const rules = urlPatterns.map((pattern, index) => {
//     const hostname = pattern.replace("*://*.", "").replace("/*", "");
//     return {
//       id: 1000 + index, // 🔐 unique ID for each rule
//       priority: 1,
//       action: {
//         type: "redirect",
//         redirect: { extensionPath: "/block.html" }
//       },
//       condition: {
//         urlFilter: hostname, // only match the base domain
//         resourceTypes: ["main_frame"]
//       }
//     };
//   });

//   const ruleIds = rules.map(rule => rule.id);

//   chrome.declarativeNetRequest.updateDynamicRules({
//     removeRuleIds: ruleIds,
//     addRules: rules
//   }).then(() => {
//     console.log("✅ Blocking rules set using DNR:", rules);
//   }).catch(err => {
//     console.error("❌ Failed to set rules:", err);
//   });
// }

// MOST IMPORTANT FUNCTION::::::::::: MY ENTIRE PROGRAM IS ON THIS LINE
function setupBlocking(urlPatterns) {
  const rules = urlPatterns.map((pattern, index) => {
    const hostname = pattern.replace("*://*.", "").replace("/*", "");
    return {
      id: 1000 + index, // 🔐 unique ID for each rule
      priority: 1,
      action: {
        type: "redirect",
        redirect: { extensionPath: "/block.html" }
      },
      condition: {
        urlFilter: hostname,
        resourceTypes: ["main_frame"]
      }
    };
  });

  const newRuleIds = rules.map(rule => rule.id);

  // 🔄 Remove all existing rules before adding new ones
  chrome.declarativeNetRequest.getDynamicRules().then(existingRules => {
    const existingIds = existingRules.map(r => r.id);

    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingIds, // 🧹 clear everything
      addRules: rules              // ➕ add fresh ones
    }).then(() => {
      console.log("✅ Blocking rules refreshed:", rules);
    }).catch(err => {
      console.error("❌ Failed to update rules:", err);
    });
  });
}



//Trigger fetchBlockedSites ONLY inside event handlers:
chrome.runtime.onInstalled.addListener(() => {
  console.log("🔧 Extension installed");
  fetchBlockedSites();
});

chrome.runtime.onStartup.addListener(() => {
  console.log("🔁 Chrome restarted - refetching blocklist");
  fetchBlockedSites();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message === "refreshBlocklist") {
    console.log("🔄 Popup requested to re-fetch blocklist");
    fetchBlockedSites();
  }
});