'use client';

import React, { useState, useEffect } from 'react';
import { useCampContext } from '@/lib/services/CampContext';
import { useCampEngine } from '@/lib/services/campEngine';
import { TaskItem, HelpCategory } from '@/lib/services/types';
import styles from './participant.module.css';

export default function SharedTeamWorkspace() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const int = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(int);
  }, []);

  const { provider, currentUser, setCurrentUser } = useCampContext();
  const { 
    isLoaded, globalState, activeSession, activeSessionIndex, sessions,
    userTeam: team, tasks, completedCount, totalTasks, progressPercentage
  } = useCampEngine();

  // Task detail modal state
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [taskAnswerInput, setTaskAnswerInput] = useState('');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // Deliverable modal / input
  const [deliverableInput, setDeliverableInput] = useState('');
  const [isSubmittingDeliverable, setIsSubmittingDeliverable] = useState(false);

  // Help request modal state
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpCategory, setHelpCategory] = useState<HelpCategory>('product');
  const [helpMessage, setHelpMessage] = useState('');
  const [isSendingHelp, setIsSendingHelp] = useState(false);

  const [copiedCode, setCopiedCode] = useState(false);

  // Restore stored session if currentUser is not hydrated yet
  useEffect(() => {
    if (!currentUser && typeof window !== 'undefined') {
      try {
        const storedStr = localStorage.getItem('camp_os_session') || sessionStorage.getItem('camp_os_session');
        if (storedStr) {
          const session = JSON.parse(storedStr);
          if (session && session.participantId) {
            setCurrentUser({
              id: session.participantId,
              name: session.participantName || session.name || 'Participant',
              role: 'participant',
              teamId: session.teamId,
              campId: session.campId || 'Z2MVP'
            });
          }
        }
      } catch (e) {
        console.warn('Session restore failed:', e);
      }
    }
  }, [currentUser, setCurrentUser]);

  if (!currentUser) {
    return (
      <div className={styles.container} style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h2>لم يتم التعرف على الجلسة الحالية.</h2>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>يرجى الدخول من الشاشة الرئيسية لبدء معسكر From Zero to MVP.</p>
        <a href="/" className={styles.primaryBtn} style={{ maxWidth: 280, margin: '2rem auto 0 auto', textDecoration: 'none' }}>
          العودة للشاشة الرئيسية ←
        </a>
      </div>
    );
  }

  if (!isLoaded || !globalState) {
    return (
      <div className={styles.container} style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>جاري تحميل مساحة عمل الفريق...</div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className={styles.container} style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div style={{ background: 'var(--bg-surface)', border: '2px solid var(--border-main)', padding: '2.5rem', maxWidth: 480, margin: '0 auto' }}>
          <h2>الانضمام للفريق</h2>
          <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>أدخل رمز الانضمام المقدم لك من فريقك.</p>
          <a href="/" className={styles.primaryBtn} style={{ marginTop: '1.5rem', textDecoration: 'none' }}>
            الذهاب لصفحة الانضمام ←
          </a>
        </div>
      </div>
    );
  }

  const activeSubmission = team.submissions?.[activeSession?.id || ''];
  const organizerCheckInNote = (team.submissions as any)?.organizerNote;
  const activeHelp = team.helpRequests?.find(h => h.status !== 'resolved');

  const copyTeamCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(team.joinCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    setIsSubmittingTask(true);
    try {
      await provider.updateTaskStatus(team.id, selectedTask.id, 'completed');
      setSelectedTask(null);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleDeliverableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    setIsSubmittingDeliverable(true);
    try {
      await provider.submitDeliverable(team.id, activeSession.id, deliverableInput.trim());
      setDeliverableInput('');
    } finally {
      setIsSubmittingDeliverable(false);
    }
  };

  const handleSendHelpRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingHelp(true);
    try {
      await provider.requestHelp(team.id, currentUser.name, helpCategory, helpMessage.trim());
      setShowHelpModal(false);
      setHelpMessage('');
    } finally {
      setIsSendingHelp(false);
    }
  };

  const journeyMilestones = [
    { key: 'IDEA', label: '1. الاستكشاف', day: 1 },
    { key: 'DEFINE', label: '2. التحديد', day: 1 },
    { key: 'BUILD', label: '3. البناء', day: 2 },
    { key: 'SHIP', label: '4. الإطلاق', day: 3 },
    { key: 'PITCH', label: '5. العرض', day: 3 }
  ];

  return (
    <div className={styles.container}>
      {/* GLOBAL ANNOUNCEMENT BANNER */}
      {globalState.announcement && (
        <div className={styles.announcementBanner}>
          <span>📢 إعلان المعسكر:</span>
          <span>{globalState.announcement}</span>
        </div>
      )}

      {/* TOP AREA — TEAM HEADER */}
      <header className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div>
            <span className={styles.brandLabel}>FROM ZERO TO MVP · OUR PROJECT</span>
            <div className={styles.teamTitleRow} style={{ marginTop: '0.25rem' }}>
              <h1 className={styles.teamName}>{team.name}</h1>
              <div className={styles.joinCodeBadge}>
                <span>{team.joinCode}</span>
                <button className={styles.copyCodeBtn} onClick={copyTeamCode}>
                  {copiedCode ? 'تم النسخ ✓' : 'نسخ الرمز'}
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              اليوم {activeSession?.day || 1} · {activeSession?.subtitle || 'مرحلة البناء والتفكير'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>تقدم الفريق:</span>
              <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 800, color: 'var(--color-blue)' }}>{progressPercentage}%</span>
            </div>
          </div>
        </div>

        {/* VISUAL PROGRESS JOURNEY (NO GAMER UI) */}
        <div className={styles.journeyBar}>
          {journeyMilestones.map((m, idx) => {
            const isCurrent = activeSessionIndex === idx || (idx === 0 && activeSessionIndex < 0);
            const isPast = activeSessionIndex > idx;
            return (
              <div key={m.key} className={styles.journeyStep}>
                <div className={`${styles.stepDot} ${isPast ? styles.stepDotDone : isCurrent ? styles.stepDotActive : ''}`}>
                  {isPast ? '✓' : idx + 1}
                </div>
                <span className={`${styles.stepLabel} ${isCurrent ? styles.stepLabelActive : ''}`}>
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
      </header>

      {/* MAIN MISSION CARD — DOMINATES THE SCREEN */}
      <main className={styles.mainCard}>
        <div className={styles.missionHeader}>
          <span className={styles.stageTag}>
            SESSION 0{activeSession?.order || 1} · DAY {activeSession?.day || 1}
          </span>
          <h2 className={styles.missionTitle}>
            {activeSession?.mission?.title || activeSession?.title || 'مهمة الفريق الحالية'}
          </h2>
          <p className={styles.missionDesc}>
            {activeSession?.mission?.description || activeSession?.description || 'قم بإكمال جميع المهام المطلوبة للانتقال للمرحلة القادمة.'}
          </p>
        </div>

        {/* WHY IT MATTERS BOX */}
        {activeSession?.mission?.whyItMatters && (
          <div className={styles.whyItMattersBox}>
            <span className={styles.whyTitle}>💡 لماذا تهمنا هذه الخطوة؟</span>
            <span className={styles.whyText}>{activeSession.mission.whyItMatters}</span>
          </div>
        )}

        {/* ORGANIZER CHECK-IN NOTE */}
        {organizerCheckInNote && (
          <div style={{ padding: '1rem', background: '#EFF6FF', border: '2px solid var(--color-blue)', marginBottom: '1.25rem' }}>
            <span style={{ fontWeight: 800, color: 'var(--color-blue)', fontSize: '0.9rem' }}>📩 رسالة وتفقد من المنظم:</span>
            <p style={{ marginTop: '0.25rem', fontWeight: 600, color: 'var(--text-main)' }}>"{organizerCheckInNote}"</p>
          </div>
        )}

        {/* ORGANIZER FEEDBACK / NOTE (IF REQUESTED CHANGES) */}
        {activeSubmission && activeSubmission.status === 'changes_requested' && (
          <div className={styles.organizerNoteCard}>
            <div className={styles.organizerNoteTitle}>
              <span>⚠️ ملاحظات وتوجيهات المنظم</span>
            </div>
            <p className={styles.organizerNoteContent}>
              "{activeSubmission.organizerFeedback || 'يرجى مراجعة وتحديث المخرجات وإعادة التسليم للمراجعة.'}"
            </p>
          </div>
        )}

        {/* DONE WHEN EXPECTED OUTCOME */}
        {activeSession?.mission?.expectedOutcome && (
          <div style={{ padding: '0.85rem 1.25rem', background: '#DCFCE7', border: '1.5px solid var(--color-green)', marginBottom: '1.25rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-green)' }}>
            ✓ متى نعتبر أنجزنا؟ (DONE WHEN): {activeSession.mission.expectedOutcome}
          </div>
        )}

        {/* TASKS CHECKLIST SECTION */}
        <section className={styles.tasksSection}>
          <div className={styles.sectionHeading}>
            <span>المهام المطلوبة ({completedCount} من {totalTasks} مكتملة)</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>اضغط على المهمة لعرض التفاصيل وتحديث الإجابة</span>
          </div>

          <div className={styles.taskGrid}>
            {tasks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>لا توجد مهام محددة لهذه الجلسة.</p>
            ) : (
              tasks.map((t, index) => {
                const isDone = team.completedTaskIds?.includes(t.id);
                const isNeedsChanges = activeSubmission?.status === 'changes_requested';
                return (
                  <div 
                    key={t.id} 
                    className={`${styles.taskCard} ${isDone ? styles.taskCardDone : ''}`}
                    onClick={() => setSelectedTask(t)}
                  >
                    <div className={styles.taskLeft}>
                      <span className={styles.taskNumber}>0{index + 1}</span>
                      <span className={styles.taskTitle}>{t.title}</span>
                    </div>

                    <div>
                      {isDone ? (
                        <span className={`${styles.taskStatusBadge} ${styles.badgeDone}`}>مكتملة ✓</span>
                      ) : isNeedsChanges ? (
                        <span className={`${styles.taskStatusBadge} ${styles.badgeNeedsChanges}`}>تطلب تعديل ⚠️</span>
                      ) : (
                        <span className={`${styles.taskStatusBadge} ${styles.badgeNotStarted}`}>قيد التنفيذ</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* SUBMISSION ZONE */}
        {activeSession?.deliverableConfig?.requiresSubmission && (
          <div style={{ marginTop: '1rem', padding: '1.5rem', background: 'var(--bg-secondary)', border: '2px solid var(--border-main)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              تسليم مخرج الجلسة (Deliverable)
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              {activeSession.deliverableConfig.instructions || 'ضع رابط المشروع النهائي أو العرض المباشر للمراجعة.'}
            </p>

            {activeSubmission?.status === 'submitted' ? (
              <div style={{ padding: '1rem', background: '#FEF3C7', border: '1px solid var(--color-yellow)', color: '#92400E', fontWeight: 700 }}>
                ⏳ تم التسليم بنجاح — بانتظار مراجعة المنظم (Under Review)
              </div>
            ) : activeSubmission?.status === 'approved' ? (
              <div style={{ padding: '1rem', background: '#DCFCE7', border: '1px solid var(--color-green)', color: 'var(--color-green)', fontWeight: 800 }}>
                ✅ تم اعتماد التسليم وموافقة المنظم (Approved)
              </div>
            ) : (
              <form onSubmit={handleDeliverableSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  type="url"
                  placeholder="https://your-mvp-demo.vercel.app"
                  className={styles.inputField}
                  value={deliverableInput}
                  onChange={(e) => setDeliverableInput(e.target.value)}
                />
                <button type="submit" className={styles.primaryBtn} disabled={isSubmittingDeliverable} style={{ width: 'auto', whiteSpace: 'nowrap' }}>
                  {isSubmittingDeliverable ? 'جاري الإرسال...' : 'إرسال للمراجعة ←'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ACTION FOOTER ROW — HELP BUTTON */}
        <div className={styles.actionFooterRow}>
          <button 
            className={styles.helpBtn} 
            onClick={() => setShowHelpModal(true)}
          >
            <span>🚨 نحتاج مساعدة المنظم</span>
          </button>

          {activeHelp && (
            <div style={{ padding: '0.75rem 1rem', background: '#FFFBEB', border: '1.5px solid var(--color-yellow)', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📢 حالة الطلب:</span>
              <span style={{ color: 'var(--color-blue)' }}>
                {activeHelp.status === 'open' ? 'بانتظار استلام المنظم' : `المنظم (${activeHelp.claimedBy || 'المنظم'}) في طريقه إليكم`}
              </span>
            </div>
          )}
        </div>
      </main>

      {/* TEAM ROSTER & PRODUCT INFO AREA */}
      <section className={styles.teamProjectGrid}>
        <div className={styles.sideCard}>
          <h3 className={styles.sideCardTitle}>فريقنا ({team.members?.length || 1})</h3>
          <div className={styles.memberList}>
            {team.members?.map(m => (
              <div key={m.id} className={styles.memberItem}>
                <span className={styles.memberDot}></span>
                <span>{m.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.sideCard}>
          <h3 className={styles.sideCardTitle}>مشروعنا (OUR PRODUCT)</h3>
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>فكرة المشروع:</span>
            <p style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.25rem' }}>
              {team.projectIdea || 'لم تحدد الفكرة بشكل كامل بعد.'}
            </p>
          </div>
          {team.submittedDeliverableUrl && (
            <div style={{ marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>رابط المنتَج الحي:</span>
              <a href={team.submittedDeliverableUrl} target="_blank" rel="noreferrer" style={{ display: 'block', wordBreak: 'break-all', fontWeight: 700, marginTop: '0.25rem' }}>
                {team.submittedDeliverableUrl}
              </a>
            </div>
          )}
        </div>
      </section>

      {/* TASK DETAIL MODAL */}
      {selectedTask && (
        <div className={styles.modalOverlay} onClick={() => setSelectedTask(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className={styles.stageTag}>TASK DETAIL</span>
              <button onClick={() => setSelectedTask(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', fontWeight: 800, cursor: 'pointer' }}>✕</button>
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{selectedTask.title}</h2>

            {selectedTask.whyItMatters && (
              <div className={styles.whyItMattersBox}>
                <span className={styles.whyTitle}>لماذا تهم هذه المهمة؟</span>
                <span className={styles.whyText}>{selectedTask.whyItMatters}</span>
              </div>
            )}

            <form onSubmit={handleTaskSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {selectedTask.submissionType === 'text' && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>إجابة المهمة</label>
                  <textarea
                    className={styles.inputField}
                    rows={4}
                    placeholder="اكتب إجابتك أو مخرجات المهمة هنا..."
                    value={taskAnswerInput}
                    onChange={(e) => setTaskAnswerInput(e.target.value)}
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setSelectedTask(null)} style={{ width: '35%' }}>
                  إغلاق
                </button>
                <button type="submit" className={styles.primaryBtn} disabled={isSubmittingTask} style={{ width: '65%' }}>
                  {isSubmittingTask ? 'جاري الحفظ...' : 'اعتماد وتأكيد الإنجاز ✓'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HELP REQUEST MODAL */}
      {showHelpModal && (
        <div className={styles.modalOverlay} onClick={() => setShowHelpModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className={styles.stageTag} style={{ color: 'var(--color-red)' }}>طلب مساعدة المنظم</span>
              <button onClick={() => setShowHelpModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', fontWeight: 800, cursor: 'pointer' }}>✕</button>
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>ما نوع المساعدة التي تحتاجونها؟</h2>

            <form onSubmit={handleSendHelpRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>تصنيف المشكلة</label>
                <select 
                  className={styles.inputField}
                  value={helpCategory}
                  onChange={(e) => setHelpCategory(e.target.value as HelpCategory)}
                >
                  <option value="product">منتج وتحديد النطاق (Product)</option>
                  <option value="technical">تطوير وبرمجة (Technical)</option>
                  <option value="idea">فكرة وتأطير (Idea)</option>
                  <option value="team">تنسيق الفريق (Team)</option>
                  <option value="other">أخرى (Other)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>تفاصيل مختصرة (اختياري)</label>
                <textarea
                  className={styles.inputField}
                  rows={3}
                  placeholder="اشرح بشكل مختصر أين تقفون وما الذي يعطلكم..."
                  value={helpMessage}
                  onChange={(e) => setHelpMessage(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setShowHelpModal(false)} style={{ width: '35%' }}>
                  إلغاء
                </button>
                <button type="submit" className={styles.primaryBtn} disabled={isSendingHelp} style={{ width: '65%', background: 'var(--color-red)' }}>
                  {isSendingHelp ? 'جاري الإرسال...' : 'إرسال طلب المساعدة 🚨'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
