'use client';

import React, { useEffect } from 'react';
import { useCampContext } from '@/lib/services/CampContext';
import { auth, googleProvider } from '@/lib/services/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { currentUser } = useCampContext();
  const router = useRouter();

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'organizer') router.push('/organizer');
      else if (currentUser.role === 'mentor') router.push('/mentor');
      else if (currentUser.role === 'judge') router.push('/judge');
      else router.push('/participant');
    }
  }, [currentUser, router]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      alert('فشل تسجيل الدخول: ' + err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      background: 'radial-gradient(circle at 50% 40%, rgba(59, 130, 246, 0.08), transparent 60%), var(--bg-main)',
      textAlign: 'center'
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-glass-strong)',
        borderRadius: 'var(--radius-lg)',
        padding: '3.5rem 2.5rem',
        maxWidth: '460px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(16px)'
      }}>
        <div style={{
          display: 'inline-block',
          padding: '0.35rem 0.9rem',
          borderRadius: 'var(--radius-pill)',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid var(--border-glass-strong)',
          color: 'var(--accent-blue)',
          fontSize: '0.85rem',
          fontWeight: 700,
          marginBottom: '1.25rem'
        }}>
          Camp OS
        </div>

        <h1 style={{
          fontSize: '2.25rem',
          fontWeight: 800,
          color: 'var(--text-main)',
          marginBottom: '0.75rem'
        }}>
          تسجيل الدخول
        </h1>

        <p style={{
          color: 'var(--text-muted)',
          fontSize: '1rem',
          marginBottom: '2.25rem',
          lineHeight: 1.5
        }}>
          سجّل الدخول للوصول إلى لوحة المعلومات
        </p>
        
        {!currentUser ? (
          <button 
            onClick={handleGoogleLogin}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              background: 'var(--accent-blue)',
              color: 'white',
              padding: '0.9rem 1.5rem', 
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontSize: '1.05rem',
              fontWeight: 700,
              boxShadow: '0 4px 14px var(--accent-blue-glow)',
              transition: 'transform 0.15s ease, background 0.15s ease'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            تسجيل الدخول باستخدام Google
          </button>
        ) : (
          <button 
            onClick={handleLogout}
            style={{
              width: '100%',
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--accent-red)',
              border: '1px solid var(--accent-red-glow)',
              padding: '0.9rem 1.5rem', 
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontSize: '1.05rem',
              fontWeight: 700,
              transition: 'background 0.15s ease'
            }}
          >
            تسجيل الخروج
          </button>
        )}
      </div>
    </div>
  );
}
