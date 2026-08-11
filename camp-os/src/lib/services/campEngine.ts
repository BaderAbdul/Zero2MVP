import { useState, useEffect } from 'react';
import { useCampContext, useGlobalState, useTeam, useTeams } from './CampContext';
import { Session, SessionType, TaskItem, GlobalState, Team, HelpCategory } from './types';

// ==================================================================
// SESSION PRESETS (Guided Freedom: PRESET -> CUSTOMIZE -> RUN)
// ==================================================================
export const SESSION_PRESETS: Record<string, Partial<Session>> = {
  BUILD_SPRINT: {
    type: 'work',
    durationMinutes: 90,
    timerMode: 'countdown',
    requiresSubmission: true,
    requiresMentorReview: true,
    deliverableConfig: { requiresSubmission: true, requiresReview: true, type: 'link', instructions: 'ضع رابط الـ Live Prototype أو Vercel' },
    mission: {
      id: 'm_build',
      title: 'مرحلة البناء والبرمجة — Build Sprint',
      description: 'تحويل الأفكار والواجهات إلى تطبيق حي يعمل بالذكاء الاصطناعي.',
      whyItMatters: 'البناء السريع والحي هو الفارق بين مجرد فكرة وبين مشروع MVP يمكن تجدربه.',
      expectedOutcome: 'رابط حي لتطبيق يعمل ويبهر المستخدمين.',
      tasks: [
        { id: 't_b1', title: 'تجهيز بيئة العمل والمستودع', whyItMatters: 'تسريع عملية التطوير والنشر', order: 1, required: true, submissionType: 'none' },
        { id: 't_b2', title: 'بناء الواجهات والمنطق الأساسي', whyItMatters: 'تقديم قيمة فورية للمستخدم', order: 2, required: true, submissionType: 'none' },
        { id: 't_b3', title: 'نشر النسخة الأولية ورابط التجربة Live URL', whyItMatters: 'التأكد من إمكانية استخدام المشروع من أي جهاز', order: 3, required: true, submissionType: 'link' }
      ]
    }
  },
  CHECKPOINT: {
    type: 'checkpoint',
    durationMinutes: 20,
    timerMode: 'countdown',
    requiresSubmission: true,
    requiresMentorReview: true,
    deliverableConfig: { requiresSubmission: true, requiresReview: true, type: 'link', instructions: 'تسليم النموذج الأولي لمراجعة المنظمين' },
    mission: {
      id: 'm_check',
      title: 'نقطة التحقق والمراجعة — Checkpoint',
      description: 'عرض ما تم إنجازه لمراجعة المنظم والمرشد والحصول على التوجيه المباشر.',
      whyItMatters: 'اكتشاف الأخطاء مبكراً وتعديل الاتجاه قبل يوم العروض.',
      expectedOutcome: 'موافقة المنظم على الانتقال للمرحلة التالية.',
      tasks: [
        { id: 't_c1', title: 'تسليم رابط الـ MVP للمراجعة', order: 1, required: true, submissionType: 'checkpoint' }
      ]
    }
  },
  EXPERT_SESSION: {
    type: 'expert',
    durationMinutes: 30,
    timerMode: 'countdown',
    speakerName: 'خبير منتجات الذكاء الاصطناعي',
    expertTakeaway: 'ركز على ميزة واحدة رئيسية تجعل منتجك فريداً بدلاً من تشتيت الفريق.',
    deliverableConfig: { requiresSubmission: false, requiresReview: false },
    mission: {
      id: 'm_expert',
      title: 'جلسة توجيه مع الخبراء — Expert Session',
      description: 'استمع لنصائح مركزة من خبراء بناء المنتجات لتفادي الأخطاء الشائعة.',
      whyItMatters: 'التعلم من خبرات من بنوا منتجات ناجحة سابقاً.',
      tasks: [
        { id: 't_e1', title: 'تدوين الفكرة الرئيسية وتطبيقها على المشروع', order: 1, required: true, submissionType: 'none' }
      ]
    }
  },
  BREAK: {
    type: 'break',
    durationMinutes: 15,
    timerMode: 'countdown',
    deliverableConfig: { requiresSubmission: false, requiresReview: false },
    mission: {
      id: 'm_break',
      title: 'استراحة وتجديد الطاقة — Operational Break',
      description: 'خذ قسطاً من الراحة والتواصل مع الفرق الأخرى.',
      whyItMatters: 'تجديد النشاط والحفاظ على تركيز الفريق.',
      tasks: []
    }
  },
  DEMO: {
    type: 'demo',
    durationMinutes: 60,
    timerMode: 'countup',
    deliverableConfig: { requiresSubmission: false, requiresReview: false },
    mission: {
      id: 'm_demo',
      title: 'يوم العروض والتقييم — Demo Day',
      description: 'عرض المشروعات الحية أمام الحكام والجمهور وتحديد الفائزين.',
      whyItMatters: 'إثبات القدرة على البناء والتسليم خلال 3 أيام.',
      tasks: []
    }
  }
};

// ==================================================================
// OFFICIAL 3-DAY PROGRAM PRESET: FROM ZERO TO MVP
// ==================================================================
export const DEFAULT_ZERO2MVP_SESSIONS: Session[] = [
  // DAY 1: THINK (Idea Explorer -> Product Thinker)
  {
    id: 's_day1_welcome',
    title: 'الترحيب والانطلاق — Welcome & Onboarding',
    subtitle: 'مقدمة المعسكر وتشكيل الفرق',
    description: 'التعرف على رؤية From Zero to MVP وتقسيم الفرق وتحديد اسم المشروع.',
    day: 1,
    order: 1,
    type: 'work',
    durationMinutes: 20,
    timerMode: 'countdown',
    status: 'active',
    mission: {
      id: 'm_welcome',
      title: 'تأكيد الفريق واسم المشروع',
      description: 'الهدف من هذه الجلسة هو ضمان انضمام جميع الأعضاء وتحديد اسم الفريق.',
      whyItMatters: 'البداية السريعة تبني روح الفريق.',
      expectedOutcome: 'انضمام جميع الأعضاء بالرمز وتحديد اسم الفريق.',
      tasks: [
        { id: 't_w1', title: 'انضمام الأعضاء عبر رمز الفريق (Team Code)', order: 1, required: true, submissionType: 'none' },
        { id: 't_w2', title: 'تحديد اسم الفريق وصياغة الفكرة المبدئية', order: 2, required: true, submissionType: 'text' }
      ]
    }
  },
  {
    id: 's_day1_ideation',
    title: 'استكشاف الفكرة والمشكلة — Idea Explorer',
    subtitle: 'صياغة المشكلة وتحديد الحل',
    description: 'توليد الأفكار وتحديد المشكلة الحقيقية والتحقق الأولية.',
    day: 1,
    order: 2,
    type: 'work',
    durationMinutes: 45,
    timerMode: 'countdown',
    status: 'queued',
    requiresSubmission: true,
    requiresMentorReview: true,
    deliverableConfig: { requiresSubmission: true, requiresReview: true, type: 'text', instructions: 'اكتب تعريف المشكلة والحل المقترح في مربع التسليم' },
    mission: {
      id: 'm_ideation',
      title: 'صياغة تعريف المشكلة وقيمة الذكاء الاصطناعي',
      description: 'حدد المشكلة الدقيقة التي تحلها ولماذا يحتاج الحل إلى الذكاء الاصطناعي.',
      whyItMatters: 'المنتجات الناجحة تبدأ من مشكلة حقيقية وليس من مجرد تقنية.',
      expectedOutcome: 'صياغة واضحة للمشكلة والحل.',
      tasks: [
        { id: 't_i1', title: 'صياغة تعريف المشكلة (Problem Statement)', order: 1, required: true, submissionType: 'text' },
        { id: 't_i2', title: 'تحديد قيمة الذكاء الاصطناعي في الحل', order: 2, required: true, submissionType: 'text' },
        { id: 't_i3', title: 'تحديد الفئة المستهدفة الأولى (Target Users)', order: 3, required: true, submissionType: 'none' }
      ]
    }
  },
  {
    id: 's_day1_mvp_scope',
    title: 'تحديد نطاق الـ MVP — Product Thinker',
    subtitle: 'تحديد الميزات الأساسية واستبعاد التشتت',
    description: 'تقليص الفكرة إلى أصغر نسخة يمكن بناؤها وإطلاقها لتأكيد القيمة.',
    day: 1,
    order: 3,
    type: 'work',
    durationMinutes: 60,
    timerMode: 'countdown',
    status: 'queued',
    requiresSubmission: true,
    requiresMentorReview: true,
    deliverableConfig: { requiresSubmission: true, requiresReview: true, type: 'text' },
    mission: {
      id: 'm_scope',
      title: 'تحديد أصغر نطاق عملي للمنتج (MVP Scope)',
      description: 'اكتب ميزة رئيسية واحدة فقط ستقوم ببنائها، وقائمة بالأشياء التي لن تبنيها الآن.',
      whyItMatters: 'التركيز الشديد هو السر لتسليم منتج حي خلال 3 أيام.',
      expectedOutcome: 'قائمة الميزات المطلوبة وقائمة المستبعدات (NOT Building).',
      tasks: [
        { id: 't_s1', title: 'تحديد الميزة الرئيسية الأولى (Core Flow)', order: 1, required: true, submissionType: 'text' },
        { id: 't_s2', title: 'كتابة قائمة الميزات المستبعدة حالياً (NOT Building)', order: 2, required: true, submissionType: 'text' }
      ]
    }
  },

  // DAY 2: BUILD (AI Builder -> MVP Creator)
  {
    id: 's_day2_build1',
    title: 'سباق البناء الأول — AI Builder Sprint',
    subtitle: 'بناء الواجهات والمنطق البرمجي',
    description: 'البدء الفعلي في برمجة الواجهة وربط نماذج الذكاء الاصطناعي.',
    day: 2,
    order: 4,
    type: 'work',
    durationMinutes: 90,
    timerMode: 'countdown',
    status: 'queued',
    requiresSubmission: true,
    requiresMentorReview: true,
    deliverableConfig: { requiresSubmission: true, requiresReview: true, type: 'link', instructions: 'ضع رابط التجربة المباشرة Vercel / Live URL' },
    mission: {
      id: 'm_build1',
      title: 'بناء الواجهة الحية وتفعيل الذكاء الاصطناعي',
      description: 'استخدم أدوات الذكاء الاصطناعي لبناء واجهة تفاعلية تعمل وتجلب نتائج حقيقية.',
      whyItMatters: 'رؤية المشروع يعمل تمنح الفريق ثقة وزخماً عالياً.',
      expectedOutcome: 'رابط نشر حي يعمل ببيانات أو نماذج ذكاء اصطناعي.',
      tasks: [
        { id: 't_b1', title: 'إنشاء الواجهة التفاعلية الرئيسية (UI Setup)', order: 1, required: true, submissionType: 'none' },
        { id: 't_b2', title: 'ربط واجهة API الخاصة بالذكاء الاصطناعي (Gemini / AI Logic)', order: 2, required: true, submissionType: 'none' },
        { id: 't_b3', title: 'نشر المشروع وتجربة الرابط المباشر (Live URL)', order: 3, required: true, submissionType: 'link' }
      ]
    }
  },
  {
    id: 's_day2_break',
    title: 'استراحة وتجديد النشاط — Break',
    subtitle: 'تناول الوجبات والراحة',
    description: 'استراحة قصيرة للتزود بالطاقة والحديث مع الفرق الأخر.',
    day: 2,
    order: 5,
    type: 'break',
    durationMinutes: 20,
    timerMode: 'countdown',
    status: 'queued',
    mission: {
      id: 'm_break1',
      title: 'استراحة معسكر',
      description: 'الأنظمة متوقفة مؤقتاً.',
      tasks: []
    }
  },

  // DAY 3: SHIP (MVP Creator -> Founder)
  {
    id: 's_day3_pitch',
    title: 'إعداد العرض التقديمي — Pitch Mission',
    subtitle: 'تجهيز الشريحة والتجربة الحية',
    description: 'إعداد شرائح العرض وتجهيز الاستعراض الحي للمنتج خلال 3 دقائق.',
    day: 3,
    order: 6,
    type: 'work',
    durationMinutes: 45,
    timerMode: 'countdown',
    status: 'queued',
    requiresSubmission: true,
    requiresMentorReview: true,
    deliverableConfig: { requiresSubmission: true, requiresReview: true, type: 'link', instructions: 'ضع رابط شرائح العرض التقديمي (Pitch Deck)' },
    mission: {
      id: 'm_pitch',
      title: 'إعداد العرض التقديمي وتجربة الـ Live Demo',
      description: 'جهز عرضاً مدته 3 دقائق يشرح المشكلة، الحل، والمنتج الحي.',
      whyItMatters: 'العرض الرائع يعطي المنتج الحق الذي يستحقه أمام الحكام.',
      expectedOutcome: 'عرض تقديمي جاهز ورابط متصفح مفتوح للعرض.',
      tasks: [
        { id: 't_p1', title: 'تجهيز شرائح العرض التقديمي (Pitch Deck)', order: 1, required: true, submissionType: 'link' },
        { id: 't_p2', title: 'التدرب على العرض الحي والالتزام بوقت 3 دقائق', order: 2, required: true, submissionType: 'none' }
      ]
    }
  },
  {
    id: 's_day3_demo',
    title: 'يوم العروض والتقييم — Demo Day',
    subtitle: 'عرض المشاريع وتكريم الفائزين',
    description: 'عرض المشروعات أمام لجنة التحكيم وإعلان النتائج.',
    day: 3,
    order: 7,
    type: 'demo',
    durationMinutes: 60,
    timerMode: 'countup',
    status: 'queued',
    mission: {
      id: 'm_demoday',
      title: 'عرض المنتجات الحية أمام لجنة التحكيم',
      description: 'استعرض منتجك الحي بفرص متساوية واحتفل بإنجاز الفريق.',
      tasks: []
    }
  }
];

// Compatibility exports
export const DEFAULT_ZERO2MVP_STAGES = DEFAULT_ZERO2MVP_SESSIONS;
export const QUICK_ADD_PRESETS = Object.values(SESSION_PRESETS);

// ==================================================================
// HOOK: useCampEngine()
// ==================================================================
export function useCampEngine() {
  const globalState = useGlobalState();
  const { currentUser } = useCampContext();
  const team = useTeam(currentUser?.teamId);
  const teams = useTeams();

  // Manage Date.now() safely to prevent hydration mismatches and impure render errors
  const [now, setNow] = useState<number>(0);
  
  useEffect(() => {
    // We only want to tick on the client, and we initialize safely inside the effect
    const timeout = setTimeout(() => {
      setNow(Date.now());
    }, 0);
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  if (!globalState) {
    return { isLoaded: false };
  }

  // 1. Resolve Sessions
  const sessions: Session[] = (globalState.sessions && globalState.sessions.length > 0)
    ? globalState.sessions
    : DEFAULT_ZERO2MVP_SESSIONS;

  const activeSessionId = globalState.activeSessionId || sessions[0]?.id || 's_day1_welcome';
  const activeSessionIndex = sessions.findIndex(s => s.id === activeSessionId);
  const activeSession = sessions[activeSessionIndex >= 0 ? activeSessionIndex : 0] || sessions[0];
  const nextSession = activeSessionIndex >= 0 && activeSessionIndex < sessions.length - 1 
    ? sessions[activeSessionIndex + 1] 
    : null;

  const currentMission = activeSession.mission;
  const isBreak = activeSession.type === 'break' || globalState.isCampPaused;
  const isDemoDay = activeSession.type === 'demo';

  // Active Demo Team
  const activeDemoTeam = isDemoDay ? teams.find(t => t.id === globalState.activeDemoTeamId) : null;

  // 2. Timer Calculation
  const safeNow = now > 0 ? now : (globalState.timerStartTime || globalState.timerEndTime || 0);

  const timerMode = globalState.timerMode || activeSession.timerMode || 'countdown';
  const isTimerPaused = !!globalState.isTimerPaused || !!globalState.isCampPaused;

  let timeRemainingSeconds = 0;
  let timeElapsedSeconds = 0;

  if (timerMode === 'countdown') {
    if (isTimerPaused && globalState.timerPausedRemainingMs !== undefined && globalState.timerPausedRemainingMs !== null) {
      timeRemainingSeconds = Math.max(0, Math.floor(globalState.timerPausedRemainingMs / 1000));
    } else if (globalState.timerEndTime) {
      timeRemainingSeconds = Math.max(0, Math.floor((globalState.timerEndTime - safeNow) / 1000));
    }
  } else if (timerMode === 'countup') {
    if (isTimerPaused && globalState.timerPausedAt && globalState.timerStartTime) {
      timeElapsedSeconds = Math.max(0, Math.floor((globalState.timerPausedAt - globalState.timerStartTime) / 1000));
    } else if (globalState.timerStartTime) {
      timeElapsedSeconds = Math.max(0, Math.floor((safeNow - globalState.timerStartTime) / 1000));
    }
  }

  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formattedTime = timerMode === 'countup' 
    ? formatTime(timeElapsedSeconds) 
    : formatTime(timeRemainingSeconds);

  const isTimerRunning = timerMode === 'countup'
    ? !!globalState.timerStartTime && !isTimerPaused
    : timeRemainingSeconds > 0 && !isTimerPaused;

  // 3. Team Progress & Momentum Calculations
  const tasks = currentMission?.tasks || [];
  const completedTaskIds = team?.completedTaskIds || [];
  const completedCount = tasks.filter(t => completedTaskIds.includes(t.id)).length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // 4. Organizer "NEEDS ATTENTION" Queue (Surfaces problems automatically)
  const needsAttentionTeams = teams.filter(t => {
    const hasOpenHelp = t.helpRequests?.some(h => h.status === 'open');
    const isRedOrYellow = t.healthStatus === 'red' || t.healthStatus === 'yellow';
    const activeSub = t.submissions?.[activeSession.id];
    const isPendingReview = activeSub?.status === 'submitted' || activeSub?.status === 'ready_for_review' || t.checkpointStatus === 'pending';
    return hasOpenHelp || isRedOrYellow || isPendingReview;
  });

  return {
    isLoaded: true,
    globalState,
    sessions,
    stages: sessions, // Alias for legacy support
    activeStage: activeSession, // Alias for legacy support
    activeSession,
    activeSessionIndex,
    nextSession,
    activeDemoTeam,
    currentMission,
    isBreak,
    isDemoDay,
    timerMode,
    isTimerPaused,
    timeRemainingSeconds,
    timeElapsedSeconds,
    formattedTime,
    isTimerRunning,
    userTeam: team,
    tasks,
    completedCount,
    totalTasks,
    progressPercentage,
    needsAttentionTeams
  };
}
