import { useEffect, useState } from "react";

const WORK_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;

function PomodoroTimer() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isWorkSession, setIsWorkSession] = useState(true);
  const [remainingSeconds, setRemainingSeconds] = useState(WORK_DURATION);
  const [endTime, setEndTime] = useState(null);
  const currentDuration = isWorkSession ? WORK_DURATION : BREAK_DURATION;

  useEffect(() => {
    chrome.storage.local.get("pomodoroState", ({ pomodoroState }) => {
      if (pomodoroState) {
        const running = Boolean(pomodoroState.isRunning && pomodoroState.endTime);
        const remaining = running
          ? Math.max(0, Math.ceil((pomodoroState.endTime - Date.now()) / 1000))
          : pomodoroState.remainingSeconds;
        setIsRunning(running && remaining > 0);
        setIsWorkSession(pomodoroState.isWorkSession ?? true);
        setRemainingSeconds(remaining ?? WORK_DURATION);
        setEndTime(running && remaining > 0 ? pomodoroState.endTime : null);
      }
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    chrome.storage.local.set({
      pomodoroState: {
        isRunning, isWorkSession, remainingSeconds, endTime,
        workDuration: WORK_DURATION, breakDuration: BREAK_DURATION
      }
    });
  }, [isLoaded, isRunning, isWorkSession, remainingSeconds, endTime]);

  useEffect(() => {
    if (!isRunning || !endTime) return;
    const tick = () => {
      const next = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setRemainingSeconds(next);
      if (next === 0) {
        const nextIsWork = !isWorkSession;
        setIsRunning(false);
        setEndTime(null);
        setIsWorkSession(nextIsWork);
        setRemainingSeconds(nextIsWork ? WORK_DURATION : BREAK_DURATION);
        chrome.runtime.sendMessage({ type: "setTimerBlocking", enabled: false });
      }
    };
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [isRunning, endTime, isWorkSession]);

  const handleStartPause = () => {
    if (!isRunning) {
      const nextEndTime = Date.now() + remainingSeconds * 1000;
      setIsRunning(true);
      setEndTime(nextEndTime);
      chrome.runtime.sendMessage({ type: "setTimerBlocking", enabled: isWorkSession });
      chrome.runtime.sendMessage({ type: "scheduleSessionEnd", endTime: nextEndTime });
      return;
    }

    const nextRemaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    setRemainingSeconds(nextRemaining);
    setIsRunning(false);
    setEndTime(null);
    chrome.runtime.sendMessage({ type: "setTimerBlocking", enabled: false });
    chrome.runtime.sendMessage({ type: "cancelSessionEnd" });
  };

  const handleReset = () => {
    setIsRunning(false);
    setEndTime(null);
    setRemainingSeconds(currentDuration);
    chrome.runtime.sendMessage({ type: "setTimerBlocking", enabled: false });
    chrome.runtime.sendMessage({ type: "cancelSessionEnd" });
  };

  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const seconds = String(remainingSeconds % 60).padStart(2, "0");

  return (
    <section className="panel timer-panel">
      <h2>Focus Timer</h2>
      <div className="timer-tabs">
        <span className={isWorkSession ? "selected" : ""}>Focus</span>
        <span className={!isWorkSession ? "selected" : ""}>Break</span>
      </div>
      <div className="timer-display">{minutes}:{seconds}</div>
      <p className="helper-text timer-help">
        {isWorkSession ? "Your websites are blocked while the focus timer runs." : "Break time. Websites are available."}
      </p>
      <div className="timer-actions">
        <button className="main-button" onClick={handleStartPause}>
          {isRunning ? "Pause" : remainingSeconds < currentDuration ? "Resume" : "Start"}
        </button>
        <button className="plain-button" onClick={handleReset}>Reset</button>
      </div>
    </section>
  );
}

export default PomodoroTimer;
