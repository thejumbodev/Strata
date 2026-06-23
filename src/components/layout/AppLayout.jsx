import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'

export default function AppLayout() {
  const { user, signOut } = useAuth()
  const { workspace }     = useWorkspace()
  const navigate          = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>
      <header
        className="flex-shrink-0 h-11 flex items-stretch px-5 gap-1"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
      >
        {/* Wordmark — links to /home */}
        <div
          className="flex items-center gap-2 mr-4 select-none cursor-pointer"
          onClick={() => navigate('/home')}
        >
          <div style={{ width: 18, height: 18, borderRadius: 5, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="10.5" width="14" height="2.5" rx="1.2" fill="white" fillOpacity="0.92"/>
              <rect x="1" y="6.5"  width="10" height="2.5" rx="1.2" fill="white" fillOpacity="0.65"/>
              <rect x="1" y="2.5"  width="6"  height="2.5" rx="1.2" fill="white" fillOpacity="0.38"/>
            </svg>
          </div>
          <span style={{ color: 'var(--text)', fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>Strata</span>
          {workspace && (
            <>
              <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: 16, fontWeight: 300, margin: '0 2px' }}>/</span>
              <span className="truncate max-w-[130px]" style={{ color: 'var(--text3)', fontSize: 13 }}>{workspace.name}</span>
            </>
          )}
        </div>

        {/* Nav tabs */}
        <nav className="flex items-stretch gap-0.5">
          <NavLink
            to="/board"
            className={({ isActive }) =>
              `flex items-center px-3 transition-all duration-200 border-b-2 ${isActive ? '' : 'border-transparent'}`
            }
            style={({ isActive }) => ({
              color: isActive ? 'var(--text)' : 'var(--text3)',
              borderBottomColor: isActive ? 'var(--accent)' : 'transparent',
              fontSize: 13, fontWeight: 500,
            })}
          >
            Board
          </NavLink>
          <NavLink
            to="/calendar"
            className={({ isActive }) =>
              `flex items-center px-3 transition-all duration-200 border-b-2 ${isActive ? '' : 'border-transparent'}`
            }
            style={({ isActive }) => ({
              color: isActive ? 'var(--text)' : 'var(--text3)',
              borderBottomColor: isActive ? 'var(--accent)' : 'transparent',
              fontSize: 13, fontWeight: 500,
            })}
          >
            Calendar
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center px-3 transition-all duration-200 border-b-2 ${isActive ? '' : 'border-transparent'}`
            }
            style={({ isActive }) => ({
              color: isActive ? 'var(--text)' : 'var(--text3)',
              borderBottomColor: isActive ? 'var(--accent)' : 'transparent',
              fontSize: 13, fontWeight: 500,
            })}
          >
            Settings
          </NavLink>
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-4">
          <span className="hidden sm:block truncate max-w-[200px]" style={{ color: 'var(--text3)', fontSize: 12 }}>
            {user?.email}
          </span>
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

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
