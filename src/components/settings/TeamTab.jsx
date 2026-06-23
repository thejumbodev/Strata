import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import CardPanel from '../cards/CardPanel'

// ── Palette helpers ───────────────────────────────────────────────────

const ROLE_AVATAR = {
  Editor:       { bg: 'rgba(96,165,250,0.2)',  text: '#93c5fd' },
  Animator:     { bg: 'rgba(167,139,250,0.2)', text: '#c4b5fd' },
  Thumbnail:    { bg: 'rgba(249,168,212,0.2)', text: '#f9a8d4' },
  Scriptwriter: { bg: 'rgba(253,230,138,0.2)', text: '#fde68a' },
  Videographer: { bg: 'rgba(103,232,249,0.2)', text: '#67e8f9' },
  Collaborator: { bg: 'rgba(155,154,151,0.2)', text: '#9b9a97' },
}

const ROLE_BADGE = {
  Editor:       { color: '#93c5fd', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.2)'   },
  Animator:     { color: '#c4b5fd', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)'  },
  Thumbnail:    { color: '#f9a8d4', bg: 'rgba(249,168,212,0.1)', border: 'rgba(249,168,212,0.2)'  },
  Scriptwriter: { color: '#fde68a', bg: 'rgba(253,230,138,0.1)', border: 'rgba(253,230,138,0.2)'  },
  Videographer: { color: '#67e8f9', bg: 'rgba(103,232,249,0.1)', border: 'rgba(103,232,249,0.2)'  },
  Collaborator: { color: 'var(--text2)', bg: 'rgba(255,255,255,0.05)', border: 'var(--border-hover)' },
}

const CARD_STATUS_PILL = {
  Ideas:    { bg: 'rgba(167,139,250,0.15)', color: '#c4b5fd' },
  Recorded: { bg: 'rgba(246,195,67,0.15)',  color: '#fbbf24' },
  Edited:   { bg: 'rgba(77,157,224,0.15)',  color: '#60b4e8' },
  Uploaded: { bg: 'rgba(62,207,142,0.15)',  color: '#34d399' },
}

const RSVP_COLOR = { accepted: 'var(--success)', declined: 'var(--danger)', pending: 'var(--text3)' }

// ── Sub-components ────────────────────────────────────────────────────

function StatPill({ label, value, accent }) {
  return (
    <div style={{
      padding: '14px 20px', flex: 1, minWidth: 0,
      background: accent ? 'rgba(124,106,247,0.08)' : 'var(--card)',
      border: `1px solid ${accent ? 'rgba(124,106,247,0.2)' : 'var(--border)'}`,
      borderRadius: 10,
    }}>
      <motion.div
        key={String(value)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        style={{ fontSize: 22, fontWeight: 700, color: accent ? 'var(--accent)' : 'var(--text)', lineHeight: 1.1 }}
      >
        {value}
      </motion.div>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text3)', marginTop: 5 }}>
        {label}
      </div>
    </div>
  )
}

function RateToggle({ value, onChange }) {
  return (
    <div style={{ display: 'inline-flex', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
      {[['per_video', 'Per video'], ['per_hour', 'Per hour']].map(([t, label]) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          style={{
            padding: '5px 10px', fontSize: 11, fontWeight: 500,
            background: value === t ? 'rgba(124,106,247,0.18)' : 'transparent',
            color: value === t ? 'var(--accent)' : 'var(--text3)',
            transition: 'all 0.15s',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ── Member card ───────────────────────────────────────────────────────

function MemberCard({ member, invites, allCards, onOpenCard, updateMember }) {
  const [rateType, setRateType]     = useState(member.rate_type  || 'per_video')
  const [rateAmount, setRateAmount] = useState(Number(member.rate_amount) || 0)
  const [hours, setHours]           = useState(0)
  const [rateSaved, setRateSaved]   = useState(false)
  const [rateError, setRateError]   = useState(false)
  const [expanded, setExpanded]     = useState(false)
  // Synchronous ref guard — prevents concurrent saves without blocking feedback
  const saveInFlight = useRef(false)

  // Re-sync local state when member prop changes (e.g. after context reload or
  // another component updates the same member).
  useEffect(() => {
    setRateType(member.rate_type  || 'per_video')
    setRateAmount(Number(member.rate_amount) || 0)
  }, [member.id, member.rate_type, member.rate_amount])

  const invited    = invites.length
  const confirmed  = invites.filter(i => i.rsvp === 'accepted').length
  const declined   = invites.filter(i => i.rsvp === 'declined').length
  const acceptance = invited > 0 ? Math.round((confirmed / invited) * 100) : null

  const estCost = rateAmount > 0
    ? (rateType === 'per_video' ? rateAmount * confirmed : rateAmount * hours)
    : 0

  const saveRate = async (type, amount) => {
    if (saveInFlight.current) return
    saveInFlight.current = true
    setRateError(false)
    const t = type   ?? rateType
    const a = amount ?? rateAmount
    const { error } = await updateMember(member.id, { rate_type: t, rate_amount: a })
    saveInFlight.current = false
    if (error) {
      console.error('[Strata] Rate save failed for', member.name, error)
      setRateError(true)
      setTimeout(() => setRateError(false), 3000)
    } else {
      setRateSaved(true)
      setTimeout(() => setRateSaved(false), 2000)
    }
  }

  const handleRateTypeChange = (t) => {
    setRateType(t)
    // Pass both values explicitly so we don't capture stale closure
    saveRate(t, rateAmount)
  }

  const handleRateAmountBlur = () => {
    saveRate(rateType, rateAmount)
  }

  const ra = ROLE_AVATAR[member.role] ?? ROLE_AVATAR.Collaborator
  const rb = ROLE_BADGE[member.role]  ?? ROLE_BADGE.Collaborator

  return (
    <div
      style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, transition: 'border-color 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* ── Top row ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>

        {/* Avatar + Name + Role */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 180 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: ra.bg, color: ra.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
            {member.name[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{member.name}</div>
            <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: rb.bg, color: rb.color, border: `1px solid ${rb.border}`, marginTop: 4, display: 'inline-block' }}>
              {member.role}
            </span>
          </div>
        </div>

        {/* Stats */}
        {invited > 0 ? (
          <div style={{ display: 'flex', gap: 28, flex: 1, minWidth: 260, flexWrap: 'wrap' }}>
            {[
              { label: 'Invited',    value: invited    },
              { label: 'Confirmed',  value: confirmed  },
              { label: 'Acceptance', value: acceptance !== null ? `${acceptance}%` : '—' },
              { label: 'Declined',   value: declined   },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', lineHeight: 1.1 }}>{value}</div>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text3)', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', minHeight: 40 }}>
            <span style={{ color: 'var(--text3)', fontSize: 13 }}>No data yet</span>
          </div>
        )}

        {/* Rate section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 190 }}>
          <RateToggle value={rateType} onChange={handleRateTypeChange} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden', background: 'var(--input)' }}>
              <span style={{ color: 'var(--text3)', fontSize: 13, padding: '5px 0 5px 8px' }}>$</span>
              <input
                type="number"
                value={rateAmount || ''}
                onChange={e => setRateAmount(Number(e.target.value) || 0)}
                onBlur={handleRateAmountBlur}
                min={0} step={0.01}
                placeholder="0"
                style={{ width: 64, padding: '5px 8px 5px 2px', fontSize: 13, fontFamily: 'monospace', background: 'transparent', border: 'none' }}
              />
            </div>

            {rateType === 'per_hour' && (
              <>
                <span style={{ color: 'var(--text3)', fontSize: 12 }}>×</span>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden', background: 'var(--input)' }}>
                  <input
                    type="number"
                    value={hours || ''}
                    onChange={e => setHours(Number(e.target.value) || 0)}
                    min={0} step={0.5}
                    placeholder="0"
                    style={{ width: 46, padding: '5px 6px', fontSize: 13, background: 'transparent', border: 'none' }}
                  />
                  <span style={{ color: 'var(--text3)', fontSize: 11, paddingRight: 6 }}>hr</span>
                </div>
              </>
            )}

            {rateSaved && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--success)', fontSize: 11, whiteSpace: 'nowrap' }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 5l2.5 2.5 5-5"/></svg>
                Saved
              </span>
            )}
            {rateError && (
              <span style={{ color: 'var(--danger)', fontSize: 11, whiteSpace: 'nowrap' }}>
                Save failed
              </span>
            )}
          </div>

          {estCost > 0 && (
            <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
              ${estCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} est.
            </div>
          )}
        </div>
      </div>

      {/* ── View videos ── */}
      {invited > 0 && (
        <div style={{ marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
          <button
            onClick={() => setExpanded(p => !p)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text3)', fontSize: 12, fontWeight: 500, transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text2)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}
          >
            <svg
              width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
              style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
            >
              <path d="M2 4l4 4 4-4"/>
            </svg>
            {expanded ? 'Hide videos' : `View videos (${invited})`}
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10 }}>
                  {invites.map(inv => {
                    const card = allCards.find(c => c.id === inv.card_id)
                    if (!card) return null
                    const cs = CARD_STATUS_PILL[card.status] ?? CARD_STATUS_PILL.Ideas
                    return (
                      <div
                        key={inv.id}
                        onClick={() => onOpenCard(card.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 6, background: 'var(--surface)', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
                      >
                        <span style={{ flex: 1, color: 'var(--text2)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {card.title}
                        </span>
                        <span style={{ fontSize: 11, color: RSVP_COLOR[inv.rsvp] ?? RSVP_COLOR.pending, flexShrink: 0, textTransform: 'capitalize' }}>
                          {inv.rsvp}
                        </span>
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: cs.bg, color: cs.color, flexShrink: 0 }}>
                          {card.status}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

// ── Main TeamTab export ────────────────────────────────────────────────

export default function TeamTab() {
  const { members, channels, updateMember } = useWorkspace()

  const [allCards, setAllCards]   = useState([])
  const [allInvites, setAllInvites] = useState([])
  const [loading, setLoading]     = useState(false)
  const [channelFilter, setChannelFilter] = useState('all')
  const [selectedCard, setSelectedCard]   = useState(null)
  const [isPanelExpanded, setPanelExpanded] = useState(false)

  // Fetch all cards + invites for the workspace on mount / channel change
  useEffect(() => {
    if (!channels.length) return
    loadData()
  }, [channels]) // eslint-disable-line

  async function loadData() {
    setLoading(true)
    const channelIds = channels.map(c => c.id)

    const { data: cards, error: cErr } = await supabase
      .from('cards')
      .select('id, title, status, channel_id')
      .in('channel_id', channelIds)

    if (cErr) { console.error('[Strata] TeamTab cards error:', cErr); setLoading(false); return }
    setAllCards(cards ?? [])

    const cardIds = (cards ?? []).map(c => c.id)
    if (!cardIds.length) { setAllInvites([]); setLoading(false); return }

    const { data: invites, error: iErr } = await supabase
      .from('card_invites')
      .select('id, member_id, rsvp, card_id')
      .in('card_id', cardIds)

    if (iErr) console.error('[Strata] TeamTab invites error:', iErr)
    setAllInvites(invites ?? [])
    setLoading(false)
  }

  // Filtered view
  const filteredCards = channelFilter === 'all'
    ? allCards
    : allCards.filter(c => c.channel_id === channelFilter)

  const filteredCardIds = new Set(filteredCards.map(c => c.id))
  const filteredInvites = allInvites.filter(inv => filteredCardIds.has(inv.card_id))

  // Summary: total estimated cost (per_video members only; per_hour requires local hours)
  const totalEstCost = members.reduce((sum, m) => {
    if ((m.rate_type ?? 'per_video') !== 'per_video') return sum
    const confirmed = filteredInvites.filter(i => i.member_id === m.id && i.rsvp === 'accepted').length
    return sum + (Number(m.rate_amount) || 0) * confirmed
  }, 0)

  // Card panel open/close
  const handleOpenCard = async (cardId) => {
    const { data } = await supabase
      .from('cards')
      .select('*, card_invites(id, member_id, rsvp, members(id, name, role, discord_user_id))')
      .eq('id', cardId)
      .single()
    if (data) setSelectedCard(data)
  }

  const handleCardUpdate = (updated) => {
    setAllCards(prev => prev.map(c =>
      c.id === updated.id
        ? { id: updated.id, title: updated.title, status: updated.status, channel_id: updated.channel_id }
        : c
    ))
    if (updated.card_invites) {
      setAllInvites(prev => {
        const others = prev.filter(i => i.card_id !== updated.id)
        const fresh  = updated.card_invites.map(i => ({ id: i.id, member_id: i.member_id, rsvp: i.rsvp, card_id: updated.id }))
        return [...others, ...fresh]
      })
    }
    setSelectedCard(updated)
  }

  const handleCardDelete = (id) => {
    setAllCards(prev => prev.filter(c => c.id !== id))
    setAllInvites(prev => prev.filter(i => i.card_id !== id))
    setSelectedCard(null)
  }

  const selectedChannel = channels.find(c => c.id === selectedCard?.channel_id)

  // ── Render ──

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ color: 'var(--text)', fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>
          Team overview
        </h2>
        <select
          value={channelFilter}
          onChange={e => setChannelFilter(e.target.value)}
          style={{ padding: '6px 28px 6px 10px', fontSize: 13, minWidth: 150 }}
        >
          <option value="all">All channels</option>
          {channels.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
        </select>
      </div>

      {/* Summary stat pills */}
      <div style={{ display: 'flex', gap: 12 }}>
        <StatPill label="Members" value={members.length} />
        <StatPill
          label="Videos in pipeline"
          value={filteredCards.length}
        />
        <StatPill
          label="Est. total cost"
          value={`$${totalEstCost.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          accent
        />
      </div>

      {/* No members */}
      {members.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text3)', fontSize: 13, lineHeight: 1.7, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10 }}>
          No team members yet.
          <br />
          Add members in the <span style={{ color: 'var(--text2)', fontWeight: 500 }}>Team Members</span> tab to start tracking participation.
        </div>
      )}

      {/* Members exist but no invites */}
      {members.length > 0 && filteredInvites.length === 0 && !loading && (
        <p style={{ color: 'var(--text3)', fontSize: 13, lineHeight: 1.6 }}>
          Invite team members to video recordings to start tracking participation.
        </p>
      )}

      {/* Member cards */}
      {members.map(member => (
        <MemberCard
          key={member.id}
          member={member}
          invites={filteredInvites.filter(i => i.member_id === member.id)}
          allCards={filteredCards}
          onOpenCard={handleOpenCard}
          updateMember={updateMember}
        />
      ))}

      {/* Card side panel (fixed, slides in from right) */}
      <AnimatePresence>
        {selectedCard && (
          <CardPanel
            key={selectedCard.id}
            card={selectedCard}
            channelId={selectedCard.channel_id}
            channelName={selectedChannel?.name ?? ''}
            fromPage="settings"
            isExpanded={isPanelExpanded}
            onExpandChange={setPanelExpanded}
            onClose={() => { setSelectedCard(null); setPanelExpanded(false) }}
            onUpdate={handleCardUpdate}
            onCreate={() => {}}
            onDelete={handleCardDelete}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
