import { 
  collection, doc, getDoc, setDoc, updateDoc, onSnapshot, 
  query, where, addDoc, getDocs, runTransaction, deleteDoc, arrayUnion
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  DataProvider, GlobalState, Team, Task, DemoDayScore, 
  AuditLogEventType, User, Session, TaskStatus, 
  HelpCategory, TeamSubmission, Organizer 
} from './types';
import { DEFAULT_ZERO2MVP_SESSIONS } from './campEngine';

export class FirebaseProvider implements DataProvider {
  subscribeToGlobalState(callback: (state: GlobalState) => void): () => void {
    const unsub = onSnapshot(doc(db, 'camp_os', 'global_state'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as GlobalState;
        if (!data.sessions || data.sessions.length === 0) {
          data.sessions = DEFAULT_ZERO2MVP_SESSIONS;
        }
        if (!data.activeSessionId && data.sessions.length > 0) {
          data.activeSessionId = data.sessions[0].id;
        }
        callback(data);
      } else {
        callback({
          campCode: 'Z2MVP',
          campStatus: 'welcome',
          isCampPaused: false,
          activeSessionId: DEFAULT_ZERO2MVP_SESSIONS[0].id,
          sessions: DEFAULT_ZERO2MVP_SESSIONS,
          announcement: null,
          timerEndTime: null,
          timerStartTime: null,
          timerMode: 'countdown',
          isTimerPaused: false
        } as GlobalState);
      }
    });
    return unsub;
  }

  subscribeToUsers(callback: (users: User[]) => void): () => void {
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as User);
      callback(users);
    });
    return unsub;
  }

  subscribeToTeams(callback: (teams: Team[]) => void): () => void {
    const unsub = onSnapshot(collection(db, 'teams'), (snapshot) => {
      const teams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Team);
      callback(teams);
    });
    return unsub;
  }

  subscribeToTeam(teamId: string, callback: (team: Team | null) => void): () => void {
    const unsub = onSnapshot(doc(db, 'teams', teamId), (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() } as Team);
      } else {
        callback(null);
      }
    });
    return unsub;
  }

  subscribeToTeamTasks(teamId: string, callback: (tasks: Task[]) => void): () => void {
    const q = query(collection(db, `teams/${teamId}/tasks`));
    const unsub = onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => doc.data() as Task);
      callback(tasks);
    });
    return unsub;
  }

  subscribeToDemoScores(teamId: string, callback: (scores: DemoDayScore[]) => void): () => void {
    const q = query(collection(db, 'demo_scores'), where('teamId', '==', teamId));
    const unsub = onSnapshot(q, (snapshot) => {
      const scores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as DemoDayScore);
      callback(scores);
    });
    return unsub;
  }

  subscribeToInterventions(teamId: string, callback: (interventions: any[]) => void): () => void {
    const q = query(collection(db, `teams/${teamId}/interventions`));
    const unsub = onSnapshot(q, (snapshot) => {
      const ints = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(ints);
    });
    return unsub;
  }

  async logAudit(type: AuditLogEventType, actorId?: string, actorRole?: string, targetId?: string, metadata?: any): Promise<void> {
    try {
      await addDoc(collection(db, 'camp_logs'), {
        type,
        actorId: actorId || 'system',
        actorRole: actorRole || 'system',
        targetId: targetId || null,
        metadata: metadata || {},
        timestamp: Date.now()
      });
    } catch (e: any) {
      console.warn('Audit log failed:', e.message);
    }
  }

  async updateGlobalState(updates: Partial<GlobalState>, actorId?: string): Promise<void> {
    const ref = doc(db, 'camp_os', 'global_state');
    await updateDoc(ref, updates);
  }

  async saveSessions(sessions: Session[]): Promise<void> {
    const ref = doc(db, 'camp_os', 'global_state');
    await updateDoc(ref, { sessions });
  }

  async saveCustomStages(stages: any[]): Promise<void> {
    await this.saveSessions(stages as Session[]);
  }

  async activateSession(sessionId: string): Promise<void> {
    const ref = doc(db, 'camp_os', 'global_state');
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const data = snap.data() as GlobalState;
    const sessions = data.sessions || DEFAULT_ZERO2MVP_SESSIONS;
    const targetSession = sessions.find(s => s.id === sessionId);

    if (!targetSession) return;

    const now = Date.now();
    const durationMs = (targetSession.durationMinutes || 30) * 60 * 1000;

    const updatedSessions = sessions.map(s => {
      if (s.id === sessionId) return { ...s, status: 'active' as const };
      if (s.order < targetSession.order) return { ...s, status: 'completed' as const };
      return { ...s, status: 'queued' as const };
    });

    await updateDoc(ref, {
      sessions: updatedSessions,
      activeSessionId: sessionId,
      timerMode: targetSession.timerMode || 'countdown',
      timerStartTime: now,
      timerEndTime: now + durationMs,
      isTimerPaused: false,
      timerPausedAt: null,
      timerPausedRemainingMs: durationMs
    });

    await this.logAudit('STAGE_ACTIVATED', undefined, 'organizer', sessionId, { title: targetSession.title });
  }

  async activateCustomStage(stageId: string): Promise<void> {
    await this.activateSession(stageId);
  }

  async pauseSession(): Promise<void> {
    const ref = doc(db, 'camp_os', 'global_state');
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data() as GlobalState;
    const now = Date.now();

    if (data.timerMode === 'countdown' && data.timerEndTime) {
      const remaining = Math.max(0, data.timerEndTime - now);
      await updateDoc(ref, { isTimerPaused: true, timerPausedRemainingMs: remaining });
    } else if (data.timerMode === 'countup') {
      await updateDoc(ref, { isTimerPaused: true, timerPausedAt: now });
    }
  }

  async resumeSession(): Promise<void> {
    const ref = doc(db, 'camp_os', 'global_state');
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data() as GlobalState;
    const now = Date.now();

    if (data.timerMode === 'countdown') {
      const remaining = data.timerPausedRemainingMs || 0;
      await updateDoc(ref, { isTimerPaused: false, timerEndTime: now + remaining, timerPausedRemainingMs: null });
    } else if (data.timerMode === 'countup') {
      const pausedAt = data.timerPausedAt || now;
      const pausedDuration = now - pausedAt;
      const adjustedStart = (data.timerStartTime || now) + pausedDuration;
      await updateDoc(ref, { isTimerPaused: false, timerStartTime: adjustedStart, timerPausedAt: null });
    }
  }

  async pauseCamp(): Promise<void> {
    await this.updateGlobalState({ isCampPaused: true, campStatus: 'paused' });
  }

  async resumeCamp(): Promise<void> {
    await this.updateGlobalState({ isCampPaused: false, campStatus: 'live' });
  }

  async adjustTimer(minutesDelta: number): Promise<void> {
    const ref = doc(db, 'camp_os', 'global_state');
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data() as GlobalState;
    const currentEnd = data.timerEndTime || Date.now();
    const newEnd = Math.max(Date.now(), currentEnd + (minutesDelta * 60 * 1000));
    await updateDoc(ref, { timerEndTime: newEnd });
  }

  async createTeam(name: string, customCode?: string): Promise<Team> {
    const id = 'team-' + name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random()*1000);
    const joinCode = customCode || 'Z2MVP-' + Math.floor(10 + Math.random() * 90);
    
    const newTeam: Team = {
      id,
      name,
      joinCode,
      members: [],
      projectIdea: 'لم يحدد بعد',
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

    await setDoc(doc(db, 'teams', id), newTeam);
    return newTeam;
  }

  async joinTeam(joinCode: string, participantName: string, participantId?: string): Promise<{ teamId: string; participantId: string }> {
    const q = query(collection(db, 'teams'), where('joinCode', '==', joinCode));
    const snaps = await getDocs(q);
    if (snaps.empty) {
      throw new Error("رمز الانضمام غير صحيح.");
    }
    const teamDoc = snaps.docs[0];
    const teamId = teamDoc.id;
    const pid = participantId || 'p-' + Math.random().toString(36).substr(2, 7);

    const teamData = teamDoc.data() as Team;
    const members = teamData.members || [];
    if (!members.find(m => m.id === pid)) {
      members.push({ id: pid, name: participantName, joinedAt: Date.now() });
      await updateDoc(doc(db, 'teams', teamId), { members });
    }

    return { teamId, participantId: pid };
  }

  async updateTeam(teamId: string, updates: Partial<Team>): Promise<void> {
    const ref = doc(db, 'teams', teamId);
    await updateDoc(ref, updates);
  }

  async deleteTeam(teamId: string): Promise<void> {
    await deleteDoc(doc(db, 'teams', teamId));
  }

  async updateTaskStatus(teamId: string, taskId: string, status: TaskStatus): Promise<void> {
    const ref = doc(db, 'teams', teamId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data() as Team;
    const taskStatuses = data.taskStatuses || {};
    taskStatuses[taskId] = status;

    const completedTaskIds = Object.keys(taskStatuses).filter(id => taskStatuses[id] === 'completed');
    await updateDoc(ref, { taskStatuses, completedTaskIds });
  }

  async submitTask(teamId: string, taskId: string): Promise<void> {
    await this.updateTaskStatus(teamId, taskId, 'completed');
  }

  async submitDeliverable(teamId: string, sessionId: string, deliverableUrl: string, textAnswer?: string): Promise<void> {
    const ref = doc(db, 'teams', teamId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data() as Team;
    const submissions = data.submissions || {};

    submissions[sessionId] = {
      sessionId,
      deliverableUrl,
      textAnswer,
      status: 'submitted',
      submittedAt: Date.now()
    };

    await updateDoc(ref, { 
      submissions, 
      checkpointStatus: 'pending',
      submittedDeliverableUrl: deliverableUrl 
    });
  }

  async reviewDeliverable(teamId: string, sessionId: string, status: 'approved' | 'changes_requested', feedback?: string, reviewerName?: string): Promise<void> {
    const ref = doc(db, 'teams', teamId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data() as Team;
    const submissions = data.submissions || {};
    const existing = submissions[sessionId] || { sessionId, submittedAt: Date.now() };

    submissions[sessionId] = {
      ...existing,
      status,
      organizerFeedback: feedback || '',
      reviewedAt: Date.now(),
      reviewerName: reviewerName || 'المنظّم'
    };

    await updateDoc(ref, { 
      submissions,
      checkpointStatus: status === 'approved' ? 'approved' : 'rejected',
      healthStatus: status === 'approved' ? 'green' : 'yellow'
    });
  }

  async submitCheckpoint(teamId: string): Promise<void> {
    const ref = doc(db, 'teams', teamId);
    await updateDoc(ref, { checkpointStatus: 'pending' });
  }

  async approveCheckpoint(teamId: string, nextStage: string, mentorId: string): Promise<void> {
    const ref = doc(db, 'teams', teamId);
    await updateDoc(ref, { checkpointStatus: 'approved', currentStageId: nextStage });
  }

  async requestHelp(teamId: string, participantName: string, category: HelpCategory, message?: string): Promise<void> {
    const ref = doc(db, 'teams', teamId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data() as Team;
    const helpRequests = data.helpRequests || [];

    const newReq = {
      id: 'help-' + Math.random().toString(36).substr(2, 7),
      teamId,
      participantName,
      category,
      message,
      status: 'open' as const,
      createdAt: Date.now()
    };

    helpRequests.push(newReq);
    await updateDoc(ref, { helpRequests, healthStatus: 'red' });
  }

  async requestIntervention(teamId: string, participantId: string): Promise<void> {
    await this.requestHelp(teamId, participantId, 'other', 'طلب مساعدة زمني');
  }

  async claimHelp(teamId: string, helpRequestId: string, organizerName: string): Promise<void> {
    const ref = doc(db, 'teams', teamId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data() as Team;
    const helpRequests = (data.helpRequests || []).map(h => {
      if (h.id === helpRequestId) return { ...h, status: 'claimed' as const, claimedBy: organizerName };
      return h;
    });
    await updateDoc(ref, { helpRequests, healthStatus: 'yellow' });
  }

  async claimIntervention(teamId: string, interventionId: string, mentorId: string): Promise<void> {
    await this.claimHelp(teamId, interventionId, mentorId);
  }

  async resolveHelp(teamId: string, helpRequestId: string, organizerName: string): Promise<void> {
    const ref = doc(db, 'teams', teamId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data() as Team;
    const helpRequests = (data.helpRequests || []).map(h => {
      if (h.id === helpRequestId) return { ...h, status: 'resolved' as const, resolvedAt: Date.now() };
      return h;
    });
    await updateDoc(ref, { helpRequests, healthStatus: 'green' });
  }

  async resolveIntervention(teamId: string, interventionId: string, mentorId: string): Promise<void> {
    await this.resolveHelp(teamId, interventionId, mentorId);
  }

  async submitJudgeScore(score: Omit<DemoDayScore, 'id' | 'totalScore'>): Promise<void> {
    const total = Object.values(score.scores).reduce((a: number, b: number) => a + b, 0);
    const deterministicId = `${score.teamId}_${score.judgeId}`;
    
    await setDoc(doc(db, 'demo_scores', deterministicId), {
      ...score,
      totalScore: total
    });
  }

  async resetState(): Promise<void> {
    throw new Error('resetState is disabled in FirebaseProvider. Use seedDatabase instead.');
  }

  async seedDatabase(): Promise<void> {
    const globalStateRef = doc(db, 'camp_os', 'global_state');
    await setDoc(globalStateRef, {
      campCode: 'Z2MVP',
      campStatus: 'live',
      isCampPaused: false,
      activeSessionId: DEFAULT_ZERO2MVP_SESSIONS[0].id,
      sessions: DEFAULT_ZERO2MVP_SESSIONS,
      announcement: null,
      timerEndTime: Date.now() + 20 * 60 * 1000,
      timerStartTime: Date.now(),
      timerMode: 'countdown',
      isTimerPaused: false
    });

    const teams: Team[] = [
      { id: 'team-orbit', name: 'Team Orbit', joinCode: 'Z2MVP-42', members: [{ id: 'p1', name: 'بدر', joinedAt: Date.now() }], projectIdea: 'AI coding assistant', currentStageId: 's_day1_welcome', progressPercentage: 20, momentumScore: 80, taskStatuses: {}, completedTaskIds: [], submissions: {}, helpRequests: [], healthStatus: 'green', checkpointStatus: 'idle' },
      { id: 'team-namaa', name: 'Team Namaa', joinCode: 'Z2MVP-18', members: [{ id: 'p2', name: 'سارة', joinedAt: Date.now() }], projectIdea: 'Smart calendar', currentStageId: 's_day1_welcome', progressPercentage: 10, momentumScore: 60, taskStatuses: {}, completedTaskIds: [], submissions: {}, helpRequests: [], healthStatus: 'green', checkpointStatus: 'idle' }
    ];

    for (const t of teams) {
      await setDoc(doc(db, 'teams', t.id), t);
    }
  }
}

export const firebaseProvider = new FirebaseProvider();
