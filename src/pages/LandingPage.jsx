import { useNavigate } from 'react-router-dom'

const Logo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(124,106,247,0.5)' }}>
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="10.5" width="14" height="2.5" rx="1.2" fill="white" fillOpacity="0.92"/>
        <rect x="1" y="6.5"  width="10" height="2.5" rx="1.2" fill="white" fillOpacity="0.65"/>
        <rect x="1" y="2.5"  width="6"  height="2.5" rx="1.2" fill="white" fillOpacity="0.38"/>
      </svg>
    </div>
    <span style={{ color: 'var(--text)', fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>Strata</span>
  </div>
)

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
    <circle cx="7" cy="7" r="6"/>
    <path d="M4.5 7l2 2 3.5-3.5"/>
  </svg>
)

const features = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round">
        <rect x="1" y="2" width="5" height="16" rx="2"/>
        <rect x="8" y="2" width="5" height="10" rx="2"/>
        <rect x="15" y="2" width="4" height="14" rx="2"/>
      </svg>
    ),
    title: 'Kanban planning',
    desc: 'Drag videos from idea to upload across a clean, focused board.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="8" cy="7" r="3"/>
        <circle cx="14" cy="7" r="2.5"/>
        <path d="M2 17c0-3 2.7-5 6-5s6 2 6 5"/>
        <path d="M14 12c2 0 4 1.5 4 4"/>
      </svg>
    ),
    title: 'Team coordination',
    desc: 'Invite editors, animators, and collaborators. Send recording invites via Discord.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round">
        <rect x="3" y="2" width="14" height="16" rx="2"/>
        <path d="M7 7h6M7 10h6M7 13h4"/>
      </svg>
    ),
    title: 'Video briefs',
    desc: 'Write scripts, notes, and briefs inside every video card. Like Notion, but for your channel.',
  },
]

const tiers = [
  {
    name: 'Free',
    tagline: 'Get started today',
    highlighted: true,
    badge: null,
    features: [
      '1 channel',
      '20 cards per channel',
      '3 team members',
      'Discord bot integration',
      'Video briefs',
    ],
  },
  {
    name: 'Pro',
    tagline: 'For growing channels',
    highlighted: false,
    badge: 'Coming soon',
    features: [
      'Unlimited channels',
      'Unlimited cards',
      '25 team members',
      'Priority Discord support',
      'Analytics dashboard',
      'CSV export',
    ],
  },
  {
    name: 'Enterprise',
    tagline: 'For large teams',
    highlighted: false,
    badge: 'Coming soon',
    features: [
      'Everything in Pro',
      'Multiple workspaces',
      'White label options',
      'Dedicated support',
      'Custom integrations',
    ],
  },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Nav ───────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(17,17,16,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: 54,
      }}>
        <Logo />
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => navigate('/auth')}
            style={{ padding: '7px 16px', fontSize: 13, fontWeight: 500, color: 'var(--text2)', borderRadius: 6, border: '1px solid var(--border-hover)', background: 'transparent', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
          >
            Sign in
          </button>
          <button
            onClick={() => navigate('/auth')}
            style={{ padding: '7px 16px', fontSize: 13, fontWeight: 600, color: '#fff', borderRadius: 6, background: 'var(--accent)', boxShadow: '0 2px 10px rgba(124,106,247,0.4)', transition: 'all 0.2s' }}
          >
            Get started
          </button>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '88vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '80px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: 'radial-gradient(ellipse 90% 60% at 50% -10%, rgba(124,106,247,0.12) 0%, transparent 70%)',
      }}>
        {/* Subtle dot grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }} />

        <div style={{ position: 'relative', maxWidth: 700 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '5px 14px', borderRadius: 99,
            background: 'rgba(124,106,247,0.1)', border: '1px solid rgba(124,106,247,0.25)',
            marginBottom: 28, fontSize: 12, fontWeight: 500, color: 'var(--accent)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
            Now in early access
          </div>

          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 62px)',
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginBottom: 24,
            color: 'var(--text)',
          }}>
            The workspace built for{' '}
            <span style={{ color: 'var(--accent)' }}>YouTube teams</span>
          </h1>

          <p style={{
            fontSize: 'clamp(15px, 2.5vw, 19px)',
            color: 'var(--text2)',
            lineHeight: 1.7,
            maxWidth: 520,
            margin: '0 auto 40px',
          }}>
            Plan videos, brief your team, and coordinate recordings, all in one place.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/auth')}
              style={{
                padding: '12px 28px', fontSize: 14, fontWeight: 600,
                color: '#fff', borderRadius: 8, background: 'var(--accent)',
                boxShadow: '0 4px 20px rgba(124,106,247,0.45)', transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              Get started free
            </button>
            <button
              onClick={() => navigate('/auth')}
              style={{
                padding: '12px 28px', fontSize: 14, fontWeight: 500,
                color: 'var(--text2)', borderRadius: 8,
                border: '1px solid var(--border-hover)', background: 'transparent',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
            >
              Sign in
            </button>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 12 }}>
            Everything your team needs
          </h2>
          <p style={{ color: 'var(--text3)', fontSize: 15, maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
            Built for the way YouTube teams actually work, from ideation to upload.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {features.map(f => (
            <div
              key={f.title}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 12, padding: 28,
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(124,106,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: 'var(--text3)', fontSize: 13, lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 12 }}>
            Simple pricing
          </h2>
          <p style={{ color: 'var(--text3)', fontSize: 15, lineHeight: 1.6 }}>
            Start free. Upgrade when your team grows.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, alignItems: 'start' }}>
          {tiers.map(tier => (
            <div
              key={tier.name}
              style={{
                background: 'var(--surface)',
                border: `1px solid ${tier.highlighted ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 12, padding: 28, position: 'relative',
                boxShadow: tier.highlighted ? '0 0 0 1px rgba(124,106,247,0.15), 0 4px 24px rgba(124,106,247,0.1)' : 'none',
              }}
            >
              {tier.highlighted && (
                <div style={{
                  position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--accent)', color: '#fff',
                  fontSize: 11, fontWeight: 600, padding: '3px 12px', borderRadius: 99,
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                }}>
                  Current plan
                </div>
              )}
              {tier.badge && (
                <div style={{
                  position: 'absolute', top: 16, right: 16,
                  background: 'rgba(255,255,255,0.06)', color: 'var(--text3)',
                  fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 99,
                  border: '1px solid var(--border)',
                }}>
                  {tier.badge}
                </div>
              )}

              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{tier.name}</h3>
              <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 24 }}>{tier.tagline}</p>

              <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none', padding: 0, margin: '0 0 24px' }}>
                {tier.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13, color: 'var(--text2)' }}>
                    <CheckIcon />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => !tier.badge && navigate('/auth')}
                disabled={!!tier.badge}
                style={{
                  width: '100%', padding: '10px', fontSize: 13, fontWeight: 600,
                  borderRadius: 7, transition: 'all 0.2s',
                  background: tier.highlighted ? 'var(--accent)' : 'transparent',
                  color: tier.highlighted ? '#fff' : 'var(--text3)',
                  border: tier.highlighted ? 'none' : '1px solid var(--border-hover)',
                  boxShadow: tier.highlighted ? '0 2px 10px rgba(124,106,247,0.35)' : 'none',
                  cursor: tier.badge ? 'default' : 'pointer',
                  opacity: tier.badge ? 0.6 : 1,
                }}
              >
                {tier.highlighted ? 'Get started free' : 'Coming soon'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '32px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Logo />
          <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 6 }}>Built for creators</p>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <a href="#" style={{ color: 'var(--text3)', fontSize: 13, textDecoration: 'none' }}>Privacy</a>
          <a href="#" style={{ color: 'var(--text3)', fontSize: 13, textDecoration: 'none' }}>Terms</a>
        </div>
      </footer>
    </div>
  )
}
