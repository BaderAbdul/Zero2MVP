'use client';

import React from 'react';
import { useCampContext } from '@/lib/services/CampContext';
import { useCampEngine } from '@/lib/services/campEngine';
import GlobalTimer from '@/components/GlobalTimer';
import styles from './participant.module.css';

export default function ParticipantDashboard() {
  const { provider, currentUser } = useCampContext();
  const { isLoaded, globalState, currentRoSPhase, isBreak, currentMission, activeCustomStage, userTeam: team, activeDemoTeam } = useCampEngine();

  const [joinCodeInput, setJoinCodeInput] = React.useState('');
  const [joinError, setJoinError] = React.useState('');
  const [isJoining, setIsJoining] = React.useState(false);

  if (!currentUser || currentUser.role !== 'participant') {
    return <div className={styles.error}>UNAUTHORIZED. LOGIN AS PARTICIPANT.</div>;
  }

  if (!isLoaded || !globalState) return <div className={styles.loading}>INITIALIZING TERMINAL...</div>;

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
      <div className={styles.waitingRoom}>
        <div className={styles.waitingCard}>
          <h1>TEAM ACCESS</h1>
          <p className={styles.missionDesc} style={{margin: '1rem 0'}}>الرجاء إدخال رمز الانضمام المقدم من المنظّم.</p>
          <form onSubmit={handleJoinTeam} className={styles.joinForm}>
            <input 
              type="text" 
              placeholder="CODE" 
              value={joinCodeInput} 
              onChange={e => setJoinCodeInput(e.target.value)}
              className={styles.joinInput}
              disabled={isJoining}
            />
            <button type="submit" className={styles.joinBtn} disabled={isJoining || !joinCodeInput.trim()}>
              {isJoining ? 'VERIFYING...' : 'ENTER SQUAD'}
            </button>
          </form>
          {joinError && <p className={styles.errorText}>{joinError}</p>}
        </div>
      </div>
    );
  }

  const handleTaskSubmit = async (taskId: string) => {
    if (!team.completedTaskIds?.includes(taskId)) {
      await provider.submitTask(team.id, taskId);
    }
  };

  const handleRequestCheckpoint = async () => {
    await provider.submitCheckpoint(team.id);
  };

  const handleRequestHelp = async () => {
    await provider.requestIntervention(team.id, currentUser.id);
  };

  const renderMissionChecklist = () => {
    let tasksToRender = activeCustomStage ? activeCustomStage.tasks : currentMission?.tasks;
    
    if (!tasksToRender || tasksToRender.length === 0) return null;

    const completedCount = team.completedTaskIds?.filter(id => tasksToRender!.find((t: any) => t.id === id)).length || 0;
    const totalCount = tasksToRender.length;
    const allCompleted = totalCount > 0 && completedCount === totalCount;

    return (
      <div className={styles.missionChecklist}>
        <div className={styles.tasksHeader}>مهامك (TASKS)</div>
        {tasksToRender.map((task: any) => {
          const isCompleted = team.completedTaskIds?.includes(task.id);
          return (
            <label key={task.id} className={`${styles.taskItem} ${isCompleted ? styles.taskCompleted : ''}`}>
              <input 
                type="checkbox" 
                checked={isCompleted} 
                onChange={() => handleTaskSubmit(task.id)}
                disabled={isCompleted}
              />
              <span>{task.title || (task as any).description}</span>
            </label>
          );
        })}
        {allCompleted && (
          <div className={styles.statusBannerApproved}>
            [COMPLETED] جميع مهام هذه المرحلة مكتملة.
          </div>
        )}
      </div>
    );
  };

  const renderCurrentMission = () => {
    if (isBreak) {
      return (
        <div className={styles.missionCenter}>
          <p className={styles.subLabel}>SYSTEM PAUSE</p>
          <h2 className={styles.missionTitle}>استراحة</h2>
          <p className={styles.missionDesc}>الأنظمة متوقفة مؤقتاً.</p>
        </div>
      );
    }

    if (currentRoSPhase.type === 'demo_day') {
      if (activeDemoTeam?.id === team.id) {
        return (
          <div className={styles.missionActiveAlert}>
            <p className={styles.subLabel}>LIVE STAGE</p>
            <h2 className={styles.missionTitlePulse}>إنه دورك!</h2>
            <p className={styles.missionDesc}>فريقك الآن على المسرح. استعد للعرض.</p>
          </div>
        );
      } else {
        return (
          <div className={styles.missionCenter}>
            <p className={styles.subLabel}>OBSERVATION STAGE</p>
            <h2 className={styles.missionTitle}>يوم العروض</h2>
            <p className={styles.missionDesc}>تابع شاشة العرض.</p>
          </div>
        );
      }
    }

    if (currentRoSPhase.id === 'checkpoint') {
      return (
        <div className={styles.missionCenter}>
          <p className={styles.subLabel}>REQUIRED ACTION</p>
          <h2 className={styles.missionTitle}>نقطة التحقق</h2>
          {team.checkpointStatus === 'idle' ? (
            <div className={styles.missionActive}>
              <p className={styles.missionDesc}>المطلوب إرسال عملك للمراجعة الآن.</p>
              <button onClick={handleRequestCheckpoint} className={styles.primaryBtnWarning}>
                SUBMIT FOR REVIEW
              </button>
            </div>
          ) : team.checkpointStatus === 'pending' ? (
            <div className={styles.statusBannerPending}>
              [PENDING] قيد المراجعة من قبل المُرشِد...
            </div>
          ) : (
            <div className={styles.statusBannerApproved}>
              [APPROVED] تم اجتياز نقطة التحقق.
            </div>
          )}
        </div>
      );
    }

    // Dynamic Mission Stage (from Organizer Command Center or predefined ROS)
    const activeStageTitle = activeCustomStage ? activeCustomStage.title : (currentMission ? currentMission.title : currentRoSPhase.title);
    const activeStageDesc = activeCustomStage ? activeCustomStage.description : (currentMission ? currentMission.description : currentRoSPhase.description);
    
    const showSubmitCheckpoint = activeCustomStage?.allowSubmission ?? true;

    return (
      <div className={styles.missionActive}>
        <p className={styles.subLabel}>CURRENT ASSIGNMENT</p>
        <h2 className={styles.missionTitleActive}>{activeStageTitle}</h2>
        <p className={styles.missionDesc}>{activeStageDesc}</p>
        
        {renderMissionChecklist()}
        
        <div className={styles.actionGroup}>
          <button 
            onClick={handleRequestHelp} 
            disabled={team.healthStatus === 'red'}
            className={styles.secondaryBtnWarning}
          >
            {team.healthStatus === 'red' ? '🚨 REQUEST SENT' : '[ SOS - REQUEST HELP ]'}
          </button>
          
          {(team.checkpointStatus === 'idle' && showSubmitCheckpoint) && (
            <button onClick={handleRequestCheckpoint} className={styles.secondaryBtn}>
              [ إرسال المهمة للمراجعة ]
            </button>
          )}
        </div>
        
        {team.checkpointStatus === 'pending' && (
          <div className={styles.statusBannerPending}>
            [PENDING] تم طلب المراجعة...
          </div>
        )}
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

      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.systemLabel}>SQUAD // {team.id}</span>
          <div className={styles.teamBadge}>{team.name}</div>
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${team.progressPercentage}%` }} 
              />
            </div>
            <span className={styles.progressText}>{team.progressPercentage}%</span>
          </div>
        </div>
        <GlobalTimer />
      </header>

      <main className={styles.mainCard}>
        {renderCurrentMission()}
      </main>
    </div>
  );
}
