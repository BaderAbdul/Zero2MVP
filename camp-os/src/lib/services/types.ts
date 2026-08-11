export type CampPhase = 
  | 'setup'
  | 'welcome'
  | 'ideation'
  | 'build'
  | 'checkpoint'
  | 'break'
  | 'demo_day_queue'
  | 'demo_day_intro'
  | 'demo_day_presenting'
  | 'demo_day_judging'
  | 'demo_day_reveal'
  | 'finished';

export type CampStatus = 'setup' | 'waiting_room' | 'live';

export type TimerMode = 'countdown' | 'countup' | 'hidden';

export interface GlobalState {
  campStatus: CampStatus;
  currentPhase: CampPhase;
  activeDemoTeamId: string | null;
  nextDemoTeamId: string | null;
  announcement: string | null;
  timerEndTime: number | null;
  timerStartTime?: number | null;
  timerMode?: TimerMode;
  timerRoles?: UserRole[];
  customStageTitle?: string;
  customStageDesc?: string;
  customStageDuration?: number;
  revealScores: boolean;
  preBreakPhase?: CampPhase;
}

export type TeamStatus = 'green' | 'yellow' | 'red';
export type CheckpointStatus = 'idle' | 'pending' | 'approved' | 'rejected';
export type CampStage = 'ideation' | 'core_flow' | 'mvp_build';

export interface Team {
  id: string;
  name: string;
  joinCode: string;
  projectIdea: string;
  currentStage: CampStage;
  progressPercentage: number;
  healthStatus: TeamStatus;
  checkpointStatus: CheckpointStatus;
  demoDayTotalScore: number;
  completedTaskIds: string[];
}

export interface Task {
  taskId: string;
  status: 'pending' | 'completed';
  submittedWork?: string;
  completedAt?: number;
}

export interface DemoDayScore {
  id: string;
  teamId: string;
  judgeId: string;
  scores: {
    problem: number;
    product: number;
    execution: number;
    ai: number;
    pitch: number;
  };
  totalScore: number;
  notes?: string;
}

export type UserRole = 'organizer' | 'participant' | 'mentor' | 'judge' | 'projector';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  teamId?: string; // For participants
}

export interface DataProvider {
  // Subscriptions
  subscribeToGlobalState(callback: (state: GlobalState) => void): () => void;
  subscribeToUsers(callback: (users: User[]) => void): () => void;
  subscribeToTeams(callback: (teams: Team[]) => void): () => void;
  subscribeToTeam(teamId: string, callback: (team: Team | null) => void): () => void;
  subscribeToTeamTasks(teamId: string, callback: (tasks: Task[]) => void): () => void;
  subscribeToDemoScores(teamId: string, callback: (scores: DemoDayScore[]) => void): () => void;
  subscribeToInterventions(teamId: string, callback: (interventions: Intervention[]) => void): () => void;

  // Mutations
  updateGlobalState(updates: Partial<GlobalState>, actorId?: string): Promise<void>;
  updateTeam(teamId: string, updates: Partial<Team>): Promise<void>;
  submitTask(teamId: string, taskId: string): Promise<void>;
  submitCheckpoint(teamId: string): Promise<void>;
  approveCheckpoint(teamId: string, nextStage: CampStage, mentorId: string): Promise<void>;
  requestIntervention(teamId: string, participantId: string): Promise<void>;
  claimIntervention(teamId: string, interventionId: string, mentorId: string): Promise<void>;
  resolveIntervention(teamId: string, interventionId: string, mentorId: string): Promise<void>;
  submitJudgeScore(score: Omit<DemoDayScore, 'id' | 'totalScore'>): Promise<void>;
  joinTeam(joinCode: string, participantId: string): Promise<string>;
  createTeam(name: string): Promise<void>;
  deleteTeam(teamId: string): Promise<void>;
  
  // Dev Only
  resetState(): Promise<void>;
}

// ------------------------------------------------------------------
// PHASE 2: CAMP OPERATIONS ENGINE TYPES
// ------------------------------------------------------------------

export type PhaseType = 'normal' | 'break' | 'demo_day';

export interface RunOfShowPhase {
  id: string; // e.g., 'phase_1'
  title: string; // e.g., 'Ideation'
  description: string;
  durationMinutes: number;
  order: number;
  missionId?: string;
  type: PhaseType;
  allowAdvance: boolean;
  projectorMode: string;
}

export interface MissionTaskTemplate {
  id: string;
  description: string;
}

export interface MissionTemplate {
  id: string;
  title: string;
  description: string;
  tasks: MissionTaskTemplate[];
}

export interface TeamMissionChecklist {
  missionId: string;
  completedTaskIds: string[];
}

export type InterventionStatus = 'open' | 'claimed' | 'resolved';

export interface Intervention {
  id: string;
  teamId: string;
  participantId?: string;
  mentorId?: string;
  status: InterventionStatus;
  createdAt: number;
  claimedAt?: number;
  resolvedAt?: number;
}

export type AuditLogEventType = 
  | 'PHASE_STARTED' 
  | 'BREAK_STARTED' 
  | 'BREAK_ENDED' 
  | 'MISSION_COMPLETED'
  | 'CHECKPOINT_SUBMITTED' 
  | 'CHECKPOINT_APPROVED' 
  | 'INTERVENTION_REQUESTED' 
  | 'INTERVENTION_CLAIMED' 
  | 'INTERVENTION_RESOLVED' 
  | 'DEMO_TEAM_STARTED' 
  | 'SCORES_SUBMITTED' 
  | 'SCORES_REVEALED';

export interface AuditLogEvent {
  id: string;
  type: AuditLogEventType;
  timestamp: number;
  actorId?: string; // Who triggered it
  actorRole?: UserRole;
  targetId?: string; // Team ID, Phase ID, etc.
  metadata?: Record<string, any>;
}

export interface RoleAllowlistEntry {
  email: string;
  role: 'organizer' | 'mentor' | 'judge';
}
