'use client';

import React from 'react';
import { useCampEngine } from '@/lib/services/campEngine';
import { useTeams } from '@/lib/services/CampContext';
import styles from './projector.module.css';

export default function AuditoriumProjector() {
  const { 
    isLoaded, globalState, activeSession, nextSession, 
    formattedTime, isBreak, isDemoDay, activeDemoTeam
  } = useCampEngine();
  const teams = useTeams();

  if (!isLoaded || !globalState) {
    return (
      <div className={styles.projectorShell} style={{ justifyContent: 'center', alignItems: 'center' }}>
        <h1 className={styles.brandTitle}>FROM ZERO TO MVP</h1>
        <p style={{ fontSize: '1.5rem', marginTop: '1rem' }}>جاري شاشة عرض القاعة الرئيسية...</p>
      </div>
    );
  }

  // Sorted teams by progress for momentum display
  const sortedTeams = [...teams].sort((a, b) => (b.progressPercentage || 0) - (a.progressPercentage || 0)).slice(0, 5);

  return (
    <div className={styles.projectorShell}>
      {/* FULL SCREEN ANNOUNCEMENT OVERLAY */}
      {globalState.announcement && (
        <div className={styles.announcementOverlay}>
          <span className={styles.announcementTag}>إعلان هام من إدارة المعسكر</span>
          <h1 className={styles.announcementText}>{globalState.announcement}</h1>
          <span style={{ fontSize: '1.25rem', opacity: 0.8, fontFamily: 'IBM Plex Mono' }}>BROADCAST SIGNAL // LIVE</span>
        </div>
      )}

      {/* TOP HEADER */}
      <header className={styles.topHeader}>
        <div>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '1rem', fontWeight: 800, color: 'var(--color-blue)' }}>
            AI PRODUCT BUILDER CAMP
          </span>
          <h1 className={styles.brandTitle}>FROM ZERO TO MVP</h1>
        </div>

        <div className={styles.stageBadge}>
          {isBreak ? '☕ استراحة معسكر' : isDemoDay ? '🏆 يوم العروض والتقييم' : `SESSION 0${activeSession?.order || 1} · DAY ${activeSession?.day || 1}`}
        </div>
      </header>

      {/* CENTRAL STAGE */}
      <main className={styles.centerStage}>
        {isBreak ? (
          <>
            <h1 className={styles.sessionTitle}>استراحة معسكر — OPERATIONAL BREAK</h1>
            <p className={styles.sessionDesc}>خذ قسطاً من الراحة والتزود بالطاقة قبل استئناف سباق البناء القادم.</p>
            <div className={styles.timerBox}>
              <div className={styles.timerText}>{formattedTime}</div>
            </div>
          </>
        ) : isDemoDay ? (
          <>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-blue)' }}>
              PRESENTING NOW
            </span>
            <h1 className={styles.sessionTitle}>
              {activeDemoTeam ? activeDemoTeam.name : 'يوم العروض والتقييم — DEMO DAY'}
            </h1>
            <p className={styles.sessionDesc}>
              {activeDemoTeam ? `الفريق المعروض حالياً: ${activeDemoTeam.projectIdea || 'مشروع ذكاء اصطناعي'}` : 'عرض المنتجات الحية أمام لجنة التحكيم'}
            </p>
            <div className={styles.timerBox}>
              <div className={styles.timerText}>{formattedTime}</div>
            </div>
          </>
        ) : (
          <>
            <h1 className={styles.sessionTitle}>
              {activeSession?.mission?.title || activeSession?.title || 'سباق البناء والتفكير'}
            </h1>
            <p className={styles.sessionDesc}>
              {activeSession?.mission?.description || activeSession?.description || 'من فكرة خام إلى منتج حي خلال 3 أيام.'}
            </p>

            <div className={styles.timerBox}>
              <div className={styles.timerText}>{formattedTime}</div>
            </div>

            {/* LIVE TEAM MOMENTUM LEADERBOARD */}
            {sortedTeams.length > 0 && (
              <div className={styles.podiumGrid}>
                {sortedTeams.map((t, idx) => (
                  <div key={t.id} className={styles.podiumRow}>
                    <span className={styles.podiumRank}>0{idx + 1}</span>
                    <span className={styles.podiumName}>{t.name}</span>
                    <div className={styles.podiumBarBg}>
                      <div className={styles.podiumBarFill} style={{ width: `${t.progressPercentage || 0}%` }} />
                    </div>
                    <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 900, fontSize: '1.25rem' }}>
                      {t.progressPercentage || 0}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* BOTTOM FOOTER */}
      <footer className={styles.bottomFooter}>
        <div>
          <span>الجلسة القادمة: </span>
          <span style={{ color: 'var(--color-blue)' }}>
            {nextSession ? nextSession.title : 'ختام اليوم والحفل ختامي'}
          </span>
        </div>

        <div style={{ fontFamily: 'IBM Plex Mono' }}>
          CAMP OS 5.0 · AUDITORIUM DISPLAY
        </div>
      </footer>
    </div>
  );
}
