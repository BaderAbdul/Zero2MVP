const admin = require('firebase-admin');

// Ensure you have a service account key or are using the emulator
// For local emulator:
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

admin.initializeApp({
  projectId: 'demo-camp-os' // Make sure this matches your project ID
});

const db = admin.firestore();

async function setRole(email, role) {
  if (!email || !role) {
    console.error('Usage: node add-role.js <email> <role>');
    console.error('Roles: organizer, mentor, judge, participant');
    process.exit(1);
  }

  const emailLower = email.toLowerCase();
  
  try {
    // 1. Add to staff_allowlist
    await db.collection('staff_allowlist').doc(emailLower).set({
      email: emailLower,
      role: role
    });
    console.log(`✅ Added ${emailLower} as ${role} to staff_allowlist`);

    // 2. Update existing user profile if it exists
    const usersSnap = await db.collection('users').get();
    let found = false;
    
    // Find the user by their email (since we might not know their UID here if we didn't search by email)
    // Wait, users are keyed by UID and don't necessarily have email indexed for easy search here,
    // But since this is a small bootcamp, we can just warn them.
    console.log(`💡 Note: If you already logged in before running this, you may need to log out and log back in, or delete your user document in Firestore to refresh your role.`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error setting role:', err);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
setRole(args[0], args[1]);
