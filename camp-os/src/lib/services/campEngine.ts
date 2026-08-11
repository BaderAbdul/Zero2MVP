import { useCampContext, useGlobalState, useTeam, useTeams } from './CampContext';
import { RunOfShowPhase, MissionTemplate, PhaseType } from './types';

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

  // 1. Phase state
  const isBreak = globalState.currentPhase === 'break';
  const effectivePhaseId = isBreak ? (globalState.preBreakPhase || 'setup') : globalState.currentPhase;
  const currentRoSPhase = RUN_OF_SHOW.find(p => p.id === effectivePhaseId) || RUN_OF_SHOW[0];
  
  // 2. Demo Queue logic
  const isDemoDay = currentRoSPhase.type === 'demo_day';
  const activeDemoTeam = isDemoDay ? teams.find(t => t.id === globalState.activeDemoTeamId) : null;
  
  let nextDemoTeam = null;
  if (isDemoDay && activeDemoTeam) {
    // Determine next team based on order (mock logic for now, assumes teams array order is queue)
    const activeIdx = teams.findIndex(t => t.id === activeDemoTeam.id);
    if (activeIdx >= 0 && activeIdx < teams.length - 1) {
      nextDemoTeam = teams[activeIdx + 1];
    }
  } else if (isDemoDay && !activeDemoTeam && teams.length > 0) {
    nextDemoTeam = teams[0];
  }

  // 3. Timer status
  const now = Date.now();
  const timerMode = globalState.timerMode || 'countdown';
  const timeRemainingMs = globalState.timerEndTime ? Math.max(0, globalState.timerEndTime - now) : 0;
  const timeRemainingSeconds = Math.floor(timeRemainingMs / 1000);
  
  const timeElapsedMs = globalState.timerStartTime ? Math.max(0, now - globalState.timerStartTime) : 0;
  const timeElapsedSeconds = Math.floor(timeElapsedMs / 1000);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 4. Mission state (for participant)
  let currentMission: MissionTemplate | null = null;
  if (currentRoSPhase.missionId) {
    currentMission = MISSIONS[currentRoSPhase.missionId] || null;
  }

  return {
    isLoaded: true,
    globalState,
    currentRoSPhase,
    isBreak,
    isDemoDay,
    activeDemoTeam,
    nextDemoTeam,
    currentMission,
    timerMode,
    timeRemainingSeconds,
    timeElapsedSeconds,
    formattedTime: formatTime(timerMode === 'countup' ? timeElapsedSeconds : timeRemainingSeconds),
    isTimerRunning: timerMode === 'countup' ? !!globalState.timerStartTime && !isBreak : timeRemainingSeconds > 0 && !isBreak,
    userTeam: team
  };
}
