'use client';

import React, { useState, useEffect } from 'react';
import { useCampContext, useTeams } from '@/lib/services/CampContext';
import { useCampEngine } from '@/lib/services/campEngine';
import styles from './organizer.module.css';
import { CustomStage, CustomTask, TimerMode } from '@/lib/services/types';

export default function OrganizerMissionControl() {
  const { provider, currentUser } = useCampContext();
  const { isLoaded, globalState, activeCustomStage, isTimerPaused, timerMode, timeRemainingSeconds, timeElapsedSeconds } = useCampEngine();
  const teams = useTeams();

  // STAGE BUILDER STATE
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingStage, setEditingStage] = useState<Partial<CustomStage> | null>(null);

  if (!isLoaded || !globalState) return <div className={styles.emptyState}>INITIALIZING OP-SYS...</div>;

  if (currentUser?.role !== 'organizer') {
    return <div className={styles.emptyState}>UNAUTHORIZED. LOGIN AS ORGANIZER.</div>;
  }

  // --- TIMER OPERATIONS ---
  const handleTogglePause = async () => {
    if (!activeCustomStage) return;
    const now = Date.now();
    
    if (isTimerPaused) {
      // RESUME
      const pausedAt = globalState.timerPausedAt || now;
      const pausedDuration = now - pausedAt;
      
      const updates: any = {
        isTimerPaused: false,
        timerPausedAt: null
      };
      
      if (timerMode === 'countdown' && globalState.timerEndTime) {
        updates.timerEndTime = globalState.timerEndTime + pausedDuration;
      } else if (timerMode === 'countup') {
        updates.timerStartTime = (globalState.timerStartTime || now) + pausedDuration;
      }
      
      await provider.updateGlobalState(updates, currentUser.id);
    } else {
      // PAUSE
      await provider.updateGlobalState({
        isTimerPaused: true,
        timerPausedAt: now
      }, currentUser.id);
    }
  };

  const handleAdjustTimer = async (minutes: number) => {
    if (timerMode === 'countdown') {
      const currentEnd = globalState.timerEndTime || Date.now();
      await provider.updateGlobalState({
        timerEndTime: currentEnd + (minutes * 60 * 1000)
      }, currentUser.id);
    }
  };

  const handleResetTimer = async () => {
    if (!activeCustomStage) return;
    const updates: any = {
      isTimerPaused: false,
      timerPausedAt: null
    };

    if (activeCustomStage.timerMode === 'countdown') {
      updates.timerEndTime = Date.now() + ((activeCustomStage.durationMs || 0));
      updates.timerStartTime = Date.now();
    } else if (activeCustomStage.timerMode === 'countup') {
      updates.timerStartTime = Date.now();
      updates.timerEndTime = null;
      updates.timerAccumulatedMs = 0;
    }
    
    await provider.updateGlobalState(updates, currentUser.id);
  };

  const handleStartTimer = async () => {
    if (!activeCustomStage) return;
    handleResetTimer();
  };

  // --- RUN OF SHOW OPERATIONS ---
  const handleSaveStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStage || !editingStage.title) return;

    const stages = [...(globalState.customStages || [])];
    
    if (editingStage.id) {
      const idx = stages.findIndex(s => s.id === editingStage.id);
      if (idx >= 0) stages[idx] = editingStage as CustomStage;
    } else {
      const newStage: CustomStage = {
        ...editingStage,
        id: `stage_${Date.now()}`,
        title: editingStage.title,
        order: stages.length + 1,
        timerMode: editingStage.timerMode || 'countdown',
        tasks: editingStage.tasks || [],
        allowSubmission: editingStage.allowSubmission ?? true
      };
      stages.push(newStage);
    }

    await provider.updateGlobalState({ customStages: stages }, currentUser.id);
    setShowBuilder(false);
    setEditingStage(null);
  };

  const handleActivateStage = async (stageId: string) => {
    const stage = globalState.customStages?.find(s => s.id === stageId);
    if (!stage) return;
    
    const updates: any = {
      currentPhase: 'custom',
      currentStageId: stageId,
      timerMode: stage.timerMode,
      isTimerPaused: false,
      timerPausedAt: null
    };
    
    // Automatically set timer ends based on config
    if (stage.timerMode === 'countdown') {
      updates.timerStartTime = Date.now();
      updates.timerEndTime = Date.now() + (stage.durationMs || 0);
    } else if (stage.timerMode === 'countup') {
      updates.timerStartTime = Date.now();
      updates.timerEndTime = null;
      updates.timerAccumulatedMs = 0;
    } else {
      updates.timerStartTime = null;
      updates.timerEndTime = null;
    }

    await provider.updateGlobalState(updates, currentUser.id);
  };

  const handleAddTask = () => {
    if (!editingStage) return;
    const newTasks = [...(editingStage.tasks || []), {
      id: `task_${Date.now()}`,
      title: '',
      required: true
    }];
    setEditingStage({...editingStage, tasks: newTasks});
  };

  // --- RENDER HELPERS ---
  const formatTime = (seconds: number) => {
    const m = Math.floor(Math.max(0, seconds) / 60);
    const s = Math.max(0, seconds) % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const customStages = globalState.customStages || [];
  
  return (
    <div className={styles.container}>
      {/* BUILDER MODAL */}
      {showBuilder && (
        <div className={styles.modalOverlay}>
          <div className={styles.builderPanel}>
            <div className={styles.builderHeader}>
              <h2>{editingStage?.id ? 'Edit Stage' : 'New Stage'}</h2>
            </div>
            <form onSubmit={handleSaveStage} className={styles.builderBody}>
              <div className={styles.formGroup}>
                <label>Stage Title</label>
                <input 
                  type="text" 
                  value={editingStage?.title || ''} 
                  onChange={e => setEditingStage({...editingStage, title: e.target.value})} 
                  className={styles.input} 
                  required 
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea 
                  value={editingStage?.description || ''} 
                  onChange={e => setEditingStage({...editingStage, description: e.target.value})} 
                  className={styles.textarea} 
                />
              </div>

              <div className={styles.formGroup}>
                <label>Timer Mode</label>
                <select 
                  value={editingStage?.timerMode || 'countdown'} 
                  onChange={e => setEditingStage({...editingStage, timerMode: e.target.value as TimerMode})} 
                  className={styles.select}
                >
                  <option value="countdown">Countdown</option>
                  <option value="countup">Count Up</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>

              {editingStage?.timerMode === 'countdown' && (
                <div className={styles.formGroup}>
                  <label>Duration (Minutes)</label>
                  <input 
                    type="number" 
                    value={(editingStage?.durationMs || 0) / 60000 || ''} 
                    onChange={e => setEditingStage({...editingStage, durationMs: Number(e.target.value) * 60000})} 
                    className={styles.input} 
                    min={1} 
                  />
                </div>
              )}
              
              <div className={styles.formGroup}>
                <label>Participant Tasks</label>
                <div className={styles.tasksList}>
                  {editingStage?.tasks?.map((t, idx) => (
                    <div key={t.id} className={styles.taskRow}>
                      <input 
                        type="text"
                        value={t.title}
                        onChange={(e) => {
                          const nt = [...(editingStage.tasks || [])];
                          nt[idx].title = e.target.value;
                          setEditingStage({...editingStage, tasks: nt});
                        }}
                        className={styles.input}
                        placeholder="Task description..."
                        required
                      />
                      <button 
                        type="button" 
                        onClick={() => {
                          const nt = editingStage.tasks?.filter(task => task.id !== t.id);
                          setEditingStage({...editingStage, tasks: nt});
                        }}
                        className={styles.removeTaskBtn}
                      >X</button>
                    </div>
                  ))}
                  <button type="button" onClick={handleAddTask} className={styles.controlBtn} style={{width: 'fit-content'}}>
                    + ADD TASK
                  </button>
                </div>
              </div>

              <div className={styles.builderActions}>
                <button type="button" onClick={() => setShowBuilder(false)} className={styles.cancelBtn}>Cancel</button>
                <button type="submit" className={styles.saveBtn}>Save Stage</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LEFT PANEL - RUN OF SHOW */}
      <div className={styles.rosPanel}>
        <div className={styles.rosHeader}>
          <h2>RUN OF SHOW</h2>
        </div>
        <div className={styles.rosList}>
          {customStages.map((stage, idx) => {
            const isActive = globalState.currentStageId === stage.id && globalState.currentPhase === 'custom';
            return (
              <div 
                key={stage.id} 
                className={`${styles.rosItem} ${isActive ? styles.rosItemActive : ''}`}
                onClick={() => handleActivateStage(stage.id)}
              >
                <div className={styles.rosItemContent}>
                  <span className={styles.rosItemOrder}>{String(idx + 1).padStart(2, '0')}</span>
                  <span className={styles.rosItemTitle}>{stage.title}</span>
                </div>
                {isActive && <span className={styles.systemLabel}>● LIVE</span>}
              </div>
            );
          })}
          
          <button 
            className={styles.addStageBtn}
            onClick={() => {
              setEditingStage({ timerMode: 'countdown', tasks: [] });
              setShowBuilder(true);
            }}
          >
            [+ ADD STAGE]
          </button>
        </div>
      </div>

      {/* MAIN CANVAS */}
      <div className={styles.mainPanel}>
        <div className={styles.topBar}>
          <div className={styles.systemLabel}>CAMP OS // LIVE COMMAND // {currentUser.id}</div>
          <div className={styles.systemTime}>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>

        <div className={styles.controlCanvas}>
          {activeCustomStage ? (
            <>
              <div className={styles.stageLabel}>المرحلة الحالية (CURRENT STAGE)</div>
              <h1 className={styles.massiveTitle}>{activeCustomStage.title}</h1>
              <p className={styles.stageDesc}>{activeCustomStage.description}</p>
              
              <div className={styles.timerBlock}>
                {timerMode !== 'hidden' ? (
                  <div className={styles.massiveTimer} style={isTimerPaused ? {opacity: 0.5} : {}}>
                    {formatTime(timerMode === 'countup' ? timeElapsedSeconds : timeRemainingSeconds)}
                  </div>
                ) : (
                  <div className={styles.massiveTimer} style={{ color: 'var(--text-muted)' }}>HIDDEN</div>
                )}
                
                <div className={styles.timerControlsRow}>
                  {(!globalState.timerStartTime && !globalState.timerEndTime) ? (
                    <button onClick={handleStartTimer} className={`${styles.controlBtn} ${styles.controlBtnPrimary}`}>
                      [ START ]
                    </button>
                  ) : (
                    <>
                      <button onClick={handleTogglePause} className={`${styles.controlBtn} ${isTimerPaused ? styles.controlBtnWarning : ''}`}>
                        {isTimerPaused ? '[ RESUME ]' : '[ PAUSE ]'}
                      </button>
                      <button onClick={handleResetTimer} className={styles.controlBtn}>
                        [ RESET ]
                      </button>
                      {timerMode === 'countdown' && (
                        <>
                          <button onClick={() => handleAdjustTimer(1)} className={styles.controlBtn}>[ +1 MIN ]</button>
                          <button onClick={() => handleAdjustTimer(5)} className={styles.controlBtn}>[ +5 MIN ]</button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className={styles.secondaryControls}>
                <div className={styles.secondaryCard}>
                  <h3>Quick Announcement</h3>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <input 
                      type="text" 
                      placeholder="Write message..." 
                      className={styles.input} 
                      style={{ flex: 1 }}
                      id="announcementInput"
                    />
                    <button 
                      className={styles.controlBtn}
                      onClick={async () => {
                        const el = document.getElementById('announcementInput') as HTMLInputElement;
                        if (el && el.value) {
                          await provider.updateGlobalState({ announcement: el.value }, currentUser.id);
                          el.value = '';
                        }
                      }}
                    >
                      [ SEND ]
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>
              <h2>No Stage Active</h2>
              <p>Select a stage from the Run of Show to begin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
