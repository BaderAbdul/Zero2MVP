'use client';

import { 
  DataProvider, GlobalState, Team, Task, DemoDayScore, 
  User, Session, TaskStatus, HelpCategory, TeamSubmission, Organizer 
} from './types';
import { DEFAULT_ZERO2MVP_SESSIONS } from './campEngine';

const INITIAL_GLOBAL_STATE: GlobalState = {
  campCode: 'Z2MVP',
  campStatus: 'welcome',
  isCampPaused: false,
  activeSessionId: DEFAULT_ZERO2MVP_SESSIONS[0].id,
  sessions: DEFAULT_ZERO2MVP_SESSIONS,
  announcement: null,
  timerEndTime: null,
  timerStartTime: null,
  timerMode: 'countdown',
  isTimerPaused: false,
};

const INITIAL_TEAMS: Team[] = [
  {
    id: 'team1',
    name: 'Pixel Founders',
    joinCode: 'Z2MVP-42',
    members: [{ id: 'p1', name: 'بدر', joinedAt: Date.now() }],
    projectIdea: 'AI Product Builder Assistant',
    currentStageId: 's_day1_welcome',
    progressPercentage: 25,
    momentumScore: 85,
    taskStatuses: {},
    completedTaskIds: [],
    submissions: {},
    helpRequests: [],
    healthStatus: 'green',
    checkpointStatus: 'idle'
  },
  {
    id: 'team2',
    name: 'Team Orbit',
    joinCode: 'Z2MVP-18',
    members: [{ id: 'p2', name: 'سارة', joinedAt: Date.now() }],
    projectIdea: 'Smart Logistics Platform',
    currentStageId: 's_day1_welcome',
    progressPercentage: 10,
    momentumScore: 50,
    taskStatuses: {},
    completedTaskIds: [],
    submissions: {},
    helpRequests: [],
    healthStatus: 'green',
    checkpointStatus: 'idle'
  }
];

const STORAGE_KEY = 'camp_os_mock_db_v5';

export class MockProvider implements DataProvider {
  private globalState: GlobalState;
  private teams: Map<string, Team>;
  private tasks: Map<string, Task[]>;
  private demoScores: Map<string, DemoDayScore[]>;

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
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        this.globalState = parsed.globalState;
        if (!this.globalState.sessions) {
          this.globalState.sessions = DEFAULT_ZERO2MVP_SESSIONS;
          this.globalState.activeSessionId = DEFAULT_ZERO2MVP_SESSIONS[0].id;
        }
        this.teams = new Map(parsed.teams.map((t: Team) => [t.id, t]));
        return;
      } catch (e) {
        console.error("Failed to parse mock DB", e);
      }
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    const db = {
      globalState: this.globalState,
      teams: Array.from(this.teams.values())
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    this.notifyAll();
  }

  private notifyAll() {
    this.notifyGlobalState();
    this.notifyTeams();
    Array.from(this.teams.keys()).forEach(id => this.notifyTeam(id));
  }

  subscribeToUsers(callback: (users: User[]) => void): () => void {
    callback([]);
    return () => {};
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

  subscribeToInterventions(teamId: string, callback: (interventions: any[]) => void): () => void {
    callback([]);
    return () => {};
  }

  async updateGlobalState(updates: Partial<GlobalState>): Promise<void> {
    this.globalState = { ...this.globalState, ...updates };
    this.saveToStorage();
  }

  async saveSessions(sessions: Session[]): Promise<void> {
    this.globalState.sessions = sessions;
    this.saveToStorage();
  }

  async saveCustomStages(stages: any[]): Promise<void> {
    await this.saveSessions(stages as Session[]);
  }

  async activateSession(sessionId: string): Promise<void> {
    const sessions = this.globalState.sessions || DEFAULT_ZERO2MVP_SESSIONS;
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      const now = Date.now();
      const durationMs = (session.durationMinutes || 30) * 60 * 1000;
      this.globalState.activeSessionId = sessionId;
      this.globalState.timerMode = session.timerMode || 'countdown';
      this.globalState.timerStartTime = now;
      this.globalState.timerEndTime = now + durationMs;
      this.globalState.isTimerPaused = false;
      this.globalState.timerPausedAt = null;
      this.globalState.timerPausedRemainingMs = durationMs;

      this.globalState.sessions = sessions.map(s => {
        if (s.id === sessionId) return { ...s, status: 'active' as const };
        if (s.order < session.order) return { ...s, status: 'completed' as const };
        return { ...s, status: 'queued' as const };
      });

      this.saveToStorage();
    }
  }

  async activateCustomStage(stageId: string): Promise<void> {
    await this.activateSession(stageId);
  }

  async pauseSession(): Promise<void> {
    const now = Date.now();
    if (this.globalState.timerMode === 'countdown' && this.globalState.timerEndTime) {
      const remaining = Math.max(0, this.globalState.timerEndTime - now);
      this.globalState.isTimerPaused = true;
      this.globalState.timerPausedRemainingMs = remaining;
    } else if (this.globalState.timerMode === 'countup') {
      this.globalState.isTimerPaused = true;
      this.globalState.timerPausedAt = now;
    }
    this.saveToStorage();
  }

  async resumeSession(): Promise<void> {
    const now = Date.now();
    if (this.globalState.timerMode === 'countdown') {
      const remaining = this.globalState.timerPausedRemainingMs || 0;
      this.globalState.isTimerPaused = false;
      this.globalState.timerEndTime = now + remaining;
      this.globalState.timerPausedRemainingMs = undefined;
    } else if (this.globalState.timerMode === 'countup') {
      const pausedAt = this.globalState.timerPausedAt || now;
      const pausedDuration = now - pausedAt;
      this.globalState.isTimerPaused = false;
      this.globalState.timerStartTime = (this.globalState.timerStartTime || now) + pausedDuration;
      this.globalState.timerPausedAt = null;
    }
    this.saveToStorage();
  }

  async pauseCamp(): Promise<void> {
    this.globalState.isCampPaused = true;
    this.globalState.campStatus = 'paused';
    this.saveToStorage();
  }

  async resumeCamp(): Promise<void> {
    this.globalState.isCampPaused = false;
    this.globalState.campStatus = 'live';
    this.saveToStorage();
  }

  async adjustTimer(minutesDelta: number): Promise<void> {
    const currentEnd = this.globalState.timerEndTime || Date.now();
    this.globalState.timerEndTime = Math.max(Date.now(), currentEnd + (minutesDelta * 60 * 1000));
    this.saveToStorage();
  }

  async createTeam(name: string, customCode?: string): Promise<Team> {
    const id = 'team-' + Math.random().toString(36).substr(2, 5);
    const joinCode = customCode || 'Z2MVP-' + Math.floor(10 + Math.random() * 90);
    const team: Team = {
      id,
      name,
      joinCode,
      members: [],
      projectIdea: 'TBD',
      currentStageId: 's_day1_welcome',
      progressPercentage: 0,
      momentumScore: 0,
      taskStatuses: {},
      completedTaskIds: [],
      submissions: {},
      helpRequests: [],
      healthStatus: 'green',
      checkpointStatus: 'idle'
    };
    this.teams.set(id, team);
    this.saveToStorage();
    return team;
  }

  async joinTeam(joinCode: string, participantName: string, participantId?: string): Promise<{ teamId: string; participantId: string }> {
    const found = Array.from(this.teams.values()).find(t => t.joinCode === joinCode);
    if (!found) {
      throw new Error("رمز الانضمام غير صحيح.");
    }
    const pid = participantId || 'p-' + Math.random().toString(36).substr(2, 5);
    if (!found.members.find(m => m.id === pid)) {
      found.members.push({ id: pid, name: participantName, joinedAt: Date.now() });
      this.teams.set(found.id, { ...found });
      this.saveToStorage();
    }
    return { teamId: found.id, participantId: pid };
  }

  async updateTeam(teamId: string, updates: Partial<Team>): Promise<void> {
    const team = this.teams.get(teamId);
    if (team) {
      this.teams.set(teamId, { ...team, ...updates });
      this.saveToStorage();
    }
  }

  async deleteTeam(teamId: string): Promise<void> {
    this.teams.delete(teamId);
    this.saveToStorage();
  }

  async updateTaskStatus(teamId: string, taskId: string, status: TaskStatus): Promise<void> {
    const team = this.teams.get(teamId);
    if (team) {
      const taskStatuses = team.taskStatuses || {};
      taskStatuses[taskId] = status;
      const completedTaskIds = Object.keys(taskStatuses).filter(id => taskStatuses[id] === 'completed');
      this.teams.set(teamId, { ...team, taskStatuses, completedTaskIds });
      this.saveToStorage();
    }
  }

  async submitTask(teamId: string, taskId: string): Promise<void> {
    await this.updateTaskStatus(teamId, taskId, 'completed');
  }

  async submitDeliverable(teamId: string, sessionId: string, deliverableUrl: string, textAnswer?: string): Promise<void> {
    const team = this.teams.get(teamId);
    if (team) {
      const submissions = team.submissions || {};
      submissions[sessionId] = {
        sessionId,
        deliverableUrl,
        textAnswer,
        status: 'submitted',
        submittedAt: Date.now()
      };
      this.teams.set(teamId, { ...team, submissions, checkpointStatus: 'pending', submittedDeliverableUrl: deliverableUrl });
      this.saveToStorage();
    }
  }

  async reviewDeliverable(teamId: string, sessionId: string, status: 'approved' | 'changes_requested', feedback?: string, reviewerName?: string): Promise<void> {
    const team = this.teams.get(teamId);
    if (team) {
      const submissions = team.submissions || {};
      const existing = submissions[sessionId] || { sessionId, submittedAt: Date.now() };
      submissions[sessionId] = {
        ...existing,
        status,
        organizerFeedback: feedback || '',
        reviewedAt: Date.now(),
        reviewerName: reviewerName || 'المنظّم'
      };
      this.teams.set(teamId, {
        ...team,
        submissions,
        checkpointStatus: status === 'approved' ? 'approved' : 'rejected',
        healthStatus: status === 'approved' ? 'green' : 'yellow'
      });
      this.saveToStorage();
    }
  }

  async submitCheckpoint(teamId: string): Promise<void> {
    const team = this.teams.get(teamId);
    if (team) {
      this.teams.set(teamId, { ...team, checkpointStatus: 'pending' });
      this.saveToStorage();
    }
  }

  async approveCheckpoint(teamId: string, nextStage: string, mentorId: string): Promise<void> {
    const team = this.teams.get(teamId);
    if (team) {
      this.teams.set(teamId, { ...team, checkpointStatus: 'approved', currentStageId: nextStage });
      this.saveToStorage();
    }
  }

  async requestHelp(teamId: string, participantName: string, category: HelpCategory, message?: string): Promise<void> {
    const team = this.teams.get(teamId);
    if (team) {
      const helpRequests = team.helpRequests || [];
      helpRequests.push({
        id: 'help-' + Math.random().toString(36).substr(2, 5),
        teamId,
        participantName,
        category,
        message,
        status: 'open',
        createdAt: Date.now()
      });
      this.teams.set(teamId, { ...team, helpRequests, healthStatus: 'red' });
      this.saveToStorage();
    }
  }

  async requestIntervention(teamId: string, participantId: string): Promise<void> {
    await this.requestHelp(teamId, participantId, 'other', 'طلب مساعدة زمني');
  }

  async claimHelp(teamId: string, helpRequestId: string, organizerName: string): Promise<void> {
    const team = this.teams.get(teamId);
    if (team) {
      const helpRequests = (team.helpRequests || []).map(h => {
        if (h.id === helpRequestId) return { ...h, status: 'claimed' as const, claimedBy: organizerName };
        return h;
      });
      this.teams.set(teamId, { ...team, helpRequests, healthStatus: 'yellow' });
      this.saveToStorage();
    }
  }

  async claimIntervention(teamId: string, interventionId: string, mentorId: string): Promise<void> {
    await this.claimHelp(teamId, interventionId, mentorId);
  }

  async resolveHelp(teamId: string, helpRequestId: string, organizerName: string): Promise<void> {
    const team = this.teams.get(teamId);
    if (team) {
      const helpRequests = (team.helpRequests || []).map(h => {
        if (h.id === helpRequestId) return { ...h, status: 'resolved' as const, resolvedAt: Date.now() };
        return h;
      });
      this.teams.set(teamId, { ...team, helpRequests, healthStatus: 'green' });
      this.saveToStorage();
    }
  }

  async resolveIntervention(teamId: string, interventionId: string, mentorId: string): Promise<void> {
    await this.resolveHelp(teamId, interventionId, mentorId);
  }

  async submitJudgeScore(score: Omit<DemoDayScore, 'id' | 'totalScore'>): Promise<void> {
    const totalScore = score.scores.problem + score.scores.product + score.scores.execution + score.scores.ai + score.scores.pitch;
    const team = this.teams.get(score.teamId);
    if (team) {
      this.teams.set(score.teamId, { ...team, momentumScore: (team.momentumScore || 0) + totalScore });
      this.saveToStorage();
    }
  }

  async seedDatabase(): Promise<void> {
    this.globalState = { ...INITIAL_GLOBAL_STATE };
    this.teams = new Map(INITIAL_TEAMS.map(t => [t.id, { ...t }]));
    this.saveToStorage();
  }

  async resetState(): Promise<void> {
    await this.seedDatabase();
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
}

export const mockProvider = new MockProvider();
