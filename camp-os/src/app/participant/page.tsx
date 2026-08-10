'use client';

import React from 'react';
import { useCampContext } from '@/lib/services/CampContext';
import { useCampEngine } from '@/lib/services/campEngine';
import GlobalTimer from '@/components/GlobalTimer';
import styles from './participant.module.css';

export default function ParticipantDashboard() {
  const { provider, currentUser } = useCampContext();
  const { isLoaded, globalState, currentRoSPhase, isBreak, currentMission, userTeam: team, activeDemoTeam } = useCampEngine();

  const [joinCodeInput, setJoinCodeInput] = React.useState('');
  const [joinError, setJoinError] = React.useState('');
  const [isJoining, setIsJoining] = React.useState(false);

  if (!currentUser || currentUser.role !== 'participant') {
    return <div className={styles.error}>Unauthorized. Please login as Participant via /dev.</div>;
  }

  if (!isLoaded || !globalState) return <div className={styles.loading}>Loading...</div>;

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    setIsJoining(true);
    setJoinError('');
    try {
      await provider.joinTeam(joinCodeInput.trim().toUpperCase(), currentUser.id);
      // Success, context will automatically update `teamId` and re-render.
    } catch (err: any) {
      setJoinError(err.message || "Failed to join team.");
      setIsJoining(false);
    }
  };

  if (!team) {
    return (
      <div className={styles.waitingRoom}>
        <div className={styles.waitingCard}>
          <h1>Join Your Team</h1>
          <p>Please enter the 6-character join code provided by your organizer.</p>
          <form onSubmit={handleJoinTeam} className={styles.joinForm}>
            <input 
              type="text" 
              placeholder="e.g. MVP-7K4Q or 7K4Q9X" 
              value={joinCodeInput} 
              onChange={e => setJoinCodeInput(e.target.value)}
              className={styles.joinInput}
              disabled={isJoining}
            />
            <button type="submit" className={styles.joinBtn} disabled={isJoining || !joinCodeInput.trim()}>
              {isJoining ? 'Joining...' : 'Join Team'}
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
    if (!currentMission) return null;

    const completedCount = team.completedTaskIds?.filter(id => currentMission.tasks.find(t => t.id === id)).length || 0;
    const totalCount = currentMission.tasks.length;
    const allCompleted = totalCount > 0 && completedCount === totalCount;

    return (
      <div className={styles.missionChecklist}>
        {currentMission.tasks.map(task => {
          const isCompleted = team.completedTaskIds?.includes(task.id);
          return (
            <label key={task.id} className={`${styles.taskItem} ${isCompleted ? styles.taskCompleted : ''}`}>
              <input 
                type="checkbox" 
                checked={isCompleted} 
                onChange={() => handleTaskSubmit(task.id)}
                disabled={isCompleted}
              />
              <span>{task.description}</span>
            </label>
          );
        })}
        {allCompleted && (
          <div className={styles.statusBannerApproved}>
            ✅ Mission Accomplished!
          </div>
        )}
      </div>
    );
  };

  const renderCurrentMission = () => {
    if (isBreak) {
      return (
        <div className={styles.missionCenter}>
          <h2 className={styles.missionTitle}>Break Time ☕</h2>
          <p className={styles.missionDesc}>Take a rest. The bootcamp is paused.</p>
        </div>
      );
    }

    if (currentRoSPhase.type === 'demo_day') {
      if (activeDemoTeam?.id === team.id) {
        return (
          <div className={styles.missionActiveAlert}>
            <h2 className={styles.missionTitlePulse}>IT IS YOUR TURN! 🎤</h2>
            <p className={styles.missionDesc}>Head to the stage now.</p>
          </div>
        );
      } else {
        return (
          <div className={styles.missionCenter}>
            <h2 className={styles.missionTitle}>Demo Day</h2>
            <p className={styles.missionDesc}>Watch the projector and cheer for your peers.</p>
          </div>
        );
      }
    }

    if (currentRoSPhase.id === 'checkpoint') {
      return (
        <div className={styles.missionCenter}>
          <h2 className={styles.missionTitle}>Checkpoint 🚨</h2>
          {team.checkpointStatus === 'idle' ? (
            <div className={styles.missionActive}>
              <p className={styles.missionDesc}>You must submit your work for review now.</p>
              <button onClick={handleRequestCheckpoint} className={styles.primaryBtnWarning}>
                Request Review Now
              </button>
            </div>
          ) : team.checkpointStatus === 'pending' ? (
            <div className={styles.statusBannerPending}>
              ⏳ Mentor is reviewing your checkpoint...
            </div>
          ) : (
            <div className={styles.statusBannerApproved}>
              ✅ Checkpoint passed! Great job.
            </div>
          )}
        </div>
      );
    }

    if (currentMission) {
      return (
        <div className={styles.missionActive}>
          <p className={styles.subLabel}>CURRENT MISSION</p>
          <h2 className={styles.missionTitleActive}>{currentMission.title}</h2>
          <p className={styles.missionDesc}>{currentMission.description}</p>
          
          {renderMissionChecklist()}
          
          <div className={styles.actionGroup}>
            <button 
              onClick={handleRequestHelp} 
              disabled={team.healthStatus === 'red'}
              className={styles.secondaryBtnWarning}
            >
              {team.healthStatus === 'red' ? 'Help Requested 🚨' : 'Request Mentor Help 🆘'}
            </button>
            
            {team.checkpointStatus === 'idle' && (
              <button onClick={handleRequestCheckpoint} className={styles.secondaryBtn}>
                Submit for Early Review
              </button>
            )}
          </div>
          
          {team.checkpointStatus === 'pending' && (
            <div className={styles.statusBannerPending}>
              ⏳ Checkpoint requested. Waiting for a mentor...
            </div>
          )}
        </div>
      );
    }

    // Default standby
    return (
      <div className={styles.missionCenter}>
        <h2 className={styles.missionTitle}>{currentRoSPhase.title}</h2>
        <p className={styles.missionDesc}>{currentRoSPhase.description}</p>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {globalState.announcement && (
        <div className={styles.announcementBanner}>
          <strong>Broadcast:</strong> {globalState.announcement}
        </div>
      )}

      <header className={styles.header}>
        <div className={styles.headerLeft}>
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
