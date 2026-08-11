'use client';

import React from 'react';
import { useCampContext, useTeams, useTeamInterventions } from '@/lib/services/CampContext';
import styles from './mentor.module.css';

const TeamCard = ({ team, isUrgent }: { team: any, isUrgent: boolean }) => {
  const { provider, currentUser } = useCampContext();
  const interventions = useTeamInterventions(team.id) || [];
  
  const openInterventions = interventions.filter(i => i.status === 'open');
  const claimedInterventions = interventions.filter(i => i.status === 'claimed' && i.mentorId === currentUser?.id);
  const othersClaimedInterventions = interventions.filter(i => i.status === 'claimed' && i.mentorId !== currentUser?.id);

  const handleApproveCheckpoint = async () => {
    await provider.approveCheckpoint(team.id, 'mvp_build', currentUser!.id);
  };

  const handleUpdateHealth = async (health: 'green' | 'yellow' | 'red') => {
    await provider.updateTeam(team.id, { healthStatus: health });
  };

  const handleClaim = async (id: string) => {
    await provider.claimIntervention(team.id, id, currentUser!.id);
  };

  const handleResolve = async (id: string) => {
    await provider.resolveIntervention(team.id, id, currentUser!.id);
  };

  return (
    <div className={`${styles.teamCard} ${styles[`health-${team.healthStatus}`]} ${isUrgent ? styles.urgentCard : ''}`}>
      <div className={styles.cardHeader}>
        <div className={styles.headerLeftCard}>
          <h2>{team.name}</h2>
          <span className={styles.stageBadge}>{team.currentStage}</span>
        </div>
        <div className={styles.healthBadge}>
          {team.healthStatus === 'green' ? 'OK' : team.healthStatus === 'yellow' ? 'WARN' : 'CRIT'}
        </div>
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
        {team.checkpointStatus !== 'idle' && (
          <span className={`${styles.statusLabel} ${styles[`status-${team.checkpointStatus}`]}`}>
            [CHECKPOINT] {team.checkpointStatus.toUpperCase()}
          </span>
        )}
        
        {team.checkpointStatus === 'pending' && (
          <button 
            onClick={handleApproveCheckpoint}
            className={styles.approveButton}
          >
            APPROVE CHECKPOINT
          </button>
        )}
        
        {openInterventions.length > 0 && (
          <div className={styles.interventionsBox}>
            <p className={styles.interventionsLabel}>[!] HELP REQUESTED</p>
            {openInterventions.map(i => (
              <button key={i.id} onClick={() => handleClaim(i.id)} className={styles.claimBtn}>
                CLAIM INTERVENTION
              </button>
            ))}
          </div>
        )}

        {claimedInterventions.length > 0 && (
          <div className={styles.interventionsBox}>
            <p className={styles.interventionsLabel} style={{color: 'var(--color-success)', borderColor: 'var(--color-success)'}}>
              [+] YOU ARE ASSISTING
            </p>
            {claimedInterventions.map(i => (
              <button key={i.id} onClick={() => handleResolve(i.id)} className={styles.resolveBtn}>
                MARK RESOLVED
              </button>
            ))}
          </div>
        )}

        {othersClaimedInterventions.length > 0 && (
          <div className={styles.interventionsBox} style={{borderColor: 'var(--border-strong)'}}>
            <p className={styles.interventionsLabel} style={{color: 'var(--text-muted)'}}>
              [-] OTHER MENTOR ASSISTING
            </p>
          </div>
        )}
        
        <div className={styles.healthControls}>
          <button onClick={() => handleUpdateHealth('green')} className={styles.healthBtnGreen}>SET OK</button>
          <button onClick={() => handleUpdateHealth('yellow')} className={styles.healthBtnYellow}>SET WARN</button>
          <button onClick={() => handleUpdateHealth('red')} className={styles.healthBtnRed}>SET CRIT</button>
        </div>
      </div>
    </div>
  );
};

export default function MentorDashboard() {
  const { currentUser } = useCampContext();
  const teams = useTeams();

  if (!currentUser || currentUser.role !== 'mentor') {
    return <div className={styles.error}>UNAUTHORIZED. PLEASE LOGIN AS MENTOR VIA <a href="/login">/login</a>.</div>;
  }

  const actionRequiredTeams = teams.filter(t => t.checkpointStatus === 'pending' || t.healthStatus === 'red' || t.healthStatus === 'yellow');
  const monitoringTeams = teams.filter(t => t.checkpointStatus !== 'pending' && t.healthStatus === 'green');

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.systemLabel}>OP-SYS // MENTOR // {currentUser.id}</span>
          <h1>Intervention Center</h1>
        </div>
      </header>

      <div className={styles.triageLayout}>
        {/* LANE 1: ACTION REQUIRED */}
        <section className={styles.lane}>
          <h2 className={styles.laneTitleUrgent}>
            [!] REQUIRES INTERVENTION <span className={styles.countBadge}>{actionRequiredTeams.length}</span>
          </h2>
          <div className={styles.urgentGrid}>
            {actionRequiredTeams.length > 0 ? (
              actionRequiredTeams.map(t => <TeamCard key={t.id} team={t} isUrgent={true} />)
            ) : (
              <div className={styles.emptyLane}>[ NO ACTION REQUIRED ]</div>
            )}
          </div>
        </section>

        {/* LANE 2: MONITORING */}
        <section className={styles.lane}>
          <h2 className={styles.laneTitle}>
            [-] TELEMETRY (OK) <span className={styles.countBadge}>{monitoringTeams.length}</span>
          </h2>
          <div className={styles.monitoringGrid}>
            {monitoringTeams.map(t => <TeamCard key={t.id} team={t} isUrgent={false} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
