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
    const [isOn, setMode] = useState(false);

    const user = auth.currentUser;

    const handleOnClick = () => {
        if (!isOn) {
            setMode(true);
            chrome.runtime.sendMessage("refreshBlocklist");
        } else {
            setMode(false);
            chrome.runtime.sendMessage("disableBlocklist");
        }
    }



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

        const checkBlockingState = async () => {
            try {
                // Check if there are any active blocking rules
                const rules = await chrome.declarativeNetRequest.getDynamicRules();
                const hasActiveRules = rules.length > 0;
                setMode(hasActiveRules);
            } catch (error) {
                console.error('Error checking blocking state:', error);
            }
        };

        fetchSites();
        checkBlockingState();
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
        if (isOn) {
            chrome.runtime.sendMessage("refreshBlocklist");
        }

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
            if (isOn) {
            chrome.runtime.sendMessage("refreshBlocklist");
        }
        }


    };

    return (
        <div style={{
            width: '400px',
            padding: '20px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            margin: '10px 0',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '400px'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '15px'
            }}>
                <div 
                    onClick={handleOnClick}
                    style={{
                        width: '40px',
                        height: '24px',
                        backgroundColor: isOn ? '#34C759' : '#E5E5EA',
                        borderRadius: '12px',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '2px'
                    }}
                >
                    <div style={{
                        width: '20px',
                        height: '20px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        transform: isOn ? 'translateX(16px)' : 'translateX(0px)',
                        transition: 'transform 0.2s ease'
                    }} />
                </div>
                <h3 style={{ margin: 0 }}>Blocked Websites</h3>
            </div>
            
            <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '15px'
            }}>
                <input 
                    type="text"
                    placeholder="https://example.com" 
                    value={site}
                    onChange={(e) => setSite(e.target.value)}
                    style={{
                        flex: 1,
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px'
                    }}
                />
                <button 
                    onClick={handleAddSite}
                    style={{
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Add
                </button>
            </div>

            <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                flex: 1,
                overflowY: 'auto',
                minHeight: 0
            }}>
                {sites.map((s, i) => (
                    <li key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px',
                        borderBottom: '1px solid #eee',
                        backgroundColor: 'white',
                        marginBottom: '5px',
                        borderRadius: '4px'
                    }}>
                        <button 
                            onClick={() => handleDeleteSite(s)}
                            style={{
                                backgroundColor: '#ff5722',
                                color: 'white',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            Remove
                        </button>
                        <span style={{ flex: 1, wordBreak: 'break-all' }}>{s}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}