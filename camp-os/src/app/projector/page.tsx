'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobalState, useTeams } from '@/lib/services/CampContext';
import styles from './projector.module.css';
import { CampPhase } from '@/lib/services/types';

const variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.05 }
};

export default function ProjectorScreen() {
  const globalState = useGlobalState();
  const teams = useTeams();

  if (!globalState) return <div className={styles.loading}>Loading...</div>;

  const renderPhaseContent = (phase: CampPhase) => {
    switch (phase) {
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

      case 'break':
        return (
          <motion.div key="break" className={styles.centerBox} {...variants} transition={{ duration: 0.8 }}>
            <h1 className={styles.glitchText}>BREAK TIME</h1>
            <h2 className={styles.subtitle}>REST AND RECHARGE</h2>
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
              <h1 className={styles.phaseTitle}>
                <span className={styles.liveDot}></span>
                {phase === 'ideation' ? 'IDEATION MODE' : 'BUILD MODE'}
              </h1>
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
            <div className={styles.checkpointGrid}>
               {teams.map(team => (
                 <div key={team.id} className={`${styles.checkpointPill} ${styles[team.checkpointStatus]}`}>
                   {team.name}
                 </div>
               ))}
            </div>
          </motion.div>
        );

      case 'demo_day_queue':
      case 'demo_day_intro':
      case 'demo_day_presenting':
      case 'demo_day_judging':
      case 'demo_day_reveal':
        const activeTeam = teams.find(t => t.id === globalState.activeDemoTeamId);
        return (
          <motion.div key="demoday" className={styles.centerBox} {...variants}>
            <h1 className={styles.fireText}>🔥 DEMO DAY 🔥</h1>
            {activeTeam && (
              <div className={styles.activeTeamBox}>
                <h2 className={styles.upNext}>
                  {phase === 'demo_day_queue' && 'WAITING...'}
                  {phase === 'demo_day_intro' && 'UP NEXT'}
                  {phase === 'demo_day_presenting' && 'PRESENTING NOW'}
                  {phase === 'demo_day_judging' && 'JUDGES SCORING...'}
                  {phase === 'demo_day_reveal' && 'FINAL SCORE'}
                </h2>
                <h1 className={styles.massiveTeamName}>{activeTeam.name}</h1>
                <p className={styles.projectIdea}>"{activeTeam.projectIdea}"</p>
                
                {phase === 'demo_day_reveal' && globalState.revealScores && (
                  <motion.h1 
                    className={styles.massiveScore}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                  >
                    {activeTeam.demoDayTotalScore} / 50
                  </motion.h1>
                )}
              </div>
            )}
          </motion.div>
        );
      
      case 'finished':
        const winner = [...teams].sort((a,b) => b.demoDayTotalScore - a.demoDayTotalScore)[0];
        return (
          <motion.div key="finished" className={styles.centerBox} {...variants}>
            <h1 className={styles.glitchText}>🏆 WE HAVE A WINNER</h1>
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <h1 className={styles.massiveTeamName}>{winner?.name}</h1>
              <h2 className={styles.subtitle}>{winner?.demoDayTotalScore} Points</h2>
            </motion.div>
          </motion.div>
        );

      default:
        return <div>Unknown Phase</div>;
    }
  };

  return (
    <div className={styles.projectorContainer}>
      <AnimatePresence mode="wait">
        {renderPhaseContent(globalState.currentPhase)}
      </AnimatePresence>
    </div>
  );
}
