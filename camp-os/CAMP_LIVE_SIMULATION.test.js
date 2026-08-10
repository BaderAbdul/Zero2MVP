const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc, updateDoc, addDoc, collection, deleteDoc } = require('firebase/firestore');
const fs = require('fs');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runSimulation() {
  console.log("==================================================");
  console.log("CAMP OS — LIVE SIMULATION CERTIFICATION");
  console.log("==================================================\n");

  let testEnv;
  try {
    testEnv = await initializeTestEnvironment({
      projectId: 'zero-2-mvp',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8'),
        host: '127.0.0.1',
        port: 8080,
      }
    });
  } catch (err) {
    console.error("Failed to initialize test environment. Is the emulator running?", err);
    process.exit(1);
  }

  await testEnv.clearFirestore();

  console.log("🚀 Initializing Actors...");
  const orgContext = testEnv.authenticatedContext('org-uid', { email: 'org@test.com' });
  const mentor1Context = testEnv.authenticatedContext('mentor1-uid', { email: 'mentor1@test.com' });
  const mentor2Context = testEnv.authenticatedContext('mentor2-uid', { email: 'mentor2@test.com' });
  const judge1Context = testEnv.authenticatedContext('judge1-uid', { email: 'judge1@test.com' });
  const judge2Context = testEnv.authenticatedContext('judge2-uid', { email: 'judge2@test.com' });
  const judge3Context = testEnv.authenticatedContext('judge3-uid', { email: 'judge3@test.com' });
  const partContexts = [
    testEnv.authenticatedContext('part1-uid'),
    testEnv.authenticatedContext('part2-uid'),
    testEnv.authenticatedContext('part3-uid'),
    testEnv.authenticatedContext('part4-uid'),
    testEnv.authenticatedContext('part5-uid'),
  ];
  const projectorContext = testEnv.unauthenticatedContext();

  const orgDb = orgContext.firestore();
  const mentor1Db = mentor1Context.firestore();
  const judge1Db = judge1Context.firestore();
  const projectorDb = projectorContext.firestore();
  const partDbs = partContexts.map(ctx => ctx.firestore());

  let report = {
    total: 0,
    passed: 0,
    failed: 0,
    blocked: 0,
    failures: []
  };

  const pass = (name) => { report.total++; report.passed++; console.log(`✅ PASS: ${name}`); };
  const fail = (name, err) => { report.total++; report.failed++; report.failures.push(name); console.error(`❌ FAIL: ${name}`, err); };
  const block = (name, reason) => { report.total++; report.blocked++; console.log(`⚠️ BLOCKED: ${name} (${reason})`); };

  // Helper to bypass rules for initial staff allowlist setup
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const adminDb = context.firestore();
    await setDoc(doc(adminDb, 'staff_allowlist', 'org@test.com'), { role: 'organizer' });
    await setDoc(doc(adminDb, 'staff_allowlist', 'mentor1@test.com'), { role: 'mentor' });
    await setDoc(doc(adminDb, 'staff_allowlist', 'mentor2@test.com'), { role: 'mentor' });
    await setDoc(doc(adminDb, 'staff_allowlist', 'judge1@test.com'), { role: 'judge' });
    await setDoc(doc(adminDb, 'staff_allowlist', 'judge2@test.com'), { role: 'judge' });
    await setDoc(doc(adminDb, 'staff_allowlist', 'judge3@test.com'), { role: 'judge' });
  });

  try {
    console.log("\n--- TEST SCENARIO — SETUP ---");
    // Organizer authenticates
    await assertSucceeds(setDoc(doc(orgDb, 'users', 'org-uid'), { role: 'organizer', name: 'Organizer' }));
    pass("Organizer authenticates correctly");

    // Initialize Global State
    await assertSucceeds(setDoc(doc(orgDb, 'camp_os', 'global_state'), {
      currentPhase: 'setup',
      campStatus: 'setup',
      activeDemoTeamId: null,
      announcement: null,
      timerEndTime: null,
      revealScores: false
    }));
    pass("Organizer initializes global state (Setup Mode)");

    // Create 5 teams
    const teamCodes = ['T11111', 'T22222', 'T33333', 'T44444', 'T55555'];
    for (let i = 0; i < 5; i++) {
      await assertSucceeds(setDoc(doc(orgDb, 'teams', `team-${i + 1}`), {
        id: `team-${i + 1}`,
        name: `Team ${i + 1}`,
        joinCode: teamCodes[i],
        healthStatus: 'green',
        checkpointStatus: 'idle',
        currentStage: 'ideation',
        progressPercentage: 0
      }));
    }
    pass("Organizer creates 5 teams with valid unique join codes");

    // Adversarial: Participant cannot access organizer functions
    await assertSucceeds(setDoc(doc(partDbs[0], 'users', 'part1-uid'), { role: 'participant', name: 'P1' }));
    await assertFails(deleteDoc(doc(partDbs[0], 'teams', 'team-5')));
    pass("Participants cannot access organizer functions");

    console.log("\n--- TEST SCENARIO — WAITING ROOM ---");
    // Organizer opens camp to WAITING_ROOM
    await assertSucceeds(updateDoc(doc(orgDb, 'camp_os', 'global_state'), { campStatus: 'waiting_room' }));
    pass("Organizer transitions campStatus to WAITING_ROOM");

    // Participants authenticate
    for (let i = 1; i < 5; i++) {
      await assertSucceeds(setDoc(doc(partDbs[i], 'users', `part${i + 1}-uid`), { role: 'participant', name: `P${i + 1}` }));
    }

    // Join teams
    for (let i = 0; i < 5; i++) {
      await assertSucceeds(updateDoc(doc(partDbs[i], 'users', `part${i + 1}-uid`), { teamId: `team-${i + 1}`, joinCode: teamCodes[i] }));
    }
    pass("5 Participants successfully join teams with valid codes");

    // Adversarial tests
    await assertFails(updateDoc(doc(partDbs[0], 'users', 'part1-uid'), { teamId: 'team-2', joinCode: teamCodes[1] }));
    pass("Attempt to switch teams fails");

    await assertFails(updateDoc(doc(partDbs[1], 'users', 'part1-uid'), { teamId: 'team-2', joinCode: teamCodes[1] }));
    pass("Attempt to modify another participant fails");

    console.log("\n--- TEST SCENARIO — RUN OF SHOW ---");
    const phases = ['setup', 'welcome', 'ideation', 'build', 'checkpoint', 'break', 'pitch_prep', 'demo_day_queue'];
    
    for (let i = 0; i < phases.length - 1; i++) {
      await assertSucceeds(updateDoc(doc(orgDb, 'camp_os', 'global_state'), { 
        campStatus: 'live',
        currentPhase: phases[i + 1] 
      }));
    }
    pass(`Organizer advances through all phases successfully (${phases.join(' -> ')})`);

    console.log("\n--- PARTICIPANT MISSION TEST ---");
    // Set to BUILD phase for missions
    await assertSucceeds(updateDoc(doc(orgDb, 'camp_os', 'global_state'), { currentPhase: 'build' }));
    
    // Increment progress
    await assertSucceeds(updateDoc(doc(partDbs[0], 'teams', 'team-1'), { progressPercentage: 25 }));
    await assertSucceeds(updateDoc(doc(partDbs[0], 'teams', 'team-1'), { progressPercentage: 50 }));
    await assertSucceeds(updateDoc(doc(partDbs[0], 'teams', 'team-1'), { progressPercentage: 100 }));
    pass("Progress increases correctly to 100%");

    // Progress bounds
    await assertFails(updateDoc(doc(partDbs[0], 'teams', 'team-1'), { progressPercentage: 105 }));
    await assertFails(updateDoc(doc(partDbs[0], 'teams', 'team-1'), { progressPercentage: -5 }));
    pass("Progress never exceeds 100% or becomes negative");

    // Silo test
    await assertFails(updateDoc(doc(partDbs[0], 'teams', 'team-2'), { progressPercentage: 10 }));
    pass("Participant cannot modify another team's progress");

    console.log("\n--- MENTOR INTERVENTION TEST ---");
    await assertSucceeds(setDoc(doc(mentor1Db, 'users', 'mentor1-uid'), { role: 'mentor', name: 'Mentor 1' }));

    // Participant requests help
    const interventionRef = doc(partDbs[0], 'teams', 'team-1', 'interventions', 'int-1');
    await assertSucceeds(setDoc(interventionRef, {
      teamId: 'team-1',
      participantId: 'part1-uid',
      status: 'open',
      createdAt: Date.now()
    }));
    pass("Participant successfully opens an intervention");

    // Mentor claims
    await assertSucceeds(updateDoc(doc(mentor1Db, 'teams', 'team-1', 'interventions', 'int-1'), {
      status: 'claimed',
      mentorId: 'mentor1-uid',
      claimedAt: Date.now()
    }));
    pass("Mentor successfully claims the intervention");

    // Mentor resolves
    await assertSucceeds(updateDoc(doc(mentor1Db, 'teams', 'team-1', 'interventions', 'int-1'), {
      status: 'resolved',
      resolvedAt: Date.now()
    }));
    pass("Mentor successfully resolves the intervention");

    // Adversarial
    const badIntervention = doc(partDbs[1], 'teams', 'team-2', 'interventions', 'int-2');
    await assertSucceeds(setDoc(badIntervention, { teamId: 'team-2', participantId: 'part2-uid', status: 'open', createdAt: Date.now() }));
    await assertFails(updateDoc(doc(mentor1Db, 'teams', 'team-2', 'interventions', 'int-2'), { status: 'resolved', resolvedAt: Date.now() }));
    pass("Intervention cannot skip CLAIMED state");

    console.log("\n--- DEMO DAY TEST & JUDGE ISOLATION ---");
    await assertSucceeds(updateDoc(doc(orgDb, 'camp_os', 'global_state'), { currentPhase: 'demo_day_queue' }));

    await assertSucceeds(setDoc(doc(judge1Db, 'users', 'judge1-uid'), { role: 'judge', name: 'Judge 1' }));
    
    // Organizer queues Team 1
    await assertSucceeds(updateDoc(doc(orgDb, 'camp_os', 'global_state'), { 
      activeDemoTeamId: 'team-1',
      nextDemoTeamId: 'team-2'
    }));
    pass("Organizer successfully queues active and next demo teams");

    // Judge 1 Submits
    await assertSucceeds(setDoc(doc(judge1Db, 'demo_scores', 'team-1_judge1-uid'), {
      teamId: 'team-1',
      judgeId: 'judge1-uid',
      scores: { idea: 10, execution: 10, pitch: 10 },
      totalScore: 30
    }));
    pass("Judge successfully submits a score for the active team");

    // Adversarial Judge
    await assertFails(setDoc(doc(judge1Db, 'demo_scores', 'team-2_judge1-uid'), {
      teamId: 'team-2', // Wrong team (not active)
      judgeId: 'judge1-uid',
      scores: { idea: 10, execution: 10, pitch: 10 },
      totalScore: 30
    }));
    pass("Judge cannot score a team that is not active");

    await assertFails(setDoc(doc(judge1Db, 'demo_scores', 'team-1_fake-judge'), {
      teamId: 'team-1',
      judgeId: 'fake-judge', // Spoofing
      scores: { idea: 10, execution: 10, pitch: 10 },
      totalScore: 30
    }));
    pass("Judge cannot spoof another judgeId");

    console.log("\n--- PROJECTOR ISOLATION ---");
    await assertFails(updateDoc(doc(projectorDb, 'camp_os', 'global_state'), { currentPhase: 'setup' }));
    pass("Projector successfully remains read-only");

  } catch (err) {
    fail("Simulation execution failed", err);
  }

  // Generate Report
  console.log("\n==================================================");
  console.log("SIMULATION SUMMARY");
  console.log(`TOTAL TESTS: ${report.total}`);
  console.log(`PASSED:      ${report.passed}`);
  console.log(`FAILED:      ${report.failed}`);
  console.log(`BLOCKED:     ${report.blocked}`);
  
  if (report.failed > 0) {
    console.error("FAILURES:", report.failures);
  }

  // Cleanup
  await testEnv.cleanup();
  
  if (report.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSimulation();
