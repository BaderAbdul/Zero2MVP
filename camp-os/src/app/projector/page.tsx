'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTeams, useDemoScores } from '@/lib/services/CampContext';
import { useCampEngine } from '@/lib/services/campEngine';
import styles from './projector.module.css';

const variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.05 }
};

export default function ProjectorScreen() {
  const { isLoaded, globalState, currentRoSPhase, isBreak, timeRemainingSeconds, isTimerRunning } = useCampEngine();
  const teams = useTeams();

  // Local seconds state for smooth live countdown on projector
  const [displaySeconds, setDisplaySeconds] = React.useState(timeRemainingSeconds || 0);

  React.useEffect(() => {
    setDisplaySeconds(timeRemainingSeconds || 0);
    if (!isTimerRunning) return;
    
    const interval = setInterval(() => {
      setDisplaySeconds((prev) => (prev <= 0 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemainingSeconds, isTimerRunning]);

  const activeTeamScores = useDemoScores(globalState?.activeDemoTeamId || undefined);
  const derivedTotalScore = activeTeamScores.reduce((sum, s) => sum + (s.totalScore || 0), 0);
  const maxPossibleScore = activeTeamScores.length > 0 ? activeTeamScores.length * 50 : 50;

  if (!isLoaded || !globalState) return <div className={styles.loading}>Loading...</div>;

  const renderTimer = () => {
    if (!isTimerRunning && !isBreak) return null;
    
    const m = Math.floor(displaySeconds / 60);
    const s = displaySeconds % 60;
    const formatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    
    if (isBreak) {
      return (
        <div className={styles.projectorTimer}>
          <span className={styles.timerValue}>PAUSED</span>
        </div>
      );
    }
    
    return (
      <div className={`${styles.projectorTimer} ${displaySeconds < 60 ? styles.timerWarning : ''}`}>
        <span className={styles.timerValue}>{formatted}</span>
      </div>
    );
  };

  const renderPhaseContent = () => {
    if (isBreak) {
      return (
        <motion.div key="break" className={styles.centerBox} {...variants} transition={{ duration: 0.8 }}>
          <h1 className={styles.glitchText}>BREAK TIME</h1>
          <h2 className={styles.subtitle}>REST AND RECHARGE</h2>
          {renderTimer()}
          {globalState.announcement && (
            <div className={styles.announcementBox}>{globalState.announcement}</div>
          )}
        </motion.div>
      );
    }

    if (currentRoSPhase.type === 'demo_day') {
      const activeTeam = teams.find(t => t.id === globalState.activeDemoTeamId);
      return (
        <motion.div key="demoday" className={styles.centerBox} {...variants}>
          <h1 className={styles.fireText}>🔥 DEMO DAY 🔥</h1>
          {activeTeam && (
            <div className={styles.activeTeamBox}>
              <h2 className={styles.upNext}>
                {currentRoSPhase.id === 'demo_day_queue' && 'WAITING...'}
                {currentRoSPhase.id === 'demo_day_intro' && 'UP NEXT'}
                {currentRoSPhase.id === 'demo_day_presenting' && 'PRESENTING NOW'}
                {currentRoSPhase.id === 'demo_day_judging' && 'JUDGES SCORING...'}
                {currentRoSPhase.id === 'demo_day_reveal' && 'FINAL SCORE'}
              </h2>
              <h1 className={styles.massiveTeamName}>{activeTeam.name}</h1>
              <p className={styles.projectIdea}>"{activeTeam.projectIdea}"</p>
              
              {currentRoSPhase.id === 'demo_day_reveal' && globalState.revealScores && (
                <motion.h1 
                  className={styles.massiveScore}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', bounce: 0.5 }}
                >
                  {derivedTotalScore} / {maxPossibleScore}
                </motion.h1>
              )}
            </div>
          )}
        </motion.div>
      );
    }

    switch (currentRoSPhase.id) {
      case 'setup':
      case 'welcome':
        return (
          <motion.div key="welcome" className={styles.centerBox} {...variants} transition={{ duration: 0.8 }}>
            <h1 className={styles.glitchText}>FROM ZERO TO MVP</h1>
            <h2 className={styles.subtitle}>ARE YOU READY?</h2>
            {globalState.announcement && (
              <div className={styles.announcementBox}>{globalState.announcement}</div>
            )}
          </motion.div>
        );

      case 'ideation':
      case 'build':
        return (
          <motion.div key="build" className={styles.buildScreen} {...variants}>
            <div className={styles.buildHeader}>
              <div className={styles.headerTitleRow}>
                <h1 className={styles.phaseTitle}>
                  <span className={styles.liveDot}></span>
                  {currentRoSPhase.title.toUpperCase()}
                </h1>
                {renderTimer()}
              </div>
              {globalState.announcement && (
                <div className={styles.announcementBoxAlt}>{globalState.announcement}</div>
              )}
            </div>
            
            <div className={styles.podiumContainer}>
              {teams.sort((a, b) => b.progressPercentage - a.progressPercentage).map((team, idx) => (
                <motion.div 
                  key={team.id} 
                  layout
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className={`${styles.podiumRow} ${idx === 0 ? styles.podiumFirst : ''}`}
                >
                  <div className={styles.podiumRank}>#{idx + 1}</div>
                  <div className={styles.podiumName}>{team.name}</div>
                  <div className={styles.podiumBarContainer}>
                    <motion.div 
                      className={styles.podiumBarFill}
                      initial={{ width: 0 }}
                      animate={{ width: `${team.progressPercentage}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                  <div className={styles.podiumScore}>{team.progressPercentage}%</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      case 'checkpoint':
        return (
          <motion.div key="checkpoint" className={styles.centerBox} {...variants}>
            <h1 className={styles.alertText}>🚨 CHECKPOINT 🚨</h1>
            <h2 className={styles.subtitle}>SUBMIT YOUR WORK FOR REVIEW</h2>
            {renderTimer()}
            <div className={styles.checkpointGrid}>
               {teams.map(team => (
                 <div key={team.id} className={`${styles.checkpointPill} ${styles[team.checkpointStatus]}`}>
                   {team.name}
                 </div>
               ))}
            </div>
          </motion.div>
        );

      case 'finished':
        // For MVP finished screen, we'll just display a generic "Finished" if we can't fetch all scores.
        return (
          <motion.div key="finished" className={styles.centerBox} {...variants}>
            <h1 className={styles.glitchText}>🏆 DEMO DAY CONCLUDED</h1>
            <h2 className={styles.subtitle}>GREAT JOB EVERYONE</h2>
          </motion.div>
        );

      default:
        return <div>Unknown Phase</div>;
    }
  };

  return (
    <div className={styles.projectorContainer}>
      <AnimatePresence mode="wait">
        {renderPhaseContent()}
      </AnimatePresence>
    </div>
  );
}
