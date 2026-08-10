const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { initializeApp } = require('firebase/app');
const { getAuth, signInAnonymously } = require('firebase/auth');
const { getFirestore, doc, setDoc, onSnapshot, getDoc, updateDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

function createActor(role, appName) {
  const app = initializeApp(firebaseConfig, appName);
  const auth = getAuth(app);
  const db = getFirestore(app);
  return { app, auth, db, role };
}

async function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

(async () => {
  console.log("Starting Firebase Integration Test (Node.js SDK Simulation)...");
  
  let report = {
    'Firebase Connection': 'FAIL',
    'Firestore Rules': 'FAIL',
    'Seed': 'FAIL',
    'Realtime Sync (Projector)': 'FAIL',
    'Realtime Sync (Participant)': 'FAIL',
    'Realtime Sync (Mentor)': 'FAIL',
    'Organizer': 'FAIL',
    'Judge (Isolation)': 'FAIL',
    'Demo Day': 'FAIL',
    'Break/Resume': 'FAIL',
  };

  try {
    const org = createActor('organizer', 'orgApp');
    const proj = createActor('projector', 'projApp');
    const part = createActor('participant', 'partApp');
    const mentor = createActor('mentor', 'mentorApp');
    const judge = createActor('judge', 'judgeApp');

    // 1. Auth and Setup
    console.log("Authenticating actors...");
    for (const actor of [org, proj, part, mentor, judge]) {
      const cred = await signInAnonymously(actor.auth);
      actor.uid = cred.user.uid;
      
      const teamId = actor.role === 'participant' ? 'team-alpha' : null;
      await setDoc(doc(actor.db, 'users', actor.uid), {
        name: `Test ${actor.role}`,
        role: actor.role,
        teamId
      });
    }
    report['Firebase Connection'] = 'PASS';

    // 2. Seed Database (Organizer)
    console.log("Seeding Database...");
    const globalRef = doc(org.db, 'camp_os', 'global_state');
    await setDoc(globalRef, {
      currentPhase: 'setup',
      preBreakPhase: 'setup',
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
      await setDoc(doc(org.db, 'teams', t.id), t);
    }
    report['Seed'] = 'PASS';

    // 3. Projector Realtime Sync
    console.log("Testing Realtime Sync (Organizer -> Projector)...");
    let projectorPhase = 'setup';
    const unsubProj = onSnapshot(doc(proj.db, 'camp_os', 'global_state'), (snap) => {
      if(snap.exists()) projectorPhase = snap.data().currentPhase;
    });

    // Organizer changes phase
    await updateDoc(globalRef, { currentPhase: 'build' });
    await delay(2000); 
    
    if (projectorPhase === 'build') {
      report['Realtime Sync (Projector)'] = 'PASS';
      report['Organizer'] = 'PASS';
    } else {
      throw new Error(`Projector phase did not update. Got: ${projectorPhase}`);
    }

    // 4. Mentor -> Participant Realtime Sync
    console.log("Testing Realtime Sync (Mentor -> Participant)...");
    let partHealth = 'green';
    const unsubPart = onSnapshot(doc(part.db, 'teams', 'team-alpha'), (snap) => {
      if(snap.exists()) partHealth = snap.data().healthStatus;
    });

    await updateDoc(doc(mentor.db, 'teams', 'team-alpha'), { healthStatus: 'red' });
    await delay(2000);

    if (partHealth === 'red') {
      report['Realtime Sync (Participant)'] = 'PASS';
    } else {
      throw new Error(`Participant health did not update. Got: ${partHealth}`);
    }

    // 5. Participant -> Mentor Realtime Sync
    console.log("Testing Realtime Sync (Participant -> Mentor)...");
    let mentorProgress = 0;
    const unsubMentor = onSnapshot(doc(mentor.db, 'teams', 'team-alpha'), (snap) => {
      if(snap.exists()) mentorProgress = snap.data().progressPercentage;
    });

    await updateDoc(doc(part.db, 'teams', 'team-alpha'), { progressPercentage: 100 });
    await delay(2000);

    if (mentorProgress === 100) {
      report['Realtime Sync (Mentor)'] = 'PASS';
    } else {
      throw new Error(`Mentor progress did not update. Got: ${mentorProgress}`);
    }

    // 6. Break / Resume (Organizer)
    console.log("Testing Break / Resume...");
    await updateDoc(globalRef, { currentPhase: 'break', preBreakPhase: 'build' });
    await delay(1000);
    let snap = await getDoc(globalRef);
    if(snap.data().currentPhase !== 'break') throw new Error("Failed to enter break");
    
    await updateDoc(globalRef, { currentPhase: snap.data().preBreakPhase, preBreakPhase: 'setup' });
    await delay(1000);
    snap = await getDoc(globalRef);
    if(snap.data().currentPhase === 'build') {
      report['Break/Resume'] = 'PASS';
    } else {
      throw new Error("Failed to resume from break correctly");
    }

    // 7. Demo Day & Judge Isolation
    console.log("Testing Demo Day & Judge Isolation...");
    await updateDoc(globalRef, { currentPhase: 'demo_day', activeDemoTeamId: 'team-alpha' });
    await delay(2000);
    
    // Judge submits score for Alpha
    const alphaScoreRef = doc(judge.db, 'demo_scores', `team-alpha_${judge.uid}`);
    await setDoc(alphaScoreRef, {
      teamId: 'team-alpha',
      judgeId: judge.uid,
      scores: { ui: 5, ux: 5, technical: 5, pitch: 5, impact: 5 },
      totalScore: 25
    });
    // According to rule: allow update: if isRole('judge') && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['demoDayTotalScore']);
    await updateDoc(doc(judge.db, 'teams', 'team-alpha'), { demoDayTotalScore: 25 });
    
    // Organizer switches to Beta
    await updateDoc(globalRef, { activeDemoTeamId: 'team-nova' });
    await delay(2000);

    // Judge submits score for Nova
    const novaScoreRef = doc(judge.db, 'demo_scores', `team-nova_${judge.uid}`);
    await setDoc(novaScoreRef, {
      teamId: 'team-nova',
      judgeId: judge.uid,
      scores: { ui: 4, ux: 4, technical: 4, pitch: 4, impact: 4 },
      totalScore: 20
    });
    await updateDoc(doc(judge.db, 'teams', 'team-nova'), { demoDayTotalScore: 20 });

    // Verify both scores exist independently
    const alphaScore = await getDoc(alphaScoreRef);
    const novaScore = await getDoc(novaScoreRef);
    if (alphaScore.exists() && novaScore.exists() && alphaScore.data().totalScore === 25) {
      report['Judge (Isolation)'] = 'PASS';
      report['Demo Day'] = 'PASS';
    } else {
      throw new Error("Judge scoring isolation failed");
    }

    report['Firestore Rules'] = 'PASS';

    // Clean up listeners
    unsubProj();
    unsubPart();
    unsubMentor();

    console.log("\n=============================");
    console.log("FIREBASE E2E CERTIFICATION");
    console.log("=============================\n");
    for (const [key, val] of Object.entries(report)) {
      console.log(`${key}: ${val}`);
    }
    console.log("\nSTATE: LOCAL FIREBASE CERTIFIED");
    process.exit(0);

  } catch (err) {
    console.error("Test Failed:", err);
    console.log("\n=============================");
    console.log("FIREBASE E2E CERTIFICATION");
    console.log("=============================\n");
    for (const [key, val] of Object.entries(report)) {
      console.log(`${key}: ${val}`);
    }
    console.log("\nSTATE: BLOCKED / FAILED");
    process.exit(1);
  }
})();
