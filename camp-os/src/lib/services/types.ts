// ==================================================================
// CAMP OS 5.0 — CANONICAL DATA MODEL & CONTRACTS
// FROM ZERO TO MVP (3-DAY AI PRODUCT BUILDER CAMP)
// ==================================================================

export type UserRole = 'organizer' | 'participant' | 'mentor' | 'judge' | 'projector';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  teamId?: string;
  campId?: string;
  email?: string;
}

export interface Organizer {
  id: string;
  name: string;
  role: 'lead' | 'product' | 'technical' | 'organizer';
  status: 'active' | 'offline';
  email?: string;
}

export type SessionType = 'work' | 'break' | 'expert' | 'checkpoint' | 'demo' | 'custom';
export type SessionStatus = 'queued' | 'active' | 'paused' | 'completed' | 'skipped';
export type TimerMode = 'countdown' | 'countup' | 'hidden';

export type TaskSubmissionType = 'none' | 'text' | 'link' | 'upload' | 'checkpoint';
export type TaskStatus = 'not_started' | 'in_progress' | 'completed';

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  whyItMatters?: string;
  instructions?: string;
  optionalResourceUrl?: string;
  required?: boolean;
  order: number;
  type?: 'task' | 'checkpoint' | 'upload' | 'text' | 'link';
  submissionType?: TaskSubmissionType;
  requiresSubmission?: boolean;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  whyItMatters?: string;
  expectedOutcome?: string;
  tasks: TaskItem[];
  successCriteria?: string[];
}

export interface DeliverableConfig {
  requiresSubmission: boolean;
  requiresReview: boolean;
  type?: 'text' | 'link' | 'upload';
  instructions?: string;
}

export interface Session {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  day: 1 | 2 | 3;
  order: number;
  type: SessionType;
  durationMinutes: number;
  timerMode: TimerMode;
  status?: SessionStatus;
  mission?: Mission;
  deliverableConfig?: DeliverableConfig;
  speakerName?: string;
  expertTakeaway?: string;
  tasks?: TaskItem[]; // Backwards compatibility helper
  requiresSubmission?: boolean;
  requiresMentorReview?: boolean;
}

export type SubmissionStatus = 
  | 'not_started' 
  | 'in_progress' 
  | 'ready_for_review' 
  | 'submitted' 
  | 'approved' 
  | 'changes_requested';

export interface TeamSubmission {
  sessionId: string;
  deliverableUrl?: string;
  textAnswer?: string;
  status: SubmissionStatus;
  organizerFeedback?: string;
  submittedAt: number;
  reviewedAt?: number;
  reviewerName?: string;
}

export type HelpCategory = 'product' | 'technical' | 'idea' | 'team' | 'other';
export type HelpStatus = 'open' | 'claimed' | 'resolved';

export interface HelpRequest {
  id: string;
  teamId: string;
  participantName: string;
  category: HelpCategory;
  message?: string;
  status: HelpStatus;
  createdAt: number;
  claimedBy?: string;
  resolvedAt?: number;
}

export interface TeamMember {
  id: string;
  name: string;
  joinedAt: number;
}

export interface Team {
  id: string;
  name: string;
  joinCode: string;
  members: TeamMember[];
  projectIdea: string;
  currentStageId: string;
  progressPercentage: number;
  momentumScore: number;
  taskStatuses: Record<string, TaskStatus>;
  completedTaskIds: string[]; // Legacy & flat helper
  submissions: Record<string, TeamSubmission>;
  helpRequests: HelpRequest[];
  healthStatus: 'green' | 'yellow' | 'red'; // Needs Attention signal
  checkpointStatus: 'idle' | 'pending' | 'approved' | 'rejected';
  submittedDeliverableUrl?: string;
  currentStage?: string;
  demoDayTotalScore?: number;
}

export interface GlobalState {
  campCode: string;
  campStatus: 'welcome' | 'live' | 'paused' | 'completed' | 'setup' | 'waiting_room';
  isCampPaused: boolean;
  activeSessionId: string;
  sessions: Session[];
  announcement: string | null;
  announcementImageUrl?: string | null;
  timerMode: TimerMode;
  timerStartTime: number | null;
  timerEndTime: number | null;
  isTimerPaused: boolean;
  timerPausedAt?: number | null;
  timerPausedRemainingMs?: number;
  activeDemoTeamId?: string | null;
  nextDemoTeamId?: string | null;
  revealScores?: boolean;
  
  // Legacy / derived fields for backwards compatibility
  currentPhase?: any;
  customStages?: any[];
  activeCustomStageId?: string;
  customStageTitle?: string;
  customStageDesc?: string;
  customStageDuration?: number;
  timerRoles?: UserRole[];
  preBreakPhase?: any;
}

// Legacy helpers
export type CustomStage = Session;
export type CustomTask = TaskItem;

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

export type AuditLogEventType = 
  | 'PHASE_STARTED' 
  | 'STAGE_ACTIVATED'
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

export interface DataProvider {
  // Subscriptions
  subscribeToGlobalState(callback: (state: GlobalState) => void): () => void;
  subscribeToUsers(callback: (users: User[]) => void): () => void;
  subscribeToTeams(callback: (teams: Team[]) => void): () => void;
  subscribeToTeam(teamId: string, callback: (team: Team | null) => void): () => void;
  subscribeToTeamTasks(teamId: string, callback: (tasks: Task[]) => void): () => void;
  subscribeToDemoScores(teamId: string, callback: (scores: DemoDayScore[]) => void): () => void;
  subscribeToInterventions(teamId: string, callback: (interventions: any[]) => void): () => void;
  subscribeToOrganizers?(callback: (organizers: Organizer[]) => void): () => void;

  // Global & Session Operations
  updateGlobalState(updates: Partial<GlobalState>, actorId?: string): Promise<void>;
  saveSessions(sessions: Session[]): Promise<void>;
  saveCustomStages(stages: any[]): Promise<void>;
  activateSession(sessionId: string): Promise<void>;
  activateCustomStage(stageId: string): Promise<void>;
  pauseSession(): Promise<void>;
  resumeSession(): Promise<void>;
  pauseCamp(): Promise<void>;
  resumeCamp(): Promise<void>;
  adjustTimer(minutesDelta: number): Promise<void>;

  // Team & Participant Operations
  createTeam(name: string, customCode?: string): Promise<Team>;
  joinTeam(joinCode: string, participantName: string, participantId?: string): Promise<any>;
  updateTeam(teamId: string, updates: Partial<Team>): Promise<void>;
  deleteTeam(teamId: string): Promise<void>;

  // Task & Deliverable Operations
  updateTaskStatus(teamId: string, taskId: string, status: TaskStatus): Promise<void>;
  submitTask(teamId: string, taskId: string): Promise<void>;
  submitDeliverable(teamId: string, sessionId: string, deliverableUrl: string, textAnswer?: string): Promise<void>;
  reviewDeliverable(teamId: string, sessionId: string, status: 'approved' | 'changes_requested', feedback?: string, reviewerName?: string): Promise<void>;
  submitCheckpoint(teamId: string): Promise<void>;
  approveCheckpoint(teamId: string, nextStage: string, mentorId: string): Promise<void>;
  submitJudgeScore(score: Omit<DemoDayScore, 'id' | 'totalScore'>): Promise<void>;

  // Help Requests (Needs Attention)
  requestHelp(teamId: string, participantName: string, category: HelpCategory, message?: string): Promise<void>;
  requestIntervention(teamId: string, participantId: string): Promise<void>;
  claimHelp(teamId: string, helpRequestId: string, organizerName: string): Promise<void>;
  claimIntervention(teamId: string, interventionId: string, mentorId: string): Promise<void>;
  resolveHelp(teamId: string, helpRequestId: string, organizerName: string): Promise<void>;
  resolveIntervention(teamId: string, interventionId: string, mentorId: string): Promise<void>;

  // Organizers Management
  addOrganizer?(name: string, role: Organizer['role'], email?: string): Promise<void>;
  removeOrganizer?(organizerId: string): Promise<void>;

  // Seed / Reset
  seedDatabase(): Promise<void>;
  resetState(): Promise<void>;
}
