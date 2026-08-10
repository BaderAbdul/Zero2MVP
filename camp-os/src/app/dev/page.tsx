'use client';

import React from 'react';
import { useCampContext } from '@/lib/services/CampContext';
import { UserRole } from '@/lib/services/types';
import styles from './dev.module.css';
import Link from 'next/link';

export default function DevControlPanel() {
  const { provider, currentUser, setCurrentUser } = useCampContext();

  const isFirebase = process.env.NEXT_PUBLIC_DATA_PROVIDER === 'firebase';

  const handleSimulateLogin = async (role: UserRole, teamId?: string) => {
    if (isFirebase) {
      alert("Firebase roles are strictly managed via Google Auth and the staff allowlist. Use /login instead.");
      return;
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
      alert("Use /login to manage Firebase auth.");
    } else {
      setCurrentUser(null);
    }
  };

  const handleReset = async () => {
    if (window.confirm("CRITICAL: Are you sure you want to reset the ENTIRE camp state to initial? This cannot be undone.")) {
      if (isFirebase) {
        if (currentUser?.role !== 'organizer') {
          alert("Firebase Reset requires you to be logged in as Organizer via Google Auth first.");
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
        <p>Switch roles to preview the Camp OS locally (Mock Provider Only).</p>
      </header>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h2>Current Session</h2>
          <p>Logged in as: <strong>{currentUser ? currentUser.role : 'None'}</strong></p>
          {currentUser?.teamId && <p>Team: {currentUser.teamId}</p>}
          <p>Provider: <strong>{isFirebase ? 'Firebase' : 'Mock'}</strong></p>
          
          {isFirebase && (
            <Link href="/login" className={styles.button}>Go to Login</Link>
          )}
          {!isFirebase && (
            <button onClick={handleLogout} className={styles.buttonOutline}>
              Logout
            </button>
          )}
        </div>

        <div className={styles.card}>
          <h2>Simulate Login (Mock Only)</h2>
          <div className={styles.buttonGroup}>
            <button onClick={() => handleSimulateLogin('organizer')} className={styles.button} disabled={isFirebase}>Organizer</button>
            <button onClick={() => handleSimulateLogin('mentor')} className={styles.button} disabled={isFirebase}>Mentor</button>
            <button onClick={() => handleSimulateLogin('judge')} className={styles.button} disabled={isFirebase}>Judge</button>
            <button onClick={() => handleSimulateLogin('participant', 'team-nova')} className={styles.buttonParticipant} disabled={isFirebase}>Participant (Team Nova)</button>
            <button onClick={() => handleSimulateLogin('participant', 'team-alpha')} className={styles.buttonParticipant} disabled={isFirebase}>Participant (Team Alpha)</button>
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
