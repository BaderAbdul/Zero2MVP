'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCampContext, useGlobalState, useTeams } from '@/lib/services/CampContext';
import styles from './welcome.module.css';

type Step = 'welcome' | 'camp_code' | 'name' | 'team_choice' | 'create_team' | 'join_team' | 'team_success';

export default function WelcomePage() {
  const router = useRouter();
  const { provider, setCurrentUser } = useCampContext();
  const globalState = useGlobalState();
  const teams = useTeams();

  const [step, setStep] = useState<Step>('welcome');
  const [campCodeInput, setCampCodeInput] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [participantId, setParticipantId] = useState('');
  
  // Team creation / joining states
  const [teamNameInput, setTeamNameInput] = useState('');
  const [teamCodeInput, setTeamCodeInput] = useState('');
  const [createdTeamCode, setCreatedTeamCode] = useState('');
  const [joinedTeamName, setJoinedTeamName] = useState('');
  const [activeTeamId, setActiveTeamId] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-resume existing team session if present
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const storedUserStr = localStorage.getItem('camp_os_session') || sessionStorage.getItem('camp_os_session');
      if (storedUserStr) {
        const session = JSON.parse(storedUserStr);
        if (session && session.teamId && session.participantId) {
          setCurrentUser({
            id: session.participantId,
            name: session.participantName || session.name || 'Participant',
            role: 'participant',
            teamId: session.teamId,
            campId: session.campId || 'Z2MVP'
          });
          router.push('/participant');
        }
      }
    } catch (e) {
      console.warn("Error restoring session:", e);
    }
  }, [router, setCurrentUser]);

  // Handle Step 1 -> Step 2
  const handleStart = () => {
    setErrorMessage(null);
    setCampCodeInput(globalState?.campCode || 'Z2MVP');
    setStep('camp_code');
  };

  // Handle Step 2 -> Step 3 (Camp Code Validation)
  const handleValidateCampCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const codeClean = campCodeInput.trim().toUpperCase();

    const validCode = (globalState?.campCode || 'Z2MVP').toUpperCase();
    if (!codeClean) {
      setErrorMessage('يرجى إدخال رمز المعسكر.');
      return;
    }

    if (codeClean !== validCode && codeClean !== 'Z2MVP') {
      setErrorMessage('رمز المعسكر غير صحيح. اسأل المنظم للحصول على الرمز الصحيح.');
      return;
    }

    setStep('name');
  };

  // Handle Step 3 -> Step 4 (Identity Creation)
  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const nameClean = participantName.trim();
    if (!nameClean) {
      setErrorMessage('يرجى إدخال اسمك.');
      return;
    }

    const pid = 'p-' + Math.random().toString(36).substr(2, 7);
    setParticipantId(pid);
    setStep('team_choice');
  };

  // Handle Create Team Action
  const handleCreateTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const tName = teamNameInput.trim();
    if (!tName) {
      setErrorMessage('يرجى إدخال اسم الفريق.');
      return;
    }

    if (teams.some(t => t.name.toLowerCase() === tName.toLowerCase())) {
      setErrorMessage('اسم الفريق مستخدم بالفعل. يرجى اختيار اسم آخر.');
      return;
    }

    setLoading(true);
    try {
      const newTeam = await provider.createTeam(tName);
      await provider.joinTeam(newTeam.joinCode, participantName, participantId);

      const userSession = {
        campId: globalState?.campCode || 'Z2MVP',
        participantId,
        participantName,
        teamId: newTeam.id,
        teamName: newTeam.name,
        joinCode: newTeam.joinCode
      };

      localStorage.setItem('camp_os_session', JSON.stringify(userSession));
      sessionStorage.setItem('camp_os_session', JSON.stringify(userSession));

      setCurrentUser({
        id: participantId,
        name: participantName,
        role: 'participant',
        teamId: newTeam.id,
        campId: globalState?.campCode || 'Z2MVP'
      });

      setCreatedTeamCode(newTeam.joinCode);
      setJoinedTeamName(newTeam.name);
      setActiveTeamId(newTeam.id);
      setStep('team_success');
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء إنشاء الفريق.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Join Team Action
  const handleJoinTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const codeClean = teamCodeInput.trim().toUpperCase();
    if (!codeClean) {
      setErrorMessage('يرجى إدخال رمز الفريق.');
      return;
    }

    setLoading(true);
    try {
      const result = await provider.joinTeam(codeClean, participantName, participantId);
      const targetTeam = teams.find(t => t.id === result.teamId || t.joinCode === codeClean);
      const teamName = targetTeam ? targetTeam.name : 'فريقك';

      const userSession = {
        campId: globalState?.campCode || 'Z2MVP',
        participantId: result.participantId || participantId,
        participantName,
        teamId: result.teamId,
        teamName,
        joinCode: codeClean
      };

      localStorage.setItem('camp_os_session', JSON.stringify(userSession));
      sessionStorage.setItem('camp_os_session', JSON.stringify(userSession));

      setCurrentUser({
        id: result.participantId || participantId,
        name: participantName,
        role: 'participant',
        teamId: result.teamId,
        campId: globalState?.campCode || 'Z2MVP'
      });

      setJoinedTeamName(teamName);
      setCreatedTeamCode(codeClean);
      setActiveTeamId(result.teamId);
      setStep('team_success');
    } catch (err: any) {
      setErrorMessage(err.message || 'رمز الفريق غير صحيح.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterWorkspace = () => {
    router.push('/participant');
  };

  const getStepNumber = () => {
    switch (step) {
      case 'welcome': return '01 / 05';
      case 'camp_code': return '02 / 05';
      case 'name': return '03 / 05';
      case 'team_choice': return '04 / 05';
      case 'create_team':
      case 'join_team':
      case 'team_success': return '05 / 05';
    }
  };

  return (
    <div className={styles.pageShell}>
      {/* Top Editorial Bar */}
      <header className={styles.topNav}>
        <div className={styles.brandLabel}>
          <span className={styles.blueDot}></span>
          <span>FROM ZERO TO MVP</span>
        </div>
        <div className={styles.subBrandLabel}>
          AI PRODUCT BUILDER CAMP
        </div>
      </header>

      {/* Main Editorial Grid Layout */}
      <main className={styles.gridCanvas}>
        {/* Right Column — Editorial Identity & Headline */}
        <section className={styles.heroColumn}>
          <div className={styles.heroTag}>
            <span>معسكر بناء منتجات الذكاء الاصطناعي</span>
          </div>

          <div className={styles.heroTitleGroup}>
            <h1 className={styles.mainTitle}>
              FROM ZERO<br />
              <span className={styles.highlightText}>TO MVP</span>
            </h1>
            <p className={styles.mainSubline}>
              من فكرة خام إلى منتج حي خلال 3 أيام.
            </p>
          </div>

          {/* Metric Blocks (Geometry as Information) */}
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <span className={styles.metricValue}>03</span>
              <span className={styles.metricLabel}>DAYS</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricValue}>01</span>
              <span className={styles.metricLabel}>TEAM</span>
            </div>
            <div className={styles.metricCard} style={{ borderRight: '4px solid var(--color-blue)' }}>
              <span className={styles.metricValue}>01</span>
              <span className={styles.metricLabel}>MVP</span>
            </div>
          </div>
        </section>

        {/* Left Column — Step Action Card */}
        <section className={styles.actionColumn}>
          <div className={styles.actionCard}>
            <div className={styles.stepHeader}>
              <span className={styles.stepCounter}>{getStepNumber()}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                {step === 'welcome' ? 'البداية' : step === 'camp_code' ? 'التحقق' : step === 'name' ? 'الهوية' : 'الفريق'}
              </span>
            </div>

            {errorMessage && (
              <div className={styles.errorBanner}>
                <span>⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* STEP 01 — WELCOME */}
            {step === 'welcome' && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <h2 className={styles.stepTitle}>مرحباً بك في المعسكر</h2>
                  <p className={styles.stepDesc}>
                    انضم لزملائك وابدأ في تحويل فكرتك إلى تطبيق يعمل ويخدم المستخدمين.
                  </p>
                </div>

                <button className={styles.primaryBtn} onClick={handleStart}>
                  <span>ابدأ الرحلة</span>
                  <span className="font-mono">←</span>
                </button>
              </>
            )}

            {/* STEP 02 — CAMP CODE */}
            {step === 'camp_code' && (
              <form onSubmit={handleValidateCampCode} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <h2 className={styles.stepTitle}>أدخل رمز المعسكر</h2>
                  <p className={styles.stepDesc}>رمز الوصول الصادر من منظمي المعسكر.</p>
                </div>

                <div className={styles.formGroup}>
                  <input
                    type="text"
                    className={`${styles.inputField} font-mono`}
                    placeholder="Z2MVP"
                    value={campCodeInput}
                    onChange={(e) => setCampCodeInput(e.target.value)}
                    autoFocus
                  />
                </div>

                <button type="submit" className={styles.primaryBtn}>
                  <span>متابعة</span>
                  <span className="font-mono">←</span>
                </button>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  لست متأكدًا من الرمز؟ اسأل المنظم.
                </p>
              </form>
            )}

            {/* STEP 03 — NAME */}
            {step === 'name' && (
              <form onSubmit={handleSaveName} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <h2 className={styles.stepTitle}>أهلًا بك. ما اسمك؟</h2>
                  <p className={styles.stepDesc}>الاسم الذي سيتعرف عليك به أعضاء فريقك والمنظمون.</p>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>الاسم الأول والأخير</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="مثال: بدر العبدالله"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    autoFocus
                  />
                </div>

                <button type="submit" className={styles.primaryBtn}>
                  <span>متابعة</span>
                  <span className="font-mono">←</span>
                </button>
              </form>
            )}

            {/* STEP 04 — TEAM CHOICE */}
            {step === 'team_choice' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <h2 className={styles.stepTitle}>أهلاً {participantName}!</h2>
                  <p className={styles.stepDesc}>أنت داخل أي فريق؟ أنشئ فريقاً جديداً أو انضم إلى فريقك.</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                  <button 
                    className={styles.primaryBtn}
                    onClick={() => { setErrorMessage(null); setStep('create_team'); }}
                  >
                    <span>أنشئ فريقك</span>
                    <span className="font-mono">+</span>
                  </button>

                  <button 
                    className={styles.secondaryBtn}
                    onClick={() => { setErrorMessage(null); setStep('join_team'); }}
                  >
                    <span>انضم إلى فريق</span>
                    <span className="font-mono">#</span>
                  </button>
                </div>
              </div>
            )}

            {/* CREATE TEAM */}
            {step === 'create_team' && (
              <form onSubmit={handleCreateTeamSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <h2 className={styles.stepTitle}>أنشئ فريقك</h2>
                  <p className={styles.stepDesc}>اختر اسماً يمثل مشروعكم ورؤيتكم.</p>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>اسم الفريق</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="مثال: Pixel Founders"
                    value={teamNameInput}
                    onChange={(e) => setTeamNameInput(e.target.value)}
                    autoFocus
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className={styles.secondaryBtn} onClick={() => setStep('team_choice')} style={{ width: '35%' }}>
                    رجوع
                  </button>
                  <button type="submit" className={styles.primaryBtn} disabled={loading} style={{ width: '65%' }}>
                    {loading ? 'جاري الإنشاء...' : 'إنشاء الفريق'}
                  </button>
                </div>
              </form>
            )}

            {/* JOIN TEAM */}
            {step === 'join_team' && (
              <form onSubmit={handleJoinTeamSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <h2 className={styles.stepTitle}>انضم إلى فريق</h2>
                  <p className={styles.stepDesc}>أدخل رمز الفريق المقدم لك من زميلك أو المنظم.</p>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>رمز الفريق (Team Code)</label>
                  <input
                    type="text"
                    className={`${styles.inputField} font-mono`}
                    placeholder="Z2MVP-42"
                    value={teamCodeInput}
                    onChange={(e) => setTeamCodeInput(e.target.value)}
                    autoFocus
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className={styles.secondaryBtn} onClick={() => setStep('team_choice')} style={{ width: '35%' }}>
                    رجوع
                  </button>
                  <button type="submit" className={styles.primaryBtn} disabled={loading} style={{ width: '65%' }}>
                    {loading ? 'جاري الانضمام...' : 'الانضمام للفريق'}
                  </button>
                </div>
              </form>
            )}

            {/* SUCCESS */}
            {step === 'team_success' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <div style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: '#DCFCE7', color: 'var(--color-green)', fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    ✓ اكتمل الإعداد
                  </div>
                  <h2 className={styles.stepTitle}>انضممت إلى: {joinedTeamName}</h2>
                </div>

                <div className={styles.successBox}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>رمز الانضمام لفريقك:</span>
                  <span className={styles.successCode}>{createdTeamCode}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>شارك هذا الرمز مع أعضاء فريقك ليدخلوا معكم</span>
                </div>

                <button className={styles.primaryBtn} onClick={handleEnterWorkspace}>
                  <span>الدخول إلى مساحة الفريق</span>
                  <span className="font-mono">←</span>
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer Line */}
      <footer className={styles.footerBar}>
        <span>FROM ZERO TO MVP © 2026</span>
        <span className="font-mono">BUILDER SYSTEM 5.0</span>
      </footer>
    </div>
  );
}
