import { useEffect, useState } from "react";
import { db, auth } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";

export default function BlockedSites() {
  const [site, setSite] = useState("");
  const [sites, setSites] = useState([]);
  const [manualBlocking, setManualBlocking] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const docSnap = await getDoc(doc(db, "blockedSites", user.uid));
      if (docSnap.exists()) setSites(docSnap.data().sites || []);
      const stored = await chrome.storage.local.get("manualBlocking");
      setManualBlocking(Boolean(stored.manualBlocking));
    };

    load();
  }, [user]);

  const toggleManualBlocking = () => {
    const next = !manualBlocking;
    setManualBlocking(next);
    chrome.runtime.sendMessage({ type: "setManualBlocking", enabled: next });
  };

  const handleAddSite = async () => {
    const trimmedSite = site.trim();
    if (!trimmedSite || !user) return;

    const docRef = doc(db, "blockedSites", user.uid);
    await setDoc(docRef, { sites: arrayUnion(trimmedSite) }, { merge: true });
    setSites((previous) => previous.includes(trimmedSite) ? previous : [...previous, trimmedSite]);
    setSite("");
    chrome.runtime.sendMessage("refreshBlocklist");
  };

  const handleDeleteSite = async (siteToDelete) => {
    if (!user) return;
    const updatedSites = sites.filter((savedSite) => savedSite !== siteToDelete);
    await updateDoc(doc(db, "blockedSites", user.uid), { sites: updatedSites });
    setSites(updatedSites);
    chrome.runtime.sendMessage("refreshBlocklist");
  };

  return (
    <section className="panel sites-panel">
      <h2>Website Blocker</h2>
      <p className="helper-text">Block your list anytime, with or without the timer.</p>

      <button className={`block-toggle ${manualBlocking ? "on" : ""}`} onClick={toggleManualBlocking}>
        <span className="toggle-track"><span className="toggle-knob" /></span>
        {manualBlocking ? "Blocking is on" : "Blocking is off"}
      </button>

      <div className="site-input-row">
        <input
          type="text"
          placeholder="youtube.com"
          value={site}
          onChange={(event) => setSite(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && handleAddSite()}
        />
        <button onClick={handleAddSite}>Add</button>
      </div>

      <div className="site-list">
        {sites.length === 0 ? (
          <p className="empty-state">No websites added yet.</p>
        ) : sites.map((savedSite) => (
          <div className="site-row" key={savedSite}>
            <span>{savedSite}</span>
            <button onClick={() => handleDeleteSite(savedSite)} aria-label={`Remove ${savedSite}`}>Remove</button>
          </div>
        ))}
      </div>
    </section>
  );
}
