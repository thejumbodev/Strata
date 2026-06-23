import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { supabase } from '../lib/supabase'
import { getPlanLimits } from '../lib/limits'

function greeting(email) {
  const h = new Date().getHours()
  const name = email?.split('@')[0] ?? 'there'
  if (h < 12) return `Good morning, ${name}`
  if (h < 18) return `Good afternoon, ${name}`
  return `Good evening, ${name}`
}

function fmtDate() {
  return new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
}

const QuickAction = ({ icon, label, sub, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '18px 20px',
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 10, textAlign: 'left', width: '100%',
      transition: 'all 0.2s', cursor: 'pointer',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.background = 'var(--card)' }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)' }}
  >
    <div style={{ width: 38, height: 38, borderRadius: 9, background: 'rgba(124,106,247,0.1)', border: '1px solid rgba(124,106,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <div style={{ color: 'var(--text)', fontSize: 14, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ color: 'var(--text3)', fontSize: 12, marginTop: 2 }}>{sub}</div>}
    </div>
    <svg style={{ marginLeft: 'auto', color: 'var(--text3)', flexShrink: 0 }} width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M5 3l4 4-4 4"/>
    </svg>
  </button>
)

const STATUS_COLOR = {
  Ideas:    '#a78bfa',
  Recorded: '#f6c343',
  Edited:   '#4d9de0',
  Uploaded: '#3ecf8e',
}

export default function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { workspace, channels, members, activeChannelId } = useWorkspace()

  const [cardCounts, setCardCounts]       = useState(null)
  const [totalCards, setTotalCards]       = useState(0)
  const [loadingStats, setLoadingStats]   = useState(false)

  const plan       = workspace?.plan || 'free'
  const limits     = getPlanLimits(plan)
  const channel    = channels.find(c => c.id === activeChannelId) || channels[0]

  useEffect(() => {
    if (!channel?.id) return
    setLoadingStats(true)
    supabase
      .from('cards')
      .select('status')
      .eq('channel_id', channel.id)
      .then(({ data }) => {
        if (!data) return
        const counts = { Ideas: 0, Recorded: 0, Edited: 0, Uploaded: 0 }
        data.forEach(c => { if (counts[c.status] !== undefined) counts[c.status]++ })
        setCardCounts(counts)
        setTotalCards(data.length)
      })
      .finally(() => setLoadingStats(false))
  }, [channel?.id])

  const sectionTitle = (t) => (
    <h2 style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
      {t}
    </h2>
  )

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 28px' }}>

      {/* ── Greeting ───────────────────────────────────────────────── */}
      <div style={{ marginBottom: 44 }}>
        <h1 style={{ color: 'var(--text)', fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>
          {greeting(user?.email)}
        </h1>
        <p style={{ color: 'var(--text3)', fontSize: 13 }}>{fmtDate()}</p>
      </div>

      {/* ── Quick actions ───────────────────────────────────────────── */}
      <div style={{ marginBottom: 40 }}>
        {sectionTitle('Quick actions')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
          <QuickAction
            onClick={() => navigate('/board')}
            label="Go to board"
            sub="View and manage your kanban board"
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round">
                <rect x="1" y="1" width="4" height="14" rx="1.5"/>
                <rect x="6" y="1" width="4" height="9" rx="1.5"/>
                <rect x="11" y="1" width="4" height="12" rx="1.5"/>
              </svg>
            }
          />
          <QuickAction
            onClick={() => navigate('/settings?tab=team')}
            label="Team members"
            sub="Add or manage your crew"
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="6" cy="5" r="2.5"/>
                <circle cx="11" cy="5" r="2"/>
                <path d="M1 14c0-2.5 2-4 5-4s5 1.5 5 4"/>
                <path d="M11 9c1.5 0 3.5 1 3.5 3.5"/>
              </svg>
            }
          />
          <QuickAction
            onClick={() => navigate('/settings?tab=discord')}
            label="Discord settings"
            sub="Connect your server and configure alerts"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent)">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.054a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
              </svg>
            }
          />
          <QuickAction
            onClick={() => navigate('/settings?tab=team')}
            label="Invite someone"
            sub="Add a new team member to your workspace"
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="6" cy="5" r="2.5"/>
                <path d="M1 14c0-2.5 2-4 5-4s5 1.5 5 4"/>
                <path d="M12 7v5M14.5 9.5h-5"/>
              </svg>
            }
          />
        </div>
      </div>

      {/* ── Workspace summary ───────────────────────────────────────── */}
      <div style={{ marginBottom: 40 }}>
        {sectionTitle('Workspace summary')}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
          {!channel ? (
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>
              No channels yet.{' '}
              <button onClick={() => navigate('/board')} style={{ color: 'var(--accent)', fontSize: 13, textDecoration: 'underline', background: 'none', cursor: 'pointer' }}>
                Go to board to add one.
              </button>
            </p>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <p style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Current channel</p>
                  <p style={{ color: 'var(--text)', fontSize: 15, fontWeight: 600 }}>{channel.name}</p>
                </div>
                <button
                  onClick={() => navigate('/board')}
                  style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 500 }}
                >
                  View board →
                </button>
              </div>

              {loadingStats ? (
                <p style={{ color: 'var(--text3)', fontSize: 13 }}>Loading...</p>
              ) : cardCounts ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {['Ideas','Recorded','Edited','Uploaded'].map(s => (
                    <div
                      key={s}
                      style={{ background: 'var(--card)', borderRadius: 8, padding: '12px 14px', border: `1px solid ${STATUS_COLOR[s]}22` }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLOR[s], display: 'inline-block' }} />
                        <span style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 500 }}>{s}</span>
                      </div>
                      <span style={{ color: 'var(--text)', fontSize: 22, fontWeight: 700 }}>{cardCounts[s]}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      {/* ── Plan status ─────────────────────────────────────────────── */}
      <div>
        {sectionTitle('Plan')}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: 'var(--text)', fontSize: 15, fontWeight: 600, textTransform: 'capitalize' }}>
                {plan} tier
              </span>
              <span style={{ padding: '2px 9px', background: 'rgba(124,106,247,0.1)', border: '1px solid rgba(124,106,247,0.2)', borderRadius: 99, fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>
                Current
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              {
                label: 'Channels',
                used: channels.length,
                max: limits.channels === Infinity ? '∞' : limits.channels,
              },
              {
                label: 'Cards',
                used: totalCards,
                max: limits.cards === Infinity ? '∞' : limits.cards,
              },
              {
                label: 'Members',
                used: members.length,
                max: limits.members === Infinity ? '∞' : limits.members,
              },
            ].map(({ label, used, max }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: 'var(--text3)', fontSize: 13, width: 70 }}>{label}</span>
                <div style={{ flex: 1, height: 4, background: 'var(--card)', borderRadius: 99, overflow: 'hidden' }}>
                  {typeof max === 'number' && (
                    <div style={{
                      height: '100%', borderRadius: 99,
                      background: (used / max) > 0.8 ? 'var(--danger)' : 'var(--accent)',
                      width: `${Math.min((used / max) * 100, 100)}%`,
                      transition: 'width 0.5s ease',
                    }} />
                  )}
                </div>
                <span style={{ color: 'var(--text2)', fontSize: 12, fontVariantNumeric: 'tabular-nums', width: 48, textAlign: 'right' }}>
                  {used} / {max}
                </span>
              </div>
            ))}
          </div>

          <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            Pro plan with unlimited channels and cards is coming soon.
          </p>
        </div>
      </div>
    </div>
  )
}
