import { 
  collection, doc, getDoc, setDoc, updateDoc, onSnapshot, 
  query, where, addDoc 
} from 'firebase/firestore';
import { db } from './firebase';
import { DataProvider, GlobalState, Team, Task, DemoDayScore, CampStage } from './types';

export class FirebaseProvider implements DataProvider {
  subscribeToGlobalState(callback: (state: GlobalState) => void): () => void {
    const unsub = onSnapshot(doc(db, 'camp_os', 'global_state'), (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as GlobalState);
      }
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

  async updateGlobalState(updates: Partial<GlobalState>): Promise<void> {
    const ref = doc(db, 'camp_os', 'global_state');
    await updateDoc(ref, updates);
  }

  async updateTeam(teamId: string, updates: Partial<Team>): Promise<void> {
    const ref = doc(db, 'teams', teamId);
    await updateDoc(ref, updates);
  }

  async submitTask(teamId: string, task: Partial<Task>): Promise<void> {
    const teamRef = doc(db, 'teams', teamId);
    const teamSnap = await getDoc(teamRef);
    if (!teamSnap.exists()) return;
    
    const team = teamSnap.data() as Team;
    const newProgress = Math.min(100, team.progressPercentage + 10);
    
    // Write task
    await addDoc(collection(db, `teams/${teamId}/tasks`), {
      ...task,
      completedAt: Date.now()
    });
    
    // Update team progress
    await updateDoc(teamRef, { progressPercentage: newProgress });
  }

  async submitCheckpoint(teamId: string): Promise<void> {
    const ref = doc(db, 'teams', teamId);
    await updateDoc(ref, { checkpointStatus: 'pending' });
  }

  async approveCheckpoint(teamId: string, nextStage: CampStage): Promise<void> {
    const ref = doc(db, 'teams', teamId);
    await updateDoc(ref, { 
      checkpointStatus: 'approved',
      currentStage: nextStage
    });
  }

  async submitJudgeScore(score: Omit<DemoDayScore, 'id' | 'totalScore'>): Promise<void> {
    const total = Object.values(score.scores).reduce((a, b) => a + b, 0);
    
    await addDoc(collection(db, 'demo_scores'), {
      ...score,
      totalScore: total
    });
    
    // Update the team's total score sum
    // In a real app we might use a cloud function or transaction for safety
    // but for the MVP, the client can calculate and update it directly, 
    // or just fetch all scores when needed. 
    // The previous mock did: team.demoDayTotalScore += total;
    const teamRef = doc(db, 'teams', score.teamId);
    const teamSnap = await getDoc(teamRef);
    if (teamSnap.exists()) {
      const currentTotal = teamSnap.data().demoDayTotalScore || 0;
      await updateDoc(teamRef, { demoDayTotalScore: currentTotal + total });
    }
  }

  async resetState(): Promise<void> {
    throw new Error('resetState is disabled in FirebaseProvider. Use seedDatabase instead.');
  }

  async seedDatabase(): Promise<void> {
    // Controlled seed mechanism - requires Organizer role permissions in Firestore
    const globalStateRef = doc(db, 'camp_os', 'global_state');
    await setDoc(globalStateRef, {
      currentPhase: 'setup',
      activeDemoTeamId: null,
      announcement: null,
      timerEndTime: null,
      revealScores: false
    });

    const teams = [
      { id: 'team-alpha', name: 'Team Alpha', projectIdea: 'AI coding assistant', currentStage: 'ideation', progressPercentage: 0, healthStatus: 'green', checkpointStatus: 'idle', demoDayTotalScore: 0 },
      { id: 'team-nova', name: 'Team Nova', projectIdea: 'Smart calendar', currentStage: 'ideation', progressPercentage: 0, healthStatus: 'green', checkpointStatus: 'idle', demoDayTotalScore: 0 },
      { id: 'team-omega', name: 'Team Omega', projectIdea: 'Auto documenter', currentStage: 'ideation', progressPercentage: 0, healthStatus: 'green', checkpointStatus: 'idle', demoDayTotalScore: 0 }
    ];

    for (const t of teams) {
      await setDoc(doc(db, 'teams', t.id), t);
    }
    
    // Note: this does not delete old tasks or demo scores for simplicity, 
    // it just overwrites the teams and global state.
  }
}

export const firebaseProvider = new FirebaseProvider();
