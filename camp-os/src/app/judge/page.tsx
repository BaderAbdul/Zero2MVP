'use client';

import React, { useState, useEffect } from 'react';
import { useCampContext, useTeam } from '@/lib/services/CampContext';
import { useCampEngine } from '@/lib/services/campEngine';
import styles from './judge.module.css';

export default function JudgeExperience() {
  const { provider, currentUser } = useCampContext();
  const { isLoaded, globalState, isDemoDay } = useCampEngine();
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
    return <div className={styles.container}><div className={styles.error}>UNAUTHORIZED. PLEASE LOGIN AS JUDGE VIA <a href="/login">/login</a>.</div></div>;
  }

  if (!isLoaded || !globalState) return <div className={styles.container}><div className={styles.label}>INITIALIZING SCORING MATRIX...</div></div>;

  if (!isDemoDay) {
    return (
      <div className={styles.container}>
        <div className={styles.waitingState}>
          <p className={styles.label}>DEMO DAY OFFLINE</p>
          <h1 style={{ color: '#ffffff' }}>يوم العروض غير مفعّل حالياً</h1>
          <p style={{ color: '#92b5b1' }}>الرجاء الانتظار حتى يقوم المنظّم ببدء مرحلة العروض.</p>
        </div>
      </div>
    );
  }

  if (!activeTeam) {
    return (
      <div className={styles.container}>
        <div className={styles.waitingState}>
          <p className={styles.label}>AWAITING NEXT TEAM</p>
          <h1 style={{ color: '#ffffff' }}>في انتظار الفريق التالي</h1>
          <p style={{ color: '#92b5b1' }}>تابع شاشة العرض الرئيسية لمعرفة الفريق المعروض حالياً.</p>
        </div>
      </div>
    );
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
          <p className={styles.label}>SCORE TRANSMITTED ✅</p>
          <h1 style={{ color: '#00f0ff' }}>تم إرسال التقييم بنجاح</h1>
          <p style={{ color: '#92b5b1' }}>تم توثيق الدرجات في النظام. بانتظار انتقال المنظم للفريق التالي.</p>
        </div>
      </div>
    );
  }

  const allScored = Object.values(scores).every(v => v > 0);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <span className={styles.label}>JUDGE SCORING TERMINAL // SQUAD #{activeTeam.id}</span>
        <h1 className={styles.teamName}>{activeTeam.name}</h1>
        <p className={styles.idea}>"{activeTeam.projectIdea}"</p>
      </header>

      <div className={styles.scoringGrid}>
        {Object.keys(scores).map((key) => (
          <div key={key} className={styles.scoreRow}>
            <div className={styles.scoreHeader}>
              <span className={styles.criteriaName}>CRITERIA: {key.toUpperCase()}</span>
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
          {allScored ? '[ TRANSMIT SCORE / إرسال التقييم ]' : '[ أكمل تقييم جميع المعايير ]'}
        </button>
      </div>
    </div>
  );
}
