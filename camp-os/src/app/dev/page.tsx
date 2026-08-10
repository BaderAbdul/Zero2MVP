'use client';

import React from 'react';
import { useCampContext } from '@/lib/services/CampContext';
import { UserRole } from '@/lib/services/types';
import { auth, db } from '@/lib/services/firebase';
import { signInAnonymously, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import styles from './dev.module.css';

export default function DevControlPanel() {
  const { provider, currentUser, setCurrentUser } = useCampContext();

  const isFirebase = process.env.NEXT_PUBLIC_DATA_PROVIDER === 'firebase';

  const handleSimulateLogin = async (role: UserRole, teamId?: string) => {
    if (isFirebase) {
      try {
        const cred = await signInAnonymously(auth);
        const name = `Dev ${role} (Firebase)`;
        await setDoc(doc(db, 'users', cred.user.uid), {
          name,
          role,
          teamId: teamId || null
        });
        alert(`Logged in to Firebase anonymously as ${role}`);
      } catch (err: any) {
        alert('Firebase Login Error: ' + err.message);
      }
    } else {
      setCurrentUser({
        id: `dev-${role}-${Math.random().toString(36).substr(2, 5)}`,
        name: `Dev ${role}`,
        role,
        teamId
      });
    }
  };

  const handleLogout = async () => {
    if (isFirebase) {
      await signOut(auth);
    } else {
      setCurrentUser(null);
    }
  };

  const handleReset = async () => {
    if (window.confirm("CRITICAL: Are you sure you want to reset the ENTIRE camp state to initial? This cannot be undone.")) {
      if (isFirebase) {
        if (currentUser?.role !== 'organizer') {
          alert("Firebase Reset requires you to be logged in as Organizer first.");
          return;
        }
        try {
          // @ts-ignore - seedDatabase is specific to FirebaseProvider
          await provider.seedDatabase();
          alert("Firebase Database Seeded successfully!");
        } catch (e: any) {
          alert("Seed failed: " + e.message);
        }
      } else {
        await provider.resetState();
        alert("Mock Global State Reset!");
      }
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Camp OS - Dev Control Panel</h1>
        <p>Switch roles to preview the Camp OS locally.</p>
      </header>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h2>Current Session</h2>
          <p>Logged in as: <strong>{currentUser ? currentUser.role : 'None'}</strong></p>
          {currentUser?.teamId && <p>Team: {currentUser.teamId}</p>}
          <p>Provider: <strong>{isFirebase ? 'Firebase' : 'Mock'}</strong></p>
          <button onClick={handleLogout} className={styles.buttonOutline}>
            Logout
          </button>
        </div>

        <div className={styles.card}>
          <h2>Simulate Login</h2>
          <div className={styles.buttonGroup}>
            <button onClick={() => handleSimulateLogin('organizer')} className={styles.button}>Organizer</button>
            <button onClick={() => handleSimulateLogin('mentor')} className={styles.button}>Mentor</button>
            <button onClick={() => handleSimulateLogin('judge')} className={styles.button}>Judge</button>
            <button onClick={() => handleSimulateLogin('participant', 'team-nova')} className={styles.buttonParticipant}>Participant (Team Nova)</button>
            <button onClick={() => handleSimulateLogin('participant', 'team-alpha')} className={styles.buttonParticipant}>Participant (Team Alpha)</button>
          </div>
        </div>

        <div className={styles.card}>
          <h2>Open Views (New Tab)</h2>
          <div className={styles.linkGroup}>
            <a href="/organizer" target="_blank" rel="noreferrer" className={styles.link}>[↗] Organizer Control Center</a>
            <a href="/projector" target="_blank" rel="noreferrer" className={styles.link}>[↗] Projector (No Auth Req)</a>
            <a href="/participant" target="_blank" rel="noreferrer" className={styles.link}>[↗] Participant Dashboard</a>
            <a href="/mentor" target="_blank" rel="noreferrer" className={styles.link}>[↗] Mentor Dashboard</a>
            <a href="/judge" target="_blank" rel="noreferrer" className={styles.link}>[↗] Judge Scorecard</a>
          </div>
        </div>

        <div className={styles.cardDanger}>
          <h2>Danger Zone</h2>
          <button onClick={handleReset} className={styles.buttonDanger}>Reset All State to Initial</button>
        </div>
      </div>
    </div>
  );
}
