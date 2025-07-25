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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      backgroundColor: '#f8f9fa'
    }}>
      { user? (<Dashboard/>) : (
        <div style={{
          width: '100%',
          maxWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px'
        }}>
          {/* FocusShield Logo */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#007AFF',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)'
            }}>
              <span style={{
                fontSize: '32px',
                color: 'white',
                fontWeight: '700',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
              }}>
                🛡️
              </span>
            </div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#1d1d1f',
              margin: '0',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
            }}>
              FocusShield
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#86868b',
              margin: '0',
              textAlign: 'center',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
            }}>
              Stay focused, stay productive
            </p>
          </div>

          {/* Login Form */}
          <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <input 
              type="email" 
              placeholder='Email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                padding: '16px',
                border: '1px solid #d2d2d7',
                borderRadius: '12px',
                fontSize: '16px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                backgroundColor: 'white',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007AFF'}
              onBlur={(e) => e.target.style.borderColor = '#d2d2d7'}
            /> 
            <input 
              type="password" 
              placeholder='Password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                padding: '16px',
                border: '1px solid #d2d2d7',
                borderRadius: '12px',
                fontSize: '16px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                backgroundColor: 'white',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007AFF'}
              onBlur={(e) => e.target.style.borderColor = '#d2d2d7'}
            />
            <button 
              onClick={handleLogin}
              style={{
                padding: '16px',
                backgroundColor: '#007AFF',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#0056CC'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#007AFF'}
            >
              Sign In / Sign Up
            </button>
          </div>

          {/* Status Message */}
          {status && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: status.includes('Failed') ? '#FFE5E5' : '#E5F3FF',
              color: status.includes('Failed') ? '#D70015' : '#007AFF',
              borderRadius: '8px',
              fontSize: '14px',
              textAlign: 'center',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
            }}>
              {status}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Popup;
