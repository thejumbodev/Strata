import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function HomeLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>
      <header
        className="flex-shrink-0 h-11 flex items-center justify-between px-6"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      >
        {/* Wordmark */}
        <div className="flex items-center gap-2 select-none cursor-pointer" onClick={() => navigate('/home')}>
          <div style={{ width: 18, height: 18, borderRadius: 5, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="10.5" width="14" height="2.5" rx="1.2" fill="white" fillOpacity="0.92"/>
              <rect x="1" y="6.5"  width="10" height="2.5" rx="1.2" fill="white" fillOpacity="0.65"/>
              <rect x="1" y="2.5"  width="6"  height="2.5" rx="1.2" fill="white" fillOpacity="0.38"/>
            </svg>
          </div>
          <span style={{ color: 'var(--text)', fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>Strata</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden sm:block" style={{ color: 'var(--text3)', fontSize: 12 }}>{user?.email}</span>
          <button
            onClick={handleSignOut}
            style={{ color: 'var(--text3)', fontSize: 12, transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = 'var(--text2)'}
            onMouseLeave={e => e.target.style.color = 'var(--text3)'}
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
