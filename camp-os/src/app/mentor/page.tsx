'use client';

import React from 'react';
import { useCampContext, useTeams } from '@/lib/services/CampContext';
import styles from './mentor.module.css';

export default function MentorDashboard() {
  const { provider, currentUser } = useCampContext();
  const teams = useTeams();

  if (!currentUser || currentUser.role !== 'mentor') {
    return <div className={styles.error}>Unauthorized. Please login as Mentor via /dev.</div>;
  }

  const handleApproveCheckpoint = async (teamId: string) => {
    await provider.approveCheckpoint(teamId, 'mvp_build');
  };

  const handleUpdateHealth = async (teamId: string, health: 'green' | 'yellow' | 'red') => {
    await provider.updateTeam(teamId, { healthStatus: health });
  };

  const actionRequiredTeams = teams.filter(t => t.checkpointStatus === 'pending' || t.healthStatus === 'red');
  const monitoringTeams = teams.filter(t => t.checkpointStatus !== 'pending' && t.healthStatus !== 'red')
    .sort((a, b) => {
      // Yellow first, then green
      if (a.healthStatus === 'yellow' && b.healthStatus === 'green') return -1;
      if (a.healthStatus === 'green' && b.healthStatus === 'yellow') return 1;
      return 0;
    });

  const renderTeamCard = (team: any, isUrgent: boolean) => (
    <div key={team.id} className={`${styles.teamCard} ${styles[`health-${team.healthStatus}`]} ${isUrgent ? styles.urgentCard : ''}`}>
      <div className={styles.cardHeader}>
        <div className={styles.headerLeft}>
          <h2>{team.name}</h2>
          <span className={styles.stageBadge}>{team.currentStage}</span>
        </div>
        <div className={styles.healthIndicator} title={`Health: ${team.healthStatus}`} />
      </div>
      
      <p className={styles.idea}>"{team.projectIdea}"</p>
      
      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${team.progressPercentage}%` }} 
          />
        </div>
        <span className={styles.progressText}>{team.progressPercentage}%</span>
      </div>

      <div className={styles.checkpointSection}>
        <span className={`${styles.statusLabel} ${styles[`status-${team.checkpointStatus}`]}`}>
          Checkpoint: {team.checkpointStatus.toUpperCase()}
        </span>
        
        {team.checkpointStatus === 'pending' && (
          <button 
            onClick={() => handleApproveCheckpoint(team.id)}
            className={styles.approveButton}
          >
            Approve Checkpoint
          </button>
        )}
        
        <div className={styles.healthControls}>
          <button onClick={() => handleUpdateHealth(team.id, 'green')} className={styles.healthBtnGreen}>✓</button>
          <button onClick={() => handleUpdateHealth(team.id, 'yellow')} className={styles.healthBtnYellow}>⚠️</button>
          <button onClick={() => handleUpdateHealth(team.id, 'red')} className={styles.healthBtnRed}>🚨</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Team Intervention Center</h1>
      </header>

      <div className={styles.triageLayout}>
        {/* LANE 1: ACTION REQUIRED */}
        <section className={styles.lane}>
          <h2 className={styles.laneTitleUrgent}>
            🚨 Action Required <span className={styles.countBadge}>{actionRequiredTeams.length}</span>
          </h2>
          <div className={styles.urgentGrid}>
            {actionRequiredTeams.length > 0 ? (
              actionRequiredTeams.map(t => renderTeamCard(t, true))
            ) : (
              <div className={styles.emptyLane}>✅ All caught up! No teams need immediate help.</div>
            )}
          </div>
        </section>

        {/* LANE 2: MONITORING */}
        <section className={styles.lane}>
          <h2 className={styles.laneTitle}>
            ✅ Monitoring <span className={styles.countBadge}>{monitoringTeams.length}</span>
          </h2>
          <div className={styles.monitoringGrid}>
            {monitoringTeams.map(t => renderTeamCard(t, false))}
          </div>
        </section>
      </div>
    </div>
  );
}
