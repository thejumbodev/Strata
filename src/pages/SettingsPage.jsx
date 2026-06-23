import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useWorkspace } from '../contexts/WorkspaceContext'
import MembersList    from '../components/members/MembersList'
import DiscordSettings from '../components/workspace/DiscordSettings'
import TeamTab        from '../components/settings/TeamTab'

const TABS = ['Workspace', 'Team Members', 'Team', 'Discord']

const TAB_FROM_PARAM = {
  workspace: 'Workspace',
  team:      'Team Members',
  overview:  'Team',
  discord:   'Discord',
}

export default function SettingsPage() {
  const [searchParams] = useSearchParams()
  const initialTab = TAB_FROM_PARAM[searchParams.get('tab')] ?? 'Workspace'

  const [activeTab, setActiveTab] = useState(initialTab)
  const { workspace, updateWorkspace } = useWorkspace()
  const [wsName, setWsName] = useState(workspace?.name ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  const handleSaveWs = async () => {
    if (!wsName.trim()) return
    setSaving(true)
    await updateWorkspace({ name: wsName.trim() })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Team tab uses a wider canvas; all others stay at 600px
  const maxW = activeTab === 'Team' ? 960 : 600

  return (
    <div className="flex-1 overflow-y-auto">
      <div style={{ maxWidth: maxW, margin: '0 auto', padding: '36px 32px', transition: 'max-width 0.2s ease' }}>

        <h1 style={{ color: 'var(--text)', fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 28 }}>
          Settings
        </h1>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 28 }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 0', marginRight: 24, fontSize: 13, fontWeight: 500,
                color: activeTab === tab ? 'var(--text)' : 'var(--text3)',
                borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom: -1, transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Workspace */}
        {activeTab === 'Workspace' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', color: 'var(--text3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Workspace name
              </label>
              <input
                value={wsName}
                onChange={e => setWsName(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', fontSize: 14 }}
              />
            </div>
            <div>
              <button
                onClick={handleSaveWs}
                disabled={saving || !wsName.trim()}
                style={{ padding: '8px 18px', background: 'var(--accent)', color: '#fff', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500, opacity: (saving || !wsName.trim()) ? 0.5 : 1, boxShadow: '0 2px 8px rgba(124,106,247,0.25)', transition: 'all 0.2s' }}
              >
                {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
              </button>
            </div>
            <div style={{ paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <p style={{ color: 'var(--text3)', fontSize: 12 }}>
                Workspace ID <span style={{ fontFamily: 'monospace', opacity: 0.6 }}>{workspace?.id}</span>
              </p>
            </div>
          </div>
        )}

        {activeTab === 'Team Members' && <MembersList />}
        {activeTab === 'Team'         && <TeamTab />}
        {activeTab === 'Discord'      && <DiscordSettings />}
      </div>
    </div>
  )
}
