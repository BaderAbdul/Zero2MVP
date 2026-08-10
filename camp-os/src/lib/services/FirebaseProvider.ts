import { 
  collection, doc, getDoc, setDoc, updateDoc, onSnapshot, 
  query, where, addDoc, serverTimestamp, arrayUnion, getDocs,
  runTransaction, deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { DataProvider, GlobalState, Team, Task, DemoDayScore, CampStage, AuditLogEventType, Intervention, User } from './types';

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  'setup': ['welcome'],
  'welcome': ['ideation', 'setup'], // allow back to setup if needed
  'ideation': ['build', 'welcome'],
  'build': ['checkpoint', 'pitch_prep'],
  'checkpoint': ['break', 'pitch_prep', 'build'],
  'pitch_prep': ['demo_day_queue', 'build'],
  'demo_day_queue': ['demo_day_intro', 'finished'],
  'demo_day_intro': ['demo_day_presenting', 'demo_day_queue'],
  'demo_day_presenting': ['demo_day_judging'],
  'demo_day_judging': ['demo_day_reveal'],
  'demo_day_reveal': ['demo_day_queue'],
  'break': ['setup', 'welcome', 'ideation', 'build', 'checkpoint', 'pitch_prep'], // Can resume to any pre-break phase
  'finished': ['setup'] // allow full reset loop
};

export class FirebaseProvider implements DataProvider {
  subscribeToGlobalState(callback: (state: GlobalState) => void): () => void {
    const unsub = onSnapshot(doc(db, 'camp_os', 'global_state'), (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as GlobalState);
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

  subscribeToInterventions(teamId: string, callback: (interventions: Intervention[]) => void): () => void {
    const q = query(collection(db, `teams/${teamId}/interventions`));
    const unsub = onSnapshot(q, (snapshot) => {
      const ints = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Intervention);
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
      console.warn('Audit log failed (expected in local mock without rules, but must pass in prod):', e.message);
      // We don't throw here to avoid breaking the main operation if audit logging fails due to rules testing,
      // but in a strict prod environment we might want to fail the operation.
    }
  }

  async updateGlobalState(updates: Partial<GlobalState>, actorId?: string): Promise<void> {
    const ref = doc(db, 'camp_os', 'global_state');
    const snap = await getDoc(ref);
    
    if (snap.exists() && updates.currentPhase) {
      const currentState = snap.data() as GlobalState;
      const currentPhase = currentState.currentPhase;
      const newPhase = updates.currentPhase;
      
      if (currentPhase !== newPhase && currentPhase !== 'break') {
        const allowed = ALLOWED_TRANSITIONS[currentPhase] || [];
        if (!allowed.includes(newPhase)) {
          throw new Error(`Invalid phase transition: ${currentPhase} -> ${newPhase}`);
        }
      }
    }

    await updateDoc(ref, updates);
  }

  async updateTeam(teamId: string, updates: Partial<Team>): Promise<void> {
    const ref = doc(db, 'teams', teamId);
    await updateDoc(ref, updates);
  }

  async submitTask(teamId: string, taskId: string): Promise<void> {
    const teamRef = doc(db, 'teams', teamId);
    await updateDoc(teamRef, { 
      completedTaskIds: arrayUnion(taskId)
    });
    await this.logAudit('MISSION_COMPLETED', undefined, undefined, teamId, { taskId });
  }

  async submitCheckpoint(teamId: string): Promise<void> {
    const ref = doc(db, 'teams', teamId);
    await updateDoc(ref, { checkpointStatus: 'pending' });
    await this.logAudit('CHECKPOINT_SUBMITTED', undefined, undefined, teamId);
  }

  async approveCheckpoint(teamId: string, nextStage: CampStage, mentorId: string): Promise<void> {
    const ref = doc(db, 'teams', teamId);
    await updateDoc(ref, { 
      checkpointStatus: 'approved',
      currentStage: nextStage
    });
    await this.logAudit('CHECKPOINT_APPROVED', mentorId, 'mentor', teamId, { nextStage });
  }

  async requestIntervention(teamId: string, participantId: string): Promise<void> {
    const teamRef = doc(db, 'teams', teamId);
    const snap = await getDoc(teamRef);
    if (snap.exists() && snap.data().healthStatus !== 'green') {
      throw new Error("Team already has an active intervention.");
    }
    
    await updateDoc(teamRef, { healthStatus: 'red' });
    
    await addDoc(collection(db, `teams/${teamId}/interventions`), {
      teamId,
      participantId,
      status: 'open',
      createdAt: Date.now()
    });
    await this.logAudit('INTERVENTION_REQUESTED', participantId, 'participant', teamId);
  }

  async claimIntervention(teamId: string, interventionId: string, mentorId: string): Promise<void> {
    const intRef = doc(db, `teams/${teamId}/interventions`, interventionId);
    await updateDoc(intRef, {
      status: 'claimed',
      mentorId,
      claimedAt: Date.now()
    });
    await updateDoc(doc(db, 'teams', teamId), { healthStatus: 'yellow' });
    await this.logAudit('INTERVENTION_CLAIMED', mentorId, 'mentor', teamId, { interventionId });
  }

  async resolveIntervention(teamId: string, interventionId: string, mentorId: string): Promise<void> {
    const intRef = doc(db, `teams/${teamId}/interventions`, interventionId);
    await updateDoc(intRef, {
      status: 'resolved',
      resolvedAt: Date.now()
    });
    await updateDoc(doc(db, 'teams', teamId), { healthStatus: 'green' });
    await this.logAudit('INTERVENTION_RESOLVED', mentorId, 'mentor', teamId, { interventionId });
  }

  async submitJudgeScore(score: Omit<DemoDayScore, 'id' | 'totalScore'>): Promise<void> {
    const total = Object.values(score.scores).reduce((a, b) => a + b, 0);
    const deterministicId = `${score.teamId}_${score.judgeId}`;
    
    await setDoc(doc(db, 'demo_scores', deterministicId), {
      ...score,
      totalScore: total
    });
    
    // We NO LONGER update the team document's demoDayTotalScore blindly here.
    // Derived total should be calculated from 'demo_scores' collection by the client/projector.
    
    await this.logAudit('SCORES_SUBMITTED', score.judgeId, 'judge', score.teamId, { totalScore: total });
  }

  async joinTeam(joinCode: string, participantId: string): Promise<string> {
    // 1. Query for the team by joinCode first
    const q = query(collection(db, 'teams'), where('joinCode', '==', joinCode));
    const snaps = await getDocs(q);
    if (snaps.empty) {
      throw new Error("Invalid join code.");
    }
    const teamId = snaps.docs[0].id;
    
    // 2. Perform atomic transaction
    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', participantId);
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) {
        throw new Error("User does not exist.");
      }
      if (userDoc.data().teamId) {
        throw new Error("You are already assigned to a team.");
      }
      
      transaction.update(userRef, { teamId, joinCode });
    });
    return teamId;
  }

  async createTeam(name: string): Promise<void> {
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random()*1000);
    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    await setDoc(doc(db, 'teams', id), {
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
  }

  async deleteTeam(teamId: string): Promise<void> {
    await deleteDoc(doc(db, 'teams', teamId));
  }

  async resetState(): Promise<void> {
    throw new Error('resetState is disabled in FirebaseProvider. Use seedDatabase instead.');
  }

  async seedDatabase(): Promise<void> {
    const globalStateRef = doc(db, 'camp_os', 'global_state');
    await setDoc(globalStateRef, {
      currentPhase: 'setup',
      activeDemoTeamId: null,
      announcement: null,
      timerEndTime: null,
      revealScores: false
    });

    const teams = [
      { id: 'team-alpha', name: 'Team Alpha', projectIdea: 'AI coding assistant', currentStage: 'ideation', progressPercentage: 0, healthStatus: 'green', checkpointStatus: 'idle', demoDayTotalScore: 0, completedTaskIds: [] },
      { id: 'team-nova', name: 'Team Nova', projectIdea: 'Smart calendar', currentStage: 'ideation', progressPercentage: 0, healthStatus: 'green', checkpointStatus: 'idle', demoDayTotalScore: 0, completedTaskIds: [] },
      { id: 'team-omega', name: 'Team Omega', projectIdea: 'Auto documenter', currentStage: 'ideation', progressPercentage: 0, healthStatus: 'green', checkpointStatus: 'idle', demoDayTotalScore: 0, completedTaskIds: [] }
    ];

    for (const t of teams) {
      await setDoc(doc(db, 'teams', t.id), t);
    }
  }
}

export const firebaseProvider = new FirebaseProvider();
