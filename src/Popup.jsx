import { useEffect, useState } from 'react';
import { auth } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import Dashboard from './Dashboard';

function Popup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [user, setUser] = useState(null);

  const handleLogin = async () => {
    setStatus('Logging In...');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setStatus("Logged In!");
    } catch(error) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          setStatus("Created account and Logged In");
        } catch (signupError) {
          setStatus(`Failed ${error.message}`);
        }
      } else {
        setStatus(`Login Failed: ${error.message}`);
      }
    }
  };

  useEffect (() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>
      { user? (<Dashboard/>) : (
        <>
      <h3>FocusShield Login</h3>
      <input 
        type="email" 
        placeholder='Email'
        value={email}
        onChange={e => setEmail(e.target.value)}
        /> 
      <input 
        type="password" 
        placeholder='Password'
        value={password}
        onChange={e => setPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Login / Sign Up</button>
        <p>{status}</p>
        </>
        )}
    </div>
  )
}

export default Popup;
