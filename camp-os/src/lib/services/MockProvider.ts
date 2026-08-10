'use client';

import { DataProvider, GlobalState, Team, Task, DemoDayScore, CampStage } from './types';

// Initial Mock Data
const INITIAL_GLOBAL_STATE: GlobalState = {
  currentPhase: 'setup',
  activeDemoTeamId: null,
  announcement: null,
  timerEndTime: null,
  revealScores: false,
};

const INITIAL_TEAMS: Team[] = [
  {
    id: 'team-nova',
    name: 'Team Nova',
    projectIdea: 'AI Study Companion',
    currentStage: 'ideation',
    progressPercentage: 0,
    healthStatus: 'green',
    checkpointStatus: 'idle',
    demoDayTotalScore: 0,
  },
  {
    id: 'team-alpha',
    name: 'Team Alpha',
    projectIdea: 'Smart Health Tracker',
    currentStage: 'ideation',
    progressPercentage: 0,
    healthStatus: 'green',
    checkpointStatus: 'idle',
    demoDayTotalScore: 0,
  }
];

const STORAGE_KEY = 'camp_os_mock_db';

interface MockDB {
  globalState: GlobalState;
  teams: Team[];
  tasks: Record<string, Task[]>;
  demoScores: Record<string, DemoDayScore[]>;
}

export class MockProvider implements DataProvider {
  private globalState: GlobalState;
  private teams: Map<string, Team>;
  private tasks: Map<string, Task[]>;
  private demoScores: Map<string, DemoDayScore[]>;

  // Subscriptions
  private globalStateSubscribers: Set<(state: GlobalState) => void> = new Set();
  private teamsSubscribers: Set<(teams: Team[]) => void> = new Set();
  private teamSubscribers: Map<string, Set<(team: Team | null) => void>> = new Map();
  private tasksSubscribers: Map<string, Set<(tasks: Task[]) => void>> = new Map();
  private scoresSubscribers: Map<string, Set<(scores: DemoDayScore[]) => void>> = new Map();

  constructor() {
    this.globalState = { ...INITIAL_GLOBAL_STATE };
    this.teams = new Map(INITIAL_TEAMS.map(t => [t.id, { ...t }]));
    this.tasks = new Map();
    this.demoScores = new Map();

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
        this.teams = new Map(parsed.teams.map(t => [t.id, t]));
        this.tasks = new Map(Object.entries(parsed.tasks || {}));
        this.demoScores = new Map(Object.entries(parsed.demoScores || {}));
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
      demoScores: Object.fromEntries(this.demoScores)
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    this.notifyAll(); // Also notify local tab
  }

  private notifyAll() {
    this.notifyGlobalState();
    this.notifyTeams();
    Array.from(this.teams.keys()).forEach(id => this.notifyTeam(id));
    Array.from(this.tasks.keys()).forEach(id => this.notifyTasks(id));
    Array.from(this.demoScores.keys()).forEach(id => this.notifyScores(id));
  }

  // --- Subscriptions ---

  subscribeToGlobalState(callback: (state: GlobalState) => void): () => void {
    this.globalStateSubscribers.add(callback);
    callback({ ...this.globalState }); // Immediate flush
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

  // --- Mutations ---

  async updateGlobalState(updates: Partial<GlobalState>): Promise<void> {
    this.globalState = { ...this.globalState, ...updates };
    this.saveToStorage();
  }

  async updateTeam(teamId: string, updates: Partial<Team>): Promise<void> {
    const team = this.teams.get(teamId);
    if (team) {
      this.teams.set(teamId, { ...team, ...updates });
      this.saveToStorage();
    }
  }

  async submitTask(teamId: string, task: Partial<Task>): Promise<void> {
    if (!this.tasks.has(teamId)) this.tasks.set(teamId, []);
    
    const teamTasks = this.tasks.get(teamId)!;
    const existingIndex = teamTasks.findIndex(t => t.taskId === task.taskId);
    
    if (existingIndex >= 0) {
      teamTasks[existingIndex] = { ...teamTasks[existingIndex], ...task } as Task;
    } else {
      teamTasks.push(task as Task);
    }
    
    const team = this.teams.get(teamId);
    if (team) {
      const newProgress = Math.min(100, team.progressPercentage + 10);
      this.teams.set(teamId, { ...team, progressPercentage: newProgress });
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

  async approveCheckpoint(teamId: string, nextStage: CampStage): Promise<void> {
    const team = this.teams.get(teamId);
    if (team) {
      this.teams.set(teamId, { ...team, checkpointStatus: 'idle', currentStage: nextStage });
      this.saveToStorage();
    }
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
    this.saveToStorage();
  }

  // --- Notification Helpers ---
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
}

export const mockProvider = new MockProvider();
