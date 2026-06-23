import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import ThumbnailUpload from './ThumbnailUpload'
import DateTimePicker from './DateTimePicker'
import RichTextEditor from './RichTextEditor'
import InvitePanel from './InvitePanel'

const STATUSES = ['Ideas', 'Recorded', 'Edited', 'Uploaded']

const STATUS = {
  Ideas:    { bg: 'rgba(167,139,250,0.12)', color: '#c4b5fd', border: 'rgba(196,181,253,0.3)' },
  Recorded: { bg: 'rgba(246,195,67,0.12)',  color: '#fbbf24', border: 'rgba(251,191,36,0.3)'  },
  Edited:   { bg: 'rgba(77,157,224,0.12)',  color: '#60b4e8', border: 'rgba(96,180,232,0.3)'  },
  Uploaded: { bg: 'rgba(62,207,142,0.12)',  color: '#34d399', border: 'rgba(52,211,153,0.3)'  },
}

const ROLE_AVATAR = {
  Editor:       { bg: 'rgba(96,165,250,0.2)',  text: '#93c5fd' },
  Animator:     { bg: 'rgba(167,139,250,0.2)', text: '#c4b5fd' },
  Thumbnail:    { bg: 'rgba(249,168,212,0.2)', text: '#f9a8d4' },
  Scriptwriter: { bg: 'rgba(253,230,138,0.2)', text: '#fde68a' },
  Videographer: { bg: 'rgba(103,232,249,0.2)', text: '#67e8f9' },
  Collaborator: { bg: 'rgba(155,154,151,0.2)', text: '#9b9a97' },
}

function parseNotes(raw) {
  if (!raw) return null
  if (typeof raw === 'object') return raw
  if (typeof raw === 'string') {
    try { const p = JSON.parse(raw); if (p?.type === 'doc') return p } catch {}
  }
  return null
}

function fmtReadable(dt) {
  if (!dt) return null
  const d = new Date(dt)
  const date = d.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  return `${date} at ${time}`
}

const BLANK = { id: null, title: '', thumb_url: '', notes: null, record_datetime: null, status: 'Ideas', card_invites: [] }

function SectionDivider() {
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '20px 0' }} />
}

function SectionLabel({ children }) {
  return (
    <p style={{ color: 'var(--text3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
      {children}
    </p>
  )
}

function IconBtn({ onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, color: 'var(--text3)', transition: 'all 0.2s', flexShrink: 0 }}
      onMouseEnter={e => { e.currentTarget.style.color = 'var(--text2)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.background = 'transparent' }}
    >
      {children}
    </button>
  )
}

const CloseIcon = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M1 1l9 9M10 1L1 10"/>
  </svg>
)

export default function CardPanel({
  card, initialStatus, channelId, channelName, fromPage,
  isExpanded, onExpandChange,
  onClose, onUpdate, onCreate, onDelete,
}) {
  const isNew = !card
  const [local, setLocal] = useState(
    isNew ? { ...BLANK, status: initialStatus } : { ...card, notes: parseNotes(card?.notes) }
  )
  const [invites, setInvites]         = useState(card?.card_invites ?? [])
  const [tab, setTab]                 = useState('details')
  const [saveStatus, setSave]         = useState('idle')
  const [showDatePicker, setShowDate] = useState(false)
  const [showInvites, setShowInvites] = useState(false)
  const localRef  = useRef(local)
  const invRef    = useRef(invites)
  const timerRef  = useRef(null)

  useEffect(() => { localRef.current = local }, [local])
  useEffect(() => { invRef.current = invites }, [invites])

  // Fetch fresh invites from Supabase whenever this card opens.
  // The prop value (card?.card_invites) may be stale if invites were
  // added or RSVP'd since the card list was last loaded.
  useEffect(() => {
    if (isNew || !local.id) return
    console.log('[Strata] CardPanel: fetching invites for card', local.id)
    supabase
      .from('card_invites')
      .select('id, member_id, rsvp, members(id, name, role, discord_user_id)')
      .eq('card_id', local.id)
      .then(({ data, error }) => {
        if (error) {
          console.error('[Strata] CardPanel fetchInvites error:', error)
        } else {
          console.log('[Strata] CardPanel: invites loaded', data?.length ?? 0)
          setInvites(data ?? [])
        }
      })
  }, [local.id]) // eslint-disable-line

  // Escape collapses full-page back to side panel (never closes)
  useEffect(() => {
    if (!isExpanded) return
    const handler = (e) => { if (e.key === 'Escape') onExpandChange(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isExpanded, onExpandChange])

  // 1 second debounce in full-page (spec), 700ms in side panel
  const persist = (delay) => {
    const ms = delay ?? (isExpanded ? 1000 : 700)
    setSave('saving')
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      const c = localRef.current
      if (!c.id) return
      const { error } = await supabase.from('cards').update({
        title:           c.title,
        thumb_url:       c.thumb_url || null,
        notes:           c.notes     || null,
        record_datetime: c.record_datetime || null,
        status:          c.status,
      }).eq('id', c.id)
      if (error) {
        console.error('[Strata] Card save error:', error); setSave('idle')
      } else {
        onUpdate({ ...c, card_invites: invRef.current })
        setSave('saved')
        setTimeout(() => setSave('idle'), 2000)
      }
    }, ms)
  }

  const set = (key, value, immediate = false) => {
    setLocal(prev => { const next = { ...prev, [key]: value }; localRef.current = next; return next })
    if (!isNew) persist(immediate ? 80 : undefined)
  }

  const cycleStatus = () => {
    const next = STATUSES[(STATUSES.indexOf(local.status) + 1) % STATUSES.length]
    set('status', next, true)
  }

  const handleSaveNew = async () => {
    if (!local.title.trim()) return
    setSave('saving')
    const { data, error } = await supabase.from('cards')
      .insert({
        channel_id: channelId, title: local.title.trim(),
        thumb_url: local.thumb_url || null, notes: local.notes || null,
        record_datetime: local.record_datetime || null, status: local.status,
      })
      .select('*, card_invites(id, member_id, rsvp, members(id, name, role, discord_user_id))')
      .single()
    if (error) { console.error('[Strata] Card create error:', error); setSave('idle') }
    else { setSave('idle'); onCreate(data) }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this video? This cannot be undone.')) return
    await supabase.from('cards').delete().eq('id', local.id)
    onDelete(local.id); onClose()
  }

  const st        = STATUS[local.status] ?? STATUS.Ideas
  const backLabel = `Back to ${fromPage || 'board'}`

  const StatusBadge = () => (
    <button
      onClick={cycleStatus}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0, background: st.bg, color: st.color, padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500, border: `1px solid ${st.border}`, transition: 'all 0.2s' }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.color, flexShrink: 0 }} />
      {local.status}
    </button>
  )

  const SaveBadge = () => (
    <span style={{ fontSize: 11, color: saveStatus === 'saved' ? 'var(--success)' : 'var(--text3)', flexShrink: 0 }}>
      {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : ''}
    </span>
  )

  // ════════════════════════════════════════════════════════════════════
  // MOTION WRAPPER — Framer Motion animates both x (slide) and width (expand)
  // ════════════════════════════════════════════════════════════════════
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0, width: isExpanded ? '100vw' : 420 }}
      exit={{ x: '100%' }}
      transition={{
        x:     { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] },
        width: { duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] },
      }}
      className="fixed flex flex-col overflow-hidden"
      style={{ right: 0, top: 44, height: 'calc(100vh - 44px)', background: 'var(--surface)', borderLeft: `4px solid ${st.color}55`, boxShadow: '-4px 0 32px rgba(0,0,0,0.5)', zIndex: 40 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isExpanded ? (

          // ════════════════════════════════════════════════════════════
          // FULL-PAGE — Notion-style single-column document view
          // ════════════════════════════════════════════════════════════
          <motion.div
            key="full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
          >
            {/* ── Top bar ─────────────────────────────────────────── */}
            <div style={{ flexShrink: 0, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {/* Back */}
              <button
                onClick={() => onExpandChange(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text3)', fontSize: 12, fontWeight: 500, transition: 'color 0.2s', flexShrink: 0 }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text2)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 2L4 7l5 5"/>
                </svg>
                {backLabel}
              </button>

              {/* Right: status + save + close */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <StatusBadge />
                <SaveBadge />
                <IconBtn onClick={onClose} title="Close"><CloseIcon /></IconBtn>
              </div>
            </div>

            {/* ── Document body (scrollable) ───────────────────────── */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 20px 80px' }}>

                {/* Thumbnail — 16:9, full width */}
                <ThumbnailUpload
                  value={local.thumb_url || null}
                  onChange={v => set('thumb_url', v, true)}
                  fullPage
                />

                {/* Title — large editable heading */}
                <input
                  value={local.title}
                  onChange={e => set('title', e.target.value)}
                  onBlur={() => !isNew && persist(50)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); persist(50); e.currentTarget.blur() } }}
                  placeholder="Untitled video"
                  style={{
                    display: 'block', width: '100%',
                    marginTop: local.thumb_url ? 28 : 20,
                    background: 'transparent', border: 'none', outline: 'none',
                    color: 'var(--text)', fontSize: 28, fontWeight: 700,
                    letterSpacing: '-0.02em', lineHeight: 1.2,
                    padding: 0,
                  }}
                />

                {/* Metadata row: date · status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setShowDate(p => !p)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 9px', borderRadius: 5,
                      background: showDatePicker ? 'rgba(255,255,255,0.06)' : 'transparent',
                      border: '1px solid',
                      borderColor: showDatePicker ? 'var(--border-hover)' : 'var(--border)',
                      color: local.record_datetime ? 'var(--text2)' : 'var(--text3)',
                      fontSize: 12, transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { if (!showDatePicker) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'var(--border-hover)' } }}
                    onMouseLeave={e => { if (!showDatePicker) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)' } }}
                  >
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                      <rect x="1" y="2" width="10" height="9" rx="1.5"/><path d="M4 1v2M8 1v2M1 5h10"/>
                    </svg>
                    {local.record_datetime ? fmtReadable(local.record_datetime) : 'Add recording date'}
                  </button>

                  <span style={{ color: 'var(--text3)', fontSize: 11 }}>·</span>
                  <StatusBadge />
                </div>

                {/* Date/time picker — inline toggle, smooth height */}
                <AnimatePresence>
                  {showDatePicker && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ paddingTop: 14, paddingBottom: 4 }}>
                        <DateTimePicker
                          value={local.record_datetime}
                          onChange={v => set('record_datetime', v)}
                        />
                        <button
                          onClick={() => setShowDate(false)}
                          style={{ marginTop: 10, fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}
                        >
                          Done
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Invites row — avatar circles, click to expand */}
                {!isNew && (
                  <>
                    <div
                      onClick={() => setShowInvites(p => !p)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, cursor: 'pointer', userSelect: 'none' }}
                    >
                      {invites.length > 0 ? (
                        <>
                          {/* Avatar stack */}
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {invites.slice(0, 6).map((inv, i) => {
                              const role  = inv.members?.role ?? 'Collaborator'
                              const ra    = ROLE_AVATAR[role] ?? ROLE_AVATAR.Collaborator
                              return (
                                <div
                                  key={inv.id}
                                  title={`${inv.members?.name ?? '?'} — ${inv.rsvp}`}
                                  style={{
                                    width: 22, height: 22, borderRadius: '50%',
                                    background: ra.bg, color: ra.text,
                                    border: '1.5px solid var(--surface)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 9, fontWeight: 700,
                                    marginLeft: i === 0 ? 0 : -6,
                                  }}
                                >
                                  {(inv.members?.name ?? '?')[0].toUpperCase()}
                                </div>
                              )
                            })}
                            {invites.length > 6 && (
                              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1.5px solid var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'var(--text3)', marginLeft: -6 }}>
                                +{invites.length - 6}
                              </div>
                            )}
                          </div>
                          <span style={{ color: 'var(--text3)', fontSize: 12 }}>
                            {invites.length} invited
                            {invites.filter(i => i.rsvp === 'accepted').length > 0 && `, ${invites.filter(i => i.rsvp === 'accepted').length} confirmed`}
                          </span>
                        </>
                      ) : (
                        <span style={{ color: 'var(--text3)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                            <circle cx="6" cy="5" r="2.5"/><path d="M1 12c0-2.2 2-3.5 5-3.5s5 1.3 5 3.5"/>
                            <path d="M10.5 4v4M12.5 6h-4"/>
                          </svg>
                          Invite team members
                        </span>
                      )}
                      <svg
                        width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                        style={{ color: 'var(--text3)', marginLeft: 2, transform: showInvites ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
                      >
                        <path d="M2 4l4 4 4-4"/>
                      </svg>
                    </div>

                    {/* Inline invites panel */}
                    <AnimatePresence>
                      {showInvites && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={{ paddingTop: 16, paddingBottom: 4 }}>
                            <InvitePanel
                              card={{ ...local, card_invites: invites }}
                              channelName={channelName}
                              onInvitesChange={setInvites}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}

                {/* Divider before notes */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '28px 0 24px' }} />

                {/* Notes — full-height TipTap, no label */}
                <RichTextEditor
                  content={local.notes}
                  onChange={v => set('notes', v)}
                  fullPage
                />

                {/* Delete link at the very bottom */}
                {!isNew && (
                  <div style={{ marginTop: 48, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button
                      onClick={handleDelete}
                      style={{ color: 'var(--danger)', fontSize: 12, opacity: 0.7, transition: 'opacity 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
                    >
                      Delete video
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

        ) : (

          // ════════════════════════════════════════════════════════════
          // SIDE PANEL — unchanged
          // ════════════════════════════════════════════════════════════
          <motion.div
            key="panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
          >
            {/* Header */}
            <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
                <input
                  value={local.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder="Give this video a title..."
                  autoFocus={isNew}
                  style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 22, fontWeight: 600, lineHeight: 1.25, padding: 0, letterSpacing: '-0.02em' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, paddingTop: 4 }}>
                  <IconBtn onClick={() => onExpandChange(true)} title="Expand to full page">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M1 4.5V1h3.5M12 4.5V1H8.5M1 8.5V12h3.5M12 8.5V12H8.5"/>
                    </svg>
                  </IconBtn>
                  <IconBtn onClick={onClose} title="Close"><CloseIcon /></IconBtn>
                </div>
              </div>
              <StatusBadge />
            </div>

            {/* Tab bar */}
            {!isNew && (
              <div style={{ display: 'flex', alignItems: 'stretch', flexShrink: 0, paddingLeft: 20, paddingRight: 20, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['details', 'invites'].map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    style={{ color: tab === t ? 'var(--text)' : 'var(--text3)', borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent', fontSize: 12, fontWeight: 500, textTransform: 'capitalize', padding: '10px 0', marginRight: 20, marginBottom: -1, transition: 'all 0.2s' }}
                  >
                    {t}
                    {t === 'invites' && invites.length > 0 && <span style={{ marginLeft: 5, color: 'var(--text3)', fontSize: 10 }}>{invites.length}</span>}
                  </button>
                ))}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', fontSize: 11 }}>
                  {saveStatus === 'saving' && <span style={{ color: 'var(--text3)' }}>Saving...</span>}
                  {saveStatus === 'saved'  && <span style={{ color: 'var(--success)' }}>Saved</span>}
                </div>
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {(tab === 'details' || isNew) && (
                <div style={{ padding: '20px 22px' }}>
                  <div><SectionLabel>Thumbnail</SectionLabel><ThumbnailUpload value={local.thumb_url || null} onChange={v => set('thumb_url', v, true)} /></div>
                  <SectionDivider />
                  <div><SectionLabel>Recording date and time</SectionLabel><DateTimePicker value={local.record_datetime} onChange={v => set('record_datetime', v)} /></div>
                  <SectionDivider />
                  <div><SectionLabel>Notes and brief</SectionLabel><RichTextEditor content={local.notes} onChange={v => set('notes', v)} /></div>
                </div>
              )}
              {tab === 'invites' && !isNew && (
                <div style={{ padding: '20px 22px' }}>
                  <InvitePanel card={{ ...local, card_invites: invites }} channelName={channelName} onInvitesChange={setInvites} />
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
              {!isNew
                ? <button onClick={handleDelete} style={{ color: 'var(--danger)', fontSize: 12, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = '0.7'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>Delete video</button>
                : <div />
              }
              {isNew && (
                <button onClick={handleSaveNew} disabled={!local.title.trim()} style={{ background: 'var(--accent)', color: '#fff', padding: '7px 16px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500, boxShadow: '0 2px 8px rgba(124,106,247,0.3)', opacity: local.title.trim() ? 1 : 0.4, transition: 'all 0.2s' }}>
                  Create video
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
