import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) throw error
        navigate('/home')
      } else {
        const { error, data } = await signUp(email, password)
        if (error) throw error
        if (data?.user && !data.session) {
          setInfo('Check your email to confirm your account, then sign in.')
        } else {
          navigate('/home')
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full" style={{ maxWidth: 360 }}>

        {/* Wordmark */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)', boxShadow: '0 4px 14px rgba(124,106,247,0.4)' }}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="10.5" width="14" height="2.5" rx="1.2" fill="white" fillOpacity="0.92"/>
                <rect x="1" y="6.5"  width="10" height="2.5" rx="1.2" fill="white" fillOpacity="0.65"/>
                <rect x="1" y="2.5"  width="6"  height="2.5" rx="1.2" fill="white" fillOpacity="0.38"/>
              </svg>
            </div>
            <span style={{ color: 'var(--text)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Strata</span>
          </div>
          <p style={{ color: 'var(--text3)', fontSize: 13, lineHeight: 1.5 }}>
            Video production planning for YouTube teams
          </p>
        </div>

        {/* Card */}
        <div className="p-7" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: '0 4px 32px rgba(0,0,0,0.5)' }}>
          <h2 style={{ color: 'var(--text)', fontSize: 15, fontWeight: 600, marginBottom: 24 }}>
            {mode === 'login' ? 'Sign in' : 'Create an account'}
          </h2>

          {error && (
            <div className="mb-5 px-3.5 py-2.5 text-sm" style={{ background: 'rgba(224,82,82,0.08)', border: '1px solid rgba(224,82,82,0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', lineHeight: 1.5 }}>
              {error}
            </div>
          )}
          {info && (
            <div className="mb-5 px-3.5 py-2.5 text-sm" style={{ background: 'rgba(77,172,125,0.08)', border: '1px solid rgba(77,172,125,0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--success)', lineHeight: 1.5 }}>
              {info}
            </div>
          )}

          <form onSubmit={handle} className="space-y-4">
            <div>
              <label className="block mb-1.5" style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5"
                style={{ fontSize: 14 }}
              />
            </div>
            <div>
              <label className="block mb-1.5" style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="at least 6 characters"
                className="w-full px-3.5 py-2.5"
                style={{ fontSize: 14 }}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 font-semibold transition-all duration-200 disabled:opacity-50"
              style={{ background: 'var(--accent)', color: '#fff', borderRadius: 'var(--radius-sm)', fontSize: 13, boxShadow: '0 2px 10px rgba(124,106,247,0.35)' }}
            >
              {loading ? 'One moment...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="mt-5 pt-5 text-center" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError(''); setInfo('') }}
              className="transition-colors duration-200"
              style={{ color: 'var(--text3)', fontSize: 13 }}
            >
              {mode === 'login' ? "No account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
