import { useState } from 'react'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { getPlanLimits } from '../../lib/limits'
import LimitModal from '../ui/LimitModal'

export default function ChannelTabs() {
  const { channels, activeChannelId, setActiveChannelId, addChannel, updateChannel, deleteChannel, workspace } = useWorkspace()
  const [adding, setAdding]       = useState(false)
  const [newName, setNewName]     = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName]   = useState('')
  const [menuId, setMenuId]       = useState(null)
  const [showLimit, setShowLimit] = useState(false)

  const handleAdd = async (e) => {
    e.preventDefault()
    const name = newName.trim()
    if (!name) { setAdding(false); return }
    setAdding(false); setNewName('')
    await addChannel(name)
  }

  const handleStartAdding = () => {
    const limit = getPlanLimits(workspace?.plan).channels
    if (channels.length >= limit) { setShowLimit(true); return }
    setAdding(true)
  }

  const startEdit = (ch) => { setMenuId(null); setEditingId(ch.id); setEditName(ch.name) }

  const submitEdit = async (id) => {
    setEditingId(null)
    const name = editName.trim()
    if (name) await updateChannel(id, { name })
  }

  const handleDelete = async (id) => {
    setMenuId(null)
    if (confirm('Delete this channel and all its cards?')) await deleteChannel(id)
  }

  return (
    <>
      <div
        className="flex-shrink-0 h-10 flex items-stretch pl-5 pr-3 overflow-x-auto"
        style={{ borderBottom: '1px solid var(--border)' }}
        onClick={() => setMenuId(null)}
      >
        {channels.map(ch => (
          <div key={ch.id} className="relative flex-shrink-0 flex items-stretch">
            {editingId === ch.id ? (
              <div className="flex items-center px-1">
                <form onSubmit={() => submitEdit(ch.id)}>
                  <input
                    autoFocus
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onBlur={() => submitEdit(ch.id)}
                    className="px-2 w-32"
                    style={{ height: 26, fontSize: 13 }}
                  />
                </form>
              </div>
            ) : (
              <div className="flex items-stretch group">
                <button
                  onClick={() => setActiveChannelId(ch.id)}
                  className="flex items-center px-3 whitespace-nowrap transition-all duration-200 border-b-2"
                  style={{
                    color: activeChannelId === ch.id ? 'var(--text)' : 'var(--text3)',
                    borderBottomColor: activeChannelId === ch.id ? 'var(--accent)' : 'transparent',
                    fontSize: 13, fontWeight: 500,
                  }}
                >
                  {ch.name}
                </button>

                <button
                  onClick={e => { e.stopPropagation(); setMenuId(p => p === ch.id ? null : ch.id) }}
                  className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-5 transition-all duration-200"
                  style={{ color: 'var(--text3)', marginLeft: -6 }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                    <circle cx="5" cy="1.5" r="1.1"/>
                    <circle cx="5" cy="5"   r="1.1"/>
                    <circle cx="5" cy="8.5" r="1.1"/>
                  </svg>
                </button>

                {menuId === ch.id && (
                  <div
                    className="absolute z-40 py-1"
                    style={{
                      top: 'calc(100% + 4px)', left: 0,
                      background: 'var(--card)', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 'var(--radius)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                      minWidth: 148,
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      onClick={() => startEdit(ch)}
                      className="w-full text-left px-3.5 py-1.5 transition-colors duration-150"
                      style={{ color: 'var(--text2)', fontSize: 13 }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      Rename
                    </button>
                    <div style={{ borderTop: '1px solid var(--border)', margin: '2px 0' }} />
                    <button
                      onClick={() => handleDelete(ch.id)}
                      className="w-full text-left px-3.5 py-1.5 transition-colors duration-150"
                      style={{ color: 'var(--danger)', fontSize: 13 }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      Delete channel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {adding ? (
          <div className="flex items-center px-2">
            <form onSubmit={handleAdd}>
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onBlur={() => { setAdding(false); setNewName('') }}
                placeholder="Channel name"
                className="px-2.5 w-36"
                style={{ height: 26, fontSize: 13 }}
              />
            </form>
          </div>
        ) : (
          <button
            onClick={handleStartAdding}
            className="flex items-center gap-1.5 px-3 flex-shrink-0 transition-colors duration-200"
            style={{ color: 'var(--text3)', fontSize: 12 }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text2)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}
          >
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M4.5 1v7M1 4.5h7"/>
            </svg>
            Add
          </button>
        )}
      </div>

      {showLimit && (
        <LimitModal
          message={`You have reached the channel limit on the free tier (${getPlanLimits(workspace?.plan).channels} channel). Pro plan will support unlimited channels.`}
          onClose={() => setShowLimit(false)}
        />
      )}
    </>
  )
}
