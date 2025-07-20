import React, { useEffect, useState } from "react";

function PomodoroTimer() {
  const [workTimer, setWorkTimer] = useState(1500); //1500
  const [breakTimer, setBreakTimer] = useState(300);  //300

  const [timeLeft, setTimeLeft] = useState(workTimer);
  const [isRunning, setIsRunning] = useState(false);
  const [isWorkSession, setIsWorkSession] = useState(true); // true = work, false = break

  // Set initial timeLeft based on workDuration
  useEffect(() => {
    setTimeLeft(workTimer);
  }, [workTimer]);

  const handleStart = () => {
    if (!isRunning) {
      setIsRunning(true);
    } else {
      setIsRunning(false);
    }
  };

  useEffect(() => {
  let timer = null;

  if (isRunning) {
    timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer); // Stop the ticking

          if (isWorkSession) {
            setIsWorkSession(false);
            chrome.runtime.sendMessage("disableBlocklist");
            setTimeLeft(breakTimer);
          } else {
            setIsWorkSession(true);
            chrome.runtime.sendMessage("refreshBlocklist");
            setTimeLeft(workTimer);
          }

          setIsRunning(false); // Pause before starting next
          return 0;
        }

        return prev - 1;
      });
    }, 1000);
  }

  return () => clearInterval(timer);
}, [isRunning, isWorkSession, breakTimer, workTimer]);


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
            width: `${((isWorkSession ? workTimer : breakTimer) - timeLeft) / (isWorkSession ? workTimer : breakTimer) * 100}%`,
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

