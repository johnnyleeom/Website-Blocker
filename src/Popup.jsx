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
      <div className="login-brand">
        <img className="login-logo" src="/specLogo.png" alt="FocusShield logo" />
        <h1>FocusShield</h1>
        <p>Protect your focus. Finish what matters.</p>
      </div>

      <section className="login-card">
        <div>
          <span className="eyebrow">WELCOME</span>
          <h2>Sign in to focus</h2>
          <p>Your block list stays synced to your account.</p>
        </div>
        <input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" && handleLogin()} />
        <button onClick={handleLogin}>Continue</button>
        {status && <div className="login-status">{status}</div>}
      </section>
    </main>
  );
}

export default Popup;
