'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTeams, useDemoScores } from '@/lib/services/CampContext';
import { useCampEngine } from '@/lib/services/campEngine';
import styles from './projector.module.css';

const variants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.02 }
};

export default function ProjectorScreen() {
  const { 
    isLoaded, globalState, activeStage, isBreak, isDemoDay,
    formattedTime, timerMode, isTimerRunning
  } = useCampEngine();
  const teams = useTeams();

  const activeTeamScores = useDemoScores(globalState?.activeDemoTeamId || undefined);
  const derivedTotalScore = activeTeamScores.reduce((sum, s) => sum + (s.totalScore || 0), 0);
  const maxPossibleScore = activeTeamScores.length > 0 ? activeTeamScores.length * 50 : 50;

  if (!isLoaded || !globalState) {
    return <div className={styles.projectorContainer}><div className={styles.loading}>INITIALIZING BROADCAST SYSTEM...</div></div>;
  }

  const renderTimer = () => {
    if (timerMode === 'hidden') return null;

    return (
      <div className={`${styles.projectorTimer} ${timerMode === 'countdown' ? styles.timerWarning : ''}`}>
        <span className={styles.timerValue}>{formattedTime}</span>
      </div>
    );
  };

  const renderContent = () => {
    if (isBreak) {
      return (
        <motion.div key="break" className={styles.centerBox} {...variants} transition={{ duration: 0.8 }}>
          <h1 className={styles.glitchText}>OPERATIONAL BREAK</h1>
          <h2 className={styles.subtitle}>استراحة معسكر</h2>
          {renderTimer()}
          {globalState.announcement && (
            <div className={styles.announcementBox}>{globalState.announcement}</div>
          )}
        </motion.div>
      );
    }

    if (isDemoDay) {
      const activeTeam = teams.find(t => t.id === globalState.activeDemoTeamId);
      return (
        <motion.div key="demoday" className={styles.centerBox} {...variants}>
          <h1 className={styles.glitchText}>DEMO DAY // يوم العروض</h1>
          {activeTeam ? (
            <div className={styles.centerBox}>
              <h2 className={styles.subtitle}>LIVE PRESENTATION</h2>
              <h1 className={styles.massiveTeamName}>{activeTeam.name}</h1>
              <p style={{ fontSize: '1.5rem', color: '#92b5b1' }}>"{activeTeam.projectIdea}"</p>
              
              {globalState.revealScores && (
                <motion.h1 
                  style={{ fontSize: '5rem', color: '#00f0ff', fontFamily: 'IBM Plex Mono' }}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  SCORE: {derivedTotalScore} / {maxPossibleScore}
                </motion.h1>
              )}
            </div>
          ) : (
            <div className={styles.subtitle}>في انتظار إعلان الفريق التالي...</div>
          )}
        </motion.div>
      );
    }

    // Default Dynamic Custom Stage Broadcast
    return (
      <motion.div key="stage" className={styles.buildScreen} {...variants}>
        <div className={styles.buildHeader}>
          <div className={styles.headerTitleRow}>
            <h1 className={styles.phaseTitle}>
              <span className={styles.liveDot} />
              {activeStage.title}
            </h1>
            {renderTimer()}
          </div>
          {globalState.announcement && (
            <div className={styles.announcementBox}>{globalState.announcement}</div>
          )}
        </div>

        {/* TEAM LEADERBOARD / PODIUM */}
        <div className={styles.podiumContainer}>
          {teams.sort((a, b) => b.progressPercentage - a.progressPercentage).map((team, idx) => (
            <motion.div 
              key={team.id} 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className={`${styles.podiumRow} ${idx === 0 ? styles.podiumFirst : ''}`}
            >
              <div className={styles.podiumRank}>#{String(idx + 1).padStart(2, '0')}</div>
              <div className={styles.podiumName}>{team.name}</div>
              <div className={styles.podiumBarContainer}>
                <motion.div 
                  className={styles.podiumBarFill}
                  initial={{ width: 0 }}
                  animate={{ width: `${team.progressPercentage}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
              <div className={styles.podiumScore}>{team.progressPercentage}%</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  return (
    <div className={styles.projectorContainer}>
      <AnimatePresence mode="wait">
        {renderContent()}
      </AnimatePresence>
    </div>
  );
}
