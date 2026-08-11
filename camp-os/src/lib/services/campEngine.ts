import { useCampContext, useGlobalState, useTeam, useTeams } from './CampContext';
import { CustomStage, CustomTask, GlobalState, Team, RunOfShowPhase, MissionTemplate } from './types';

export const RUN_OF_SHOW: RunOfShowPhase[] = [
  { id: 'setup', title: 'الإعداد — Setup', description: 'في انتظار المشاركين', durationMinutes: 0, order: 0, type: 'normal', allowAdvance: true, projectorMode: 'standby' },
  { id: 'welcome', title: 'الترحيب — Welcome', description: 'مقدمة المعسكر', durationMinutes: 15, order: 1, type: 'normal', allowAdvance: true, projectorMode: 'intro' },
  { id: 'ideation', title: 'توليد الأفكار — Ideation', description: 'مرحلة توليد الأفكار', durationMinutes: 45, order: 2, missionId: 'mission_ideation', type: 'normal', allowAdvance: true, projectorMode: 'timer' },
  { id: 'build', title: 'بناء الـ MVP — Build MVP', description: 'مرحلة البناء الأساسية', durationMinutes: 120, order: 3, missionId: 'mission_build', type: 'normal', allowAdvance: true, projectorMode: 'timer' },
  { id: 'checkpoint', title: 'نقطة التحقق — Checkpoint', description: 'مراجعة المرشد (Mentor)', durationMinutes: 30, order: 4, type: 'normal', allowAdvance: true, projectorMode: 'timer' },
  { id: 'pitch_prep', title: 'تجهيز العرض — Pitch Prep', description: 'الاستعداد ليوم العروض', durationMinutes: 30, order: 5, missionId: 'mission_pitch', type: 'normal', allowAdvance: true, projectorMode: 'timer' },
  { id: 'demo_day_queue', title: 'يوم العروض — Demo Day', description: 'اصطفاف الفرق', durationMinutes: 0, order: 6, type: 'demo_day', allowAdvance: true, projectorMode: 'demo_queue' },
  { id: 'demo_day_intro', title: 'مقدمة العرض — Intro', description: 'تقديم الفريق التالي', durationMinutes: 2, order: 7, type: 'demo_day', allowAdvance: true, projectorMode: 'demo_intro' },
  { id: 'demo_day_presenting', title: 'العرض — Presenting', description: 'الفريق يعرض مشروعه', durationMinutes: 3, order: 8, type: 'demo_day', allowAdvance: true, projectorMode: 'demo_presenting' },
  { id: 'demo_day_judging', title: 'التحكيم — Judging', description: 'المحكّمون يقيّمون', durationMinutes: 2, order: 9, type: 'demo_day', allowAdvance: true, projectorMode: 'demo_judging' },
  { id: 'demo_day_reveal', title: 'كشف النتيجة — Reveal Score', description: 'إظهار النتيجة', durationMinutes: 2, order: 10, type: 'demo_day', allowAdvance: true, projectorMode: 'demo_reveal' },
  { id: 'finished', title: 'النهاية — Finished', description: 'انتهى المعسكر', durationMinutes: 0, order: 11, type: 'normal', allowAdvance: false, projectorMode: 'standby' }
];

export const MISSIONS: Record<string, MissionTemplate> = {
  'mission_ideation': {
    id: 'mission_ideation',
    title: 'توليد الأفكار — Ideation',
    description: 'اصنع فكرتك واختبرها مع مستخدم محتمل.',
    tasks: [
      { id: 'task_brainstorm', description: 'توليد 3 أفكار' },
      { id: 'task_select', description: 'اختيار الفكرة الأفضل' },
      { id: 'task_validate', description: 'التحقق من الفكرة مع شخص واحد على الأقل' }
    ]
  },
  'mission_build': {
    id: 'mission_build',
    title: 'بناء الـ MVP — Build MVP',
    description: 'بناء الخصائص الأساسية لمشروعك.',
    tasks: [
      { id: 'task_repo', description: 'تجهيز المستودع (Repository)' },
      { id: 'task_ui', description: 'بناء واجهة المستخدم (UI)' },
      { id: 'task_logic', description: 'برمجة المنطق الأساسي' }
    ]
  },
  'mission_pitch': {
    id: 'mission_pitch',
    title: 'تجهيز العرض — Pitch Prep',
    description: 'الاستعداد لـ Demo Day.',
    tasks: [
      { id: 'task_slides', description: 'تجهيز العرض التقديمي' },
      { id: 'task_rehearse', description: 'التدرب على عرض مدته 3 دقائق' }
    ]
  }
};

export const QUICK_ADD_PRESETS: Partial<CustomStage>[] = [
  {
    title: 'مرحلة بناء — Build Sprint',
    description: 'مرحلة بناء مركزة للتركيز على تطوير الـ MVP واختبار الخصائص.',
    durationMinutes: 90,
    type: 'work',
    timerMode: 'countdown',
    requiresSubmission: true,
    requiresMentorReview: false,
    tasks: [
      { id: 't_b1', title: 'تجهيز بيئة العمل والمستودع', required: true, order: 1, type: 'task' },
      { id: 't_b2', title: 'بناء الواجهات والمنطق الأساسي', required: true, order: 2, type: 'task' },
      { id: 't_b3', title: 'رفع الرابط المباشر للتجربة', required: true, order: 3, type: 'upload', requiresSubmission: true }
    ]
  },
  {
    title: 'نقطة مراجعة — Checkpoint',
    description: 'مراجعة وتقييم سريعة مع المرشدين للتحقق من الاتجاه.',
    durationMinutes: 20,
    type: 'work',
    timerMode: 'countdown',
    requiresSubmission: true,
    requiresMentorReview: true,
    tasks: [
      { id: 't_c1', title: 'تسليم المسودة الأولية ومراجعة المرشد', required: true, order: 1, type: 'checkpoint', requiresSubmission: true }
    ]
  },
  {
    title: 'جلسة توجيه — Expert Session',
    description: 'عرض إرشادي أو ورشة عمل سريعة مع الخبراء.',
    durationMinutes: 30,
    type: 'custom',
    timerMode: 'countdown',
    requiresSubmission: false,
    tasks: []
  },
  {
    title: 'استراحة — Break',
    description: 'استراحة قصيرة للتزود بالطاقة والراحة.',
    durationMinutes: 15,
    type: 'break',
    timerMode: 'countdown',
    requiresSubmission: false,
    tasks: []
  },
  {
    title: 'يوم العروض — Demo Day',
    description: 'عرض المشاريع أمام لجنة التحكيم وتقييم الفرق.',
    durationMinutes: 60,
    type: 'demo',
    timerMode: 'countup',
    requiresSubmission: false,
    projectorMode: 'demo_queue',
    tasks: []
  }
];

export const DEFAULT_ZERO2MVP_STAGES: CustomStage[] = [
  {
    id: 'stage_welcome',
    title: '01 / الترحيب والانطلاق — Welcome & Onboarding',
    description: 'التعرف على مسار المعسكر ورؤية From Zero to MVP وتقسيم الفرق.',
    order: 1,
    day: 1,
    type: 'work',
    durationMinutes: 20,
    timerMode: 'countdown',
    requiresSubmission: false,
    tasks: [
      { id: 'task_w1', title: 'الانضمام للفريق عبر رمز الدخول', required: true, order: 1, type: 'task' },
      { id: 'task_w2', title: 'تحديد اسم الفريق وقائد المشروع', required: true, order: 2, type: 'task' }
    ]
  },
  {
    id: 'stage_ideation',
    title: '02 / استكشاف الفكرة — Idea Explorer',
    description: 'توليد الفكرة وتحديد المشكلة الحقيقية والتحقق الأولية.',
    order: 2,
    day: 1,
    type: 'work',
    durationMinutes: 45,
    timerMode: 'countdown',
    requiresSubmission: true,
    requiresMentorReview: true,
    tasks: [
      { id: 'task_i1', title: 'صياغة تعريف المشكلة (Problem Statement)', required: true, order: 1, type: 'text' },
      { id: 'task_i2', title: 'تحديد الحل المقترح وقيمة الذكاء الاصطناعي', required: true, order: 2, type: 'text' },
      { id: 'task_i3', title: 'التحقق مع مستخدم محتمل واحد على الأقل', required: true, order: 3, type: 'checkpoint', requiresSubmission: true }
    ]
  },
  {
    id: 'stage_build_sprint_1',
    title: '03 / بناء الـ MVP — AI Builder Sprint',
    description: 'بناء الميزات الأساسية للمشروع وتصميم واجهة المستخدم الحية.',
    order: 3,
    day: 2,
    type: 'work',
    durationMinutes: 90,
    timerMode: 'countdown',
    requiresSubmission: true,
    requiresMentorReview: true,
    tasks: [
      { id: 'task_b1', title: 'إنشاء واجهة المستخدم الرئيسية (UI Setup)', required: true, order: 1, type: 'task' },
      { id: 'task_b2', title: 'ربط خدمات الذكاء الاصطناعي والمنطق البرمجي', required: true, order: 2, type: 'task' },
      { id: 'task_b3', title: 'نشر النسخة الأولية ورابط التجربة Live URL', required: true, order: 3, type: 'link', requiresSubmission: true }
    ]
  },
  {
    id: 'stage_break',
    title: '04 / استراحة وتنشيط — Operational Break',
    description: 'استراحة وتجديد الطاقة.',
    order: 4,
    day: 2,
    type: 'break',
    durationMinutes: 15,
    timerMode: 'countdown',
    requiresSubmission: false,
    tasks: []
  },
  {
    id: 'stage_pitch_prep',
    title: '05 / تجهيز العرض — Pitch & Demo Prep',
    description: 'إعداد الشرائح والتأكد من عمل العرض المباشر.',
    order: 5,
    day: 3,
    type: 'work',
    durationMinutes: 30,
    timerMode: 'countdown',
    requiresSubmission: true,
    tasks: [
      { id: 'task_p1', title: 'تجهيز العرض التقديمي (Pitch Deck)', required: true, order: 1, type: 'link', requiresSubmission: true },
      { id: 'task_p2', title: 'تجربة العرض الحي خلال 3 دقائق', required: true, order: 2, type: 'task' }
    ]
  },
  {
    id: 'stage_demo_day',
    title: '06 / يوم العروض والتقييم — Demo Day',
    description: 'عرض المشاريع أمام الحكام وتحديد الفائزين.',
    order: 6,
    day: 3,
    type: 'demo',
    durationMinutes: 60,
    timerMode: 'countup',
    requiresSubmission: false,
    projectorMode: 'demo_queue',
    tasks: []
  }
];

export function useCampEngine() {
  const globalState = useGlobalState();
  const { currentUser } = useCampContext();
  const team = useTeam(currentUser?.teamId);
  const teams = useTeams();

  if (!globalState) {
    return {
      isLoaded: false,
    };
  }

  // 1. Stages & Active Stage Dynamic Resolution
  const stages: CustomStage[] = (globalState.customStages && globalState.customStages.length > 0)
    ? globalState.customStages
    : DEFAULT_ZERO2MVP_STAGES;

  const activeStageId = globalState.activeCustomStageId || stages[0]?.id || 'stage_welcome';
  const activeStage = stages.find(s => s.id === activeStageId) || stages[0];

  const isBreak = activeStage.type === 'break' || globalState.currentPhase === 'break';
  const isDemoDay = activeStage.type === 'demo';

  // Legacy fallback support for older views
  const effectivePhaseId = isBreak ? (globalState.preBreakPhase || 'setup') : globalState.currentPhase;
  const currentRoSPhase = RUN_OF_SHOW.find(p => p.id === effectivePhaseId) || RUN_OF_SHOW[0];
  const currentMission = currentRoSPhase.missionId ? (MISSIONS[currentRoSPhase.missionId] || null) : null;

  // 2. Demo Queue Logic
  const activeDemoTeam = isDemoDay ? teams.find(t => t.id === globalState.activeDemoTeamId) : null;
  let nextDemoTeam: Team | null = null;
  if (isDemoDay && activeDemoTeam) {
    const activeIdx = teams.findIndex(t => t.id === activeDemoTeam.id);
    if (activeIdx >= 0 && activeIdx < teams.length - 1) {
      nextDemoTeam = teams[activeIdx + 1];
    }
  } else if (isDemoDay && !activeDemoTeam && teams.length > 0) {
    nextDemoTeam = teams[0];
  }

  // 3. Timer Logic (Sync across clients, no drift)
  const now = Date.now();
  const timerMode = globalState.timerMode || activeStage.timerMode || 'countdown';
  const isTimerPaused = !!globalState.isTimerPaused;

  let timeRemainingSeconds = 0;
  let timeElapsedSeconds = 0;

  if (timerMode === 'countdown') {
    if (isTimerPaused && globalState.timerPausedRemainingMs !== undefined) {
      timeRemainingSeconds = Math.max(0, Math.floor(globalState.timerPausedRemainingMs / 1000));
    } else if (globalState.timerEndTime) {
      timeRemainingSeconds = Math.max(0, Math.floor((globalState.timerEndTime - now) / 1000));
    }
  } else if (timerMode === 'countup') {
    if (isTimerPaused && globalState.timerPausedAt && globalState.timerStartTime) {
      timeElapsedSeconds = Math.max(0, Math.floor((globalState.timerPausedAt - globalState.timerStartTime) / 1000));
    } else if (globalState.timerStartTime) {
      timeElapsedSeconds = Math.max(0, Math.floor((now - globalState.timerStartTime) / 1000));
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

  // 4. Task Progress calculation
  const tasks: CustomTask[] = activeStage.tasks || [];
  const completedTaskIds = team?.completedTaskIds || [];
  const completedCount = tasks.filter(t => completedTaskIds.includes(t.id)).length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return {
    isLoaded: true,
    globalState,
    stages,
    activeStage,
    currentRoSPhase,
    currentMission,
    isBreak,
    isDemoDay,
    activeDemoTeam,
    nextDemoTeam,
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
    progressPercentage
  };
}
