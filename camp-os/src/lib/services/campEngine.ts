import { useCampContext, useGlobalState, useTeam, useTeams } from './CampContext';
import { RunOfShowPhase, MissionTemplate, PhaseType } from './types';

export const MISSIONS: Record<string, MissionTemplate> = {
  'mission_ideation': {
    id: 'mission_ideation',
    title: 'Ideation & Validation',
    description: 'Brainstorm your idea and validate it with a potential user.',
    tasks: [
      { id: 'task_brainstorm', description: 'Brainstorm 3 ideas' },
      { id: 'task_select', description: 'Select the best idea' },
      { id: 'task_validate', description: 'Validate with at least 1 person' }
    ]
  },
  'mission_build': {
    id: 'mission_build',
    title: 'Build Core MVP',
    description: 'Build the core functionality of your application.',
    tasks: [
      { id: 'task_repo', description: 'Initialize repository' },
      { id: 'task_ui', description: 'Build basic UI' },
      { id: 'task_logic', description: 'Implement core logic' }
    ]
  },
  'mission_pitch': {
    id: 'mission_pitch',
    title: 'Prepare Pitch',
    description: 'Get ready for Demo Day.',
    tasks: [
      { id: 'task_slides', description: 'Create pitch deck' },
      { id: 'task_rehearse', description: 'Rehearse 3-minute pitch' }
    ]
  }
};

export const RUN_OF_SHOW: RunOfShowPhase[] = [
  { id: 'setup', title: 'Setup', description: 'Awaiting participants', durationMinutes: 0, order: 0, type: 'normal', allowAdvance: true, projectorMode: 'standby' },
  { id: 'welcome', title: 'Welcome', description: 'Introduction to Camp', durationMinutes: 15, order: 1, type: 'normal', allowAdvance: true, projectorMode: 'intro' },
  { id: 'ideation', title: 'Ideation', description: 'Brainstorming phase', durationMinutes: 45, order: 2, missionId: 'mission_ideation', type: 'normal', allowAdvance: true, projectorMode: 'timer' },
  { id: 'build', title: 'Build MVP', description: 'Core building phase', durationMinutes: 120, order: 3, missionId: 'mission_build', type: 'normal', allowAdvance: true, projectorMode: 'timer' },
  { id: 'checkpoint', title: 'Checkpoint', description: 'Mentor Review', durationMinutes: 30, order: 4, type: 'normal', allowAdvance: true, projectorMode: 'timer' },
  { id: 'pitch_prep', title: 'Pitch Prep', description: 'Prepare for Demo Day', durationMinutes: 30, order: 5, missionId: 'mission_pitch', type: 'normal', allowAdvance: true, projectorMode: 'timer' },
  { id: 'demo_day_queue', title: 'Demo Day Queue', description: 'Teams are queued', durationMinutes: 0, order: 6, type: 'demo_day', allowAdvance: true, projectorMode: 'demo_queue' },
  { id: 'demo_day_intro', title: 'Demo Day Intro', description: 'Introducing next team', durationMinutes: 2, order: 7, type: 'demo_day', allowAdvance: true, projectorMode: 'demo_intro' },
  { id: 'demo_day_presenting', title: 'Presenting', description: 'Team is pitching', durationMinutes: 3, order: 8, type: 'demo_day', allowAdvance: true, projectorMode: 'demo_presenting' },
  { id: 'demo_day_judging', title: 'Judging', description: 'Judges are scoring', durationMinutes: 2, order: 9, type: 'demo_day', allowAdvance: true, projectorMode: 'demo_judging' },
  { id: 'demo_day_reveal', title: 'Score Reveal', description: 'Reveal the score', durationMinutes: 2, order: 10, type: 'demo_day', allowAdvance: true, projectorMode: 'demo_reveal' },
  { id: 'finished', title: 'Finished', description: 'Camp is over', durationMinutes: 0, order: 11, type: 'normal', allowAdvance: false, projectorMode: 'standby' }
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
  const timeRemainingMs = globalState.timerEndTime ? Math.max(0, globalState.timerEndTime - now) : 0;
  const timeRemainingSeconds = Math.floor(timeRemainingMs / 1000);
  
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
    timeRemainingSeconds,
    formattedTime: formatTime(timeRemainingSeconds),
    isTimerRunning: timeRemainingSeconds > 0 && !isBreak,
    userTeam: team
  };
}
