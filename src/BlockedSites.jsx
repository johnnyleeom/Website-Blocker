import { useEffect, useState } from "react";
import { db, auth } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";

export default function BlockedSites() {
  const [site, setSite] = useState("");
  const [sites, setSites] = useState([]);
  const [isBlocking, setIsBlocking] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const fetchSites = async () => {
      const docRef = doc(db, "blockedSites", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setSites(docSnap.data().sites || []);
    };

    const syncBlockingState = async () => {
      const rules = await chrome.declarativeNetRequest.getDynamicRules();
      setIsBlocking(rules.length > 0);
    };

    fetchSites();
    syncBlockingState();

    const listener = () => syncBlockingState();
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [user]);

  const handleAddSite = async () => {
    const trimmedSite = site.trim();
    if (!trimmedSite || !user) return;

    const docRef = doc(db, "blockedSites", user.uid);
    await setDoc(docRef, { sites: arrayUnion(trimmedSite) }, { merge: true });
    setSites((previous) => previous.includes(trimmedSite) ? previous : [...previous, trimmedSite]);
    setSite("");

    if (isBlocking) chrome.runtime.sendMessage("refreshBlocklist");
  };

  const handleDeleteSite = async (siteToDelete) => {
    if (!user) return;

    const docRef = doc(db, "blockedSites", user.uid);
    const updatedSites = sites.filter((savedSite) => savedSite !== siteToDelete);
    await updateDoc(docRef, { sites: updatedSites });
    setSites(updatedSites);

    if (isBlocking) chrome.runtime.sendMessage("refreshBlocklist");
  };

  return (
    <section className="focus-card sites-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">BLOCK LIST</span>
          <h2>Distracting websites</h2>
        </div>
        <span className={`status-pill ${isBlocking ? "active" : ""}`}>
          <span className="status-dot" />
          {isBlocking ? "Protected" : "Ready"}
        </span>
      </div>

      <p className="section-copy">These sites are blocked automatically while your focus timer is running.</p>

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
          <div className="empty-state">Add a website you want out of reach during focus sessions.</div>
        ) : sites.map((savedSite) => (
          <div className="site-row" key={savedSite}>
            <div className="site-icon">↗</div>
            <span>{savedSite}</span>
            <button className="remove-button" onClick={() => handleDeleteSite(savedSite)} aria-label={`Remove ${savedSite}`}>×</button>
          </div>
        ))}
      </div>
    </section>
  );
}
