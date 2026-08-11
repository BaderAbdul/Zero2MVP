'use client';

import React, { useState, useEffect } from 'react';
import { useCampContext, useTeams } from '@/lib/services/CampContext';
import { useCampEngine, SESSION_PRESETS } from '@/lib/services/campEngine';
import { Session, Team, Organizer } from '@/lib/services/types';
import { auth, googleProvider } from '@/lib/services/firebase';
import { signInWithPopup } from 'firebase/auth';
import styles from './organizer.module.css';

type ActiveTab = 'camp_control' | 'people_teams';

const SUPER_ADMIN_EMAIL = 'ebaderabdul@gmail.com';

export default function OrganizerHub() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const int = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(int);
  }, []);

  const { provider, currentUser, setCurrentUser } = useCampContext();
  const { 
    isLoaded, globalState, sessions, activeSession, activeSessionIndex, nextSession,
    timerMode, isTimerPaused, formattedTime, needsAttentionTeams
  } = useCampEngine();
  const teams = useTeams();

  const [activeTab, setActiveTab] = useState<ActiveTab>('camp_control');

  // Modals & Drawer States
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [editingSession, setEditingSession] = useState<Partial<Session> | null>(null);

  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementInput, setAnnouncementInput] = useState('');
  const [announcementImageInput, setAnnouncementImageInput] = useState('');

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [reviewFeedbackInput, setReviewFeedbackInput] = useState('');

  // Team CRUD Modals
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [newTeamNameInput, setNewTeamNameInput] = useState('');
  const [newTeamCodeInput, setNewTeamCodeInput] = useState('');

  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editTeamNameInput, setEditTeamNameInput] = useState('');
  const [editTeamIdeaInput, setEditTeamIdeaInput] = useState('');
  const [editTeamCodeInput, setEditTeamCodeInput] = useState('');

  // Staff Assignment Modal
  const [showAddOrganizerModal, setShowAddOrganizerModal] = useState(false);
  const [newStaffNameInput, setNewStaffNameInput] = useState('');
  const [newStaffEmailInput, setNewStaffEmailInput] = useState('');
  const [newStaffRoleInput, setNewStaffRoleInput] = useState<Organizer['role']>('organizer');

  // Staff List State
  const [staffList, setStaffList] = useState<Array<{ id: string; name: string; email: string; role: string }>>([
    { id: 'sa-1', name: 'بدر عبدالرحمن (المنظم الرئيسي)', email: SUPER_ADMIN_EMAIL, role: 'Super Admin / Lead' }
  ]);

  // Confirmation Guard Modal
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    action: () => Promise<void>;
  } | null>(null);

  // Check-in note modal
  const [checkInTeam, setCheckInTeam] = useState<Team | null>(null);
  const [checkInNoteInput, setCheckInNoteInput] = useState('');

  const isSuperAdmin = currentUser?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

  const handleGoogleAuthForOrganizer = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        const userEmail = res.user.email?.toLowerCase();
        const organizerUser = {
          id: res.user.uid,
          name: res.user.displayName || res.user.email?.split('@')[0] || 'منسق المعسكر',
          role: 'organizer' as const,
          email: res.user.email || undefined,
          campId: 'Z2MVP'
        };

        setCurrentUser(organizerUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('camp_os_session', JSON.stringify({
            participantId: res.user.uid,
            participantName: organizerUser.name,
            role: 'organizer',
            email: res.user.email,
            campId: 'Z2MVP'
          }));
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
    }
  };

  if (!isLoaded || !globalState) {
    return (
      <div className={styles.container} style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h2>جاري تحميل غرفة التحكم...</h2>
      </div>
    );
  }

  // Session & Timer Handlers
  const handleTogglePause = async () => {
    if (isTimerPaused) {
      await provider.resumeSession();
    } else {
      await provider.pauseSession();
    }
  };

  const handleAdjustTimer = async (deltaMins: number) => {
    await provider.adjustTimer(deltaMins);
  };

  const handleActivateNextWithGuard = async () => {
    if (!nextSession) return;
    setConfirmAction({
      title: 'الانتقال للجلسة التالية',
      message: `هل أنت تأكد من إنهاء الجلسة الحالية والانتقال للجلسة التالية: "${nextSession.title}"؟`,
      action: async () => {
        await provider.activateSession(nextSession.id);
        setConfirmAction(null);
      }
    });
  };

  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    await provider.updateGlobalState({ 
      announcement: announcementInput.trim() || null,
      announcementImageUrl: announcementImageInput.trim() || null
    });
    setShowAnnouncementModal(false);
  };

  // Team CRUD Handlers
  const handleCreateTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamNameInput.trim()) return;
    await provider.createTeam(newTeamNameInput.trim(), newTeamCodeInput.trim() || undefined);
    setNewTeamNameInput('');
    setNewTeamCodeInput('');
    setShowCreateTeamModal(false);
  };

  const handleEditTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam || !editTeamNameInput.trim()) return;
    await provider.updateTeam(editingTeam.id, {
      name: editTeamNameInput.trim(),
      projectIdea: editTeamIdeaInput.trim(),
      joinCode: editTeamCodeInput.trim() || editingTeam.joinCode
    });
    setEditingTeam(null);
  };

  const handleDeleteTeamWithGuard = (team: Team) => {
    setConfirmAction({
      title: 'حذف الفريق بالكامل',
      message: `هل أنت تأكد من حذف فريق "${team.name}" نهائياً من المعسكر؟ لا يمكن التراجع عن هذا الإجراء.`,
      action: async () => {
        await provider.deleteTeam(team.id);
        setConfirmAction(null);
      }
    });
  };

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession || !editingSession.title) return;
    
    const updatedSessions = [...sessions];
    if (editingSession.id) {
      const idx = updatedSessions.findIndex(s => s.id === editingSession.id);
      if (idx >= 0) {
        updatedSessions[idx] = { ...updatedSessions[idx], ...editingSession } as Session;
      }
    } else {
      const newS: Session = {
        id: 's_' + Math.random().toString(36).substr(2, 6),
        title: editingSession.title,
        subtitle: editingSession.subtitle || '',
        description: editingSession.description || '',
        day: (editingSession.day as 1 | 2 | 3) || 1,
        order: sessions.length + 1,
        type: editingSession.type || 'work',
        durationMinutes: editingSession.durationMinutes || 30,
        timerMode: editingSession.timerMode || 'countdown',
        status: 'queued',
        mission: editingSession.mission || {
          id: 'm_' + Math.random().toString(36).substr(2, 5),
          title: editingSession.title,
          description: editingSession.description || '',
          tasks: []
        }
      };
      updatedSessions.push(newS);
    }

    await provider.saveSessions(updatedSessions);
    setShowSessionModal(false);
    setEditingSession(null);
  };

  const handleReviewSubmission = async (teamId: string, sessionId: string, status: 'approved' | 'changes_requested') => {
    await provider.reviewDeliverable(teamId, sessionId, status, reviewFeedbackInput, currentUser?.name || 'المنظّم');
    setReviewFeedbackInput('');
    if (selectedTeam) {
      const updated = teams.find(t => t.id === selectedTeam.id);
      if (updated) setSelectedTeam(updated);
    }
  };

  const handleResolveHelp = async (teamId: string, helpId: string) => {
    await provider.resolveHelp(teamId, helpId, currentUser?.name || 'المنظّم');
  };

  const handleSendCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInTeam || !checkInNoteInput.trim()) return;
    await provider.updateTeam(checkInTeam.id, {
      submissions: {
        ...(checkInTeam.submissions || {}),
        organizerNote: checkInNoteInput.trim() as any
      }
    });
    setCheckInTeam(null);
    setCheckInNoteInput('');
  };

  const handleSelectDemoTeam = async (teamId: string) => {
    await provider.updateGlobalState({ activeDemoTeamId: teamId });
  };

  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffNameInput.trim() || !newStaffEmailInput.trim()) return;

    if (provider.addOrganizer) {
      await provider.addOrganizer(newStaffNameInput.trim(), newStaffRoleInput, newStaffEmailInput.trim());
    }

    setStaffList(prev => [
      ...prev,
      {
        id: 'st-' + Math.random().toString(36).substr(2, 5),
        name: newStaffNameInput.trim(),
        email: newStaffEmailInput.trim(),
        role: newStaffRoleInput === 'lead' ? 'منظم رئيسي' : newStaffRoleInput === 'technical' ? 'مرشد تقني' : newStaffRoleInput === 'product' ? 'مرشد منتجات' : 'منسق/محكّم'
      }
    ]);

    setNewStaffNameInput('');
    setNewStaffEmailInput('');
    setShowAddOrganizerModal(false);
  };

  return (
    <div className={styles.container}>
      {/* TOP NAVIGATION HEADER & WORKSPACE SWITCHER */}
      <header className={styles.topNav}>
        <div className={styles.navBrand}>
          <div className={styles.liveBadge}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-green)' }}></span>
            <span>LIVE OPERATIONAL COMMAND</span>
          </div>
          <span style={{ fontSize: '1.1rem', fontWeight: 900 }}>
            FROM ZERO TO MVP · CAMP OS {isSuperAdmin ? '(SUPER ADMIN: ebaderabdul@gmail.com)' : ''}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {!currentUser ? (
            <button className={`${styles.tabBtn} ${styles.tabBtnActive}`} onClick={handleGoogleAuthForOrganizer}>
              🔒 تسجيل الدخول بواسطة Google
            </button>
          ) : (
            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
              مرحباً {currentUser.name} {isSuperAdmin ? '👑 (Super Admin)' : ''}
            </div>
          )}

          <div className={styles.workspaceTabs}>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'camp_control' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('camp_control')}
            >
              🕹️ CAMP CONTROL (غرفة التحكم)
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'people_teams' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('people_teams')}
            >
              👥 PEOPLE & TEAMS ({needsAttentionTeams.length > 0 ? `⚠️ ${needsAttentionTeams.length}` : teams.length})
            </button>
          </div>
        </div>
      </header>

      {/* WORKSPACE 1: CAMP CONTROL */}
      {activeTab === 'camp_control' && (
        <div className={styles.campControlGrid}>
          {/* LEFT: LIVE SESSION FACILITATOR STAGE */}
          <div className={styles.activeSessionCard}>
            <div className={styles.sessionHeader}>
              <span className={styles.sessionTag}>
                DAY 0{activeSession?.day || 1} · SESSION 0{activeSession?.order || 1}
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                TYPE: {activeSession?.type?.toUpperCase()}
              </span>
            </div>

            <div>
              <h1 className={styles.sessionTitle}>
                {activeSession?.title || 'ترحيب المعسكر والانطلاق'}
              </h1>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                {activeSession?.description || 'مرحباً بالجميع في المعسكر.'}
              </p>
            </div>

            {/* LIVE TIMER DISPLAY */}
            <div className={styles.timerBox}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: 2 }}>
                {timerMode === 'countup' ? 'COUNT UP TIMER' : 'COUNTDOWN TIMER'}
              </span>
              <div className={styles.bigTimerText}>{formattedTime}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: isTimerPaused ? 'var(--color-yellow)' : 'var(--color-green)' }}>
                {isTimerPaused ? '⏸️ المؤقت متوقف مؤقتاً' : '▶️ المؤقت يعمل الآن'}
              </div>
            </div>

            {/* CONTROL BUTTONS WITH SAFETY GUARDS */}
            <div className={styles.controlButtonsRow}>
              <button className={`${styles.actionBtn} ${styles.primaryActionBtn}`} onClick={handleTogglePause}>
                {isTimerPaused ? '▶️ استئناف' : '⏸️ إيقاف مؤقت'}
              </button>
              <button className={styles.actionBtn} onClick={() => handleAdjustTimer(5)}>
                +5 دقائق
              </button>
              <button className={styles.actionBtn} onClick={() => handleAdjustTimer(10)}>
                +10 دقائق
              </button>
              {nextSession && (
                <button className={`${styles.actionBtn} ${styles.primaryActionBtn}`} onClick={handleActivateNextWithGuard}>
                  الجلسة التالية: {nextSession.title} ←
                </button>
              )}
              <button className={styles.actionBtn} onClick={() => setShowAnnouncementModal(true)}>
                📢 بث إعلان / صورة 🖼️
              </button>
            </div>

            {/* DEMO DAY ACTIVE TEAM SELECTOR */}
            {activeSession?.type === 'demo' && (
              <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: '#EFF6FF', border: '2px solid var(--color-blue)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem' }}>🏆 إدارة عروض Demo Day (الفريق المعروض):</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {teams.map(t => (
                    <button
                      key={t.id}
                      className={styles.actionBtn}
                      style={{
                        background: globalState.activeDemoTeamId === t.id ? 'var(--color-blue)' : 'var(--bg-surface)',
                        color: globalState.activeDemoTeamId === t.id ? '#fff' : 'var(--text-main)',
                        fontSize: '0.85rem'
                      }}
                      onClick={() => handleSelectDemoTeam(t.id)}
                    >
                      {globalState.activeDemoTeamId === t.id ? '▶️ ' : ''}{t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: TIMELINE & QUICK ADD */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className={styles.timelineCard}>
              <div className={styles.timelineHeading}>
                <span>جدول المعسكر (Run of Show)</span>
                <button 
                  className={styles.actionBtn} 
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                  onClick={() => { setEditingSession({}); setShowSessionModal(true); }}
                >
                  + إضافة جلسة
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {sessions.map((s, index) => {
                  const isActive = s.id === activeSession?.id;
                  return (
                    <div 
                      key={s.id} 
                      className={`${styles.sessionItem} ${isActive ? styles.sessionItemActive : ''}`}
                      onClick={() => {
                        setConfirmAction({
                          title: 'تفعيل الجلسة',
                          message: `هل أنت تأكد من الانتقال المباشر وتفعيل: "${s.title}"؟`,
                          action: async () => {
                            await provider.activateSession(s.id);
                            setConfirmAction(null);
                          }
                        });
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>
                          {index + 1}. {s.title}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          اليوم {s.day} · {s.durationMinutes} دقيقة
                        </div>
                      </div>

                      {isActive && (
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-blue)', background: '#EFF6FF', padding: '0.2rem 0.5rem', border: '1px solid var(--color-blue)' }}>
                          نشطة الآن 🔴
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* QUICK PRESETS ADD */}
            <div className={styles.timelineCard}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>إضافة جلسة سريعة (Quick Presets)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {Object.entries(SESSION_PRESETS).map(([key, preset]) => (
                  <button 
                    key={key}
                    className={styles.actionBtn}
                    style={{ fontSize: '0.8rem', padding: '0.5rem', textOverflow: 'ellipsis', overflow: 'hidden' }}
                    onClick={() => {
                      setEditingSession({
                        title: preset.mission?.title || key,
                        durationMinutes: preset.durationMinutes || 30,
                        type: preset.type || 'work',
                        day: 1
                      });
                      setShowSessionModal(true);
                    }}
                  >
                    + {key}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WORKSPACE 2: PEOPLE & TEAMS */}
      {activeTab === 'people_teams' && (
        <div className={styles.peopleWorkspace}>
          {/* STAFF MANAGEMENT LIST (SUPER ADMIN / LEAD ORGANIZER ONLY) */}
          <section className={styles.directorySection} style={{ borderLeft: '4px solid var(--color-blue)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 900 }}>فريق التنظيم والتدريب والتحكيم المعتمد ({staffList.length})</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  إدارة الصلاحيات وتعيين المدربين والمحكمين المعينين من قبل {SUPER_ADMIN_EMAIL}
                </p>
              </div>
              <button className={`${styles.actionBtn} ${styles.primaryActionBtn}`} onClick={() => setShowAddOrganizerModal(true)}>
                + تعيين مدرب / منظم / محكم
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
              {staffList.map(st => (
                <div key={st.id} style={{ padding: '0.85rem 1rem', background: 'var(--bg-surface)', border: '1.5px solid var(--border-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{st.name}</div>
                    <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{st.email}</div>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.5rem', background: '#EFF6FF', color: 'var(--color-blue)', border: '1px solid var(--color-blue)' }}>
                    {st.role}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* NEEDS ATTENTION QUEUE */}
          <section className={styles.needsAttentionSection}>
            <div className={styles.needsAttentionHeading}>
              <span>⚠️ يحتاج تدخل ورعاية المنظم (NEEDS ATTENTION)</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                ({needsAttentionTeams.length} فرق تحتاج مساعدة أو تنتظر المراجعة)
              </span>
            </div>

            {needsAttentionTeams.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>جميع الفرق تسير بشكل ممتاز وفي المسار المحدد! ✓</p>
            ) : (
              <div className={styles.attentionGrid}>
                {needsAttentionTeams.map(t => {
                  const openHelp = t.helpRequests?.find(h => h.status === 'open');
                  const sub = t.submissions?.[activeSession?.id || ''];
                  const isPendingSub = sub?.status === 'submitted' || t.checkpointStatus === 'pending';

                  return (
                    <div key={t.id} className={styles.attentionCard}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className={styles.attentionTitle}>{t.name}</span>
                        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.8rem', fontWeight: 800 }}>{t.joinCode}</span>
                      </div>

                      {openHelp && (
                        <p className={styles.attentionMessage}>
                          🚨 طلب مساعدة: "{openHelp.message || openHelp.category}" من {openHelp.participantName}
                        </p>
                      )}

                      {isPendingSub && (
                        <p className={styles.attentionMessage} style={{ color: '#B45309' }}>
                          📄 تسليم مخرج جديد ينتظر مراجعتك واعتمادك
                        </p>
                      )}

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        {openHelp && (
                          <button 
                            className={styles.actionBtn}
                            style={{ background: 'var(--color-green)', color: '#fff', fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                            onClick={() => handleResolveHelp(t.id, openHelp.id)}
                          >
                            تحديد كتم الحل ✓
                          </button>
                        )}
                        <button 
                          className={styles.actionBtn}
                          style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                          onClick={() => setSelectedTeam(t)}
                        >
                          فتح التفاصيل والمراجعة ←
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* TEAM DIRECTORY WITH FULL CRUD */}
          <section className={styles.directorySection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900 }}>دليل الفرق وإدارتها ({teams.length})</h2>
              <button className={`${styles.actionBtn} ${styles.primaryActionBtn}`} onClick={() => setShowCreateTeamModal(true)}>
                + إنشاء فريق جديد
              </button>
            </div>

            <div className={styles.teamsGrid}>
              {teams.map(t => (
                <div key={t.id} className={styles.teamCard}>
                  <div className={styles.teamCardHeader}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>{t.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.85rem', fontWeight: 700 }}>{t.joinCode}</span>
                      <button 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                        title="تعديل بيانات الفريق"
                        onClick={() => {
                          setEditingTeam(t);
                          setEditTeamNameInput(t.name);
                          setEditTeamIdeaInput(t.projectIdea || '');
                          setEditTeamCodeInput(t.joinCode);
                        }}
                      >
                        ✏️
                      </button>
                      <button 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--color-red)' }}
                        title="حذف الفريق"
                        onClick={() => handleDeleteTeamWithGuard(t)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      <span>نسبة الإنجاز:</span>
                      <span style={{ color: 'var(--color-blue)' }}>{t.progressPercentage || 0}%</span>
                    </div>
                    <div className={styles.progressBarBg}>
                      <div className={styles.progressBarFill} style={{ width: `${t.progressPercentage || 0}%` }} />
                    </div>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    الأعضاء ({t.members?.length || 0}): {t.members?.map(m => m.name).join(', ') || 'لا يوجد أعضاء بعد'}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button className={styles.actionBtn} onClick={() => { setCheckInTeam(t); setCheckInNoteInput('كيف الأمور؟ هل تحتاجون مساعدة في هذه الخطوة؟'); }} style={{ fontSize: '0.8rem', padding: '0.4rem' }}>
                      💬 تفقد الفريق
                    </button>
                    <button className={styles.actionBtn} onClick={() => setSelectedTeam(t)} style={{ fontSize: '0.8rem', padding: '0.4rem' }}>
                      إدارة والمراجعة ←
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ADD STAFF MODAL (ROLES ASSIGNMENT BY SUPER ADMIN) */}
      {showAddOrganizerModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddOrganizerModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900 }}>تعيين عضو جديد في فريق الإدارة / التدريب</h2>
            <form onSubmit={handleAddStaffSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>الاسم الكامل</label>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="مثال: د. أحمد المنسق"
                  value={newStaffNameInput}
                  onChange={(e) => setNewStaffNameInput(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>البريد الإلكتروني (Google Email)</label>
                <input
                  type="email"
                  className={styles.inputField}
                  placeholder="name@gmail.com"
                  value={newStaffEmailInput}
                  onChange={(e) => setNewStaffEmailInput(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>الدور والصلاحية</label>
                <select
                  className={styles.inputField}
                  value={newStaffRoleInput}
                  onChange={(e) => setNewStaffRoleInput(e.target.value as any)}
                >
                  <option value="organizer">منظّم ومسؤول جلسات (Organizer)</option>
                  <option value="technical">مرشد تقني (Technical Mentor)</option>
                  <option value="product">مرشد منتجات (Product Mentor)</option>
                  <option value="lead">منسق رئيسي (Lead Organizer)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className={styles.actionBtn} onClick={() => setShowAddOrganizerModal(false)} style={{ width: '35%' }}>إلغاء</button>
                <button type="submit" className={`${styles.actionBtn} ${styles.primaryActionBtn}`} style={{ width: '65%' }}>اعتماد وإضافة الصلاحية ←</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMISSION REVIEW MODAL WITH PRESET FEEDBACK */}
      {selectedTeam && (
        <div className={styles.modalOverlay} onClick={() => setSelectedTeam(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className={styles.sessionTag}>إدارة الفريق والمراجعة</span>
              <button onClick={() => setSelectedTeam(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', fontWeight: 800, cursor: 'pointer' }}>✕</button>
            </div>

            <h2 style={{ fontSize: '1.6rem', fontWeight: 900 }}>{selectedTeam.name} ({selectedTeam.joinCode})</h2>

            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.5rem' }}>تسليمات الفريق الحالية</h3>
              {Object.keys(selectedTeam.submissions || {}).length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>لا توجد تسليمات حتى الآن.</p>
              ) : (
                Object.entries(selectedTeam.submissions).map(([sId, sub]) => (
                  <div key={sId} style={{ padding: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-main)', marginBottom: '0.75rem' }}>
                    <div style={{ fontWeight: 800 }}>الجلسة: {sId}</div>
                    {sub.deliverableUrl && (
                      <a href={sub.deliverableUrl} target="_blank" rel="noreferrer" style={{ display: 'block', wordBreak: 'break-all', marginTop: '0.25rem' }}>
                        {sub.deliverableUrl}
                      </a>
                    )}
                    <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: 700, color: sub.status === 'approved' ? 'var(--color-green)' : '#B45309' }}>
                      الحالة الحالية: {sub.status}
                    </div>

                    <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>قوالب ملاحظات سريعة:</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        <button className={styles.actionBtn} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} onClick={() => setReviewFeedbackInput('ممتاز، استمروا بالبناء! ✓')}>
                          + ممتاز استمروا
                        </button>
                        <button className={styles.actionBtn} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} onClick={() => setReviewFeedbackInput('الفكرة واضحة، نحتاج فقط توضيح الفئة المستهدفة الأولى.')}>
                          + توضيح المستهدف
                        </button>
                        <button className={styles.actionBtn} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} onClick={() => setReviewFeedbackInput('المخرج جيد، لكن نحتاج رابط التجربة الحي Vercel.')}>
                          + رابط التجربة الحي
                        </button>
                      </div>

                      <textarea
                        className={styles.inputField}
                        rows={2}
                        placeholder="اكتب ملاحظات وتوجيهات الفريق هنا..."
                        value={reviewFeedbackInput}
                        onChange={(e) => setReviewFeedbackInput(e.target.value)}
                      />
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className={styles.actionBtn} style={{ background: 'var(--color-green)', color: '#fff' }} onClick={() => handleReviewSubmission(selectedTeam.id, sId, 'approved')}>
                          اعتماد التسليم (Approve) ✓
                        </button>
                        <button className={styles.actionBtn} style={{ background: 'var(--color-red)', color: '#fff' }} onClick={() => handleReviewSubmission(selectedTeam.id, sId, 'changes_requested')}>
                          طلب تعديلات (Request Changes) ⚠️
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT TEAM MODAL */}
      {editingTeam && (
        <div className={styles.modalOverlay} onClick={() => setEditingTeam(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900 }}>تعديل بيانات الفريق</h2>
            <form onSubmit={handleEditTeamSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>اسم الفريق</label>
                <input
                  type="text"
                  className={styles.inputField}
                  value={editTeamNameInput}
                  onChange={(e) => setEditTeamNameInput(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>فكرة المشروع</label>
                <input
                  type="text"
                  className={styles.inputField}
                  value={editTeamIdeaInput}
                  onChange={(e) => setEditTeamIdeaInput(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>رمز الانضمام (Team Code)</label>
                <input
                  type="text"
                  className={styles.inputField}
                  value={editTeamCodeInput}
                  onChange={(e) => setEditTeamCodeInput(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className={styles.actionBtn} onClick={() => setEditingTeam(null)} style={{ width: '35%' }}>إلغاء</button>
                <button type="submit" className={`${styles.actionBtn} ${styles.primaryActionBtn}`} style={{ width: '65%' }}>حفظ التعديلات ←</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION SAFETY GUARD MODAL */}
      {confirmAction && (
        <div className={styles.modalOverlay} onClick={() => setConfirmAction(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--color-red)' }}>⚠️ {confirmAction.title}</h2>
            <p style={{ margin: '1rem 0', lineHeight: 1.4 }}>{confirmAction.message}</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className={styles.actionBtn} onClick={() => setConfirmAction(null)} style={{ width: '40%' }}>
                إلغاء
              </button>
              <button className={`${styles.actionBtn} ${styles.primaryActionBtn}`} onClick={confirmAction.action} style={{ width: '60%', background: 'var(--color-red)' }}>
                تأكيد التنفيذ ←
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHECK-IN NOTE MODAL */}
      {checkInTeam && (
        <div className={styles.modalOverlay} onClick={() => setCheckInTeam(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 900 }}>💬 تفقد فريق {checkInTeam.name}</h2>
            <form onSubmit={handleSendCheckIn} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <textarea
                className={styles.inputField}
                rows={3}
                value={checkInNoteInput}
                onChange={(e) => setCheckInNoteInput(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className={styles.actionBtn} onClick={() => setCheckInTeam(null)} style={{ width: '35%' }}>إلغاء</button>
                <button type="submit" className={`${styles.actionBtn} ${styles.primaryActionBtn}`} style={{ width: '65%' }}>إرسال التنبيه للفريق ←</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE TEAM MODAL */}
      {showCreateTeamModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateTeamModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900 }}>إنشاء فريق جديد</h2>
            <form onSubmit={handleCreateTeamSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.9rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>اسم الفريق</label>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="مثال: Pixel Founders"
                  value={newTeamNameInput}
                  onChange={(e) => setNewTeamNameInput(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ fontSize: '0.9rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>رمز الانضمام المخصص (اختياري)</label>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="مثال: Z2MVP-99"
                  value={newTeamCodeInput}
                  onChange={(e) => setNewTeamCodeInput(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className={styles.actionBtn} onClick={() => setShowCreateTeamModal(false)} style={{ width: '35%' }}>
                  إلغاء
                </button>
                <button type="submit" className={`${styles.actionBtn} ${styles.primaryActionBtn}`} style={{ width: '65%' }}>
                  إنشاء الفريق وتوليد الرمز ←
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BROADCAST ANNOUNCEMENT & IMAGE MODAL */}
      {showAnnouncementModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAnnouncementModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900 }}>بث إعلان / صورة للبروجكتر والقاعة</h2>
            <form onSubmit={handleBroadcastAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.9rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>نص الإعلان</label>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="مثال: متبقي 5 دقائق على نهاية سباق البناء الأول!"
                  value={announcementInput}
                  onChange={(e) => setAnnouncementInput(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ fontSize: '0.9rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>رابط الصورة المعروضة (Image URL)</label>
                <input
                  type="url"
                  className={styles.inputField}
                  placeholder="https://example.com/poster.jpg"
                  value={announcementImageInput}
                  onChange={(e) => setAnnouncementImageInput(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className={styles.actionBtn} onClick={() => { setAnnouncementInput(''); setAnnouncementImageInput(''); }} style={{ width: '35%' }}>
                  مسح البث الحالي
                </button>
                <button type="submit" className={`${styles.actionBtn} ${styles.primaryActionBtn}`} style={{ width: '65%' }}>
                  بث الإعلان والصورة الآن 📢
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
