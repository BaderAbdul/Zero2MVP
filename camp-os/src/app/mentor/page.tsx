'use client';

import React from 'react';
import { useCampContext, useTeams, useUsers } from '@/lib/services/CampContext';
import { useCampEngine } from '@/lib/services/campEngine';
import GlobalTimer from '@/components/GlobalTimer';
import styles from './mentor.module.css';

export default function MentorDashboard() {
  const { provider, currentUser } = useCampContext();
  const { isLoaded, globalState, activeStage } = useCampEngine();
  const teams = useTeams();

  if (!currentUser || currentUser.role !== 'mentor') {
    return <div className={styles.container}><div className={styles.error}>UNAUTHORIZED. PLEASE LOGIN AS MENTOR.</div></div>;
  }

  if (!isLoaded || !globalState) {
    return <div className={styles.container}><div className={styles.systemLabel}>INITIALIZING MENTOR TERMINAL...</div></div>;
  }

  // Filter queues
  const urgentTeams = teams.filter(t => t.healthStatus === 'red' || t.healthStatus === 'yellow');
  const reviewPendingTeams = teams.filter(t => t.checkpointStatus === 'pending');
  const healthyTeams = teams.filter(t => t.healthStatus === 'green' && t.checkpointStatus !== 'pending');

  const handleClaimHelp = async (teamId: string) => {
    // Legacy support claim
    await provider.updateTeam(teamId, { healthStatus: 'yellow' });
  };

  const handleResolveHelp = async (teamId: string) => {
    await provider.updateTeam(teamId, { healthStatus: 'green' });
  };

  const handleApproveCheckpoint = async (teamId: string) => {
    await provider.approveCheckpoint(teamId, 'core_flow', currentUser.id);
  };

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.systemLabel}>OPERATIONAL SUPPORT // MENTOR INTERVENTION CENTER</span>
          <h1>MENTOR TRIAGE DASHBOARD</h1>
        </div>
        <GlobalTimer />
      </header>

      {/* TRIAGE LAYOUT */}
      <div className={styles.triageLayout}>

        {/* LEFT COLUMN: URGENT HELP & REVIEW QUEUE */}
        <div>
          {/* URGENT HELP REQUESTS */}
          <div className={styles.laneTitleUrgent}>
            🚨 URGENT HELP REQUESTS <span className={styles.countBadge}>{urgentTeams.length}</span>
          </div>

          <div className={styles.urgentGrid} style={{ marginBottom: '2rem' }}>
            {urgentTeams.length === 0 ? (
              <div className={styles.emptyLane}>[ NO ACTIVE HELP REQUESTS ]</div>
            ) : (
              urgentTeams.map(t => (
                <div key={t.id} className={`${styles.teamCard} ${styles.urgentCard}`}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h2>{t.name}</h2>
                      <span className={styles.systemLabel}>SQUAD // {t.id}</span>
                    </div>
                    <span className={`${styles.healthBadge} ${styles[`health-${t.healthStatus}`]}`}>
                      [{t.healthStatus.toUpperCase()}]
                    </span>
                  </div>

                  <p style={{ fontSize: '0.9rem', color: '#ff3366', margin: 0 }}>
                    ⚠️ الفريق طلب المساعدة ويرغب في توجيه فوري من المُرشد.
                  </p>

                  <div>
                    {t.healthStatus === 'red' ? (
                      <button onClick={() => handleClaimHelp(t.id)} className={styles.claimBtn}>
                        [ CLAIM HELP REQUEST / استلام الطلب ]
                      </button>
                    ) : (
                      <button onClick={() => handleResolveHelp(t.id)} className={styles.resolveBtn}>
                        [ RESOLVE / حل المشكلة ]
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* REVIEW QUEUE (SUBMISSIONS) */}
          <div className={styles.laneTitle}>
            📥 DELIVERABLE REVIEW QUEUE <span className={styles.countBadge}>{reviewPendingTeams.length}</span>
          </div>

          <div className={styles.urgentGrid}>
            {reviewPendingTeams.length === 0 ? (
              <div className={styles.emptyLane}>[ NO DELIVERABLES PENDING REVIEW ]</div>
            ) : (
              reviewPendingTeams.map(t => (
                <div key={t.id} className={styles.teamCard} style={{ borderRight: '4px solid #00f0ff' }}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h2>{t.name}</h2>
                      <span className={styles.systemLabel}>SUBMITTED FOR: {activeStage.title}</span>
                    </div>
                    <span className={styles.healthBadge} style={{ color: '#ffaa00', borderColor: '#ffaa00' }}>
                      PENDING REVIEW
                    </span>
                  </div>

                  {t.submittedDeliverableUrl && (
                    <div className={styles.deliverableBox}>
                      <span className={styles.systemLabel} style={{ display: 'block', marginBottom: '0.2rem' }}>DELIVERABLE URL:</span>
                      <a href={t.submittedDeliverableUrl} target="_blank" rel="noreferrer" className={styles.deliverableLink}>
                        {t.submittedDeliverableUrl}
                      </a>
                    </div>
                  )}

                  <button onClick={() => handleApproveCheckpoint(t.id)} className={styles.approveButton}>
                    [ APPROVE DELIVERABLE / اعتماد التسليم ]
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: MONITORING ALL TEAMS */}
        <div>
          <div className={styles.laneTitle}>
            📊 MONITORING & HEALTH OVERVIEW <span className={styles.countBadge}>{healthyTeams.length} HEALTHY</span>
          </div>

          <div className={styles.monitoringGrid}>
            {teams.map(t => (
              <div key={t.id} className={styles.teamCard}>
                <div className={styles.cardHeader}>
                  <div>
                    <h2 style={{ fontSize: '1rem' }}>{t.name}</h2>
                    <span className={styles.systemLabel}>{t.id}</span>
                  </div>
                  <span className={`${styles.healthBadge} ${styles[`health-${t.healthStatus}`]}`}>
                    {t.healthStatus}
                  </span>
                </div>

                <div style={{ fontSize: '0.75rem', color: '#92b5b1', fontFamily: 'IBM Plex Mono' }}>
                  PROGRESS: {t.completedTaskIds?.length || 0} TASKS
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
