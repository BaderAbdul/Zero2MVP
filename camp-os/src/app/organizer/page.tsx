'use client';

import React, { useState } from 'react';
import { useCampContext, useTeams, useUsers, useDemoScores } from '@/lib/services/CampContext';
import { useCampEngine, QUICK_ADD_PRESETS, DEFAULT_ZERO2MVP_STAGES } from '@/lib/services/campEngine';
import styles from './organizer.module.css';
import { TimerMode, CustomStage, CustomTask } from '@/lib/services/types';

export default function OrganizerMissionControl() {
  const { provider, currentUser } = useCampContext();
  const { 
    isLoaded, globalState, stages, activeStage, 
    formattedTime, timerMode, isTimerPaused, isTimerRunning,
    tasks, completedCount, totalTasks, progressPercentage
  } = useCampEngine();

  const teams = useTeams();
  const users = useUsers();

  // Modals & Drawers
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [showStageEditModal, setShowStageEditModal] = useState(false);
  const [editingStage, setEditingStage] = useState<Partial<CustomStage> | null>(null);

  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState<'task' | 'checkpoint' | 'upload' | 'text' | 'link'>('task');

  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementInput, setAnnouncementInput] = useState('');

  const [newTeamName, setNewTeamName] = useState('');

  if (!isLoaded || !globalState) {
    return <div className={styles.loading}>INITIALIZING COMMAND SYSTEM...</div>;
  }

  if (currentUser?.role !== 'organizer') {
    return <div className={styles.error}>UNAUTHORIZED. PLEASE LOGIN AS ORGANIZER.</div>;
  }

  // --- Camp Status Actions ---
  const handleStartLiveCamp = async (selectedStages: CustomStage[] = DEFAULT_ZERO2MVP_STAGES) => {
    await provider.saveCustomStages(selectedStages);
    await provider.activateCustomStage(selectedStages[0].id);
    await provider.updateGlobalState({ campStatus: 'live' }, currentUser.id);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    await provider.createTeam(newTeamName.trim());
    setNewTeamName('');
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا الفريق؟")) {
      await provider.deleteTeam(teamId);
    }
  };

  // --- Live Timer Actions ---
  const toggleTimerPause = async () => {
    const now = Date.now();
    if (isTimerPaused) {
      // RESUME
      if (timerMode === 'countdown') {
        const remaining = globalState.timerPausedRemainingMs || (activeStage.durationMinutes * 60 * 1000);
        await provider.updateGlobalState({
          isTimerPaused: false,
          timerEndTime: now + remaining,
          timerPausedRemainingMs: undefined
        }, currentUser.id);
      } else if (timerMode === 'countup') {
        const pausedAt = globalState.timerPausedAt || now;
        const pausedDuration = now - pausedAt;
        const adjustedStart = (globalState.timerStartTime || now) + pausedDuration;
        await provider.updateGlobalState({
          isTimerPaused: false,
          timerStartTime: adjustedStart,
          timerPausedAt: null
        }, currentUser.id);
      }
    } else {
      // PAUSE
      if (timerMode === 'countdown' && globalState.timerEndTime) {
        const remaining = Math.max(0, globalState.timerEndTime - now);
        await provider.updateGlobalState({
          isTimerPaused: true,
          timerPausedRemainingMs: remaining
        }, currentUser.id);
      } else if (timerMode === 'countup') {
        await provider.updateGlobalState({
          isTimerPaused: true,
          timerPausedAt: now
        }, currentUser.id);
      }
    }
  };

  const handleAdjustTimerMinutes = async (minutesDelta: number) => {
    if (timerMode === 'countdown') {
      const currentEnd = globalState.timerEndTime || Date.now();
      const newEnd = Math.max(Date.now(), currentEnd + (minutesDelta * 60 * 1000));
      await provider.updateGlobalState({ timerEndTime: newEnd }, currentUser.id);
    }
  };

  const handleChangeTimerMode = async (mode: TimerMode) => {
    const now = Date.now();
    const durationMs = (activeStage.durationMinutes || 30) * 60 * 1000;
    const updates: Partial<typeof globalState> = { timerMode: mode, isTimerPaused: false };

    if (mode === 'countdown') {
      updates.timerStartTime = now;
      updates.timerEndTime = now + durationMs;
    } else if (mode === 'countup') {
      updates.timerStartTime = now;
      updates.timerEndTime = null;
    } else {
      updates.timerStartTime = null;
      updates.timerEndTime = null;
    }

    await provider.updateGlobalState(updates, currentUser.id);
  };

  // --- Stage Management (Layer B) ---
  const handleActivateStage = async (stageId: string) => {
    await provider.activateCustomStage(stageId);
  };

  const handleOpenPresetSelect = () => {
    setShowPresetModal(true);
  };

  const handleAddPresetStage = (preset: Partial<CustomStage>) => {
    const newStage: CustomStage = {
      id: `stage_${Date.now()}`,
      title: preset.title || 'مرحلة جديدة',
      description: preset.description || '',
      order: stages.length + 1,
      day: 1,
      type: preset.type || 'work',
      durationMinutes: preset.durationMinutes || 30,
      timerMode: preset.timerMode || 'countdown',
      requiresSubmission: preset.requiresSubmission || false,
      requiresMentorReview: preset.requiresMentorReview || false,
      tasks: preset.tasks || []
    };

    const updated = [...stages, newStage];
    provider.saveCustomStages(updated);
    setShowPresetModal(false);
  };

  const handleEditStageModalOpen = (stage: CustomStage) => {
    setEditingStage({ ...stage });
    setShowStageEditModal(true);
  };

  const handleSaveEditedStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStage || !editingStage.id) return;

    const updated = stages.map(s => s.id === editingStage.id ? (editingStage as CustomStage) : s);
    await provider.saveCustomStages(updated);
    setShowStageEditModal(false);
    setEditingStage(null);
  };

  const handleDuplicateStage = async (stage: CustomStage) => {
    const dup: CustomStage = {
      ...stage,
      id: `stage_${Date.now()}`,
      title: `${stage.title} (نسخة)`,
      order: stages.length + 1
    };
    const updated = [...stages, dup];
    await provider.saveCustomStages(updated);
  };

  const handleDeleteStage = async (stageId: string) => {
    if (stages.length <= 1) {
      alert("يجب الإبقاء على مرحلة واحدة على الأقل.");
      return;
    }
    if (window.confirm("حذف هذه المرحلة؟")) {
      const updated = stages.filter(s => s.id !== stageId);
      await provider.saveCustomStages(updated);
    }
  };

  const handleMoveStage = async (stageId: string, direction: 'up' | 'down') => {
    const idx = stages.findIndex(s => s.id === stageId);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= stages.length) return;

    const copy = [...stages];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;

    // re-assign orders
    copy.forEach((s, i) => { s.order = i + 1; });
    await provider.saveCustomStages(copy);
  };

  // --- Task Dispatch (Layer C) ---
  const handleAddTaskToActiveStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: CustomTask = {
      id: `t_${Date.now()}`,
      title: newTaskTitle.trim(),
      type: newTaskType,
      required: true,
      order: (tasks.length || 0) + 1,
      requiresSubmission: newTaskType === 'upload' || newTaskType === 'checkpoint' || newTaskType === 'link'
    };

    const updatedStages = stages.map(s => {
      if (s.id === activeStage.id) {
        return { ...s, tasks: [...(s.tasks || []), newTask] };
      }
      return s;
    });

    await provider.saveCustomStages(updatedStages);
    setNewTaskTitle('');
    setShowAddTaskModal(false);
  };

  const handleSendAnnouncement = async () => {
    await provider.updateGlobalState({ announcement: announcementInput.trim() || null }, currentUser.id);
    setAnnouncementInput('');
    setShowAnnouncementModal(false);
  };

  const handleOpenGlobalCheckpoint = async () => {
    if (window.confirm("فتح التسليم ونقطة التحقق لجميع الفرق الآن؟")) {
      for (const t of teams) {
        await provider.submitCheckpoint(t.id);
      }
      await provider.updateGlobalState({
        announcement: "[تنبيه عاجل] تم فتح تسليم نقطة التحقق لجميع الفرق."
      }, currentUser.id);
    }
  };

  // Setup view if camp is not live
  if (globalState.campStatus !== 'live') {
    return (
      <div className={styles.container}>
        <div className={styles.setupContainer}>
          <div className={styles.sectionHeader}>
            <h2>MISSION INITIALIZATION // اختيار القالب والبدء</h2>
          </div>
          
          <div className={styles.templateCard}>
            <span className={styles.systemLabel}>OFFICIAL PRESET</span>
            <h1 className={styles.templateTitle}>FROM ZERO TO MVP</h1>
            <div className={styles.templateMeta}>
              3 DAYS · 5 LEVELS · 6 STAGES · 12 MISSIONS
            </div>
            <p className={styles.stageDesc}>
              القالب المعتمد المخصص لنقل المتدربين من صياغة الفكرة حتى إطلاق الـ MVP وعرضه في يوم العروض.
            </p>
            <button onClick={() => handleStartLiveCamp(DEFAULT_ZERO2MVP_STAGES)} className={styles.primaryControlBtn}>
              [ 🚀 بدء المعسكر بهذا القالب ]
            </button>
          </div>

          <div className={styles.sectionHeader} style={{ marginTop: '2rem' }}>
            <h2>REGISTERED SQUADS ({teams.length})</h2>
          </div>
          
          <form onSubmit={handleCreateTeam} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <input 
              type="text" 
              placeholder="اسم الفريق الجديد..." 
              value={newTeamName}
              onChange={e => setNewTeamName(e.target.value)}
              className={styles.input}
              style={{ flex: 1 }}
            />
            <button type="submit" className={styles.secondaryControlBtn}>+ إضافة فريق</button>
          </form>

          <div className={styles.taskList}>
            {teams.map(t => (
              <div key={t.id} className={styles.taskRow}>
                <span><strong>{t.name}</strong> <span className={styles.stageMetaText}>(CODE: {t.joinCode})</span></span>
                <button onClick={() => handleDeleteTeam(t.id)} className={styles.miniBtnDanger}>حذف</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* SYSTEM HEADER */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.systemLabel}>SYSTEM.ADMIN // MISSION CONTROL 4.0</span>
          <h1 className={styles.headerTitle}>CAMP OS COMMAND CENTER</h1>
        </div>
        <div className={styles.headerMeta}>
          <div className={styles.metaBadge}>SESSION // LIVE</div>
          <div className={styles.metaBadge}>TEAMS // {teams.length}</div>
          <div className={styles.liveIndicator}>
            <span className={styles.liveDot} />
            LIVE BCAST
          </div>
        </div>
      </header>

      {/* 3-LAYER COMMAND GRID */}
      <div className={styles.commandGrid}>
        
        {/* RIGHT (MAIN): LAYER A — LIVE NOW */}
        <div className={styles.centerStage}>
          <div className={styles.sectionHeader}>
            <h2>LAYER A // LIVE NOW</h2>
            <span className={styles.stageIndex}>STAGE {activeStage.order} / {stages.length}</span>
          </div>

          <h2 className={styles.stageTitle}>{activeStage.title}</h2>
          <p className={styles.stageDesc}>{activeStage.description}</p>

          {/* MASSIVE TIMER HUD */}
          <div className={styles.timerHud}>
            <span className={styles.timerModeTag}>
              [ MODE: {timerMode.toUpperCase()} ]
            </span>
            
            {timerMode !== 'hidden' ? (
              <div className={styles.massiveTimerText}>{formattedTime}</div>
            ) : (
              <div className={styles.massiveTimerText} style={{ fontSize: '3rem', opacity: 0.5 }}>[ HIDDEN TIMER ]</div>
            )}

            <div className={styles.timerStatusText}>
              STATUS: {isTimerPaused ? 'PAUSED ⏸' : (isTimerRunning ? 'RUNNING ▶' : 'IDLE ⏹')}
            </div>

            <div className={styles.timerControlsRow}>
              <button onClick={toggleTimerPause} className={styles.primaryControlBtn}>
                {isTimerPaused ? '▶ RESUME TIMER' : '⏸ PAUSE TIMER'}
              </button>

              {timerMode === 'countdown' && (
                <>
                  <button onClick={() => handleAdjustTimerMinutes(5)} className={styles.secondaryControlBtn}>+5 MIN</button>
                  <button onClick={() => handleAdjustTimerMinutes(10)} className={styles.secondaryControlBtn}>+10 MIN</button>
                  <button onClick={() => handleAdjustTimerMinutes(-1)} className={styles.secondaryControlBtn}>-1 MIN</button>
                </>
              )}

              <div style={{ display: 'flex', gap: '0.25rem', marginRight: 'auto' }}>
                <button 
                  onClick={() => handleChangeTimerMode('countdown')} 
                  className={`${styles.modeToggleBtn} ${timerMode === 'countdown' ? styles.modeToggleBtnActive : ''}`}
                >
                  COUNTDOWN
                </button>
                <button 
                  onClick={() => handleChangeTimerMode('countup')} 
                  className={`${styles.modeToggleBtn} ${timerMode === 'countup' ? styles.modeToggleBtnActive : ''}`}
                >
                  COUNT UP
                </button>
                <button 
                  onClick={() => handleChangeTimerMode('hidden')} 
                  className={`${styles.modeToggleBtn} ${timerMode === 'hidden' ? styles.modeToggleBtnActive : ''}`}
                >
                  HIDDEN
                </button>
              </div>
            </div>
          </div>

          {/* ACTIVE STAGE TASKS PROGRESS */}
          <div className={styles.missionTasksBox}>
            <div className={styles.tasksHeader}>
              <span className={styles.systemLabel}>CURRENT STAGE MISSIONS</span>
              <span>{completedCount} / {totalTasks} TASKS COMPLETE ({progressPercentage}%)</span>
            </div>
            <div className={styles.progressBarBg}>
              <div className={styles.progressBarFill} style={{ width: `${progressPercentage}%` }} />
            </div>

            <div className={styles.taskList}>
              {tasks.length === 0 ? (
                <span className={styles.stageMetaText}>لا توجد مهام محددة لهذه المرحلة. يمكنك إضافة مهمة من زر Quick Actions.</span>
              ) : (
                tasks.map(t => (
                  <div key={t.id} className={styles.taskRow}>
                    <span>{t.title}</span>
                    <span className={styles.taskTypeBadge}>[{t.type || 'task'}]</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* LAYER C: QUICK ACTIONS */}
          <div className={styles.sectionHeader} style={{ marginTop: '2rem' }}>
            <h2>LAYER C // QUICK ACTIONS</h2>
          </div>

          <div className={styles.quickActionsGrid}>
            <div onClick={() => setShowAddTaskModal(true)} className={styles.quickActionCard}>
              <span className={styles.quickActionTitle}>+ ADD TASK</span>
              <span className={styles.quickActionSub}>إضافة مهمة سريعة للمرحلة</span>
            </div>
            <div onClick={() => setShowAnnouncementModal(true)} className={styles.quickActionCard}>
              <span className={styles.quickActionTitle}>ANNOUNCE</span>
              <span className={styles.quickActionSub}>بث إعلان عام للفرق</span>
            </div>
            <div onClick={handleOpenGlobalCheckpoint} className={styles.quickActionCard}>
              <span className={styles.quickActionTitle}>CHECKPOINT</span>
              <span className={styles.quickActionSub}>فتح تسليم نـقطة التحقق</span>
            </div>
            <div onClick={() => handleAdjustTimerMinutes(5)} className={styles.quickActionCard}>
              <span className={styles.quickActionTitle}>EXTEND +5</span>
              <span className={styles.quickActionSub}>تمديد الوقت 5 دقائق</span>
            </div>
          </div>

        </div>

        {/* LEFT (SIDE): LAYER B — RUN OF SHOW CONTROL TIMELINE */}
        <div className={styles.timelineZone}>
          <div className={styles.sectionHeader}>
            <h2>LAYER B // RUN OF SHOW</h2>
            <button onClick={handleOpenPresetSelect} className={styles.secondaryControlBtn} style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
              + ADD STAGE
            </button>
          </div>

          <div className={styles.timelineList}>
            {stages.map((stg, idx) => {
              const isActive = stg.id === activeStage.id;
              return (
                <div key={stg.id} className={`${styles.stageCard} ${isActive ? styles.stageCardActive : ''}`}>
                  <div className={styles.stageCardHeader}>
                    <span className={styles.stageMetaText}>{String(idx + 1).padStart(2, '0')} // DAY {stg.day || 1}</span>
                    <span className={`${styles.stageStatusBadge} ${isActive ? styles.badgeLive : styles.badgeQueued}`}>
                      {isActive ? '● LIVE' : `${stg.durationMinutes} MIN`}
                    </span>
                  </div>

                  <span className={styles.stageCardTitle}>{stg.title}</span>

                  <div className={styles.stageCardActions}>
                    {!isActive && (
                      <button onClick={() => handleActivateStage(stg.id)} className={styles.miniBtn} style={{ color: '#00f0ff', borderColor: '#00f0ff' }}>
                        ▶ ACTIVATE
                      </button>
                    )}
                    <button onClick={() => handleEditStageModalOpen(stg)} className={styles.miniBtn}>
                      ✏ EDIT
                    </button>
                    <button onClick={() => handleDuplicateStage(stg)} className={styles.miniBtn}>
                      📋 DUP
                    </button>
                    <button onClick={() => handleMoveStage(stg.id, 'up')} className={styles.miniBtn} disabled={idx === 0}>
                      ▲
                    </button>
                    <button onClick={() => handleMoveStage(stg.id, 'down')} className={styles.miniBtn} disabled={idx === stages.length - 1}>
                      ▼
                    </button>
                    <button onClick={() => handleDeleteStage(stg.id)} className={`${styles.miniBtn} ${styles.miniBtnDanger}`}>
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* TEAM MATRIX SECTION */}
      <div className={styles.matrixSection}>
        <div className={styles.sectionHeader}>
          <h2>LIVE TEAM MATRIX ({teams.length} SQUADS)</h2>
        </div>
        <table className={styles.matrixTable}>
          <thead>
            <tr>
              <th>#</th>
              <th>TEAM NAME</th>
              <th>JOIN CODE</th>
              <th>SUBMISSION STATUS</th>
              <th>HEALTH STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t, idx) => (
              <tr key={t.id}>
                <td className={styles.matrixId}>{String(idx + 1).padStart(2, '0')}</td>
                <td><strong>{t.name}</strong></td>
                <td><code className={styles.metaBadge}>{t.joinCode}</code></td>
                <td>{t.checkpointStatus.toUpperCase()}</td>
                <td style={{ color: t.healthStatus === 'red' ? '#ff3366' : (t.healthStatus === 'yellow' ? '#ffaa00' : '#00f0ff') }}>
                  [{t.healthStatus.toUpperCase()}]
                </td>
                <td>
                  <button onClick={() => handleDeleteTeam(t.id)} className={styles.miniBtnDanger}>حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL: QUICK ADD PRESET */}
      {showPresetModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>QUICK ADD STAGE PRESETS</h3>
            <p className={styles.stageDesc}>اختر نموذجاً جاهزاً لإضافته فوراً إلى جدول الـ Run of Show:</p>

            <div className={styles.presetGrid}>
              {QUICK_ADD_PRESETS.map((preset, idx) => (
                <div key={idx} onClick={() => handleAddPresetStage(preset)} className={styles.presetCard}>
                  <span className={styles.presetTitle}>{preset.title}</span>
                  <span className={styles.presetMeta}>{preset.durationMinutes} MIN · {preset.tasks?.length || 0} TASKS</span>
                </div>
              ))}
            </div>

            <div className={styles.modalActions}>
              <button onClick={() => setShowPresetModal(false)} className={styles.cancelBtn}>إلغاء</button>
              <button 
                onClick={() => handleAddPresetStage({ title: 'مرحلة مخصصة جديدة', durationMinutes: 30, type: 'work' })}
                className={styles.primaryBtn}
              >
                + مرحلة فارغة (BLANK STAGE)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: STAGE EDITOR */}
      {showStageEditModal && editingStage && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>EDIT STAGE CONFIGURATION</h3>
            <form onSubmit={handleSaveEditedStage}>
              <div className={styles.formGroup}>
                <label>العنوان (Stage Title)</label>
                <input 
                  type="text" 
                  value={editingStage.title || ''} 
                  onChange={e => setEditingStage({ ...editingStage, title: e.target.value })}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>الوصف (Description)</label>
                <textarea 
                  value={editingStage.description || ''} 
                  onChange={e => setEditingStage({ ...editingStage, description: e.target.value })}
                  className={styles.textarea}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label>المدة بالدقائق (Duration Minutes)</label>
                  <input 
                    type="number" 
                    value={editingStage.durationMinutes || 30} 
                    onChange={e => setEditingStage({ ...editingStage, durationMinutes: Number(e.target.value) })}
                    className={styles.input}
                    min={1}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>وضع المؤقت (Timer Mode)</label>
                  <select 
                    value={editingStage.timerMode || 'countdown'} 
                    onChange={e => setEditingStage({ ...editingStage, timerMode: e.target.value as TimerMode })}
                    className={styles.select}
                  >
                    <option value="countdown">COUNTDOWN</option>
                    <option value="countup">COUNT UP</option>
                    <option value="hidden">HIDDEN</option>
                  </select>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowStageEditModal(false)} className={styles.cancelBtn}>إلغاء</button>
                <button type="submit" className={styles.primaryBtn}>حفظ التعديلات</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD TASK TO ACTIVE STAGE */}
      {showAddTaskModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>+ ADD TASK TO ACTIVE STAGE</h3>
            <form onSubmit={handleAddTaskToActiveStage}>
              <div className={styles.formGroup}>
                <label>عنوان المهمة (Task Title)</label>
                <input 
                  type="text" 
                  value={newTaskTitle} 
                  onChange={e => setNewTaskTitle(e.target.value)} 
                  className={styles.input} 
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label>نوع المهمة (Task Type)</label>
                <select 
                  value={newTaskType} 
                  onChange={e => setNewTaskType(e.target.value as any)} 
                  className={styles.select}
                >
                  <option value="task">TASK (مهمة عادية)</option>
                  <option value="checkpoint">CHECKPOINT (نقطة تسليم)</option>
                  <option value="upload">UPLOAD (تسليم ملحق/ملف)</option>
                  <option value="link">LINK (رابط مشروع/URL)</option>
                  <option value="text">TEXT (نص/إجابة)</option>
                </select>
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowAddTaskModal(false)} className={styles.cancelBtn}>إلغاء</button>
                <button type="submit" className={styles.primaryBtn}>إضافة المهمة</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ANNOUNCEMENT */}
      {showAnnouncementModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>GLOBAL BROADCAST ANNOUNCEMENT</h3>
            <div className={styles.formGroup}>
              <label>نص الإعلان (Announcement Message)</label>
              <input 
                type="text" 
                value={announcementInput} 
                onChange={e => setAnnouncementInput(e.target.value)} 
                className={styles.input} 
                placeholder="أدخل نص الإعلان للفرق..."
              />
            </div>
            <div className={styles.modalActions}>
              <button type="button" onClick={() => setShowAnnouncementModal(false)} className={styles.cancelBtn}>إلغاء</button>
              <button type="button" onClick={handleSendAnnouncement} className={styles.primaryBtn}>بث الإعلان</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
