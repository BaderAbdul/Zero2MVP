import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ padding: '4rem', fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
      <h1>Welcome to Camp OS</h1>
      <p>The operating system for From Zero to MVP.</p>
      
      <div style={{ marginTop: '2rem' }}>
        <Link 
          href="/dev" 
          style={{ 
            background: '#0f172a', 
            color: 'white', 
            padding: '1rem 2rem', 
            borderRadius: '8px', 
            textDecoration: 'none',
            fontWeight: 'bold'
          }}
        >
          Open Developer Control Panel
        </Link>
      </div>
    </div>
  );
}
