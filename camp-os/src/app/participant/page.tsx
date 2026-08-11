'use client';

import React, { useState } from 'react';
import { useCampContext } from '@/lib/services/CampContext';
import { useCampEngine } from '@/lib/services/campEngine';
import GlobalTimer from '@/components/GlobalTimer';
import styles from './participant.module.css';
import { CustomTask } from '@/lib/services/types';

export default function ParticipantDashboard() {
  const { provider, currentUser } = useCampContext();
  const { 
    isLoaded, globalState, activeStage, isBreak, isDemoDay,
    userTeam: team, activeDemoTeam, tasks, completedCount, totalTasks, progressPercentage
  } = useCampEngine();

  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const [deliverableUrl, setDeliverableUrl] = useState('');
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);

  if (!currentUser || currentUser.role !== 'participant') {
    return <div className={styles.container}><div className={styles.errorText}>UNAUTHORIZED. PLEASE LOGIN AS PARTICIPANT.</div></div>;
  }

  if (!isLoaded || !globalState) {
    return <div className={styles.container}><div className={styles.systemLabel}>INITIALIZING PARTICIPANT TERMINAL...</div></div>;
  }

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    setIsJoining(true);
    setJoinError('');
    try {
      await provider.joinTeam(joinCodeInput.trim().toUpperCase(), currentUser.id);
    } catch (err: any) {
      setJoinError(err.message || "فشل الانضمام إلى الفريق.");
      setIsJoining(false);
    }
  };

  if (!team) {
    return (
      <div className={styles.container}>
        <div className={styles.waitingRoom}>
          <div className={styles.waitingCard}>
            <span className={styles.systemLabel}>TEAM ACCESS CONTROL</span>
            <h1 className={styles.teamBadge} style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>انضم إلى فريقك</h1>
            <p className={styles.missionDesc} style={{ fontSize: '0.9rem' }}>أدخل رمز الانضمام (Join Code) المكون من 6 رموز والصادر من المنظم.</p>
            <form onSubmit={handleJoinTeam} style={{ marginTop: '1.5rem' }}>
              <input 
                type="text" 
                placeholder="CODE" 
                value={joinCodeInput} 
                onChange={e => setJoinCodeInput(e.target.value)}
                className={styles.joinInput}
                disabled={isJoining}
                maxLength={6}
              />
              <button type="submit" className={styles.joinBtn} disabled={isJoining || !joinCodeInput.trim()}>
                {isJoining ? 'VERIFYING...' : '[ ENTER SQUAD ]'}
              </button>
            </form>
            {joinError && <p className={styles.errorText}>{joinError}</p>}
          </div>
        </div>
      </div>
    );
  }

  const handleToggleTask = async (taskId: string) => {
    await provider.submitTask(team.id, taskId);
  };

  const handleDeliverableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingWork(true);
    try {
      if (deliverableUrl.trim()) {
        await provider.updateTeam(team.id, { submittedDeliverableUrl: deliverableUrl.trim() });
      }
      await provider.submitCheckpoint(team.id);
    } finally {
      setIsSubmittingWork(false);
    }
  };

  const handleRequestHelp = async () => {
    await provider.requestIntervention(team.id, currentUser.id);
  };

  const renderActiveStageContent = () => {
    if (isBreak) {
      return (
        <div className={styles.missionActive}>
          <span className={styles.subLabel}>SYSTEM STATUS // PAUSED</span>
          <h2 className={styles.missionTitleActive}>استراحة معسكر — OPERATIONAL BREAK</h2>
          <p className={styles.missionDesc}>جميع عمليات البناء متوقفة مؤقتاً للتزود بالراحة.</p>
        </div>
      );
    }

    if (isDemoDay) {
      const isMyTeamActive = activeDemoTeam?.id === team.id;
      return (
        <div className={styles.missionActive}>
          <span className={styles.subLabel}>DEMO DAY // PRESENTATIONS</span>
          <h2 className={styles.missionTitleActive}>
            {isMyTeamActive ? '🔴 إنه دور فريقك الآن!' : 'يوم العروض والتقييم'}
          </h2>
          <p className={styles.missionDesc}>
            {isMyTeamActive 
              ? 'توجّه فوراً لمستجدات البث والعرض التقديمي أمام لجنة التحكيم.' 
              : 'تابع شاشة العروض الرئيسية واطلع على المشاريع المعروضة.'}
          </p>
        </div>
      );
    }

    return (
      <div className={styles.missionActive}>
        <span className={styles.subLabel}>CURRENT STAGE // 0{activeStage.order}</span>
        <h2 className={styles.missionTitleActive}>{activeStage.title}</h2>
        <p className={styles.missionDesc}>{activeStage.description}</p>

        {/* MISSION TASKS CHECKLIST */}
        <div className={styles.missionSection}>
          <div className={styles.sectionLabel}>
            STAGE CHECKLIST ({completedCount} / {totalTasks} COMPLETED)
          </div>

          <div className={styles.missionChecklist}>
            {tasks.length === 0 ? (
              <p className={styles.missionDesc}>لا توجد مهام محددة لهذه المرحلة.</p>
            ) : (
              tasks.map(t => {
                const isDone = team.completedTaskIds?.includes(t.id);
                return (
                  <label key={t.id} className={`${styles.taskItem} ${isDone ? styles.taskCompleted : ''}`}>
                    <input 
                      type="checkbox" 
                      checked={!!isDone} 
                      onChange={() => handleToggleTask(t.id)}
                    />
                    <span>{t.title}</span>
                    {t.type && <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.7rem', color: '#00f0ff', marginRight: 'auto' }}>[{t.type}]</span>}
                  </label>
                );
              })
            )}
          </div>
        </div>

        {/* DELIVERABLE & CHECKPOINT SUBMISSION */}
        <div className={styles.missionSection}>
          <div className={styles.sectionLabel}>SUBMISSION & MENTOR REVIEW</div>

          {team.checkpointStatus === 'idle' ? (
            <form onSubmit={handleDeliverableSubmit} className={styles.deliverableForm}>
              <label className={styles.subLabel}>رابط المشروع / MVP Deliverable URL (اختياري)</label>
              <input 
                type="url" 
                placeholder="https://your-mvp-demo.vercel.app" 
                value={deliverableUrl}
                onChange={e => setDeliverableUrl(e.target.value)}
                className={styles.deliverableInput}
              />
              <button type="submit" className={styles.massivePrimaryBtn} disabled={isSubmittingWork}>
                {isSubmittingWork ? 'SUBMITTING...' : '[ إرسال للمراجعة / SUBMIT FOR REVIEW ]'}
              </button>
            </form>
          ) : team.checkpointStatus === 'pending' ? (
            <div className={styles.statusBannerPending}>
              ⏳ تم إرسال العمل للمراجعة — بانتظار مراجعة المرشد (UNDER REVIEW)
            </div>
          ) : (
            <div className={styles.statusBannerApproved}>
              ✅ تم اعتماد التسليم وموافقـة المرشد (APPROVED)
            </div>
          )}
        </div>

        {/* HELP INTERVENTION */}
        <div style={{ width: '100%', marginTop: '1.5rem' }}>
          <button 
            onClick={handleRequestHelp} 
            disabled={team.healthStatus === 'red'}
            className={styles.secondaryBtnWarning}
          >
            {team.healthStatus === 'red' ? '🚨 طلب المساعدة قيد الانتظار (WAITING MENTOR)' : '🚨 أحتاج مساعدة المُرشِد (REQUEST HELP)'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {globalState.announcement && (
        <div className={styles.announcementBanner}>
          {globalState.announcement}
        </div>
      )}

      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.systemLabel}>SQUAD TERMINAL // {team.id}</span>
          <div className={styles.teamBadge}>{team.name}</div>
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progressPercentage}%` }} />
            </div>
            <span className={styles.progressText}>{progressPercentage}%</span>
          </div>
        </div>
        <GlobalTimer />
      </header>

      {/* MAIN CARD */}
      <main className={styles.mainCard}>
        {renderActiveStageContent()}
      </main>
    </div>
  );
}
