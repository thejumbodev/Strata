import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const WorkspaceContext = createContext({})

export function WorkspaceProvider({ children }) {
  const { user } = useAuth()
  const [workspace, setWorkspace]    = useState(null)
  const [channels, setChannels]      = useState([])
  const [members, setMembers]        = useState([])
  const [activeChannelId, setActive] = useState(null)
  const [loading, setLoading]        = useState(true)

  useEffect(() => {
    if (!user) {
      setWorkspace(null); setChannels([]); setMembers([]); setLoading(false)
      return
    }
    loadAll()
  }, [user])

  // After workspace loads, detect a Discord OAuth callback (?guild_id=XXX in the URL)
  useEffect(() => {
    if (!workspace?.id) return
    const params  = new URLSearchParams(window.location.search)
    const guildId = params.get('guild_id')
    if (!guildId) return
    const clean = new URL(window.location.href)
    clean.searchParams.delete('guild_id')
    window.history.replaceState({}, '', clean.toString())
    updateWorkspace({ guild_id: guildId })
    window.dispatchEvent(new CustomEvent('strata:discord-connected'))
  }, [workspace?.id])

  // ── Loaders ──────────────────────────────────────────────────────────

  async function loadAll() {
    setLoading(true)
    console.log('[Strata] loadAll — user id:', user.id)
    try {
      // maybeSingle() + limit(1): handles 0 rows (null, no error), 1 row, or 2+ rows gracefully
      const { data: ws, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('[Strata] Workspace fetch error:', error)
        throw error
      }

      let workspace = ws
      let isNewWorkspace = false

      if (!workspace) {
        // No workspace yet — create exactly one
        console.log('[Strata] No workspace found — creating one')
        const { data: nw, error: ce } = await supabase
          .from('workspaces')
          .insert({ name: 'My Workspace', owner_id: user.id })
          .select()
          .single()
        if (ce) throw ce
        workspace = nw
        isNewWorkspace = true
        console.log('[Strata] Workspace created:', workspace.id)
      } else {
        console.log('[Strata] Workspace loaded:', workspace.id, workspace.name)
      }

      setWorkspace(workspace)

      // Load channels first so we can decide whether to seed a default
      const existingChannels = await loadChannels(workspace.id)
      await loadMembers(workspace.id)

      // For a brand-new workspace with no channels, create one default channel
      if (isNewWorkspace && existingChannels.length === 0) {
        console.log('[Strata] New workspace — seeding default channel')
        const { data: ch, error: che } = await supabase
          .from('channels')
          .insert({ workspace_id: workspace.id, name: 'Main', position: 0 })
          .select()
          .single()
        if (che) {
          console.error('[Strata] Default channel create error:', che)
        } else {
          console.log('[Strata] Default channel created:', ch.id)
          setChannels([ch])
          setActive(ch.id)
        }
      }
    } catch (e) {
      console.error('[Strata] loadAll failed:', e)
    } finally {
      setLoading(false)
    }
  }

  async function loadChannels(wsId) {
    console.log('[Strata] loadChannels — workspace:', wsId)
    const { data, error } = await supabase
      .from('channels').select('*').eq('workspace_id', wsId).order('position')
    if (error) {
      console.error('[Strata] loadChannels error:', error)
    } else {
      console.log('[Strata] Channels loaded:', data?.length ?? 0, data?.map(c => c.name))
    }
    const channels = data ?? []
    setChannels(channels)
    setActive(prev => {
      if (prev && channels.find(c => c.id === prev)) return prev
      return channels[0]?.id ?? null
    })
    return channels  // returned so loadAll can check if seeding is needed
  }

  async function loadMembers(wsId) {
    console.log('[Strata] loadMembers — workspace:', wsId)
    const { data, error } = await supabase
      .from('members').select('*').eq('workspace_id', wsId).order('name')
    if (error) {
      console.error('[Strata] loadMembers error:', error)
    } else {
      console.log('[Strata] Members loaded:', data?.length ?? 0)
    }
    setMembers(data ?? [])
  }

  // ── Channels ──────────────────────────────────────────────────────────

  async function addChannel(name) {
    console.log('[Strata] addChannel:', name)
    const { data, error } = await supabase
      .from('channels').insert({ workspace_id: workspace.id, name, position: channels.length }).select().single()
    if (error) {
      console.error('[Strata] addChannel error:', error)
    } else {
      console.log('[Strata] Channel created:', data.id, data.name)
      setChannels(p => [...p, data])
      setActive(data.id)
    }
    return { data, error }
  }

  async function updateChannel(id, updates) {
    const { data, error } = await supabase.from('channels').update(updates).eq('id', id).select().single()
    if (error) console.error('[Strata] updateChannel error:', error)
    else setChannels(p => p.map(c => c.id === id ? data : c))
    return { data, error }
  }

  async function deleteChannel(id) {
    const { error } = await supabase.from('channels').delete().eq('id', id)
    if (error) {
      console.error('[Strata] deleteChannel error:', error)
    } else {
      const rest = channels.filter(c => c.id !== id)
      setChannels(rest)
      if (activeChannelId === id) setActive(rest[0]?.id ?? null)
    }
    return { error }
  }

  // ── Members ───────────────────────────────────────────────────────────

  async function addMember(memberData) {
    // Guard: if a discord_user_id is provided and a member with that ID already exists,
    // return the existing row rather than inserting a duplicate.
    if (memberData.discord_user_id) {
      const existing = members.find(m => m.discord_user_id === memberData.discord_user_id)
      if (existing) {
        console.log('[Strata] addMember skipped — discord_user_id already exists:', memberData.discord_user_id)
        return { data: existing, error: null }
      }
    }
    console.log('[Strata] addMember:', memberData.name)
    const { data: m, error } = await supabase
      .from('members').insert({ ...memberData, workspace_id: workspace.id }).select().single()
    if (error) {
      console.error('[Strata] addMember error:', error)
    } else {
      console.log('[Strata] Member created:', m.id, m.name)
      setMembers(p => [...p, m])
    }
    return { data: m, error }
  }

  async function updateMember(id, updates) {
    console.log('[Strata] updateMember id:', id, 'updates:', updates)
    const { data, error } = await supabase.from('members').update(updates).eq('id', id).select().single()
    if (error) {
      console.error('[Strata] updateMember error:', error)
    } else {
      console.log('[Strata] updateMember success, returned:', data)
      setMembers(p => p.map(m => m.id === id ? data : m))
    }
    return { data, error }
  }

  async function deleteMember(id) {
    const { error } = await supabase.from('members').delete().eq('id', id)
    if (error) console.error('[Strata] deleteMember error:', error)
    else setMembers(p => p.filter(m => m.id !== id))
    return { error }
  }

  // ── Workspace ─────────────────────────────────────────────────────────

  async function updateWorkspace(updates) {
    const { data, error } = await supabase
      .from('workspaces').update(updates).eq('id', workspace.id).select().single()
    if (error) console.error('[Strata] updateWorkspace error:', error)
    else setWorkspace(data)
    return { data, error }
  }

  return (
    <WorkspaceContext.Provider value={{
      workspace, channels, members, activeChannelId,
      setActiveChannelId: setActive, loading,
      addChannel, updateChannel, deleteChannel,
      addMember, updateMember, deleteMember,
      updateWorkspace,
    }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export const useWorkspace = () => useContext(WorkspaceContext)
