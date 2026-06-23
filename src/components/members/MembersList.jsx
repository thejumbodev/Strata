import { useState, useRef } from 'react'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { getPlanLimits } from '../../lib/limits'
import LimitModal from '../ui/LimitModal'

const ROLES = ['Editor','Animator','Thumbnail','Scriptwriter','Videographer','Collaborator']

const ROLE_STYLE = {
  Editor:       { color: '#93c5fd', background: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.2)'   },
  Animator:     { color: '#c4b5fd', background: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)'  },
  Thumbnail:    { color: '#f9a8d4', background: 'rgba(249,168,212,0.1)', border: 'rgba(249,168,212,0.2)'  },
  Scriptwriter: { color: '#fde68a', background: 'rgba(253,230,138,0.1)', border: 'rgba(253,230,138,0.2)'  },
  Videographer: { color: '#67e8f9', background: 'rgba(103,232,249,0.1)', border: 'rgba(103,232,249,0.2)'  },
  Collaborator: { color: 'var(--text2)', background: 'rgba(255,255,255,0.05)', border: 'var(--border-hover)' },
}

const isSnowflake = id => /^\d{15,}$/.test(String(id ?? ''))

const BLANK = { name: '', discord_user_id: '', role: 'Editor' }
const inpStyle = { width: '100%', padding: '8px 12px', fontSize: 13 }
const labelStyle = {
  display: 'block', color: 'var(--text3)', fontSize: 11,
  fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
}

function DiscordDot({ hasId }) {
  return (
    <div style={{ position: 'relative', width: 18, height: 18, flexShrink: 0 }}>
      {/* Discord "blurple" icon, muted */}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--text3)" style={{ display: 'block' }}>
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.054a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
      </svg>
      {/* Status dot */}
      <div style={{
        position: 'absolute', bottom: -1, right: -1,
        width: 7, height: 7, borderRadius: '50%',
        background: hasId ? 'var(--success)' : 'var(--text3)',
        border: '1.5px solid var(--card)',
      }} />
    </div>
  )
}

export default function MembersList() {
  const { members, addMember, updateMember, deleteMember, workspace } = useWorkspace()

  const [showForm, setShowForm] = useState(false)
  const [showLimit, setShowLimit] = useState(false)
  const [form, setForm]         = useState(BLANK)
  const [saving, setSaving]     = useState(false)
  const [editId, setEditId]     = useState(null)
  const [editForm, setEditForm] = useState(BLANK)
  const [err, setErr]           = useState('')

  const sf = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const se = (k, v) => setEditForm(p => ({ ...p, [k]: v }))

  // Synchronous guard — React state is async, a fast double-click can fire twice
  const submittingRef = useRef(false)

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    if (submittingRef.current) return
    submittingRef.current = true
    setSaving(true); setErr('')
    try {
      const { error } = await addMember({
        name:            form.name.trim(),
        role:            form.role,
        discord_user_id: form.discord_user_id.trim() || null,
      })
      if (error) { setErr(error.message); return }
      setForm(BLANK); setShowForm(false)
    } finally {
      setSaving(false)
      submittingRef.current = false
    }
  }

  const handleUpdate = async (id) => {
    if (!editForm.name.trim()) return
    await updateMember(id, {
      name:            editForm.name.trim(),
      role:            editForm.role,
      discord_user_id: editForm.discord_user_id.trim() || null,
    })
    setEditId(null)
  }

  const handleDelete = async (id, name) => {
    if (confirm(`Remove ${name} from the workspace?`)) await deleteMember(id)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'var(--text3)', fontSize: 13 }}>
          {members.length} member{members.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => {
            const limit = getPlanLimits(workspace?.plan).members
            if (members.length >= limit) { setShowLimit(true); return }
            setShowForm(true); setErr('')
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px',
            background: 'var(--accent)', color: '#fff',
            borderRadius: 6, fontSize: 13, fontWeight: 500,
            boxShadow: '0 2px 8px rgba(124,106,247,0.25)',
          }}
        >
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
            <path d="M4.5 1v7M1 4.5h7"/>
          </svg>
          Add member
        </button>
      </div>

      {err && (
        <div style={{ background: 'rgba(224,82,82,0.08)', border: '1px solid rgba(224,82,82,0.2)', borderRadius: 8, padding: '9px 14px', color: 'var(--danger)', fontSize: 13 }}>
          {err}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <form
          onSubmit={handleAdd}
          style={{ background: 'var(--card)', border: '1px solid var(--border-hover)', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Nickname</label>
              <input
                autoFocus
                value={form.name}
                onChange={e => sf('name', e.target.value)}
                placeholder="How you know them"
                style={inpStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Role</label>
              <select value={form.role} onChange={e => sf('role', e.target.value)} style={inpStyle}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Discord User ID</label>
            <input
              value={form.discord_user_id}
              onChange={e => sf('discord_user_id', e.target.value)}
              placeholder="e.g. 194532891234567890"
              style={{ ...inpStyle, fontFamily: 'monospace' }}
            />
            <p style={{ color: 'var(--text3)', fontSize: 11, marginTop: 5, lineHeight: 1.5 }}>
              In Discord: Settings → Advanced → enable Developer Mode, then right-click the person's profile and click Copy User ID.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="submit"
              disabled={saving || !form.name.trim()}
              style={{ padding: '7px 14px', background: 'var(--accent)', color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 500, opacity: (saving || !form.name.trim()) ? 0.5 : 1 }}
            >
              {saving ? 'Adding...' : 'Add member'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(BLANK) }}
              style={{ padding: '7px 14px', color: 'var(--text3)', fontSize: 13, borderRadius: 6 }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {members.length === 0 && !showForm && (
        <p style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '32px 0', lineHeight: 1.6 }}>
          No team members yet. Add your first member above.
        </p>
      )}

      {/* Member list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {members.map(m => {
          const rs = ROLE_STYLE[m.role] ?? ROLE_STYLE.Collaborator
          const hasId = isSnowflake(m.discord_user_id)

          return (
            <div
              key={m.id}
              style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              {editId === m.id ? (
                <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <input
                      autoFocus
                      value={editForm.name}
                      onChange={e => se('name', e.target.value)}
                      placeholder="Nickname"
                      style={inpStyle}
                    />
                    <select value={editForm.role} onChange={e => se('role', e.target.value)} style={inpStyle}>
                      {ROLES.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <input
                    value={editForm.discord_user_id}
                    onChange={e => se('discord_user_id', e.target.value)}
                    placeholder="Discord User ID (e.g. 194532891234567890)"
                    style={{ ...inpStyle, fontFamily: 'monospace' }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleUpdate(m.id)}
                      style={{ padding: '6px 14px', background: 'var(--accent)', color: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 500 }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      style={{ padding: '6px 14px', color: 'var(--text3)', fontSize: 13, borderRadius: 6 }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px' }}>
                  {/* Avatar */}
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: 'var(--text2)', flexShrink: 0 }}>
                    {m.name[0].toUpperCase()}
                  </div>

                  {/* Name + role */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--text)', fontSize: 14, fontWeight: 500 }}>{m.name}</span>
                      <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: rs.background, color: rs.color, border: `1px solid ${rs.border}` }}>
                        {m.role}
                      </span>
                    </div>
                    {m.discord_user_id && (
                      <div style={{ color: 'var(--text3)', fontSize: 11, fontFamily: 'monospace', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.discord_user_id}
                      </div>
                    )}
                  </div>

                  {/* Discord status */}
                  <DiscordDot hasId={hasId} />

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                    <button
                      onClick={() => {
                        setEditId(m.id)
                        setEditForm({ name: m.name, role: m.role, discord_user_id: m.discord_user_id ?? '' })
                      }}
                      style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, color: 'var(--text3)', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--text2)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.background = 'transparent' }}
                    >
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 2l2 2L4 11H2V9L9 2z"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(m.id, m.name)}
                      style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, color: 'var(--text3)', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.background = 'transparent' }}
                    >
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3.5h9M5.5 3.5V2h2v1.5M4.5 5.5v4M8.5 5.5v4M3 3.5l.6 7.5h5.8L10 3.5"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showLimit && (
        <LimitModal
          message={`You have reached the member limit on the free tier (${getPlanLimits(workspace?.plan).members} members). Upgrade to Pro for more team members.`}
          onClose={() => setShowLimit(false)}
        />
      )}
    </div>
  )
}
