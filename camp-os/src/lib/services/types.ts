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

export interface GlobalState {
  currentPhase: CampPhase;
  activeDemoTeamId: string | null;
  announcement: string | null;
  timerEndTime: number | null;
  revealScores: boolean;
}

export type TeamStatus = 'green' | 'yellow' | 'red';
export type CheckpointStatus = 'idle' | 'pending' | 'approved' | 'rejected';
export type CampStage = 'ideation' | 'core_flow' | 'mvp_build';

export interface Team {
  id: string;
  name: string;
  projectIdea: string;
  currentStage: CampStage;
  progressPercentage: number;
  healthStatus: TeamStatus;
  checkpointStatus: CheckpointStatus;
  demoDayTotalScore: number;
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
  subscribeToTeams(callback: (teams: Team[]) => void): () => void;
  subscribeToTeam(teamId: string, callback: (team: Team | null) => void): () => void;
  subscribeToTeamTasks(teamId: string, callback: (tasks: Task[]) => void): () => void;
  subscribeToDemoScores(teamId: string, callback: (scores: DemoDayScore[]) => void): () => void;

  // Mutations
  updateGlobalState(updates: Partial<GlobalState>): Promise<void>;
  updateTeam(teamId: string, updates: Partial<Team>): Promise<void>;
  submitTask(teamId: string, task: Partial<Task>): Promise<void>;
  submitCheckpoint(teamId: string): Promise<void>;
  approveCheckpoint(teamId: string, nextStage: CampStage): Promise<void>;
  submitJudgeScore(score: Omit<DemoDayScore, 'id' | 'totalScore'>): Promise<void>;
  
  // Dev Only
  resetState(): Promise<void>;
}
