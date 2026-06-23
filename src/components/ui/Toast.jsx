export default function Toast({ message, onDismiss }) {
  return (
    <div
      onClick={onDismiss}
      style={{
        position: 'fixed',
        bottom: 28,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '11px 20px',
        background: 'var(--success)',
        color: '#fff',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 500,
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        animation: 'toastIn 0.25s ease',
      }}
    >
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="7.5" cy="7.5" r="6.5"/>
        <path d="M4.5 7.5l2 2 4-4"/>
      </svg>
      {message}
    </div>
  )
}
