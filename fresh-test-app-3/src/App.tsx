import { useState, useEffect } from 'react'
import './responsive.css'
import './App.css'

function App() {
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (newPath: string) => {
    window.history.pushState({}, '', newPath)
    setPath(newPath)
  }

  return (
    <div className="responsive-container">
      <nav style={{ padding: '1rem', background: '#333', color: 'white', display: 'flex', gap: '1rem' }}>
        <button onClick={() => navigate('/')}>Home</button>
        <button onClick={() => navigate('/dashboard')}>Dashboard</button>
      </nav>
      
      {path === '/' && (
        <section>
          <h1>Root Home Page</h1>
          <p>This is the main route.</p>
        </section>
      )}

      {path === '/dashboard' && (
        <section>
          <h1>Dashboard Page</h1>
          <p>This is a nested client-side route.</p>
        </section>
      )}

      {path !== '/' && path !== '/dashboard' && (
        <section>
          <h1>404 Not Found (Client Side)</h1>
        </section>
      )}
    </div>
  )
}

export default App
