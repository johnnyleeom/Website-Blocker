import React, { useEffect, useState } from "react";
import { db, auth } from './firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion
} from 'firebase/firestore';

export default function BlockedSites() {
    const [site, setSite] = useState('');
    const [sites, setSites] = useState([]);

    const user = auth.currentUser;

    useEffect(() => {
        if (!user) {
            return;
        }

        const fetchSites = async () => {
            const docRef = doc(db, 'blockedSites', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setSites(docSnap.data().sites || []);
            }

    
        };

        fetchSites();
    }, [user]);

    const handleAddSite = async () => {
        if (!site.trim() || !user) {
            return;
        }

        const docRef = doc(db, 'blockedSites', user.uid);
        await setDoc(
            docRef,
            { sites: arrayUnion(site.trim()) },
            { merge: true}
        );

        setSites((prev) => [...prev, site.trim()]);
        setSite('');
        chrome.runtime.sendMessage("refreshBlocklist");

    };

    const handleDeleteSite = async (siteToDelete) => {
        if (!user) {
            return;
        }

        const docRef = doc(db,  'blockedSites', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const currentSite = docSnap.data().sites || [];
            const updatedSites = currentSite.filter(s => s !== siteToDelete);

            await updateDoc(docRef, { sites: updatedSites });
            setSites(updatedSites);
            chrome.runtime.sendMessage("refreshBlocklist");
        }


    };

    return (
        <div>
            <h3>Blocked Websites</h3>
            <input 
                type="test"
                placeholder="https://example.com" 
                value={site}
                onChange={(e) => setSite(e.target.value)}
            />
            <button onClick={handleAddSite}>Add</button>

            <ul>
                {sites.map((s, i) => (
                    <li key={i}><button onClick={() => handleDeleteSite(s)}>Remove</button>{s} </li>
                ))}
            </ul>
        </div>
    );
}