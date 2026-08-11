'use client';

import React, { useEffect, useState } from 'react';
import { useCampContext } from '@/lib/services/CampContext';
import { auth, googleProvider } from '@/lib/services/firebase';
import { signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

const SUPER_ADMIN_EMAIL = 'ebaderabdul@gmail.com';

export default function LoginPage() {
  const { currentUser, setCurrentUser } = useCampContext();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    if (currentUser) {
      setIsLoading(false);
      if (currentUser.role === 'organizer' || currentUser.role === 'mentor' || currentUser.role === 'judge') {
        router.push('/organizer');
      } else {
        router.push('/participant');
      }
    }
  }, [currentUser, router]);

  const handleGoogleOrganizerLogin = async () => {
    try {
      setIsLoading(true);
      setLoginError('');
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        const userEmail = res.user.email?.toLowerCase();
        const isSuperAdmin = userEmail === SUPER_ADMIN_EMAIL.toLowerCase();

        const organizerUser = {
          id: res.user.uid,
          name: res.user.displayName || res.user.email?.split('@')[0] || 'منسق المعسكر',
          role: isSuperAdmin ? ('organizer' as const) : ('organizer' as const),
          email: res.user.email || undefined,
          campId: 'Z2MVP'
        };

        setCurrentUser(organizerUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('camp_os_session', JSON.stringify({
            participantId: res.user.uid,
            participantName: organizerUser.name,
            role: 'organizer',
            email: res.user.email,
            campId: 'Z2MVP'
          }));
        }

        router.push('/organizer');
      }
    } catch (err: any) {
      console.error('Firebase auth popup error:', err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr: any) {
          console.error('Firebase auth redirect error:', redirectErr);
        }
      }
      setLoginError('تعذر تسجيل الدخول. يرجى المحاولة مرة أخرى.');
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('camp_os_session');
    }
    setIsLoading(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <span className={styles.brand}>FROM ZERO TO MVP · CAMP OS</span>
        <h1 className={styles.title}>تسجيل دخول إدارة المعسكر والتحكيم</h1>
        <p className={styles.subtitle}>سجّل الدخول بواسطة Google للوصول إلى غرفة التحكم (CAMP CONTROL)</p>
        
        {!currentUser ? (
          <>
            <button 
              onClick={handleGoogleOrganizerLogin}
              className={styles.googleBtn}
              disabled={isLoading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              {isLoading ? 'جاري الدخول...' : 'تسجيل الدخول كمنظّم / مدرب بواسطة Google'}
            </button>
            {loginError && <p className={styles.errorMsg}>{loginError}</p>}
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            <p style={{ color: 'var(--text-main)', fontSize: '1rem' }}>
              مرحباً <strong>{currentUser.name}</strong> (إدارة المعسكر)
            </p>
            <button onClick={() => router.push('/organizer')} className={styles.googleBtn}>
              الانتقال إلى غرفة التحكم (CAMP CONTROL) ←
            </button>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              تسجيل الخروج
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
