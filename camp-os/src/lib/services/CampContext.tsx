'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { DataProvider, GlobalState, Team, User } from './types';
import { mockProvider } from './MockProvider';
import { firebaseProvider } from './FirebaseProvider';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface CampContextValue {
  provider: DataProvider;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
}

const CampContext = createContext<CampContextValue | null>(null);

export const CampProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const isFirebase = process.env.NEXT_PUBLIC_DATA_PROVIDER !== 'mock';
  const activeProvider = isFirebase ? firebaseProvider : mockProvider;

  useEffect(() => {
    if (!isFirebase) {
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('camp_current_user');
        if (stored) {
          try { setCurrentUser(JSON.parse(stored)); } catch (e) { }
        }
      }
      setAuthLoading(false);
      return;
    }

    // Firebase Auth Flow
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userRef = doc(db, 'users', firebaseUser.uid);
          let userDoc;
          try {
            userDoc = await getDoc(userRef);
          } catch (err) {
            console.error('Error fetching userDoc:', err);
          }
          
          if (!userDoc || !userDoc.exists()) {
            let assignedRole = 'participant';
            if (firebaseUser.email) {
              try {
                const allowlistDoc = await getDoc(doc(db, 'staff_allowlist', firebaseUser.email.toLowerCase()));
                if (allowlistDoc && allowlistDoc.exists()) {
                  assignedRole = allowlistDoc.data().role;
                }
              } catch (e) {
                console.warn('Allowlist fetch warning:', e);
              }
            }
            
            try {
              await setDoc(userRef, {
                name: firebaseUser.displayName || firebaseUser.email || 'Participant',
                role: assignedRole,
                teamId: null
              });
              userDoc = await getDoc(userRef);
            } catch (e) {
              console.error('Error setting user profile:', e);
            }
          }

          const data = userDoc?.exists() ? userDoc.data() : null;
          setCurrentUser({
            id: firebaseUser.uid,
            name: data?.name || firebaseUser.displayName || firebaseUser.email || 'User',
            role: data?.role || 'participant',
            teamId: data?.teamId || null
          });
        } else {
          setCurrentUser(null);
        }
      } catch (globalAuthErr) {
        console.error('Global auth listener error:', globalAuthErr);
      } finally {
        setAuthLoading(false);
      }
    });

    return unsubscribe;
  }, [isFirebase]);

  const handleSetUser = (user: User | null) => {
    // Only used directly when MockProvider is active
    if (!isFirebase) {
      setCurrentUser(user);
      if (typeof window !== 'undefined') {
        if (user) {
          sessionStorage.setItem('camp_current_user', JSON.stringify(user));
        } else {
          sessionStorage.removeItem('camp_current_user');
        }
      }
    }
  };
  
  const value = useMemo(() => ({
    provider: activeProvider,
    currentUser,
    setCurrentUser: handleSetUser
  }), [currentUser, activeProvider]);

  return (
    <CampContext.Provider value={value}>
      {!authLoading ? children : <div style={{padding: '2rem'}}>Loading Camp OS...</div>}
    </CampContext.Provider>
  );
};

export function useCampContext() {
  const context = useContext(CampContext);
  if (!context) throw new Error('useCampContext must be used within CampProvider');
  return context;
}

export function useGlobalState() {
  const { provider } = useCampContext();
  const [globalState, setGlobalState] = useState<GlobalState | null>(null);

  useEffect(() => {
    const unsubscribe = provider.subscribeToGlobalState((state) => {
      setGlobalState(state);
    });
    return unsubscribe;
  }, [provider]);

  return globalState;
}

export function useTeams() {
  const { provider } = useCampContext();
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    const unsubscribe = provider.subscribeToTeams((t) => {
      setTeams(t);
    });
    return unsubscribe;
  }, [provider]);

  return teams;
}

export function useUsers() {
  const { provider } = useCampContext();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (provider.subscribeToUsers) {
      const unsubscribe = provider.subscribeToUsers((u) => setUsers(u));
      return unsubscribe;
    }
  }, [provider]);

  return users;
}

export function useTeam(teamId: string | undefined) {
  const { provider } = useCampContext();
  const [team, setTeam] = useState<Team | null>(null);

  useEffect(() => {
    if (!teamId) return;
    const unsubscribe = provider.subscribeToTeam(teamId, (t) => {
      setTeam(t);
    });
    return unsubscribe;
  }, [provider, teamId]);

  return team;
}

export function useTeamInterventions(teamId: string | undefined) {
  const { provider } = useCampContext();
  const [interventions, setInterventions] = useState<any[]>([]);

  useEffect(() => {
    if (!teamId) return;
    if (provider.subscribeToInterventions) {
      const unsubscribe = provider.subscribeToInterventions(teamId, (i) => {
        setInterventions(i);
      });
      return unsubscribe;
    }
  }, [provider, teamId]);

  return interventions;
}

export function useDemoScores(teamId?: string) {
  const { provider } = useCampContext();
  const [scores, setScores] = useState<any[]>([]);

  useEffect(() => {
    if (!teamId) {
      setScores([]);
      return;
    }
    if (provider.subscribeToDemoScores) {
      const unsubscribe = provider.subscribeToDemoScores(teamId, (s) => {
        setScores(s);
      });
      return unsubscribe;
    }
  }, [provider, teamId]);

  return scores;
}
