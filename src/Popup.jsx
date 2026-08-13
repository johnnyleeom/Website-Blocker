import { useEffect, useState } from "react";
import { auth } from "./firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import Dashboard from "./Dashboard";

function Popup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [user, setUser] = useState(null);

  const handleLogin = async () => {
    setStatus("Signing in...");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setStatus("");
    } catch (error) {
      if (error.code === "auth/user-not-found" || error.code === "auth/invalid-credential") {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          setStatus("");
        } catch (signupError) {
          setStatus(`Unable to create account: ${signupError.message}`);
        }
      } else {
        setStatus(`Unable to sign in: ${error.message}`);
      }
    }
  };

  useEffect(() => onAuthStateChanged(auth, setUser), []);
  if (user) return <Dashboard />;

  return (
    <main className="login-shell">
      <header className="app-header login-heading">
        <h1>FocusShield</h1>
        <p>Less distraction. More focus.</p>
      </header>
      <section className="panel login-panel">
        <h2>Sign in</h2>
        <input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" && handleLogin()} />
        <button className="main-button" onClick={handleLogin}>Continue</button>
        {status && <p className="login-status">{status}</p>}
      </section>
    </main>
  );
}

export default Popup;
