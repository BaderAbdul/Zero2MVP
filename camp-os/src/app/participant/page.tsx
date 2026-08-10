'use client';

import React from 'react';
import { useCampContext, useTeam, useGlobalState } from '@/lib/services/CampContext';
import styles from './participant.module.css';
import { CampPhase } from '@/lib/services/types';

export default function ParticipantDashboard() {
  const { provider, currentUser } = useCampContext();
  const globalState = useGlobalState();
  const team = useTeam(currentUser?.teamId);

  if (!currentUser || currentUser.role !== 'participant') {
    return <div className={styles.error}>Unauthorized. Please login as Participant via /dev.</div>;
  }

  if (!team || !globalState) return <div className={styles.loading}>Loading...</div>;

  const handleSimulateTaskSubmit = async () => {
    await provider.submitTask(team.id, {
      taskId: `task-${Date.now()}`,
      status: 'completed'
    });
  };

  const handleRequestCheckpoint = async () => {
    await provider.submitCheckpoint(team.id);
  };

  const renderCurrentMission = (phase: CampPhase) => {
    switch (phase) {
      case 'setup':
      case 'welcome':
        return (
          <div className={styles.missionCenter}>
            <h2 className={styles.missionTitle}>Standby</h2>
            <p className={styles.missionDesc}>The bootcamp is about to begin. Please watch the projector screen.</p>
          </div>
        );
      
      case 'break':
        return (
          <div className={styles.missionCenter}>
            <h2 className={styles.missionTitle}>Break Time ☕</h2>
            <p className={styles.missionDesc}>Take a rest. The bootcamp is paused.</p>
          </div>
        );

      case 'ideation':
      case 'build':
        return (
          <div className={styles.missionActive}>
            <p className={styles.subLabel}>CURRENT MISSION</p>
            <h2 className={styles.missionTitleActive}>
              {phase === 'ideation' ? 'Ideation Mode' : 'Build Mode'}
            </h2>
            <p className={styles.missionDesc}>
              {phase === 'ideation' 
                ? 'Work with your team to finalize your idea and architecture.'
                : 'Build your MVP. Focus on core features.'}
            </p>
            
            <div className={styles.actionGroup}>
              <button 
                onClick={handleSimulateTaskSubmit} 
                disabled={team.progressPercentage >= 100}
                className={styles.primaryBtn}
              >
                {team.progressPercentage >= 100 ? 'MAX PROGRESS REACHED' : 'Complete a Task (+10%)'}
              </button>
              
              {team.checkpointStatus === 'idle' && (
                <button onClick={handleRequestCheckpoint} className={styles.secondaryBtn}>
                  Request Mentor Review
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

      case 'checkpoint':
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

      case 'demo_day_queue':
      case 'demo_day_intro':
      case 'demo_day_presenting':
      case 'demo_day_judging':
      case 'demo_day_reveal':
        if (globalState.activeDemoTeamId === team.id) {
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

      case 'finished':
        return (
          <div className={styles.missionCenter}>
            <h2 className={styles.missionTitle}>Camp Finished</h2>
            <p className={styles.missionDesc}>Thank you for participating! See the projector for the winner.</p>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      {globalState.announcement && (
        <div className={styles.announcementBanner}>
          <strong>Broadcast:</strong> {globalState.announcement}
        </div>
      )}

      <header className={styles.header}>
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
      </header>

      <main className={styles.mainCard}>
        {renderCurrentMission(globalState.currentPhase)}
      </main>
    </div>
  );
}
