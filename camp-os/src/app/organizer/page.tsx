'use client';

import React, { useState } from 'react';
import { useCampContext, useTeams, useUsers, useDemoScores } from '@/lib/services/CampContext';
import { useCampEngine, RUN_OF_SHOW } from '@/lib/services/campEngine';
import styles from './organizer.module.css';
import { CampPhase, TimerMode, UserRole } from '@/lib/services/types';
import GlobalTimer from '@/components/GlobalTimer';

export default function OrganizerMissionControl() {
  const { provider, currentUser } = useCampContext();
  const { isLoaded, globalState, currentRoSPhase, isBreak, timerMode } = useCampEngine();
  const teams = useTeams();
  const users = useUsers();
  
  const currentDemoScores = useDemoScores(globalState?.activeDemoTeamId || undefined);

  const [announcementText, setAnnouncementText] = useState('');
  const [advanceCooldown, setAdvanceCooldown] = useState(false);
  const [justAdvancedTo, setJustAdvancedTo] = useState<string | null>(null);
  
  // Setup state
  const [newTeamName, setNewTeamName] = useState('');
  const [confirmPhaseId, setConfirmPhaseId] = useState<string | null>(null);
  const [confirmLifecycle, setConfirmLifecycle] = useState<'waiting_room' | 'live' | null>(null);

  // UX 3.0 Modals & Forms
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);

  // Task Dispatcher Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [targetTeamId, setTargetTeamId] = useState<'all' | string>('all');
  const [isTaskSending, setIsTaskSending] = useState(false);

  // Timer Control Form State
  const [selectedTimerMode, setSelectedTimerMode] = useState<TimerMode>(timerMode || 'countdown');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(['organizer', 'participant', 'mentor', 'projector']);

  // Custom Stage Form State
  const [stageType, setStageType] = useState('مهمة');
  const [customStageTitle, setCustomStageTitle] = useState('');
  const [customStageDesc, setCustomStageDesc] = useState('');
  const [customStageDuration, setCustomStageDuration] = useState(45);
  const [stageTimerMode, setStageTimerMode] = useState<TimerMode>('countdown');

  if (!isLoaded || !globalState) return <div className={styles.loading}>INITIALIZING OP-SYS...</div>;

  if (currentUser?.role !== 'organizer') {
    return <div className={styles.error}>UNAUTHORIZED. PLEASE LOGIN AS ORGANIZER VIA <a href="/login">/login</a>.</div>;
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
      alert("لا يمكن حذف فريق يحتوي على مشاركين.");
      return;
    }
    if (window.confirm("هل أنت متأكد من حذف هذا الفريق؟")) {
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
      updates.timerStartTime = Date.now();
      updates.timerMode = 'countdown';
    } else {
      updates.timerEndTime = null;
      updates.timerStartTime = null;
    }

    await provider.updateGlobalState(updates, currentUser.id);
    setConfirmPhaseId(null);
  };

  const attemptPhaseChange = (phaseId: string) => {
    const targetPhase = RUN_OF_SHOW.find(p => p.id === phaseId);
    if (!targetPhase) return;

    if (targetPhase.order === currentRoSPhase.order + 1 || (currentRoSPhase.type === 'demo_day' && targetPhase.type === 'demo_day')) {
      executePhaseChange(phaseId);
    } else {
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

  // --- UX 3.0 Actions ---
  const handleDispatchTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setIsTaskSending(true);
    try {
      const targetTeams = targetTeamId === 'all' ? teams : teams.filter(t => t.id === targetTeamId);
      const taskId = `task-${Date.now()}`;
      
      for (const t of targetTeams) {
        await provider.submitTask(t.id, taskId);
      }
      
      await provider.updateGlobalState({
        announcement: `[مهمة] ${taskTitle.trim()}`
      }, currentUser.id);

      setTaskTitle('');
      setTaskDesc('');
      setShowTaskModal(false);
    } catch (err: any) {
      alert("تعذر إرسال المهمة: " + err.message);
    } finally {
      setIsTaskSending(false);
    }
  };

  const handleSaveTimerSettings = async () => {
    const updates: any = {
      timerMode: selectedTimerMode,
      timerRoles: selectedRoles
    };

    if (selectedTimerMode === 'countdown') {
      updates.timerEndTime = Date.now() + (durationMinutes * 60 * 1000);
      updates.timerStartTime = Date.now();
    } else if (selectedTimerMode === 'countup') {
      updates.timerStartTime = Date.now();
      updates.timerEndTime = null;
    } else {
      updates.timerEndTime = null;
      updates.timerStartTime = null;
    }

    await provider.updateGlobalState(updates, currentUser.id);
    setShowTimerModal(false);
  };

  const handleAdjustTimer = async (minutesDelta: number) => {
    const currentEnd = globalState.timerEndTime || Date.now();
    const newEnd = Math.max(Date.now(), currentEnd + (minutesDelta * 60 * 1000));
    await provider.updateGlobalState({ timerEndTime: newEnd }, currentUser.id);
  };

  const handleLaunchCustomStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStageTitle.trim()) return;
    
    const formattedTitle = `[${stageType}] ${customStageTitle.trim()}`;
    
    const updates: any = {
      customStageTitle: formattedTitle,
      customStageDesc: customStageDesc.trim(),
      customStageDuration,
      timerMode: stageTimerMode,
      announcement: `[مرحلة] ${formattedTitle}`
    };

    if (stageTimerMode === 'countdown') {
      updates.timerEndTime = Date.now() + (customStageDuration * 60 * 1000);
      updates.timerStartTime = Date.now();
    } else if (stageTimerMode === 'countup') {
      updates.timerStartTime = Date.now();
      updates.timerEndTime = null;
    } else {
      updates.timerEndTime = null;
      updates.timerStartTime = null;
    }

    await provider.updateGlobalState(updates, currentUser.id);
    setShowStageModal(false);
  };

  const handleSetAnnouncement = async () => {
    await provider.updateGlobalState({ announcement: announcementText || null }, currentUser.id);
    setAnnouncementText('');
    setShowAnnouncementModal(false);
  };

  const handleGlobalCheckpointTrigger = async () => {
    if (window.confirm("هل أنت متأكد من فتح نقطة التحقق لجميع الفرق الآن؟")) {
      for (const t of teams) {
        await provider.submitCheckpoint(t.id);
      }
      await provider.updateGlobalState({
        announcement: "[تنبيه] تم فتح نقطة التحقق لجميع الفرق! الرجاء إرسال العمل للمراجعة."
      }, currentUser.id);
    }
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

  // Metrics calculation
  const participantsCount = users.filter(u => u.role === 'participant').length;
  const participantsWithTeamCount = users.filter(u => u.role === 'participant' && u.teamId).length;
  const teamsCompletedCount = teams.filter(t => t.checkpointStatus === 'approved').length;
  const teamsWorkingCount = teams.filter(t => t.healthStatus === 'green' && t.checkpointStatus !== 'approved').length;
  const teamsNeedingHelpCount = teams.filter(t => t.healthStatus === 'red' || t.healthStatus === 'yellow' || t.checkpointStatus === 'pending').length;

  const totalJudges = users.filter(u => u.role === 'judge').length;
  const submittedJudges = new Set(currentDemoScores.map(s => s.judgeId)).size;

  // Render Setup Mode
  if (globalState.campStatus === 'setup') {
    return (
      <div className={styles.container}>
        {confirmLifecycle === 'waiting_room' && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <h3>تأكيد تغيير حالة المعسكر</h3>
              <p>أنت على وشك فتح المعسكر (Open Camp).</p>
              <div className={styles.modalActions}>
                <button onClick={() => setConfirmLifecycle(null)} className={styles.cancelBtn}>إلغاء</button>
                <button onClick={handleOpenWaitingRoom} className={styles.primaryBtnWarning}>تأكيد الفتح</button>
              </div>
            </div>
          </div>
        )}
        <div className={styles.setupCard}>
          <h1>الإعداد الأولي</h1>
          <p className={styles.pulseText}>قم بإنشاء الفرق وتجهيز البيئة قبل فتح الأبواب.</p>
          
          <form onSubmit={handleCreateTeam} className={styles.setupForm}>
            <input 
              value={newTeamName} 
              onChange={e => setNewTeamName(e.target.value)} 
              placeholder="اسم الفريق الجديد" 
              className={styles.input}
            />
            <button type="submit" className={styles.primaryBtn} disabled={!newTeamName.trim()}>إضافة فريق</button>
          </form>

          <table className={styles.setupTable}>
            <thead>
              <tr>
                <th>اسم الفريق</th>
                <th>رمز الانضمام</th>
                <th>الأعضاء</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {teams.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    لم يتم إنشاء أي فريق بعد.
                  </td>
                </tr>
              )}
              {teams.map(t => {
                const members = users.filter(u => u.teamId === t.id).length;
                return (
                  <tr key={t.id}>
                    <td><strong>{t.name}</strong></td>
                    <td className="font-mono">{t.joinCode}</td>
                    <td>{members}</td>
                    <td>
                      <button 
                        onClick={() => handleDeleteTeam(t.id)}
                        disabled={members > 0}
                        className={styles.deleteBtn}
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <button onClick={() => setConfirmLifecycle('waiting_room')} className={styles.massivePrimaryBtn}>
            فتح الأبواب (غرفة الانتظار)
          </button>
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
              <h3>تأكيد بداية المعسكر المباشر</h3>
              <div className={styles.modalActions}>
                <button onClick={() => setConfirmLifecycle(null)} className={styles.cancelBtn}>إلغاء</button>
                <button onClick={handleStartLiveCamp} className={styles.primaryBtnWarning}>تأكيد البدء</button>
              </div>
            </div>
          </div>
        )}
        <div className={styles.setupCard}>
          <h1>غرفة الانتظار</h1>
          <p className={styles.pulseText}>المعسكر مفتوح لدخول المشاركين وتكوين الفرق.</p>
          
          <div className={styles.statsGrid}>
            <div className={styles.statBox}>
              <span className={styles.statValue}>{participantsWithTeamCount} / {participantsCount}</span>
              <span className={styles.statLabel}>المشاركون المنضمون</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statValue}>{teams.length}</span>
              <span className={styles.statLabel}>إجمالي الفرق</span>
            </div>
          </div>

          <button onClick={() => setConfirmLifecycle('live')} className={styles.massivePrimaryBtn}>
            بدء المعسكر المباشر 🔴
          </button>
        </div>
      </div>
    );
  }

  // --- LIVE MISSION CONTROL (UX 3.0) ---
  return (
    <div className={styles.container}>
      {/* CONFIRMATION MODAL */}
      {confirmPhaseId && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>تأكيد تغيير المرحلة</h3>
            <p>الحالي: <strong>{currentRoSPhase.title}</strong> ➔ التالي: <strong>{RUN_OF_SHOW.find(p => p.id === confirmPhaseId)?.title}</strong></p>
            <div className={styles.modalActions}>
              <button onClick={() => setConfirmPhaseId(null)} className={styles.cancelBtn}>إلغاء</button>
              <button onClick={() => executePhaseChange(confirmPhaseId)} className={styles.primaryBtnWarning}>تأكيد الانتقال</button>
            </div>
          </div>
        </div>
      )}

      {/* TASK DISPATCH MODAL */}
      {showTaskModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>إرسال مهمة موجهة</h3>
            <form onSubmit={handleDispatchTask}>
              <div className={styles.formGroup}>
                <label>عنوان المهمة (Mission Title):</label>
                <input 
                  type="text" 
                  value={taskTitle} 
                  onChange={e => setTaskTitle(e.target.value)} 
                  className={styles.input} 
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label>الوصف والتعليمات (Instructions):</label>
                <textarea 
                  value={taskDesc} 
                  onChange={e => setTaskDesc(e.target.value)} 
                  className={styles.textarea} 
                />
              </div>
              <div className={styles.formGroup}>
                <label>الجمهور المستهدف (Target):</label>
                <select 
                  value={targetTeamId} 
                  onChange={e => setTargetTeamId(e.target.value)} 
                  className={styles.select}
                >
                  <option value="all">جميع الفرق ({teams.length})</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowTaskModal(false)} className={styles.cancelBtn}>إلغاء</button>
                <button type="submit" className={styles.primaryBtn} disabled={isTaskSending || !taskTitle.trim()}>
                  {isTaskSending ? 'جاري الإرسال...' : 'إرسال المهمة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TIMER CONTROLS MODAL */}
      {showTimerModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>إعدادات المؤقت</h3>
            <div className={styles.formGroup}>
              <label>نمط المؤقت (Timer Mode):</label>
              <div className={styles.radioGroup}>
                <label><input type="radio" name="timerMode" value="countdown" checked={selectedTimerMode === 'countdown'} onChange={() => setSelectedTimerMode('countdown')} /> عد تنازلي</label>
                <label><input type="radio" name="timerMode" value="countup" checked={selectedTimerMode === 'countup'} onChange={() => setSelectedTimerMode('countup')} /> عد تصاعدي</label>
                <label><input type="radio" name="timerMode" value="hidden" checked={selectedTimerMode === 'hidden'} onChange={() => setSelectedTimerMode('hidden')} /> بدون مؤقت (مخفي)</label>
              </div>
            </div>

            {selectedTimerMode === 'countdown' && (
              <div className={styles.formGroup}>
                <label>المدة بالدقائق (Duration):</label>
                <input 
                  type="number" 
                  value={durationMinutes} 
                  onChange={e => setDurationMinutes(Number(e.target.value))} 
                  className={styles.input} 
                  min={1} 
                />
              </div>
            )}

            <div className={styles.formGroup}>
              <label>الرؤية (Visibility) [متوفر جزئياً بالبنية الحالية]:</label>
              <div className={styles.checkboxGroup}>
                {(['organizer', 'participant', 'mentor', 'judge', 'projector'] as UserRole[]).map(role => (
                  <label key={role}>
                    <input 
                      type="checkbox" 
                      checked={selectedRoles.includes(role)} 
                      onChange={e => {
                        if (e.target.checked) setSelectedRoles([...selectedRoles, role]);
                        else setSelectedRoles(selectedRoles.filter(r => r !== role));
                      }} 
                    /> {role}
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.modalActions}>
              <button type="button" onClick={() => setShowTimerModal(false)} className={styles.cancelBtn}>إلغاء</button>
              <button type="button" onClick={handleSaveTimerSettings} className={styles.primaryBtn}>حفظ الإعدادات</button>
            </div>
          </div>
        </div>
      )}

      {/* STAGE BUILDER MODAL */}
      {showStageModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Stage Builder — بناء مرحلة</h3>
            <form onSubmit={handleLaunchCustomStage}>
              <div className={styles.formGroup}>
                <label>نوع المرحلة (Stage Type):</label>
                <select value={stageType} onChange={e => setStageType(e.target.value)} className={styles.select}>
                  <option value="مهمة">مهمة</option>
                  <option value="ورشة">ورشة</option>
                  <option value="نقاش">نقاش</option>
                  <option value="بناء">بناء</option>
                  <option value="مراجعة">مراجعة</option>
                  <option value="عرض">عرض</option>
                  <option value="استراحة">استراحة</option>
                  <option value="مخصص">مخصص</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>اسم المرحلة (Stage Name):</label>
                <input type="text" value={customStageTitle} onChange={e => setCustomStageTitle(e.target.value)} className={styles.input} required />
              </div>
              <div className={styles.formGroup}>
                <label>الوصف (Description):</label>
                <textarea value={customStageDesc} onChange={e => setCustomStageDesc(e.target.value)} className={styles.textarea} />
              </div>
              <div className={styles.formGroup}>
                <label>نمط المؤقت (Timer Mode):</label>
                <select value={stageTimerMode} onChange={e => setStageTimerMode(e.target.value as TimerMode)} className={styles.select}>
                  <option value="countdown">عد تنازلي</option>
                  <option value="countup">عد تصاعدي</option>
                  <option value="hidden">بدون مؤقت</option>
                </select>
              </div>
              {stageTimerMode === 'countdown' && (
                <div className={styles.formGroup}>
                  <label>المدة بالدقائق (Duration):</label>
                  <input type="number" value={customStageDuration} onChange={e => setCustomStageDuration(Number(e.target.value))} className={styles.input} min={1} />
                </div>
              )}
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowStageModal(false)} className={styles.cancelBtn}>إلغاء</button>
                <button type="submit" className={styles.primaryBtn} disabled={!customStageTitle.trim()}>إطلاق المرحلة</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ANNOUNCEMENT MODAL */}
      {showAnnouncementModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>إرسال إعلان (Communication)</h3>
            <div className={styles.formGroup}>
              <input type="text" value={announcementText} onChange={e => setAnnouncementText(e.target.value)} className={styles.input} />
            </div>
            <div className={styles.modalActions}>
              <button type="button" onClick={() => setShowAnnouncementModal(false)} className={styles.cancelBtn}>إلغاء</button>
              <button type="button" onClick={handleSetAnnouncement} className={styles.primaryBtn}>إرسال البث</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.systemLabel}>OP-SYS // COMMAND // {currentUser.id}</span>
          <h1>Mission Control</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <span className={styles.liveIndicator}>Live State Active</span>
          <button 
            onClick={toggleBreak} 
            className={`${styles.breakToggle} ${isBreak ? styles.breakActive : ''}`}
          >
            {isBreak ? `RESUME SYSTEM` : `SYSTEM PAUSE`}
          </button>
        </div>
      </header>

      {/* MAIN COMMAND LAYOUT */}
      <div className={styles.mainLayout}>
        <div className={styles.primaryColumn}>
          
          {/* QUICK COMMAND CENTER */}
          <section className={styles.commandCenter}>
            <div className={styles.commandHeader}>
              <h2>Command Menu</h2>
              <div className={styles.commandHeaderLine}></div>
            </div>
            <div className={styles.commandGrid}>
              <button onClick={() => setShowStageModal(true)} className={styles.commandBtn}>
                إنشاء مرحلة (Stage Builder)
              </button>
              <button onClick={() => setShowTaskModal(true)} className={`${styles.commandBtn} ${styles.commandBtnPrimary}`}>
                إرسال مهمة (Mission)
              </button>
              <button onClick={() => setShowTimerModal(true)} className={styles.commandBtn}>
                إدارة المؤقت (Timer)
              </button>
              <button onClick={() => setShowAnnouncementModal(true)} className={styles.commandBtn}>
                بث مباشر (Broadcast)
              </button>
              <button onClick={handleGlobalCheckpointTrigger} className={`${styles.commandBtn} ${styles.commandBtnWarning}`}>
                فتح التسليم (Checkpoint)
              </button>
            </div>
          </section>

          {/* TELEMETRY */}
          <section className={styles.liveMetricsBar}>
            <div className={styles.metricBadge}>
              <span className={styles.metricVal}>{teams.length}</span>
              <span className={styles.metricLbl}>ACTIVE TEAMS</span>
            </div>
            <div className={styles.metricBadge}>
              <span className={styles.metricVal} style={{ color: 'var(--color-accent)' }}>{teamsWorkingCount}</span>
              <span className={styles.metricLbl}>WORKING</span>
            </div>
            <div className={styles.metricBadge}>
              <span className={styles.metricVal} style={{ color: 'var(--color-success)' }}>{teamsCompletedCount}</span>
              <span className={styles.metricLbl}>SUBMITTED</span>
            </div>
            <div className={styles.metricBadge}>
              <span className={styles.metricVal} style={{ color: 'var(--color-danger)' }}>{teamsNeedingHelpCount}</span>
              <span className={styles.metricLbl}>NEED HELP</span>
            </div>
          </section>

          {/* CURRENT LIVE STATE */}
          <section className={styles.actionCard}>
            <span className={styles.subLabel}>CURRENT PHASE / {currentRoSPhase.id}</span>
            <h2 className={styles.massivePhaseText}>
              {(globalState.customStageTitle || currentRoSPhase.title)}
            </h2>
            <div className={styles.timerWrapper}>
              <GlobalTimer />
              {timerMode === 'countdown' && (
                <div className={styles.timerControls}>
                  <button onClick={() => handleAdjustTimer(-1)} className={styles.secondaryBtn}>-1m</button>
                  <button onClick={() => handleAdjustTimer(-5)} className={styles.secondaryBtn}>-5m</button>
                  <button onClick={() => handleAdjustTimer(1)} className={styles.secondaryBtn}>+1m</button>
                  <button onClick={() => handleAdjustTimer(5)} className={styles.secondaryBtn}>+5m</button>
                </div>
              )}
            </div>

            <p className={styles.phaseDesc}>{globalState.customStageDesc || currentRoSPhase.description}</p>
            
            {currentRoSPhase.type !== 'demo_day' && currentRoSPhase.allowAdvance && (
              <button onClick={handleAdvanceNext} disabled={advanceCooldown} className={styles.advanceButton}>
                {justAdvancedTo ? `[✓] EXECUTE ${justAdvancedTo.toUpperCase()}` : `EXECUTE NEXT STAGE ➔`}
              </button>
            )}

            {currentRoSPhase.type === 'demo_day' && (
              <div className={styles.demoDayControls}>
                <span className={styles.subLabel}>DEMO DAY OPERATIONS</span>
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
                    <label>ON STAGE (ACTIVE):</label>
                    <select value={globalState.activeDemoTeamId || ''} onChange={(e) => handleSelectActiveTeam(e.target.value)} className={styles.select}>
                      <option value="">-- NONE --</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>

                  <div className={styles.teamSelector}>
                    <label>UP NEXT (QUEUE):</label>
                    <select value={globalState.nextDemoTeamId || ''} onChange={(e) => handleSelectNextTeam(e.target.value)} className={styles.select}>
                      <option value="">-- NONE --</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>
                
                <div>
                  <button onClick={handleAdvanceDemoQueue} className={styles.secondaryBtn} disabled={!globalState.nextDemoTeamId || !teams.some(t => t.id === globalState.nextDemoTeamId)}>
                    ADVANCE QUEUE TO STAGE
                  </button>
                </div>

                {currentRoSPhase.id === 'demo_day_judging' && (
                  <div className={styles.judgeStatusAlert}>
                    <strong>SCORE SUBMISSIONS:</strong> {submittedJudges} / {totalJudges}
                  </div>
                )}

                <button 
                  onClick={() => provider.updateGlobalState({ revealScores: true }, currentUser.id)} 
                  disabled={currentRoSPhase.id !== 'demo_day_reveal' || globalState.revealScores}
                  className={styles.revealButton}
                >
                  {globalState.revealScores ? 'SCORES REVEALED' : 'REVEAL SCORES'}
                </button>
              </div>
            )}
          </section>

          {/* OBSERVATION MATRIX */}
          <section className={styles.matrixSection}>
            <div className={styles.commandHeader}>
              <h2>Live Team Matrix</h2>
              <div className={styles.commandHeaderLine}></div>
            </div>
            <table className={styles.matrixTable}>
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Mission Stage</th>
                  <th>Submission</th>
                  <th>Health Status</th>
                </tr>
              </thead>
              <tbody>
                {teams.map(t => {
                  const isNeedingHelp = t.healthStatus === 'red' || t.healthStatus === 'yellow';
                  return (
                    <tr key={t.id}>
                      <td><strong>{t.name}</strong></td>
                      <td>{t.currentStage}</td>
                      <td className={t.checkpointStatus === 'approved' ? styles.statusBadgeCompleted : (t.checkpointStatus === 'pending' ? styles.statusBadgeReview : '')}>
                        {t.checkpointStatus === 'approved' ? 'SUBMITTED' : (t.checkpointStatus === 'pending' ? 'REVIEWING' : 'WORKING')}
                      </td>
                      <td className={isNeedingHelp ? styles.statusBadgeHelp : styles.statusBadgeWorking}>
                        {t.healthStatus === 'red' ? 'CRITICAL - NEEDS HELP' : (t.healthStatus === 'yellow' ? 'WARNING' : 'HEALTHY')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

        </div>
      </div>
    </div>
  );
}
