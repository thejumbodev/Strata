import { useDraggable } from '@dnd-kit/core'

const STATUS_PILL = {
  Ideas:    { bg: 'rgba(167,139,250,0.12)', color: '#c4b5fd' },
  Recorded: { bg: 'rgba(246,195,67,0.12)',  color: '#fbbf24' },
  Edited:   { bg: 'rgba(77,157,224,0.12)',  color: '#60b4e8' },
  Uploaded: { bg: 'rgba(62,207,142,0.12)',  color: '#34d399' },
}

function fmtDate(dt) {
  if (!dt) return null
  return new Date(dt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Extract plain text from a TipTap JSON document for preview
function extractText(json) {
  if (!json) return ''
  if (typeof json === 'string') return ''
  const walk = node => {
    if (!node) return ''
    if (node.type === 'text') return node.text || ''
    if (Array.isArray(node.content)) return node.content.map(walk).join(' ')
    return ''
  }
  return walk(json).replace(/\s+/g, ' ').trim().slice(0, 120)
}

export default function VideoCard({ card, onClick }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id })

  const invites      = card.card_invites ?? []
  const acceptedCount = invites.filter(i => i.rsvp === 'accepted').length
  const pill          = STATUS_PILL[card.status] ?? STATUS_PILL.Ideas
  const notesText     = extractText(card.notes)

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="select-none overflow-hidden"
      style={{
        background:   'var(--card)',
        border:       '1px solid var(--border)',
        borderRadius: 10,
        cursor:       'pointer',
        opacity:      isDragging ? 0 : 1,
        transition:   'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, opacity 0.1s ease',
        boxShadow:    '0 1px 4px rgba(0,0,0,0.2)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform   = 'translateY(-2px)'
        e.currentTarget.style.boxShadow   = '0 8px 24px rgba(0,0,0,0.4)'
        e.currentTarget.style.borderColor = 'var(--border-hover)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform   = 'translateY(0)'
        e.currentTarget.style.boxShadow   = '0 1px 4px rgba(0,0,0,0.2)'
        e.currentTarget.style.borderColor = 'var(--border)'
      }}
    >
      {/* Thumbnail — 16:9, flush to card edge, top corners clipped by card radius */}
      {card.thumb_url && (
        <div style={{ aspectRatio: '16/9', overflow: 'hidden', background: 'var(--surface)' }}>
          <img
            src={card.thumb_url}
            alt=""
            draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => { e.target.parentElement.style.display = 'none' }}
          />
        </div>
      )}

      {/* Body */}
      <div style={{ padding: '10px 12px 6px 12px' }}>
        <h3 style={{
          color: 'var(--text)', fontSize: 13.5, fontWeight: 500, lineHeight: 1.4,
          marginBottom: 7,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {card.title}
        </h3>

        {card.record_datetime && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" style={{ color: 'var(--text3)', flexShrink: 0 }}>
              <rect x="1" y="2" width="10" height="9" rx="1.5"/>
              <path d="M4 1v2M8 1v2M1 5h10"/>
            </svg>
            <span style={{ color: 'var(--text3)', fontSize: 11 }}>{fmtDate(card.record_datetime)}</span>
          </div>
        )}

        {notesText && !card.thumb_url && (
          <p style={{
            color: 'var(--text3)', fontSize: 11, lineHeight: 1.6, marginBottom: 5,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {notesText}
          </p>
        )}

        {invites.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <div style={{ display: 'flex' }}>
              {invites.slice(0, 5).map((inv, i) => (
                <div
                  key={inv.id}
                  title={`${inv.members?.name ?? '?'} (${inv.rsvp})`}
                  style={{
                    width: 18, height: 18, borderRadius: '50%',
                    background: 'var(--surface)', border: '1.5px solid var(--card)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 600, color: 'var(--text2)',
                    marginLeft: i === 0 ? 0 : -5, flexShrink: 0,
                  }}
                >
                  {(inv.members?.name ?? '?')[0].toUpperCase()}
                </div>
              ))}
              {invites.length > 5 && (
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'var(--surface)', border: '1.5px solid var(--card)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, color: 'var(--text3)', marginLeft: -5,
                }}>
                  +{invites.length - 5}
                </div>
              )}
            </div>
            {acceptedCount > 0 && (
              <span style={{ color: 'var(--success)', fontSize: 10, fontWeight: 500 }}>{acceptedCount} confirmed</span>
            )}
          </div>
        )}
      </div>

      {/* Status pill — anchored at bottom */}
      <div style={{ padding: '4px 12px 10px' }}>
        <span style={{
          display: 'inline-block',
          background: pill.bg,
          color: pill.color,
          borderRadius: 4,
          padding: '2px 8px',
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.01em',
        }}>
          {card.status}
        </span>
      </div>
    </div>
  )
}
