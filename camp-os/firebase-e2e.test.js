const { initializeApp } = require('firebase/app');
const { getAuth, signInAnonymously } = require('firebase/auth');
const { getFirestore, doc, getDoc, setDoc } = require('firebase/firestore');

// Required for tests
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

async function runLiveIntegrationTest() {
  console.log("Starting Firebase LIVE Integration Test...");
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  let report = {};
  const pass = (name) => { report[name] = 'PASS'; console.log(`✅ ${name}`); };
  const fail = (name, err) => { report[name] = `FAIL: ${err.message}`; console.error(`❌ ${name}`, err); };

  try {
    // 3. Projector / Public Read Access (Global State)
    try {
      const snap = await getDoc(doc(db, 'camp_os', 'global_state'));
      if (snap.exists()) {
         pass('Live Projector Global State Read Access');
      } else {
         fail('Live Projector Global State Read Access', new Error("Document not found"));
      }
    } catch (e) {
      fail('Live Projector Global State Read Access', e);
    }

  } catch (err) {
    fail('Live Integration execution encountered an error', err);
  }

  console.log("\n=============================");
  console.log("PRODUCTION FIREBASE INTEGRATION — LIVE");
  console.log("=============================\n");
  let allPassed = true;
  for (const [key, val] of Object.entries(report)) {
    console.log(`${val.padEnd(5, ' ')} | ${key}`);
    if (!val.startsWith('PASS')) allPassed = false;
  }
  
  if (allPassed) {
    console.log("\nSTATE: LIVE INTEGRATION PASSED");
    process.exit(0);
  } else {
    console.log("\nSTATE: LIVE INTEGRATION FAILED");
    process.exit(1);
  }
}

runLiveIntegrationTest();
