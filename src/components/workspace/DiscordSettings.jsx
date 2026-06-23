import { useState } from 'react'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { getInviteUrl } from '../../lib/discord'

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="7" cy="7" r="6"/>
      <path d="M4.5 7l2 2 3.5-3.5"/>
    </svg>
  )
}

export default function DiscordSettings() {
  const { workspace, updateWorkspace } = useWorkspace()
  const [alertsId, setAlertsId]        = useState(workspace?.alerts_channel_id ?? '')
  const [saving, setSaving]            = useState(false)
  const [saved, setSaved]              = useState(false)
  const [connecting, setConnecting]    = useState(false)
  const [connectErr, setConnectErr]    = useState(null)

  const isConnected = !!workspace?.guild_id

  const handleConnect = async () => {
    setConnecting(true)
    setConnectErr(null)
    try {
      const url = await getInviteUrl()
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (e) {
      setConnectErr(e.message)
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Discord? Your team members will stay in the system but you will not be able to send invites until you reconnect.')) return
    await updateWorkspace({ guild_id: null })
  }

  const handleSaveAlerts = async () => {
    setSaving(true)
    await updateWorkspace({ alerts_channel_id: alertsId.trim() || null })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // ── Not connected ───────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '32px 0' }}>
        {/* Bot icon */}
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 4px 20px rgba(124,106,247,0.4)' }}>
          <span style={{ color: '#fff', fontSize: 28, fontWeight: 800, lineHeight: 1 }}>S</span>
        </div>

        <h3 style={{ color: 'var(--text)', fontSize: 18, fontWeight: 600, marginBottom: 10, letterSpacing: '-0.01em' }}>
          Connect your Discord server
        </h3>
        <p style={{ color: 'var(--text3)', fontSize: 13, lineHeight: 1.65, maxWidth: 380, marginBottom: 28 }}>
          Invite the Strata bot to your server to sync your team members and send recording invites directly from your video cards.
        </p>

        {connectErr && (
          <div style={{ marginBottom: 16, padding: '8px 14px', background: 'rgba(224,82,82,0.08)', border: '1px solid rgba(224,82,82,0.2)', borderRadius: 6, color: 'var(--danger)', fontSize: 13 }}>
            {connectErr}
          </div>
        )}

        <button
          onClick={handleConnect}
          disabled={connecting}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 24px',
            background: 'var(--accent)',
            color: '#fff',
            borderRadius: 8,
            fontSize: 14, fontWeight: 600,
            boxShadow: '0 2px 12px rgba(124,106,247,0.4)',
            opacity: connecting ? 0.7 : 1,
            transition: 'all 0.2s',
          }}
        >
          {/* Discord logo */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.054a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
          </svg>
          {connecting ? 'Opening...' : 'Add Strata to Discord'}
        </button>

        <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 12 }}>
          After adding the bot, you will be redirected back automatically.
        </p>

        {/* Feature bullets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 32, alignItems: 'flex-start', width: '100%', maxWidth: 320 }}>
          {[
            'Sync your server members automatically',
            'Send recording invites as rich Discord DMs',
            'Ping confirmed attendees in your alerts channel',
          ].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Check />
              <span style={{ color: 'var(--text2)', fontSize: 13 }}>{f}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Connected ────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Connected badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 18px',
        background: 'rgba(77,172,125,0.05)',
        border: '1px solid rgba(77,172,125,0.2)',
        borderRadius: 10,
      }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: 'var(--text)', fontSize: 14, fontWeight: 500 }}>Discord connected</p>
          <p style={{ color: 'var(--text3)', fontSize: 12, fontFamily: 'monospace', marginTop: 2 }}>
            Server ID: {workspace.guild_id}
          </p>
        </div>
        <button
          onClick={handleDisconnect}
          style={{ color: 'var(--danger)', fontSize: 12, flexShrink: 0, transition: 'opacity 0.2s' }}
          onMouseEnter={e => e.target.style.opacity = '0.7'}
          onMouseLeave={e => e.target.style.opacity = '1'}
        >
          Disconnect
        </button>
      </div>

      {/* Alerts channel */}
      <div>
        <label style={{ display: 'block', color: 'var(--text3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          Alerts channel ID
        </label>
        <input
          value={alertsId}
          onChange={e => setAlertsId(e.target.value)}
          placeholder="123456789012345678"
          style={{ width: '100%', padding: '8px 12px', fontSize: 13, fontFamily: 'monospace', marginBottom: 8 }}
        />
        <p style={{ color: 'var(--text3)', fontSize: 12, marginBottom: 10, lineHeight: 1.5 }}>
          Right-click a Discord channel and select Copy Channel ID. Used by the Ping Confirmed action on video cards.
        </p>
        <button
          onClick={handleSaveAlerts}
          disabled={saving}
          style={{
            padding: '7px 16px', background: 'var(--accent)', color: '#fff',
            borderRadius: 6, fontSize: 13, fontWeight: 500,
            opacity: saving ? 0.6 : 1, transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(124,106,247,0.25)',
          }}
        >
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  )
}
