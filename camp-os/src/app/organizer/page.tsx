'use client';

import React, { useState } from 'react';
import { useCampContext, useTeams, useUsers, useDemoScores } from '@/lib/services/CampContext';
import { useCampEngine, RUN_OF_SHOW } from '@/lib/services/campEngine';
import styles from './organizer.module.css';
import { CampPhase } from '@/lib/services/types';

export default function OrganizerMissionControl() {
  const { provider, currentUser } = useCampContext();
  const { isLoaded, globalState, currentRoSPhase, isBreak } = useCampEngine();
  const teams = useTeams();
  const users = useUsers();
  
  // Safe since we only need demo scores for the active team during Demo Day
  const currentDemoScores = useDemoScores(globalState?.activeDemoTeamId || undefined);

  const [announcementText, setAnnouncementText] = useState('');
  const [advanceCooldown, setAdvanceCooldown] = useState(false);
  const [justAdvancedTo, setJustAdvancedTo] = useState<string | null>(null);
  
  // New State for Day 1.0
  const [newTeamName, setNewTeamName] = useState('');
  const [confirmPhaseId, setConfirmPhaseId] = useState<string | null>(null);
  const [confirmLifecycle, setConfirmLifecycle] = useState<'waiting_room' | 'live' | null>(null);

  if (!isLoaded || !globalState) return <div>Loading...</div>;

  if (currentUser?.role !== 'organizer') {
    return <div className={styles.error}>Unauthorized. Please login as Organizer via <a href="/login">/login</a>.</div>;
  }

  // --- Camp Status Actions ---
  const handleOpenWaitingRoom = async () => {
    await provider.updateGlobalState({ campStatus: 'waiting_room' }, currentUser.id);
  };
  
  const handleStartLiveCamp = async () => {
    await provider.updateGlobalState({ campStatus: 'live', currentPhase: 'welcome' }, currentUser.id);
  };

  // --- Team Management ---
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    await provider.createTeam(newTeamName.trim());
    setNewTeamName('');
  };

  const handleDeleteTeam = async (teamId: string) => {
    const memberCount = users.filter(u => u.teamId === teamId).length;
    if (memberCount > 0) {
      alert("Cannot delete a team that has members assigned.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this empty team?")) {
      await provider.deleteTeam(teamId);
    }
  };

  // --- Phase Navigation ---
  const executePhaseChange = async (phaseId: string) => {
    const targetPhase = RUN_OF_SHOW.find(p => p.id === phaseId);
    if (!targetPhase) return;

    const updates: any = { currentPhase: phaseId as CampPhase };
    
    if (targetPhase.id !== 'demo_day_reveal') {
      updates.revealScores = false;
    }
    
    if (targetPhase.durationMinutes > 0 && targetPhase.type !== 'break') {
      updates.timerEndTime = Date.now() + (targetPhase.durationMinutes * 60 * 1000);
    } else {
      updates.timerEndTime = null;
    }

    await provider.updateGlobalState(updates, currentUser.id);
    setConfirmPhaseId(null);
  };

  const attemptPhaseChange = (phaseId: string) => {
    const targetPhase = RUN_OF_SHOW.find(p => p.id === phaseId);
    if (!targetPhase) return;

    // Fast advance without confirmation for sequential advance or intra-demo day clicks
    if (targetPhase.order === currentRoSPhase.order + 1 || (currentRoSPhase.type === 'demo_day' && targetPhase.type === 'demo_day')) {
      executePhaseChange(phaseId);
    } else {
      // Out of sequence - require confirmation
      setConfirmPhaseId(phaseId);
    }
  };

  const handleAdvanceNext = async () => {
    if (advanceCooldown) return;
    
    const currentIdx = RUN_OF_SHOW.findIndex(p => p.id === currentRoSPhase.id);
    if (currentIdx >= 0 && currentIdx < RUN_OF_SHOW.length - 1) {
      const nextPhase = RUN_OF_SHOW[currentIdx + 1];
      
      setAdvanceCooldown(true);
      setJustAdvancedTo(nextPhase.title);
      await executePhaseChange(nextPhase.id);
      
      setTimeout(() => {
        setJustAdvancedTo(null);
        setAdvanceCooldown(false);
      }, 2000);
    }
  };

  const toggleBreak = async () => {
    if (isBreak) {
      attemptPhaseChange(globalState.preBreakPhase || 'setup');
    } else {
      await provider.updateGlobalState({ preBreakPhase: globalState.currentPhase }, currentUser.id);
      attemptPhaseChange('break');
    }
  };

  const handleSetAnnouncement = async () => {
    await provider.updateGlobalState({ announcement: announcementText || null }, currentUser.id);
    setAnnouncementText('');
  };

  const handleSelectActiveTeam = async (teamId: string) => {
    await provider.updateGlobalState({ activeDemoTeamId: teamId || null }, currentUser.id);
  };
  
  const handleSelectNextTeam = async (teamId: string) => {
    await provider.updateGlobalState({ nextDemoTeamId: teamId || null }, currentUser.id);
  };

  const handleAdvanceDemoQueue = async () => {
    if (!globalState.nextDemoTeamId || !teams.some(t => t.id === globalState.nextDemoTeamId)) return;
    await provider.updateGlobalState({
      activeDemoTeamId: globalState.nextDemoTeamId,
      nextDemoTeamId: null,
      revealScores: false
    }, currentUser.id);
  };

  // --- Derived Observability Metrics ---
  const participantsCount = users.filter(u => u.role === 'participant').length;
  const participantsWithTeamCount = users.filter(u => u.role === 'participant' && u.teamId).length;
  // TODO: we should get open interventions. For now mock as 0 if we don't fetch all interventions.
  const totalJudges = users.filter(u => u.role === 'judge').length;
  const submittedJudges = new Set(currentDemoScores.map(s => s.judgeId)).size;

  // Render Setup Mode
  if (globalState.campStatus === 'setup') {
    return (
      <div className={styles.container}>
        {confirmLifecycle === 'waiting_room' && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <h3>Confirm Camp State Change</h3>
              <p>You are about to OPEN CAMP.</p>
              <p>Current: <strong>SETUP</strong></p>
              <p>New: <strong>WAITING ROOM</strong></p>
              <p>Participants will be able to join their teams using join codes. The projector and all connected screens will reflect this change.</p>
              <div className={styles.modalActions}>
                <button onClick={() => setConfirmLifecycle(null)} className={styles.cancelBtn}>Cancel</button>
                <button onClick={handleOpenWaitingRoom} className={styles.primaryBtnWarning}>Confirm Open</button>
              </div>
            </div>
          </div>
        )}
        <div className={styles.setupCard}>
          <h1>Camp Setup</h1>
          <p>Create teams and configure the environment before opening the doors.</p>
          
          <form onSubmit={handleCreateTeam} className={styles.setupForm}>
            <input 
              value={newTeamName} 
              onChange={e => setNewTeamName(e.target.value)} 
              placeholder="New Team Name" 
              className={styles.input}
            />
            <button type="submit" className={styles.primaryBtn} disabled={!newTeamName.trim()}>Add Team</button>
          </form>

          <table className={styles.setupTable}>
            <thead>
              <tr>
                <th>Team Name</th>
                <th>Join Code</th>
                <th>Members</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {teams.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No teams created yet. Add your first team above.
                  </td>
                </tr>
              )}
              {teams.map(t => {
                const members = users.filter(u => u.teamId === t.id).length;
                return (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td><strong>{t.joinCode}</strong></td>
                    <td>{members}</td>
                    <td>
                      <button 
                        onClick={() => handleDeleteTeam(t.id)}
                        disabled={members > 0}
                        className={styles.deleteBtn}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className={styles.setupActions}>
            <button onClick={() => setConfirmLifecycle('waiting_room')} className={styles.massivePrimaryBtn}>
              OPEN CAMP (Waiting Room)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Waiting Room Mode
  if (globalState.campStatus === 'waiting_room') {
    return (
      <div className={styles.container}>
        {confirmLifecycle === 'live' && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <h3>Confirm Camp State Change</h3>
              <p>You are about to START LIVE CAMP.</p>
              <p>Current: <strong>WAITING ROOM</strong></p>
              <p>New: <strong>LIVE (Welcome Phase)</strong></p>
              <p>The bootcamp officially begins. Participants will see their dashboards and the projector will show the welcome screen. This affects all connected screens.</p>
              <div className={styles.modalActions}>
                <button onClick={() => setConfirmLifecycle(null)} className={styles.cancelBtn}>Cancel</button>
                <button onClick={handleStartLiveCamp} className={styles.primaryBtnWarning}>Confirm Start</button>
              </div>
            </div>
          </div>
        )}
        <div className={styles.setupCard}>
          <h1>Camp is Open!</h1>
          <p className={styles.pulseText}>Participants can now join using their 6-character Team Codes.</p>
          
          <div className={styles.statsGrid}>
            <div className={styles.statBox}>
              <span className={styles.statValue}>{participantsWithTeamCount} / {participantsCount}</span>
              <span className={styles.statLabel}>Participants Assigned</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statValue}>{teams.length}</span>
              <span className={styles.statLabel}>Total Teams</span>
            </div>
          </div>

          <table className={styles.setupTable}>
            <thead>
              <tr>
                <th>Team Name</th>
                <th>Join Code</th>
                <th>Members Assigned</th>
              </tr>
            </thead>
            <tbody>
              {teams.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No teams available.
                  </td>
                </tr>
              )}
              {teams.map(t => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td><strong>{t.joinCode}</strong></td>
                  <td>{users.filter(u => u.teamId === t.id).length}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.setupActions}>
            <button onClick={() => setConfirmLifecycle('live')} className={styles.massivePrimaryBtn}>
              START LIVE CAMP
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Live Mode
  return (
    <div className={styles.container}>
      {confirmPhaseId && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Confirm Phase Change</h3>
            <p>You are jumping out of sequence.</p>
            <p>Current: <strong>{currentRoSPhase.title}</strong></p>
            <p>Next: <strong>{RUN_OF_SHOW.find(p => p.id === confirmPhaseId)?.title}</strong></p>
            <div className={styles.modalActions}>
              <button onClick={() => setConfirmPhaseId(null)} className={styles.cancelBtn}>Cancel</button>
              <button onClick={() => executePhaseChange(confirmPhaseId)} className={styles.primaryBtnWarning}>Confirm Jump</button>
            </div>
          </div>
        </div>
      )}

      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Mission Control</h1>
          <span className={styles.liveIndicator}>🔴 LIVE</span>
        </div>
        <button 
          onClick={toggleBreak} 
          className={`${styles.breakToggle} ${isBreak ? styles.breakActive : ''}`}
        >
          {isBreak 
            ? `▶ Resume Camp → ${RUN_OF_SHOW.find(p => p.id === globalState.preBreakPhase)?.title || 'Setup'}` 
            : '⏸ Start Break Time'}
        </button>
      </header>

      {/* TIMELINE FLIGHT PLAN */}
      <section className={styles.timelineSection}>
        <div className={styles.timelineLine} />
        <div className={styles.timelineNodes}>
          {RUN_OF_SHOW.filter(p => p.type !== 'break').map((p, idx) => {
            const isActive = p.id === currentRoSPhase.id;
            const isPast = p.order < currentRoSPhase.order;
            return (
              <div 
                key={p.id} 
                className={`${styles.timelineNode} ${isActive ? styles.nodeActive : ''} ${isPast ? styles.nodePast : ''}`}
                onClick={() => attemptPhaseChange(p.id)}
              >
                <div className={styles.nodeCircle}>{isActive ? '•' : isPast ? '✓' : ''}</div>
                <span className={styles.nodeLabel}>{p.title}</span>
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
              {currentRoSPhase.title.toUpperCase()}
            </h2>
            <p className={styles.phaseDesc}>{currentRoSPhase.description}</p>
            
            {currentRoSPhase.type !== 'demo_day' && currentRoSPhase.allowAdvance && (
              <button 
                onClick={handleAdvanceNext} 
                disabled={advanceCooldown}
                className={styles.advanceButton}
              >
                {justAdvancedTo ? `✓ ${justAdvancedTo.toUpperCase()} STARTED` : `ADVANCE TO NEXT PHASE ➔`}
              </button>
            )}

            {currentRoSPhase.type === 'demo_day' && (
              <div className={styles.demoDayControls}>
                <p className={styles.subLabel}>DEMO DAY ENGINE</p>
                <div className={styles.demoDayPhases}>
                  {RUN_OF_SHOW.filter(p => p.type === 'demo_day').map(p => (
                    <button
                      key={p.id}
                      onClick={() => attemptPhaseChange(p.id)}
                      className={`${styles.demoPhaseBtn} ${currentRoSPhase.id === p.id ? styles.activeDemoPhase : ''}`}
                    >
                      {p.title}
                    </button>
                  ))}
                </div>
                
                <div className={styles.queueGrid}>
                  <div className={styles.teamSelector}>
                    <label>Active Team on Stage:</label>
                    <select 
                      value={globalState.activeDemoTeamId || ''} 
                      onChange={(e) => handleSelectActiveTeam(e.target.value)}
                      className={styles.select}
                    >
                      <option value="">-- None --</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.teamSelector}>
                    <label>Up Next Team:</label>
                    <select 
                      value={globalState.nextDemoTeamId || ''} 
                      onChange={(e) => handleSelectNextTeam(e.target.value)}
                      className={styles.select}
                    >
                      <option value="">-- None --</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button 
                    onClick={handleAdvanceDemoQueue} 
                    className={styles.secondaryBtn}
                    disabled={!globalState.nextDemoTeamId || !teams.some(t => t.id === globalState.nextDemoTeamId)}
                  >
                    Advance Queue (Next ➔ Stage)
                  </button>
                  {(!globalState.nextDemoTeamId || !teams.some(t => t.id === globalState.nextDemoTeamId)) && (
                    <span style={{ fontSize: '0.85rem', color: '#ef4444' }}>Select an Up Next team before advancing.</span>
                  )}
                </div>

                {currentRoSPhase.id === 'demo_day_judging' && (
                  <div className={styles.judgeStatusAlert}>
                    <strong>Judges Submitted:</strong> {submittedJudges} / {totalJudges}
                  </div>
                )}

                <button 
                  onClick={() => provider.updateGlobalState({ revealScores: true }, currentUser.id)} 
                  disabled={currentRoSPhase.id !== 'demo_day_reveal' || globalState.revealScores}
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
                <button onClick={() => provider.updateGlobalState({ announcement: null }, currentUser.id)} className={styles.clearBtn}>✕</button>
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
             <h3>Live Counters</h3>
             <ul className={styles.countersList}>
               <li><strong>Assigned Participants:</strong> {participantsWithTeamCount}/{participantsCount}</li>
               <li><strong>Teams Ready:</strong> {teams.length}</li>
               {currentRoSPhase.type === 'demo_day' && (
                 <li><strong>Judges Submitted (Active):</strong> {submittedJudges}/{totalJudges}</li>
               )}
             </ul>
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
