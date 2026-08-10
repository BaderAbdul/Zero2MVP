'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { DataProvider, GlobalState, Team, User } from './types';
import { mockProvider } from './MockProvider';
import { firebaseProvider } from './FirebaseProvider';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface CampContextValue {
  provider: DataProvider;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
}

const CampContext = createContext<CampContextValue | null>(null);

export const CampProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const isFirebase = process.env.NEXT_PUBLIC_DATA_PROVIDER === 'firebase';
  const activeProvider = isFirebase ? firebaseProvider : mockProvider;

  useEffect(() => {
    if (!isFirebase) {
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('camp_current_user');
        if (stored) {
          try { setCurrentUser(JSON.parse(stored)); } catch (e) { }
        }
      }
      return;
    }

    // Firebase Auth Flow
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setCurrentUser({
            id: firebaseUser.uid,
            name: data.name || 'User',
            role: data.role || 'participant',
            teamId: data.teamId
          });
        }
      } else {
        setCurrentUser(null);
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
      {children}
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
