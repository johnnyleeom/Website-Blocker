import React, { useEffect, useState, useRef } from "react";

function PomodoroTimer() {
  const [workTimer, setWorkTimer] = useState(1500); // 25 min
  const [breakTimer, setBreakTimer] = useState(300); // 5 min

  // Persistent state
  const [isRunning, setIsRunning] = useState(false);
  const [isWorkSession, setIsWorkSession] = useState(true);
  const [lastStart, setLastStart] = useState(null); // timestamp when timer was (re)started
  const [sessionLength, setSessionLength] = useState(workTimer); // in seconds

  // Derived state
  const [timeLeft, setTimeLeft] = useState(workTimer);

  // Helper: Save state to chrome.storage.local
  const saveState = (state) => {
    chrome.storage.local.set({
      pomodoroState: {
        ...state,
        lastStart: state.lastStart || null,
      }
    });
  };

  // Helper: Load state from chrome.storage.local
  const loadState = () => {
    chrome.storage.local.get(["pomodoroState"], (result) => {
      const saved = result.pomodoroState;
      if (saved) {
        setIsWorkSession(saved.isWorkSession);
        setIsRunning(saved.isRunning);
        setLastStart(saved.lastStart);
        setSessionLength(saved.sessionLength);
      } else {
        // If no saved state, initialize
        setIsWorkSession(true);
        setIsRunning(false);
        setLastStart(null);
        setSessionLength(workTimer);
      }
    });
  };

  // On mount, load state
  useEffect(() => {
    loadState();
    // eslint-disable-next-line
  }, []);

  // Save state on any change to persistent state
  useEffect(() => {
    saveState({
      isWorkSession,
      isRunning,
      lastStart,
      sessionLength
    });
    // eslint-disable-next-line
  }, [isWorkSession, isRunning, lastStart, sessionLength]);

  // When persistent state changes, recalculate timeLeft
  useEffect(() => {
    if (isRunning && lastStart) {
      const now = Date.now();
      const elapsed = Math.floor((now - lastStart) / 1000);
      setTimeLeft(Math.max(0, sessionLength - elapsed));
    } else {
      setTimeLeft(sessionLength);
    }
  }, [isRunning, lastStart, sessionLength]);

  // When workTimer/breakTimer changes, update sessionLength if not running
  useEffect(() => {
    if (!isRunning) {
      setSessionLength(isWorkSession ? workTimer : breakTimer);
    }
    // eslint-disable-next-line
  }, [workTimer, breakTimer, isWorkSession]);

  // Timer interval
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - lastStart) / 1000);
      const newTimeLeft = Math.max(0, sessionLength - elapsed);
      setTimeLeft(newTimeLeft);
      if (newTimeLeft <= 0) {
        clearInterval(interval);
        // Auto-switch session
        if (isWorkSession) {
          setIsWorkSession(false);
          chrome.runtime.sendMessage("disableBlocklist");
          setSessionLength(breakTimer);
        } else {
          setIsWorkSession(true);
          chrome.runtime.sendMessage("refreshBlocklist");
          setSessionLength(workTimer);
        }
        setIsRunning(false);
        setLastStart(null);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, lastStart, sessionLength, isWorkSession, workTimer, breakTimer]);

  // Start/pause button
  const handleStart = () => {
    if (!isRunning) {
      setIsRunning(true);
      setLastStart(Date.now());
    } else {
      // Pause: recalc timeLeft and store as sessionLength
      const now = Date.now();
      const elapsed = Math.floor((now - lastStart) / 1000);
      const newTimeLeft = Math.max(0, sessionLength - elapsed);
      setSessionLength(newTimeLeft);
      setIsRunning(false);
      setLastStart(null);
    }
  };

  // Reset button (optional)

  return (
    <div style={{
      width: '400px',
      padding: '16px',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      margin: '10px 0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px'
    }}>
      <h3 style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        fontSize: '18px',
        fontWeight: '600',
        color: '#333',
        margin: '0'
      }}>
        Pomodoro Timer
      </h3>

      {/* Session Indicator */}
      <div style={{
        display: 'flex',
        gap: '8px',
        backgroundColor: '#E5E5EA',
        borderRadius: '8px',
        padding: '4px'
      }}>
        <div style={{
          padding: '8px 16px',
          borderRadius: '6px',
          backgroundColor: isWorkSession ? '#007AFF' : 'transparent',
          color: isWorkSession ? 'white' : '#666',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          Work
        </div>
        <div style={{
          padding: '8px 16px',
          borderRadius: '6px',
          backgroundColor: !isWorkSession ? '#007AFF' : 'transparent',
          color: !isWorkSession ? 'white' : '#666',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          Break
        </div>
      </div>

      {/* Progress Bar Timer */}
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px'
      }}>
        {/* Time Display */}
        <div style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#333',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          textAlign: 'center'
        }}>
          {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:{String(timeLeft % 60).padStart(2, "0")}
        </div>
        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: '#E5E5EA',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            backgroundColor: isWorkSession ? '#FF3B30' : '#34C759',
            borderRadius: '4px',
            width: `${100 * (1 - timeLeft / sessionLength)}%`,
            transition: 'width 1s linear'
          }} />
        </div>
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center'
      }}>
        <button
          onClick={handleStart}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: isRunning ? '#FF3B30' : '#34C759',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            minWidth: '70px'
          }}
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
      </div>
    </div>
  );
}
export default PomodoroTimer;

