import { useState, useEffect, useRef } from "react";

export const useStopwatch = () => {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [time, setTime] = useState(0);
  const countRef = useRef<NodeJS.Timeout | null>(null);

  const handleStart = () => {
    setIsActive(true);
    setIsPaused(false);
    countRef.current = setInterval(() => {
      setTime((prevTime) => prevTime + 1);
    }, 1000);
  };

  const handlePause = () => {
    if (countRef.current) {
      clearInterval(countRef.current);
    }
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
    countRef.current = setInterval(() => {
      setTime((prevTime) => prevTime + 1);
    }, 1000);
  };

  const handleReset = () => {
    if (countRef.current) {
      clearInterval(countRef.current);
    }
    setIsActive(false);
    setIsPaused(true);
    setTime(0);
  };

  const formatTime = (timeInSeconds: number) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;

    return [hours, minutes, seconds]
      .map((v) => (v < 10 ? "0" + v : v))
      .join(":");
  };

  return {
    time,
    formattedTime: formatTime(time),
    isActive,
    isPaused,
    start: handleStart,
    pause: handlePause,
    resume: handleResume,
    reset: handleReset,
  };
};
