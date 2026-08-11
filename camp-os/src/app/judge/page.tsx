'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function JudgeRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to official Organizer & Judge Control Hub
    router.replace('/organizer');
  }, [router]);

  return (
    <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#F7F5F0', fontFamily: 'IBM Plex Sans Arabic, sans-serif' }}>
      <p style={{ fontWeight: 800, fontSize: '1.2rem', color: '#111111' }}>جاري التوجيه إلى غرفة تحكم المعسكر (CAMP CONTROL)...</p>
    </div>
  );
}
