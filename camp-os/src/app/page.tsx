import Link from 'next/link';

export default function Home() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      background: 'radial-gradient(circle at 50% 30%, rgba(59, 130, 246, 0.08), transparent 60%), var(--bg-main)',
      textAlign: 'center'
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-glass-strong)',
        borderRadius: 'var(--radius-lg)',
        padding: '3.5rem 2.5rem',
        maxWidth: '520px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(16px)'
      }}>
        <div style={{
          display: 'inline-block',
          padding: '0.4rem 1rem',
          borderRadius: 'var(--radius-pill)',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid var(--border-glass-strong)',
          color: 'var(--accent-blue)',
          fontSize: '0.85rem',
          fontWeight: 700,
          marginBottom: '1.5rem',
          letterSpacing: '0.05em'
        }}>
          Camp OS
        </div>

        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 800,
          color: 'var(--text-main)',
          marginBottom: '0.75rem',
          lineHeight: 1.2
        }}>
          نظام تشغيل المعسكر البرمجي
        </h1>

        <p style={{
          color: 'var(--text-muted)',
          fontSize: '1.05rem',
          marginBottom: '2.5rem',
          lineHeight: 1.6
        }}>
          From Zero to MVP — المنصة التشغيلية لإدارة المعسكر والمشاركين والتحكيم
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Link 
            href="/login" 
            style={{ 
              background: 'var(--accent-blue)', 
              color: 'white', 
              padding: '1rem 2rem', 
              borderRadius: 'var(--radius-md)', 
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '1.1rem',
              boxShadow: '0 4px 14px var(--accent-blue-glow)',
              transition: 'transform 0.15s ease, background 0.15s ease'
            }}
          >
            تسجيل الدخول — Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
