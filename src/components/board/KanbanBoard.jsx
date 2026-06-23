import { useState, useEffect, useRef } from 'react'
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import useRsvpPolling from '../../hooks/useRsvpPolling'
import KanbanColumn from './KanbanColumn'
import VideoCard from './VideoCard'
import CardPanel from '../cards/CardPanel'
import LimitModal from '../ui/LimitModal'
import { getPlanLimits } from '../../lib/limits'

const STATUSES = ['Ideas', 'Recorded', 'Edited', 'Uploaded']

export default function KanbanBoard() {
  const { activeChannelId, channels, workspace } = useWorkspace()
  const [cards, setCards]               = useState([])
  const [loading, setLoading]           = useState(false)
  const [draggingCard, setDraggingCard] = useState(null)
  const [selectedCard, setSelectedCard] = useState(null)
  const [createStatus, setCreateStatus] = useState(null)
  const [isExpanded, setIsExpanded]     = useState(false)
  const [limitMsg, setLimitMsg]         = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const activeChannel = channels.find(c => c.id === activeChannelId)

  // Ref so the async RSVP polling callback can read current cards without a stale closure
  const cardsRef = useRef(cards)
  useEffect(() => { cardsRef.current = cards }, [cards])

  useEffect(() => {
    setSelectedCard(null); setCreateStatus(null); setIsExpanded(false)
    if (!activeChannelId) { setCards([]); return }
    loadCards()
  }, [activeChannelId])

  async function loadCards() {
    setLoading(true)
    console.log('[Strata] loadCards — channel:', activeChannelId)
    const { data, error } = await supabase
      .from('cards')
      .select('*, card_invites(id, member_id, rsvp, members(id, name, role, discord_user_id))')
      .eq('channel_id', activeChannelId)
      .order('created_at')
    if (error) {
      console.error('[Strata] loadCards error:', error)
    } else {
      console.log('[Strata] Cards loaded:', data?.length ?? 0, data?.map(c => c.title))
    }
    setCards(data ?? [])
    setLoading(false)
  }

  useRsvpPolling(cards.map(c => c.id), async (updates) => {
    // 1. Update local React state immediately so the UI reflects the new RSVP
    setCards(prev => prev.map(card => {
      const u = updates[card.id]
      if (!u) return card
      // rsvpStore is keyed by Discord snowflake; match against discord_user_id
      return {
        ...card,
        card_invites: (card.card_invites ?? []).map(inv => ({
          ...inv,
          rsvp: u[inv.members?.discord_user_id] ?? inv.rsvp,
        })),
      }
    }))

    // 2. Persist changed RSVPs to Supabase so they survive page refreshes
    for (const [cardId, memberRsvps] of Object.entries(updates)) {
      const card = cardsRef.current.find(c => c.id === cardId)
      if (!card?.card_invites?.length) continue

      for (const [discordUserId, newRsvp] of Object.entries(memberRsvps)) {
        const invite = card.card_invites.find(
          inv => inv.members?.discord_user_id === discordUserId
        )
        if (!invite) {
          console.log('[Strata] RSVP: no invite row for discordUserId', discordUserId, 'card', cardId)
          continue
        }
        if (invite.rsvp === newRsvp) continue   // already up to date, skip

        console.log('[Strata] RSVP: persisting', { inviteId: invite.id, newRsvp })
        const { error } = await supabase
          .from('card_invites')
          .update({ rsvp: newRsvp })
          .eq('id', invite.id)
        if (error) {
          console.error('[Strata] RSVP update error:', error)
        } else {
          console.log('[Strata] RSVP persisted OK:', invite.id, '->', newRsvp)
        }
      }
    }
  })

  const handleDragStart = ({ active }) => setDraggingCard(cards.find(c => c.id === active.id) ?? null)

  const handleDragEnd = async ({ active, over }) => {
    setDraggingCard(null)
    if (!over) return
    const targetStatus = STATUSES.includes(over.id) ? over.id : null
    if (!targetStatus) return
    const card = cards.find(c => c.id === active.id)
    if (!card || card.status === targetStatus) return
    setCards(prev => prev.map(c => c.id === active.id ? { ...c, status: targetStatus } : c))
    if (selectedCard?.id === active.id) setSelectedCard(prev => ({ ...prev, status: targetStatus }))
    await supabase.from('cards').update({ status: targetStatus }).eq('id', active.id)
  }

  const handleCardClick   = (card) => { setCreateStatus(null); setSelectedCard(card); setIsExpanded(false) }
  const handleAddCard = (status) => {
    const limit = getPlanLimits(workspace?.plan).cards
    if (cards.length >= limit) {
      setLimitMsg(`You have reached the card limit on the free tier (${limit} cards per channel). Upgrade to Pro for unlimited cards.`)
      return
    }
    setSelectedCard(null)
    setCreateStatus(status)
  }
  const handleCardUpdate  = (updated) => { setCards(prev => prev.map(c => c.id === updated.id ? updated : c)); if (selectedCard?.id === updated.id) setSelectedCard(updated) }
  const handleCardDelete  = (id) => { setCards(prev => prev.filter(c => c.id !== id)); setSelectedCard(null); setCreateStatus(null); setIsExpanded(false) }
  const handleCreate      = (card) => { setCards(prev => [...prev, card]); setCreateStatus(null); setSelectedCard(null) }

  if (!activeChannelId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-4">
        <div className="w-10 h-10 flex items-center justify-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" strokeWidth="1.3" style={{ stroke: 'var(--text3)' }}>
            <rect x="2" y="4" width="14" height="11" rx="2"/><path d="M6 8h6M6 11h4"/>
          </svg>
        </div>
        <p style={{ color: 'var(--text3)', fontSize: 14 }}>Add a channel above to start planning</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span style={{ color: 'var(--text3)', fontSize: 14 }}>Loading...</span>
      </div>
    )
  }

  const panelOpen = !!(selectedCard || createStatus)

  return (
    <div className="flex-1 flex min-h-0 overflow-hidden relative">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <motion.div
          animate={{ opacity: isExpanded ? 0 : 1 }}
          transition={{ duration: 0.2 }}
          style={{ pointerEvents: isExpanded ? 'none' : 'auto' }}
          className="flex-1 flex gap-4 p-5 overflow-x-auto overflow-y-hidden items-start"
        >
          {STATUSES.map(status => (
            <KanbanColumn
              key={status}
              status={status}
              cards={cards.filter(c => c.status === status)}
              onCardClick={handleCardClick}
              onAddCard={() => handleAddCard(status)}
            />
          ))}
        </motion.div>

        <DragOverlay>
          {draggingCard && (
            <div style={{ width: 280, transform: 'scale(1.03) rotate(0.4deg)', boxShadow: '0 12px 32px rgba(0,0,0,0.7)', borderRadius: 'var(--radius)', opacity: 0.96, pointerEvents: 'none' }}>
              <VideoCard card={draggingCard} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <AnimatePresence>
        {panelOpen && (
          <CardPanel
            key={selectedCard?.id ?? `new-${createStatus}`}
            card={selectedCard ?? null}
            initialStatus={createStatus ?? 'Ideas'}
            channelId={activeChannelId}
            channelName={activeChannel?.name ?? ''}
            fromPage="board"
            isExpanded={isExpanded}
            onExpandChange={setIsExpanded}
            onClose={() => { setSelectedCard(null); setCreateStatus(null); setIsExpanded(false) }}
            onUpdate={handleCardUpdate}
            onCreate={handleCreate}
            onDelete={handleCardDelete}
          />
        )}
      </AnimatePresence>

      {limitMsg && <LimitModal message={limitMsg} onClose={() => setLimitMsg(null)} />}
    </div>
  )
}
