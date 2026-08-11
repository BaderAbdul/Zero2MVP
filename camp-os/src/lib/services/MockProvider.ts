'use client';

import { DataProvider, GlobalState, Team, Task, DemoDayScore, CampStage, Intervention, User, CustomStage } from './types';
import { DEFAULT_ZERO2MVP_STAGES } from './campEngine';

// Initial Mock Data
const INITIAL_GLOBAL_STATE: GlobalState = {
  currentPhase: 'setup',
  campStatus: 'setup',
  activeDemoTeamId: null,
  nextDemoTeamId: null,
  announcement: null,
  timerEndTime: null,
  timerStartTime: null,
  timerMode: 'countdown',
  isTimerPaused: false,
  customStages: DEFAULT_ZERO2MVP_STAGES,
  activeCustomStageId: DEFAULT_ZERO2MVP_STAGES[0].id,
  revealScores: false,
};

const INITIAL_TEAMS: Team[] = [
  {
    id: 'team1',
    name: 'Alpha Squad',
    joinCode: 'ALPHA1',
    projectIdea: 'AI-driven task manager',
    currentStage: 'ideation',
    progressPercentage: 20,
    healthStatus: 'green',
    checkpointStatus: 'idle',
    demoDayTotalScore: 0,
    completedTaskIds: []
  },
  {
    id: 'team2',
    name: 'Beta Builders',
    joinCode: 'BETA22',
    projectIdea: 'Sustainable delivery platform',
    currentStage: 'ideation',
    progressPercentage: 10,
    healthStatus: 'green',
    checkpointStatus: 'idle',
    demoDayTotalScore: 0,
    completedTaskIds: []
  }
];

const STORAGE_KEY = 'camp_os_mock_db';

interface MockDB {
  globalState: GlobalState;
  teams: Team[];
  tasks: Record<string, Task[]>;
  demoScores: Record<string, DemoDayScore[]>;
  interventions: Record<string, Intervention[]>;
}

export class MockProvider implements DataProvider {
  private globalState: GlobalState;
  private teams: Map<string, Team>;
  private tasks: Map<string, Task[]>;
  private demoScores: Map<string, DemoDayScore[]>;
  private interventions: Map<string, Intervention[]>;

  private globalStateSubscribers: Set<(state: GlobalState) => void> = new Set();
  private teamsSubscribers: Set<(teams: Team[]) => void> = new Set();
  private teamSubscribers: Map<string, Set<(team: Team | null) => void>> = new Map();
  private tasksSubscribers: Map<string, Set<(tasks: Task[]) => void>> = new Map();
  private scoresSubscribers: Map<string, Set<(scores: DemoDayScore[]) => void>> = new Map();
  private interventionsSubscribers: Map<string, Set<(interventions: Intervention[]) => void>> = new Map();

  constructor() {
    this.globalState = { ...INITIAL_GLOBAL_STATE };
    this.teams = new Map(INITIAL_TEAMS.map(t => [t.id, { ...t }]));
    this.tasks = new Map();
    this.demoScores = new Map();
    this.interventions = new Map();

    this.loadFromStorage();

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
          this.loadFromStorage();
          this.notifyAll();
        }
      });
    }
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        const parsed = JSON.parse(data) as MockDB;
        this.globalState = parsed.globalState;
        if (!this.globalState.customStages) {
          this.globalState.customStages = DEFAULT_ZERO2MVP_STAGES;
          this.globalState.activeCustomStageId = DEFAULT_ZERO2MVP_STAGES[0].id;
        }
        this.teams = new Map(parsed.teams.map(t => [t.id, t]));
        this.tasks = new Map(Object.entries(parsed.tasks || {}));
        this.demoScores = new Map(Object.entries(parsed.demoScores || {}));
        this.interventions = new Map(Object.entries(parsed.interventions || {}));
        return;
      } catch (e) {
        console.error("Failed to parse mock DB", e);
      }
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    const db: MockDB = {
      globalState: this.globalState,
      teams: Array.from(this.teams.values()),
      tasks: Object.fromEntries(this.tasks),
      demoScores: Object.fromEntries(this.demoScores),
      interventions: Object.fromEntries(this.interventions)
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    this.notifyAll();
  }

  private notifyAll() {
    this.notifyGlobalState();
    this.notifyTeams();
    Array.from(this.teams.keys()).forEach(id => this.notifyTeam(id));
    Array.from(this.tasks.keys()).forEach(id => this.notifyTasks(id));
    Array.from(this.demoScores.keys()).forEach(id => this.notifyScores(id));
    Array.from(this.interventions.keys()).forEach(id => this.notifyInterventions(id));
  }

  subscribeToUsers(callback: (users: User[]) => void): () => void {
    callback([]);
    return () => {};
  }

  async joinTeam(joinCode: string, userId: string): Promise<string> {
    return "team1";
  }

  async createTeam(name: string): Promise<void> {
    const id = 'team-' + Math.random().toString(36).substr(2, 5);
    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.teams.set(id, {
      id,
      name,
      joinCode,
      projectIdea: 'TBD',
      currentStage: 'ideation',
      progressPercentage: 0,
      healthStatus: 'green',
      checkpointStatus: 'idle',
      demoDayTotalScore: 0,
      completedTaskIds: []
    });
    this.saveToStorage();
  }

  async deleteTeam(teamId: string): Promise<void> {
    this.teams.delete(teamId);
    this.saveToStorage();
  }

  subscribeToGlobalState(callback: (state: GlobalState) => void): () => void {
    this.globalStateSubscribers.add(callback);
    callback({ ...this.globalState });
    return () => this.globalStateSubscribers.delete(callback);
  }

  subscribeToTeams(callback: (teams: Team[]) => void): () => void {
    this.teamsSubscribers.add(callback);
    callback(Array.from(this.teams.values()));
    return () => this.teamsSubscribers.delete(callback);
  }

  subscribeToTeam(teamId: string, callback: (team: Team | null) => void): () => void {
    if (!this.teamSubscribers.has(teamId)) {
      this.teamSubscribers.set(teamId, new Set());
    }
    this.teamSubscribers.get(teamId)!.add(callback);
    callback(this.teams.get(teamId) || null);
    return () => this.teamSubscribers.get(teamId)!.delete(callback);
  }

  subscribeToTeamTasks(teamId: string, callback: (tasks: Task[]) => void): () => void {
    if (!this.tasksSubscribers.has(teamId)) {
      this.tasksSubscribers.set(teamId, new Set());
    }
    this.tasksSubscribers.get(teamId)!.add(callback);
    callback(this.tasks.get(teamId) || []);
    return () => this.tasksSubscribers.get(teamId)!.delete(callback);
  }

  subscribeToDemoScores(teamId: string, callback: (scores: DemoDayScore[]) => void): () => void {
    if (!this.scoresSubscribers.has(teamId)) {
      this.scoresSubscribers.set(teamId, new Set());
    }
    this.scoresSubscribers.get(teamId)!.add(callback);
    callback(this.demoScores.get(teamId) || []);
    return () => this.scoresSubscribers.get(teamId)!.delete(callback);
  }

  subscribeToInterventions(teamId: string, callback: (interventions: Intervention[]) => void): () => void {
    if (!this.interventionsSubscribers.has(teamId)) {
      this.interventionsSubscribers.set(teamId, new Set());
    }
    this.interventionsSubscribers.get(teamId)!.add(callback);
    callback(this.interventions.get(teamId) || []);
    return () => this.interventionsSubscribers.get(teamId)!.delete(callback);
  }

  async updateGlobalState(updates: Partial<GlobalState>): Promise<void> {
    this.globalState = { ...this.globalState, ...updates };
    this.saveToStorage();
  }

  async saveCustomStages(stages: CustomStage[]): Promise<void> {
    this.globalState.customStages = stages;
    this.saveToStorage();
  }

  async activateCustomStage(stageId: string): Promise<void> {
    const stages = this.globalState.customStages || DEFAULT_ZERO2MVP_STAGES;
    const stage = stages.find(s => s.id === stageId);
    if (stage) {
      const now = Date.now();
      const durationMs = (stage.durationMinutes || 30) * 60 * 1000;
      this.globalState.activeCustomStageId = stageId;
      this.globalState.timerMode = stage.timerMode || 'countdown';
      this.globalState.timerStartTime = now;
      this.globalState.timerEndTime = now + durationMs;
      this.globalState.isTimerPaused = false;
      this.globalState.timerPausedAt = null;
      this.globalState.timerPausedRemainingMs = durationMs;
      this.saveToStorage();
    }
  }

  async updateTeam(teamId: string, updates: Partial<Team>): Promise<void> {
    const team = this.teams.get(teamId);
    if (team) {
      this.teams.set(teamId, { ...team, ...updates });
      this.saveToStorage();
    }
  }

  async submitTask(teamId: string, taskId: string): Promise<void> {
    const team = this.teams.get(teamId);
    if (team) {
      const completed = team.completedTaskIds || [];
      if (!completed.includes(taskId)) {
        completed.push(taskId);
      }
      this.teams.set(teamId, { ...team, completedTaskIds: completed });
    }
    this.saveToStorage();
  }

  async submitCheckpoint(teamId: string): Promise<void> {
    const team = this.teams.get(teamId);
    if (team) {
      this.teams.set(teamId, { ...team, checkpointStatus: 'pending' });
      this.saveToStorage();
    }
  }

  async approveCheckpoint(teamId: string, nextStage: CampStage, mentorId: string): Promise<void> {
    const team = this.teams.get(teamId);
    if (team) {
      this.teams.set(teamId, { ...team, checkpointStatus: 'approved', currentStage: nextStage });
      this.saveToStorage();
    }
  }

  async requestIntervention(teamId: string, participantId: string): Promise<void> {
    if (!this.interventions.has(teamId)) this.interventions.set(teamId, []);
    const teamInts = this.interventions.get(teamId)!;
    teamInts.push({
      id: Math.random().toString(36).substr(2, 9),
      teamId,
      participantId,
      status: 'open',
      createdAt: Date.now()
    });
    const team = this.teams.get(teamId);
    if (team) {
      this.teams.set(teamId, { ...team, healthStatus: 'red' });
    }
    this.saveToStorage();
  }

  async claimIntervention(teamId: string, interventionId: string, mentorId: string): Promise<void> {
    const teamInts = this.interventions.get(teamId);
    if (teamInts) {
      const int = teamInts.find(i => i.id === interventionId);
      if (int) {
        int.status = 'claimed';
        int.mentorId = mentorId;
        int.claimedAt = Date.now();
      }
    }
    const team = this.teams.get(teamId);
    if (team) {
      this.teams.set(teamId, { ...team, healthStatus: 'yellow' });
    }
    this.saveToStorage();
  }

  async resolveIntervention(teamId: string, interventionId: string, mentorId: string): Promise<void> {
    const teamInts = this.interventions.get(teamId);
    if (teamInts) {
      const int = teamInts.find(i => i.id === interventionId);
      if (int) {
        int.status = 'resolved';
        int.resolvedAt = Date.now();
      }
    }
    const team = this.teams.get(teamId);
    if (team) {
      this.teams.set(teamId, { ...team, healthStatus: 'green' });
    }
    this.saveToStorage();
  }

  async submitJudgeScore(score: Omit<DemoDayScore, 'id' | 'totalScore'>): Promise<void> {
    if (!this.demoScores.has(score.teamId)) {
      this.demoScores.set(score.teamId, []);
    }
    const teamScores = this.demoScores.get(score.teamId)!;
    const totalScore = score.scores.problem + score.scores.product + score.scores.execution + score.scores.ai + score.scores.pitch;
    const newScore: DemoDayScore = {
      ...score,
      id: Math.random().toString(36).substr(2, 9),
      totalScore
    };
    teamScores.push(newScore);

    const team = this.teams.get(score.teamId);
    if (team) {
      const newTotal = teamScores.reduce((sum, s) => sum + s.totalScore, 0);
      this.teams.set(score.teamId, { ...team, demoDayTotalScore: newTotal });
    }
    this.saveToStorage();
  }

  async resetState(): Promise<void> {
    this.globalState = { ...INITIAL_GLOBAL_STATE };
    this.teams = new Map(INITIAL_TEAMS.map(t => [t.id, { ...t }]));
    this.tasks = new Map();
    this.demoScores = new Map();
    this.interventions = new Map();
    this.saveToStorage();
  }

  private notifyGlobalState() {
    const s = { ...this.globalState };
    this.globalStateSubscribers.forEach(cb => cb(s));
  }
  private notifyTeams() {
    const ts = Array.from(this.teams.values());
    this.teamsSubscribers.forEach(cb => cb(ts));
  }
  private notifyTeam(teamId: string) {
    const t = this.teams.get(teamId) || null;
    this.teamSubscribers.get(teamId)?.forEach(cb => cb(t));
  }
  private notifyTasks(teamId: string) {
    const t = this.tasks.get(teamId) || [];
    this.tasksSubscribers.get(teamId)?.forEach(cb => cb(t));
  }
  private notifyScores(teamId: string) {
    const s = this.demoScores.get(teamId) || [];
    this.scoresSubscribers.get(teamId)?.forEach(cb => cb(s));
  }
  private notifyInterventions(teamId: string) {
    const i = this.interventions.get(teamId) || [];
    this.interventionsSubscribers.get(teamId)?.forEach(cb => cb(i));
  }
}

export const mockProvider = new MockProvider();
