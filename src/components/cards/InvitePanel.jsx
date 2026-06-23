import { useState, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { sendInvite, pingAlerts } from '../../lib/discord'

const RSVP_COLOR = { pending: 'var(--text3)', accepted: 'var(--success)', declined: 'var(--danger)' }
const RSVP_LABEL = { pending: 'Pending', accepted: 'Accepted', declined: 'Declined' }

const isSnowflake = id => /^\d{15,}$/.test(String(id ?? ''))

export default function InvitePanel({ card, channelName, onInvitesChange }) {
  const { workspace, members } = useWorkspace()

  const [search, setSearch]   = useState('')
  const [sending, setSending] = useState({})
  const [pinging, setPinging] = useState(false)
  const [error, setError]     = useState(null)

  // Display workspace members filtered by search
  const displayMembers = useMemo(() => {
    const q = search.toLowerCase()
    return members.filter(m => m.name.toLowerCase().includes(q))
  }, [members, search])

  const invitedIds = new Set(card.card_invites.map(i => i.member_id))

  const handleToggle = async (member) => {
    setError(null)
    if (invitedIds.has(member.id)) {
      // ── DELETE ──────────────────────────────────────────────────────
      console.log('[Strata] InvitePanel: removing invite', { card_id: card.id, member_id: member.id })
      const { error } = await supabase
        .from('card_invites')
        .delete()
        .eq('card_id', card.id)
        .eq('member_id', member.id)
      if (error) {
        console.error('[Strata] InvitePanel delete error:', error)
        setError(error.message)
        return
      }
      console.log('[Strata] InvitePanel: invite removed OK')
      onInvitesChange(prev => prev.filter(i => i.member_id !== member.id))
    } else {
      // ── INSERT ──────────────────────────────────────────────────────
      console.log('[Strata] InvitePanel: inserting invite', { card_id: card.id, member_id: member.id })
      const { data, error } = await supabase
        .from('card_invites')
        .insert({ card_id: card.id, member_id: member.id, rsvp: null })
        .select('id, member_id, rsvp, members(id, name, role, discord_user_id)')
        .single()
      if (error) {
        console.error('[Strata] InvitePanel insert error:', error)
        setError(error.message)
        return
      }
      console.log('[Strata] InvitePanel: invite inserted OK', data)
      onInvitesChange(prev => [...prev, data])
    }
  }

  const handleSendInvite = async (member) => {
    setError(null)
    if (!isSnowflake(member.discord_user_id)) {
      setError('No Discord ID linked. Edit this member in Settings to add one.')
      return
    }
    if (!card.record_datetime) { setError('Set a recording date in the Details tab first.'); return }

    setSending(p => ({ ...p, [member.id]: true }))
    try {
      await sendInvite({
        userId:        member.discord_user_id,
        memberId:      member.id,
        cardId:        card.id,
        channelName:   channelName ?? '',
        title:         card.title,
        unixTimestamp: Math.floor(new Date(card.record_datetime).getTime() / 1000),
      })
    } catch (err) {
      setError(`DM failed: ${err.message}`)
    } finally {
      setSending(p => ({ ...p, [member.id]: false }))
    }
  }

  const handlePingAlerts = async () => {
    setError(null)
    if (!workspace?.alerts_channel_id) {
      setError('Set an alerts channel ID in Settings first.')
      return
    }
    const confirmed = card.card_invites.filter(i => i.rsvp === 'accepted')
    if (!confirmed.length) { setError('No confirmed attendees to ping yet.'); return }

    setPinging(true)
    try {
      const userIds = confirmed.map(i => i.members?.discord_user_id).filter(isSnowflake)
      await pingAlerts({ channelId: workspace.alerts_channel_id, userIds, title: card.title })
    } catch (err) {
      setError(`Ping failed: ${err.message}`)
    } finally {
      setPinging(false)
    }
  }

  const confirmedCount = card.card_invites.filter(i => i.rsvp === 'accepted').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Error banner */}
      {error && (
        <div style={{ background: 'rgba(224,82,82,0.08)', border: '1px solid rgba(224,82,82,0.2)', borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span style={{ color: 'var(--danger)', fontSize: 13, flex: 1, lineHeight: 1.5 }}>{error}</span>
          <button onClick={() => setError(null)} style={{ color: 'rgba(224,82,82,0.5)', fontSize: 16, lineHeight: 1, flexShrink: 0 }}>×</button>
        </div>
      )}

      {/* Search + ping */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="var(--text3)" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="5" cy="5" r="3.5"/><path d="M8 8l2.5 2.5"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search members..."
            style={{ width: '100%', paddingLeft: 30, paddingRight: 12, paddingTop: 7, paddingBottom: 7, fontSize: 13 }}
          />
        </div>
        <button
          onClick={handlePingAlerts}
          disabled={pinging}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: 'var(--card)', border: '1px solid var(--border-hover)', borderRadius: 6, color: 'var(--text2)', fontSize: 12, whiteSpace: 'nowrap', opacity: pinging ? 0.5 : 1, transition: 'all 0.2s' }}
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
            <path d="M6 1C3.8 1 2 2.8 2 5v3l-1 2h10l-1-2V5c0-2.2-1.8-4-4-4z"/>
            <path d="M4.5 10a1.5 1.5 0 003 0"/>
          </svg>
          {pinging ? 'Pinging...' : 'Ping confirmed'}
        </button>
      </div>

      <p style={{ color: 'var(--text3)', fontSize: 12 }}>
        {card.card_invites.length} invited, {confirmedCount} confirmed
      </p>

      {/* Member rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {displayMembers.length === 0 && (
          <p style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
            {search ? 'No members match that search.' : 'No members yet. Add them in Settings → Team Members.'}
          </p>
        )}

        {displayMembers.map(m => {
          const invite    = card.card_invites.find(i => i.member_id === m.id)
          const isInvited = !!invite
          const rsvp      = invite?.rsvp ?? 'pending'
          const hasId     = isSnowflake(m.discord_user_id)

          return (
            <div
              key={m.id}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, transition: 'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              {/* Avatar */}
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text2)', flexShrink: 0 }}>
                {m.name[0]?.toUpperCase() ?? '?'}
              </div>

              {/* Name + role */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.name}
                </div>
                {m.role && <div style={{ color: 'var(--text3)', fontSize: 11 }}>{m.role}</div>}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {isInvited && (
                  <>
                    <span style={{ fontSize: 11, color: RSVP_COLOR[rsvp] }}>{RSVP_LABEL[rsvp]}</span>
                    {hasId ? (
                      <button
                        onClick={() => handleSendInvite(m)}
                        disabled={sending[m.id]}
                        style={{ padding: '3px 8px', fontSize: 11, background: 'rgba(88,101,242,0.1)', color: '#7c8cf8', border: '1px solid rgba(88,101,242,0.2)', borderRadius: 6, opacity: sending[m.id] ? 0.5 : 1, transition: 'all 0.2s' }}
                      >
                        {sending[m.id] ? '...' : 'DM'}
                      </button>
                    ) : (
                      <span
                        title="No Discord ID linked"
                        style={{ padding: '3px 8px', fontSize: 11, background: 'rgba(255,255,255,0.04)', color: 'var(--text3)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'not-allowed', userSelect: 'none' }}
                      >
                        DM
                      </span>
                    )}
                  </>
                )}
                <button
                  onClick={() => handleToggle(m)}
                  style={{ padding: '3px 10px', fontSize: 11, borderRadius: 6, border: '1px solid', borderColor: isInvited ? 'var(--border-hover)' : 'rgba(124,106,247,0.3)', color: isInvited ? 'var(--text3)' : 'var(--accent)', background: 'transparent', transition: 'all 0.2s' }}
                >
                  {isInvited ? 'Remove' : 'Invite'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
