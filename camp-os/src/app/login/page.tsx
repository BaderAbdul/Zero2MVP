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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>تسجيل الدخول — Camp OS Login</h1>
      <p style={{ marginBottom: '2rem', color: '#64748b' }}>الرجاء تسجيل الدخول للوصول إلى لوحة المعلومات (Dashboard).</p>
      
      {!currentUser ? (
        <button 
          onClick={handleGoogleLogin}
          style={{
            background: '#3b82f6', color: 'white', padding: '12px 24px', 
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem',
            fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}
        >
          تسجيل الدخول باستخدام Google
        </button>
      ) : (
        <button 
          onClick={handleLogout}
          style={{
            background: '#ef4444', color: 'white', padding: '12px 24px', 
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem',
            fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}
        >
          تسجيل الخروج
        </button>
      )}
    </div>
  );
}
