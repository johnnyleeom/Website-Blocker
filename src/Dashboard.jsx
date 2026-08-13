import BlockedSites from "./BlockedSites";
import PomodoroTimer from "./PomodoroTimer";

export default function Dashboard() {
  return (
    <main className="dashboard-shell">
      <header className="app-header">
        <h1>FocusShield</h1>
        <p>Less distraction. More focus.</p>
      </header>
      <BlockedSites />
      <div className="divider"><span>or use a timer</span></div>
      <PomodoroTimer />
    </main>
  );
}
