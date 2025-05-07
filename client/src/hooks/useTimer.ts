import { useState, useEffect, useCallback, useRef } from "react";

interface TimerHook {
  currentTime: number;
  formattedTime: string;
  percentComplete: number;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  isActive: boolean;
}

export function useTimer(
  initialTime: number, 
  elapsedTime: number = 0
): TimerHook {
  // Remaining time in seconds
  const [currentTime, setCurrentTime] = useState(initialTime - elapsedTime);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Clear the interval when component unmounts
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Format the time as MM:SS
  const formattedTime = useCallback(() => {
    const minutes = Math.floor(currentTime / 60);
    const seconds = currentTime % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [currentTime]);

  // Calculate percentage complete
  const percentComplete = useCallback(() => {
    return Math.round(((initialTime - currentTime) / initialTime) * 100);
  }, [currentTime, initialTime]);

  // Start the timer
  const startTimer = useCallback(() => {
    if (!isActive && currentTime > 0) {
      setIsActive(true);
      intervalRef.current = window.setInterval(() => {
        setCurrentTime((prevTime) => {
          if (prevTime <= 1) {
            if (intervalRef.current !== null) {
              window.clearInterval(intervalRef.current);
            }
            setIsActive(false);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
  }, [isActive, currentTime]);

  // Pause the timer
  const pauseTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
  }, []);

  // Reset the timer to initial state
  const resetTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
    setCurrentTime(initialTime);
  }, [initialTime]);

  return {
    currentTime,
    formattedTime: formattedTime(),
    percentComplete: percentComplete(),
    startTimer,
    pauseTimer,
    resetTimer,
    isActive
  };
}
