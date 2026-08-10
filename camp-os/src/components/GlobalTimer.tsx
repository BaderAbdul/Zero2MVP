'use client';

import React, { useEffect, useState } from 'react';
import { useCampEngine } from '@/lib/services/campEngine';
import styles from './GlobalTimer.module.css';

export default function GlobalTimer() {
  const { isLoaded, timeRemainingSeconds, isBreak, isTimerRunning } = useCampEngine();
  const [displaySeconds, setDisplaySeconds] = useState(timeRemainingSeconds || 0);

  useEffect(() => {
    setDisplaySeconds(timeRemainingSeconds || 0);
    
    if (!isTimerRunning) return;
    
    const interval = setInterval(() => {
      setDisplaySeconds((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemainingSeconds, isTimerRunning]);

  if (!isLoaded || (!isTimerRunning && !isBreak)) return null;

  const currentSeconds = displaySeconds || 0;
  const m = Math.floor(currentSeconds / 60);
  const s = currentSeconds % 60;
  const formatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  if (isBreak) {
    return (
      <div className={`${styles.timerContainer} ${styles.breakMode}`}>
        <span className={styles.timerLabel}>استراحة — Break</span>
        <span className={styles.timerValue}>متوقف</span>
      </div>
    );
  }

  return (
    <div className={`${styles.timerContainer} ${currentSeconds < 60 ? styles.warning : ''}`}>
      <span className={styles.timerLabel}>الوقت المتبقي</span>
      <span className={styles.timerValue}>{formatted}</span>
    </div>
  );
}
