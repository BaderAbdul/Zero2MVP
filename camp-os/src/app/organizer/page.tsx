'use client';

import React, { useState } from 'react';
import { useCampContext, useTeams, useUsers, useDemoScores } from '@/lib/services/CampContext';
import { useCampEngine, RUN_OF_SHOW } from '@/lib/services/campEngine';
import styles from './organizer.module.css';
import { CampPhase } from '@/lib/services/types';
import GlobalTimer from '@/components/GlobalTimer';

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

  if (!isLoaded || !globalState) return <div className={styles.loading}>جاري تجهيز لوحة التحكم...</div>;

  if (currentUser?.role !== 'organizer') {
    return <div className={styles.error}>غير مصرح. الرجاء تسجيل الدخول كـ المنظّم عبر <a href="/login">/login</a>.</div>;
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
              <h3>تأكيد تغيير حالة المعسكر</h3>
              <p>أنت على وشك فتح المعسكر (Open Camp).</p>
              <p>الحالي: <strong>الإعداد</strong></p>
              <p>الجديد: <strong>غرفة الانتظار</strong></p>
              <p>سيتمكن المشاركون من الانضمام إلى فرقهم باستخدام رموز الانضمام. شاشة العرض (Projector) ستعكس هذا التغيير.</p>
              <div className={styles.modalActions}>
                <button onClick={() => setConfirmLifecycle(null)} className={styles.cancelBtn}>إلغاء</button>
                <button onClick={handleOpenWaitingRoom} className={styles.primaryBtnWarning}>تأكيد الفتح</button>
              </div>
            </div>
          </div>
        )}
        <div className={styles.setupCard}>
          <h1>الإعداد</h1>
          <p>قم بإنشاء الفرق وتجهيز البيئة قبل فتح الأبواب.</p>
          
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
                    لم يتم إنشاء أي فريق بعد. أضف فريقك الأول أعلاه.
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
                        حذف
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className={styles.setupActions}>
            <button onClick={() => setConfirmLifecycle('waiting_room')} className={styles.massivePrimaryBtn}>
              فتح المعسكر (غرفة الانتظار)
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
              <h3>تأكيد تغيير حالة المعسكر</h3>
              <p>أنت على وشك بدء المعسكر (Start Live Camp).</p>
              <p>الحالي: <strong>غرفة الانتظار</strong></p>
              <p>الجديد: <strong>مباشر — LIVE (Welcome Phase)</strong></p>
              <p>المعسكر يبدأ رسميًا. سيشاهد المشاركون لوحة المعلومات الخاصة بهم، وستعرض شاشة العرض شاشة الترحيب. هذا التغيير سينعكس على جميع الشاشات.</p>
              <div className={styles.modalActions}>
                <button onClick={() => setConfirmLifecycle(null)} className={styles.cancelBtn}>إلغاء</button>
                <button onClick={handleStartLiveCamp} className={styles.primaryBtnWarning}>تأكيد البدء</button>
              </div>
            </div>
          </div>
        )}
        <div className={styles.setupCard}>
          <h1>المعسكر مفتوح!</h1>
          <p className={styles.pulseText}>يمكن للمشاركين الآن الانضمام باستخدام رموز الانضمام (Join Code) المكونة من 6 أحرف.</p>
          
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

          <table className={styles.setupTable}>
            <thead>
              <tr>
                <th>اسم الفريق</th>
                <th>رمز الانضمام</th>
                <th>الأعضاء</th>
              </tr>
            </thead>
            <tbody>
              {teams.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    لا توجد فرق.
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
              بدء المعسكر
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
            <h3>تأكيد تغيير المرحلة</h3>
            <p>أنت تقوم بالانتقال خارج التسلسل.</p>
            <p>الحالي: <strong>{currentRoSPhase.title}</strong></p>
            <p>التالي: <strong>{RUN_OF_SHOW.find(p => p.id === confirmPhaseId)?.title}</strong></p>
            <div className={styles.modalActions}>
              <button onClick={() => setConfirmPhaseId(null)} className={styles.cancelBtn}>إلغاء</button>
              <button onClick={() => executePhaseChange(confirmPhaseId)} className={styles.primaryBtnWarning}>تأكيد الانتقال</button>
            </div>
          </div>
        </div>
      )}

      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>لوحة التحكم</h1>
          <span className={styles.liveIndicator}>🔴 مباشر</span>
        </div>
        <button 
          onClick={toggleBreak} 
          className={`${styles.breakToggle} ${isBreak ? styles.breakActive : ''}`}
        >
          {isBreak 
            ? `▶ استئناف المعسكر → ${RUN_OF_SHOW.find(p => p.id === globalState.preBreakPhase)?.title || 'Setup'}` 
            : '⏸ بدء الاستراحة'}
        </button>
      </header>

      <div className={styles.mainLayout}>
        {/* CENTER STAGE: CURRENT PHASE ACTION */}
        <div className={styles.primaryColumn}>
          <section className={styles.actionCard}>
            <p className={styles.subLabel}>المرحلة الحالية</p>
            <h2 className={styles.massivePhaseText}>
              {currentRoSPhase.title.toUpperCase()}
            </h2>
            <div style={{ margin: '1rem 0' }}>
              <GlobalTimer />
            </div>
            <p className={styles.phaseDesc}>{currentRoSPhase.description}</p>
            
            {currentRoSPhase.type !== 'demo_day' && currentRoSPhase.allowAdvance && (
              <button 
                onClick={handleAdvanceNext} 
                disabled={advanceCooldown}
                className={styles.advanceButton}
              >
                {justAdvancedTo ? `✓ بدأت ${justAdvancedTo.toUpperCase()}` : `الانتقال للمرحلة التالية ➔`}
              </button>
            )}

            {currentRoSPhase.type === 'demo_day' && (
              <div className={styles.demoDayControls}>
                <p className={styles.subLabel}>يوم العروض</p>
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
                    <label>الفريق الحالي على المسرح:</label>
                    <select 
                      value={globalState.activeDemoTeamId || ''} 
                      onChange={(e) => handleSelectActiveTeam(e.target.value)}
                      className={styles.select}
                    >
                      <option value="">-- لا يوجد --</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.teamSelector}>
                    <label>الفريق التالي:</label>
                    <select 
                      value={globalState.nextDemoTeamId || ''} 
                      onChange={(e) => handleSelectNextTeam(e.target.value)}
                      className={styles.select}
                    >
                      <option value="">-- لا يوجد --</option>
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
                    التالي إلى المسرح
                  </button>
                  {(!globalState.nextDemoTeamId || !teams.some(t => t.id === globalState.nextDemoTeamId)) && (
                    <span style={{ fontSize: '0.85rem', color: '#ef4444' }}>حدد الفريق التالي قبل التقديم.</span>
                  )}
                </div>

                {currentRoSPhase.id === 'demo_day_judging' && (
                  <div className={styles.judgeStatusAlert}>
                    <strong>المحكّمون الذين أرسلوا:</strong> {submittedJudges} / {totalJudges}
                  </div>
                )}

                <button 
                  onClick={() => provider.updateGlobalState({ revealScores: true }, currentUser.id)} 
                  disabled={currentRoSPhase.id !== 'demo_day_reveal' || globalState.revealScores}
                  className={styles.revealButton}
                >
                  {globalState.revealScores ? 'تم الكشف ✓' : 'كشف النتيجة'}
                </button>
              </div>
            )}
          </section>
        </div>

        {/* SIDE PANEL: SECONDARY CONTROLS */}
        <div className={styles.sideColumn}>
          <section className={styles.sideCard}>
            <h3>الإعلانات</h3>
            {globalState.announcement && (
              <div className={styles.currentAnnouncement}>
                <span className={styles.announcementText}>{globalState.announcement}</span>
                <button onClick={() => provider.updateGlobalState({ announcement: null }, currentUser.id)} className={styles.clearBtn}>✕</button>
              </div>
            )}
            <div className={styles.inputGroup}>
              <input 
                type="text" 
                placeholder="رسالة البث..." 
                value={announcementText}
                onChange={e => setAnnouncementText(e.target.value)}
                className={styles.input}
              />
              <button onClick={handleSetAnnouncement} className={styles.sendBtn}>إرسال</button>
            </div>
          </section>
          
          <section className={styles.sideCard}>
             <h3>العدادات المباشرة</h3>
             <ul className={styles.countersList}>
               <li><strong>المشاركون:</strong> {participantsWithTeamCount}/{participantsCount}</li>
               <li><strong>الفرق الجاهزة:</strong> {teams.length}</li>
               {currentRoSPhase.type === 'demo_day' && (
                 <li><strong>المحكّمون (الفريق الحالي):</strong> {submittedJudges}/{totalJudges}</li>
               )}
             </ul>
          </section>

          <section className={styles.sideCard}>
            <h3>نظرة عامة على الفرق</h3>
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
