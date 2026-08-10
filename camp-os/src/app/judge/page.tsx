'use client';

import React, { useState, useEffect } from 'react';
import { useCampContext, useTeam } from '@/lib/services/CampContext';
import { useCampEngine } from '@/lib/services/campEngine';
import styles from './judge.module.css';

export default function JudgeExperience() {
  const { provider, currentUser } = useCampContext();
  const { isLoaded, globalState, currentRoSPhase } = useCampEngine();
  const activeTeam = useTeam(globalState?.activeDemoTeamId || undefined);

  const [scores, setScores] = useState({
    problem: 0,
    product: 0,
    execution: 0,
    ai: 0,
    pitch: 0
  });
  
  const [submittedFor, setSubmittedFor] = useState<string | null>(null);

  useEffect(() => {
    if (activeTeam) {
      setScores({ problem: 0, product: 0, execution: 0, ai: 0, pitch: 0 });
      setSubmittedFor(null);
    }
  }, [activeTeam?.id]);

  if (!currentUser || currentUser.role !== 'judge') {
    return <div className={styles.error}>Unauthorized. Please login as Judge via /dev.</div>;
  }

  if (!isLoaded || !globalState) return <div className={styles.container}>Loading...</div>;

  if (currentRoSPhase.type !== 'demo_day') {
    return <div className={styles.container}>
      <div className={styles.waitingState}>
        <h1>Demo Day has not started.</h1>
        <p>Grab a coffee and wait for the Organizer to begin.</p>
      </div>
    </div>;
  }

  if (!activeTeam) {
    return <div className={styles.container}>
      <div className={styles.waitingState}>
        <h1>Waiting for next team...</h1>
        <p>Look at the Projector for the current lineup.</p>
      </div>
    </div>;
  }

  const handleChange = (criteria: string, value: number) => {
    setScores(prev => ({ ...prev, [criteria]: value }));
  };

  const handleSubmit = async () => {
    await provider.submitJudgeScore({
      teamId: activeTeam.id,
      judgeId: currentUser.id,
      scores
    });
    setSubmittedFor(activeTeam.id);
  };

  if (submittedFor === activeTeam.id) {
    return (
      <div className={styles.container}>
        <div className={styles.successBox}>
          <h1>Score Submitted! ✅</h1>
          <p>Waiting for the Organizer to switch to the next team.</p>
        </div>
      </div>
    );
  }

  const allScored = Object.values(scores).every(v => v > 0);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <p className={styles.label}>SCORING SHEET</p>
        <h1 className={styles.teamName}>{activeTeam.name}</h1>
        <p className={styles.idea}>"{activeTeam.projectIdea}"</p>
      </header>

      <div className={styles.scoringGrid}>
        {Object.keys(scores).map((key) => (
          <div key={key} className={styles.scoreRow}>
            <div className={styles.scoreHeader}>
              <span className={styles.criteriaName}>{key.toUpperCase()}</span>
              {scores[key as keyof typeof scores] > 0 && (
                <span className={styles.scoreValue}>{scores[key as keyof typeof scores]} / 10</span>
              )}
            </div>
            
            <div className={styles.segmentedControl}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                <button
                  key={val}
                  onClick={() => handleChange(key, val)}
                  className={`${styles.segmentBtn} ${scores[key as keyof typeof scores] === val ? styles.segmentActive : ''}`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.actionFooter}>
        <button 
          onClick={handleSubmit} 
          disabled={!allScored}
          className={styles.submitButton}
        >
          {allScored ? 'SUBMIT FINAL SCORE' : 'COMPLETE ALL CRITERIA'}
        </button>
      </div>
    </div>
  );
}
