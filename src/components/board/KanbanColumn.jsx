import { useDroppable } from '@dnd-kit/core'
import VideoCard from './VideoCard'

const DOT_COLOR = {
  Ideas:    '#a78bfa',
  Recorded: '#f6c343',
  Edited:   '#4d9de0',
  Uploaded: '#3ecf8e',
}

export default function KanbanColumn({ status, cards, onCardClick, onAddCard }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className="flex flex-col self-start flex-shrink-0" style={{ width: 280 }}>

      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-0.5">
        <span
          className="flex-shrink-0 rounded-full"
          style={{ width: 6, height: 6, background: DOT_COLOR[status] }}
        />
        <span style={{ color: 'var(--text2)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {status}
        </span>
        <span
          className="ml-auto tabular-nums"
          style={{ color: 'var(--text3)', fontSize: 11, background: 'var(--card)', borderRadius: 99, padding: '1px 7px' }}
        >
          {cards.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className="flex flex-col gap-2 rounded-[var(--radius)] p-2 transition-colors duration-200"
        style={{
          minHeight: 56,
          background: isOver ? 'rgba(124,106,247,0.05)' : 'transparent',
          boxShadow: isOver ? 'inset 0 0 0 1.5px rgba(124,106,247,0.2)' : 'none',
        }}
      >
        {cards.map(card => (
          <VideoCard key={card.id} card={card} onClick={() => onCardClick(card)} />
        ))}
      </div>

      {/* Add button */}
      <button
        onClick={onAddCard}
        className="flex items-center gap-2 w-full transition-colors duration-200 mt-1.5"
        style={{ color: 'var(--text3)', fontSize: 12, padding: '7px 10px', borderRadius: 'var(--radius)' }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--text2)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.background = 'transparent' }}
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M5.5 1v9M1 5.5h9"/>
        </svg>
        Add video
      </button>
    </div>
  )
}
