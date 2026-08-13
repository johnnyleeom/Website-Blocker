import BlockedSites from "./BlockedSites";
import PomodoroTimer from "./PomodoroTimer";

export default function Dashboard() {
  return (
    <main className="dashboard-shell">
      <header className="brand-header">
        <img className="brand-logo" src="/specLogo.png" alt="FocusShield logo" />
        <div>
          <h1>FocusShield</h1>
          <p>Protect your focus. Finish what matters.</p>
        </div>
      </header>

      <PomodoroTimer />
      <BlockedSites />
    </main>
  );
}
