'use client';

import React, { useEffect, useState } from 'react';
import { useCampEngine } from '@/lib/services/campEngine';
import { useCampContext } from '@/lib/services/CampContext';
import styles from './GlobalTimer.module.css';

export default function GlobalTimer() {
  const { isLoaded, globalState, timeRemainingSeconds, timeElapsedSeconds, isBreak, isTimerRunning, timerMode } = useCampEngine();
  const { currentUser } = useCampContext();

  const isCountdown = timerMode === 'countdown';
  const isCountUp = timerMode === 'countup';
  const isHidden = timerMode === 'hidden';

  const [displaySeconds, setDisplaySeconds] = useState(0);

  useEffect(() => {
    if (isCountUp) {
      setDisplaySeconds(timeElapsedSeconds || 0);
    } else {
      setDisplaySeconds(timeRemainingSeconds || 0);
    }
    
    if (!isTimerRunning) return;
    
    const interval = setInterval(() => {
      setDisplaySeconds((prev) => {
        if (isCountUp) return prev + 1;
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemainingSeconds, timeElapsedSeconds, isTimerRunning, isCountUp]);

  if (!isLoaded || isHidden || (!isTimerRunning && !isBreak && displaySeconds === 0 && !isCountUp)) return null;

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

  const isCritical = isCountdown && currentSeconds < 60;
  const label = isCountUp ? 'الوقت المنقضي' : 'الوقت المتبقي';

  return (
    <div className={`${styles.timerContainer} ${isCritical ? styles.warning : ''} ${isCountUp ? styles.countUpMode : ''}`}>
      <span className={styles.timerLabel}>{label}</span>
      <span className={styles.timerValue}>{formatted}</span>
    </div>
  );
}
