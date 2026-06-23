import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useWorkspace } from '../contexts/WorkspaceContext'
import CardPanel from '../components/cards/CardPanel'

// ── Constants ─────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

const STATUS_PILL = {
  Ideas:    { bg: 'rgba(167,139,250,0.15)', color: '#c4b5fd', border: 'rgba(167,139,250,0.3)' },
  Recorded: { bg: 'rgba(246,195,67,0.15)',  color: '#fbbf24', border: 'rgba(246,195,67,0.3)'  },
  Edited:   { bg: 'rgba(77,157,224,0.15)',  color: '#60b4e8', border: 'rgba(77,157,224,0.3)'  },
  Uploaded: { bg: 'rgba(62,207,142,0.15)',  color: '#34d399', border: 'rgba(62,207,142,0.3)'  },
}

// ── Helpers ───────────────────────────────────────────────────────────

function buildGrid(year, month) {
  // Builds 42 cells (6 rows × 7 cols), Monday-first
  const firstDay        = new Date(year, month, 1).getDay()          // 0=Sun
  const offset          = (firstDay + 6) % 7                          // 0=Mon, 6=Sun
  const daysInMonth     = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const cells = []

  // Tail of previous month
  for (let i = 0; i < offset; i++) {
    const d = daysInPrevMonth - offset + 1 + i
    cells.push({ day: d, date: new Date(year, month - 1, d), current: false })
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, date: new Date(year, month, d), current: true })
  }
  // Head of next month
  let next = 1
  while (cells.length < 42) {
    cells.push({ day: next, date: new Date(year, month + 1, next), current: false })
    next++
  }

  return cells
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  )
}

function fmtTime(dt) {
  return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// ── Main component ────────────────────────────────────────────────────

export default function CalendarPage() {
  const { channels } = useWorkspace()

  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const [cards, setCards]     = useState([])
  const [loading, setLoading] = useState(false)

  const [selectedCard, setSelectedCard] = useState(null)
  const [isExpanded, setIsExpanded]     = useState(false)

  const [tooltip, setTooltip]           = useState(null)  // { card, x, y }
  const [showGoogleTip, setShowGoogleTip] = useState(false)

  // ── Data fetching ─────────────────────────────────────────────────

  const channelKey = channels.map(c => c.id).sort().join(',')

  const loadCards = useCallback(async () => {
    const ids = channels.map(c => c.id)
    if (!ids.length) return
    setLoading(true)
    const { data, error } = await supabase
      .from('cards')
      .select('*, card_invites(id, member_id, rsvp, members(id, name, role, discord_user_id))')
      .in('channel_id', ids)
      .not('record_datetime', 'is', null)
      .order('record_datetime')
    if (!error) setCards(data ?? [])
    setLoading(false)
  }, [channelKey]) // eslint-disable-line

  useEffect(() => { loadCards() }, [loadCards])

  // ── Month navigation ──────────────────────────────────────────────

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }
  const goToday = () => { setYear(now.getFullYear()); setMonth(now.getMonth()) }

  // ── Derived data ──────────────────────────────────────────────────

  const cells      = buildGrid(year, month)
  const today      = new Date()

  const monthCards = cards.filter(c => {
    const d = new Date(c.record_datetime)
    return d.getFullYear() === year && d.getMonth() === month
  })

  const getCardsForCell = (date) =>
    monthCards.filter(c => sameDay(new Date(c.record_datetime), date))

  // ── Card panel callbacks ──────────────────────────────────────────

  const handleCardUpdate = (updated) => {
    setCards(prev => prev.map(c => c.id === updated.id ? updated : c))
    setSelectedCard(updated)
  }

  const handleCardDelete = (id) => {
    setCards(prev => prev.filter(c => c.id !== id))
    setSelectedCard(null)
  }

  const selectedChannel = channels.find(c => c.id === selectedCard?.channel_id)

  // ── NavButton sub-component ───────────────────────────────────────

  const NavBtn = ({ onClick, children }) => (
    <button
      onClick={onClick}
      style={{
        width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 6, color: 'var(--text3)', border: '1px solid var(--border)',
        background: 'transparent', transition: 'all 0.2s', flexShrink: 0,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text2)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)';       e.currentTarget.style.color = 'var(--text3)' }}
    >
      {children}
    </button>
  )

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ position: 'relative' }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div
        style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px', height: 52, borderBottom: '1px solid var(--border)',
        }}
      >
        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <NavBtn onClick={prevMonth}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M8 2L4 6.5 8 11"/>
            </svg>
          </NavBtn>

          <h2 style={{ color: 'var(--text)', fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', minWidth: 150, textAlign: 'center' }}>
            {MONTH_NAMES[month]} {year}
          </h2>

          <NavBtn onClick={nextMonth}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M5 2l4 4.5L5 11"/>
            </svg>
          </NavBtn>

          <button
            onClick={goToday}
            style={{
              padding: '5px 12px', fontSize: 12, fontWeight: 500, marginLeft: 4,
              color: 'var(--text3)', border: '1px solid var(--border)',
              borderRadius: 6, background: 'transparent', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text2)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)';       e.currentTarget.style.color = 'var(--text3)' }}
          >
            Today
          </button>
        </div>

        {/* Google Calendar sync */}
        <div style={{ position: 'relative' }}>
          <button
            onMouseEnter={() => setShowGoogleTip(true)}
            onMouseLeave={() => setShowGoogleTip(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '6px 14px', fontSize: 12, fontWeight: 500,
              color: 'var(--text3)', border: '1px solid var(--border)',
              borderRadius: 6, background: 'transparent',
              opacity: 0.65, cursor: 'default',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sync with Google Calendar
          </button>

          {showGoogleTip && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0,
              background: 'var(--card)', border: '1px solid var(--border-hover)',
              borderRadius: 6, padding: '6px 10px',
              fontSize: 11, color: 'var(--text3)',
              whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.4)', zIndex: 20,
            }}>
              Google Calendar sync coming soon
            </div>
          )}
        </div>
      </div>

      {/* ── Day column headers ──────────────────────────────────────── */}
      <div
        style={{
          flexShrink: 0,
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {DAY_NAMES.map(d => (
          <div
            key={d}
            style={{
              padding: '7px 8px', textAlign: 'center',
              fontSize: 11, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.07em',
              color: 'var(--text3)',
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* ── Calendar grid (animated on month change) ────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${year}-${month}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gridTemplateRows: 'repeat(6, 1fr)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {cells.map((cell, idx) => {
            const cellCards = getCardsForCell(cell.date)
            const isToday   = sameDay(cell.date, today)
            const isWeekend = cell.date.getDay() === 0 || cell.date.getDay() === 6
            const shown     = cellCards.length > 3 ? cellCards.slice(0, 2) : cellCards
            const moreCount = cellCards.length - 2

            return (
              <div
                key={idx}
                style={{
                  padding: '5px 6px 4px',
                  borderRight:  (idx + 1) % 7 === 0 ? 'none' : '1px solid var(--border)',
                  borderBottom: '1px solid var(--border)',
                  background:   isToday ? 'rgba(124,106,247,0.04)' : isWeekend ? 'rgba(255,255,255,0.01)' : 'transparent',
                  overflow: 'hidden',
                }}
              >
                {/* Day number */}
                <div
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 22, height: 22, borderRadius: '50%', marginBottom: 3,
                    background:  isToday ? 'var(--accent)' : 'transparent',
                    color:       !cell.current ? 'var(--text3)' : isToday ? '#fff' : 'var(--text2)',
                    fontSize:    12,
                    fontWeight:  isToday ? 700 : 400,
                    opacity:     !cell.current ? 0.35 : 1,
                    flexShrink:  0,
                  }}
                >
                  {cell.day}
                </div>

                {/* Card pills */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {shown.map(c => {
                    const st = STATUS_PILL[c.status] ?? STATUS_PILL.Ideas
                    return (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedCard(c); setIsExpanded(false) }}
                        onMouseEnter={e => {
                          const rect = e.currentTarget.getBoundingClientRect()
                          const above = rect.bottom + 96 > window.innerHeight
                          setTooltip({
                            card: c,
                            x: Math.min(rect.left, window.innerWidth - 220),
                            y: above ? rect.top - 88 : rect.bottom + 6,
                          })
                          e.currentTarget.style.transform = 'scale(1.02)'
                        }}
                        onMouseLeave={e => {
                          setTooltip(null)
                          e.currentTarget.style.transform = 'scale(1)'
                        }}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          padding: '2px 5px', borderRadius: 4,
                          background: st.bg, color: st.color,
                          border: `1px solid ${st.border}`,
                          fontSize: 11, fontWeight: 500,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          cursor: 'pointer',
                          transition: 'transform 0.15s ease',
                        }}
                      >
                        {c.title}
                      </button>
                    )
                  })}

                  {cellCards.length > 3 && (
                    <div style={{ fontSize: 10, color: 'var(--text3)', paddingLeft: 4, paddingTop: 1 }}>
                      +{moreCount} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Empty state overlay */}
          {monthCards.length === 0 && !loading && (
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              paddingBottom: 40,
            }}>
              <p style={{
                color: 'var(--text3)', fontSize: 13, textAlign: 'center',
                maxWidth: 300, lineHeight: 1.7,
              }}>
                No recordings scheduled this month.
                <br />
                Add a date to a video card to see it here.
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Tooltip ────────────────────────────────────────────────── */}
      {tooltip && (
        <div
          style={{
            position: 'fixed', left: tooltip.x, top: tooltip.y,
            zIndex: 60, pointerEvents: 'none',
            background: 'var(--card)', border: '1px solid var(--border-hover)',
            borderRadius: 8, padding: '10px 12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            minWidth: 160, maxWidth: 220,
          }}
        >
          <p style={{ color: 'var(--text)', fontSize: 12, fontWeight: 500, marginBottom: 6, lineHeight: 1.4 }}>
            {tooltip.card.title}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            {(() => {
              const st = STATUS_PILL[tooltip.card.status] ?? STATUS_PILL.Ideas
              return (
                <span style={{
                  padding: '1px 7px', borderRadius: 4,
                  fontSize: 10, fontWeight: 500,
                  background: st.bg, color: st.color,
                }}>
                  {tooltip.card.status}
                </span>
              )
            })()}
            <span style={{ color: 'var(--text3)', fontSize: 11 }}>
              {fmtTime(tooltip.card.record_datetime)}
            </span>
          </div>
        </div>
      )}

      {/* ── Side panel ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedCard && (
          <CardPanel
            key={selectedCard.id}
            card={selectedCard}
            initialStatus={selectedCard.status}
            channelId={selectedCard.channel_id}
            channelName={selectedChannel?.name ?? ''}
            fromPage="calendar"
            isExpanded={isExpanded}
            onExpandChange={setIsExpanded}
            onClose={() => { setSelectedCard(null); setIsExpanded(false) }}
            onUpdate={handleCardUpdate}
            onCreate={() => {}}
            onDelete={handleCardDelete}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
