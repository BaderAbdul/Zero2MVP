'use client';

import React, { useState } from 'react';
import { useCampContext, useGlobalState, useTeams } from '@/lib/services/CampContext';
import { CampPhase } from '@/lib/services/types';
import styles from './organizer.module.css';

const TIMELINE: { id: CampPhase; label: string }[] = [
  { id: 'setup', label: 'Setup' },
  { id: 'welcome', label: 'Welcome' },
  { id: 'ideation', label: 'Ideation' },
  { id: 'build', label: 'Build' },
  { id: 'checkpoint', label: 'Checkpoint' },
  { id: 'demo_day_queue', label: 'Demo Day' },
  { id: 'finished', label: 'Finished' },
];

const DEMO_DAY_PHASES: { id: CampPhase; label: string }[] = [
  { id: 'demo_day_queue', label: 'Queue' },
  { id: 'demo_day_intro', label: 'Intro' },
  { id: 'demo_day_presenting', label: 'Presenting' },
  { id: 'demo_day_judging', label: 'Judging' },
  { id: 'demo_day_reveal', label: 'Reveal Score' },
];

export default function OrganizerMissionControl() {
  const { provider, currentUser } = useCampContext();
  const globalState = useGlobalState();
  const teams = useTeams();

  const [announcementText, setAnnouncementText] = useState('');
  // We store the phase before breaking to resume
  const [preBreakPhase, setPreBreakPhase] = useState<CampPhase | null>(null);
  
  const [advanceCooldown, setAdvanceCooldown] = useState(false);
  const [justAdvancedTo, setJustAdvancedTo] = useState<string | null>(null);

  if (!globalState) return <div>Loading...</div>;

  if (currentUser?.role !== 'organizer') {
    return <div className={styles.error}>Unauthorized. Please login as Organizer via /dev.</div>;
  }

  const handlePhaseChange = async (phase: CampPhase) => {
    await provider.updateGlobalState({ currentPhase: phase });
    if (phase !== 'demo_day_reveal') {
      await provider.updateGlobalState({ revealScores: false });
    }
    if (phase !== 'break') {
      setPreBreakPhase(null);
    }
  };

  const handleAdvanceNext = async () => {
    if (advanceCooldown) return;
    
    const currentIdx = TIMELINE.findIndex(p => p.id === globalState.currentPhase);
    if (currentIdx >= 0 && currentIdx < TIMELINE.length - 1) {
      const nextPhase = TIMELINE[currentIdx + 1];
      
      setAdvanceCooldown(true);
      setJustAdvancedTo(nextPhase.label);
      await handlePhaseChange(nextPhase.id);
      
      setTimeout(() => {
        setJustAdvancedTo(null);
        setAdvanceCooldown(false);
      }, 2000);
    }
  };

  const toggleBreak = async () => {
    if (globalState.currentPhase === 'break') {
      // Resume
      handlePhaseChange(preBreakPhase || 'setup');
    } else {
      // Start break
      setPreBreakPhase(globalState.currentPhase);
      handlePhaseChange('break');
    }
  };

  const handleSetAnnouncement = async () => {
    await provider.updateGlobalState({ announcement: announcementText || null });
    setAnnouncementText('');
  };

  const handleSelectTeam = async (teamId: string) => {
    await provider.updateGlobalState({ activeDemoTeamId: teamId });
  };

  // Determine active timeline index for visual progress
  let activeTimelineIndex = TIMELINE.findIndex(p => p.id === globalState.currentPhase);
  if (globalState.currentPhase.startsWith('demo_day_')) {
    activeTimelineIndex = TIMELINE.findIndex(p => p.id === 'demo_day_queue');
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Mission Control</h1>
          <span className={styles.liveIndicator}>🔴 LIVE</span>
        </div>
        <button 
          onClick={toggleBreak} 
          className={`${styles.breakToggle} ${globalState.currentPhase === 'break' ? styles.breakActive : ''}`}
        >
          {globalState.currentPhase === 'break' 
            ? `▶ Resume Camp → ${TIMELINE.find(p => p.id === preBreakPhase)?.label || 'Setup'}` 
            : '⏸ Start Break Time'}
        </button>
      </header>

      {/* TIMELINE FLIGHT PLAN */}
      <section className={styles.timelineSection}>
        <div className={styles.timelineLine} />
        <div className={styles.timelineNodes}>
          {TIMELINE.map((p, idx) => {
            const isActive = idx === activeTimelineIndex || (p.id === 'demo_day_queue' && globalState.currentPhase.startsWith('demo_day'));
            const isPast = activeTimelineIndex > -1 && idx < activeTimelineIndex;
            return (
              <div 
                key={p.id} 
                className={`${styles.timelineNode} ${isActive ? styles.nodeActive : ''} ${isPast ? styles.nodePast : ''}`}
                onClick={() => handlePhaseChange(p.id)}
              >
                <div className={styles.nodeCircle}>{isActive ? '•' : isPast ? '✓' : ''}</div>
                <span className={styles.nodeLabel}>{p.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      <div className={styles.mainLayout}>
        {/* CENTER STAGE: CURRENT PHASE ACTION */}
        <div className={styles.primaryColumn}>
          <section className={styles.actionCard}>
            <p className={styles.subLabel}>CURRENT PHASE</p>
            <h2 className={styles.massivePhaseText}>
              {globalState.currentPhase.toUpperCase().replace(/_/g, ' ')}
            </h2>
            
            {globalState.currentPhase !== 'finished' && !globalState.currentPhase.startsWith('demo_day') && (
              <button 
                onClick={handleAdvanceNext} 
                disabled={advanceCooldown}
                className={styles.advanceButton}
              >
                {justAdvancedTo ? `✓ ${justAdvancedTo.toUpperCase()} STARTED` : `ADVANCE TO ${TIMELINE[activeTimelineIndex + 1]?.label.toUpperCase()} ➔`}
              </button>
            )}

            {globalState.currentPhase.startsWith('demo_day') && (
              <div className={styles.demoDayControls}>
                <p className={styles.subLabel}>DEMO DAY ENGINE</p>
                <div className={styles.demoDayPhases}>
                  {DEMO_DAY_PHASES.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handlePhaseChange(p.id)}
                      className={`${styles.demoPhaseBtn} ${globalState.currentPhase === p.id ? styles.activeDemoPhase : ''}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                
                <div className={styles.teamSelector}>
                  <label>Active Team on Stage:</label>
                  <select 
                    value={globalState.activeDemoTeamId || ''} 
                    onChange={(e) => handleSelectTeam(e.target.value)}
                    className={styles.select}
                  >
                    <option value="">-- No Team Selected --</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <button 
                  onClick={() => provider.updateGlobalState({ revealScores: true })} 
                  disabled={globalState.currentPhase !== 'demo_day_reveal' || globalState.revealScores}
                  className={styles.revealButton}
                >
                  {globalState.revealScores ? 'SCORES REVEALED ✓' : 'TRIGGER SCORE REVEAL ANIMATION'}
                </button>
              </div>
            )}
          </section>
        </div>

        {/* SIDE PANEL: SECONDARY CONTROLS */}
        <div className={styles.sideColumn}>
          <section className={styles.sideCard}>
            <h3>Announcements</h3>
            {globalState.announcement && (
              <div className={styles.currentAnnouncement}>
                <span className={styles.announcementText}>{globalState.announcement}</span>
                <button onClick={() => provider.updateGlobalState({ announcement: null })} className={styles.clearBtn}>✕</button>
              </div>
            )}
            <div className={styles.inputGroup}>
              <input 
                type="text" 
                placeholder="Broadcast message..." 
                value={announcementText}
                onChange={e => setAnnouncementText(e.target.value)}
                className={styles.input}
              />
              <button onClick={handleSetAnnouncement} className={styles.sendBtn}>Send</button>
            </div>
          </section>

          <section className={styles.sideCard}>
            <h3>Team Overview</h3>
            <ul className={styles.teamList}>
              {teams.map(t => (
                <li key={t.id} className={styles.teamListItem}>
                  <div className={styles.teamListLeft}>
                    <span className={styles.teamName}>{t.name}</span>
                    <span className={styles.teamStatus}>{t.checkpointStatus}</span>
                  </div>
                  <span className={styles.teamProgress}>{t.progressPercentage}%</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
