export default function LimitModal({ message, onClose }) {
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border-hover)',
        borderRadius: 12, padding: 28, maxWidth: 380, width: '100%',
        boxShadow: '0 12px 48px rgba(0,0,0,0.7)',
        display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center',
      }}>
        {/* Lock icon */}
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'rgba(124,106,247,0.1)', border: '1px solid rgba(124,106,247,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="8" width="12" height="9" rx="2"/>
            <path d="M6 8V5a3 3 0 0 1 6 0v3"/>
          </svg>
        </div>

        <div>
          <h3 style={{ color: 'var(--text)', fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
            Free tier limit reached
          </h3>
          <p style={{ color: 'var(--text3)', fontSize: 13, lineHeight: 1.6 }}>
            {message}
          </p>
        </div>

        {/* Coming soon badge */}
        <div style={{
          padding: '8px 14px', background: 'rgba(124,106,247,0.08)',
          border: '1px solid rgba(124,106,247,0.2)', borderRadius: 8,
          fontSize: 12, color: 'var(--accent)', fontWeight: 500,
        }}>
          Pro plan coming soon with unlimited access
        </div>

        <button
          onClick={onClose}
          style={{
            padding: '9px 24px', background: 'var(--accent)', color: '#fff',
            borderRadius: 6, fontSize: 13, fontWeight: 500,
            boxShadow: '0 2px 8px rgba(124,106,247,0.3)', transition: 'all 0.2s',
          }}
        >
          Got it
        </button>
      </div>
    </div>
  )
}
