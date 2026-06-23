import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import Modal from '../ui/Modal'
import InvitePanel from './InvitePanel'

const STATUSES = ['Ideas', 'Recorded', 'Edited', 'Uploaded']

const inputCls = 'w-full bg-surface2 border border-wire rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors'

export default function CardModal({ card, initialStatus, channelId, channelName, onClose, onUpdate, onCreate, onDelete }) {
  const isNew = !card
  const [tab, setTab] = useState('details')
  const [form, setForm] = useState({
    title:           card?.title           ?? '',
    thumb_url:       card?.thumb_url       ?? '',
    notes:           card?.notes           ?? '',
    record_datetime: card?.record_datetime ? card.record_datetime.slice(0, 16) : '',
    status:          card?.status          ?? initialStatus ?? 'Ideas',
  })
  const [invites, setInvites] = useState(card?.card_invites ?? [])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }))

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    const payload = {
      title:           form.title.trim(),
      thumb_url:       form.thumb_url.trim()  || null,
      notes:           form.notes.trim()       || null,
      record_datetime: form.record_datetime     || null,
      status:          form.status,
    }
    try {
      if (isNew) {
        const { data, error } = await supabase
          .from('cards')
          .insert({ ...payload, channel_id: channelId })
          .select('*, card_invites(id, member_id, rsvp, members(id, name, role, discord_user_id))')
          .single()
        if (error) throw error
        onCreate(data)
      } else {
        const { data, error } = await supabase
          .from('cards')
          .update(payload)
          .eq('id', card.id)
          .select('*, card_invites(id, member_id, rsvp, members(id, name, role, discord_user_id))')
          .single()
        if (error) throw error
        onUpdate({ ...data, card_invites: invites })
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this card? This cannot be undone.')) return
    setDeleting(true)
    await supabase.from('cards').delete().eq('id', card.id)
    onDelete(card.id)
    onClose()
  }

  return (
    <Modal title={isNew ? 'New video' : 'Edit video'} onClose={onClose}>
      {/* Tabs */}
      {!isNew && (
        <div className="flex border-b border-wire -mt-1 mb-4">
          {['details', 'invites'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-xs font-medium capitalize border-b-2 -mb-px transition-colors ${
                tab === t ? 'border-accent text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {t}
              {t === 'invites' && invites.length > 0 && (
                <span className="ml-1.5 text-[10px] bg-surface3 text-gray-400 px-1.5 py-0.5 rounded-full">
                  {invites.length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Details tab */}
      {tab === 'details' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Title</label>
            <input
              autoFocus
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Video title…"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={e => set('status', e.target.value)}
                className={inputCls + ' appearance-none'}
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Recording date & time</label>
              <input
                type="datetime-local"
                value={form.record_datetime}
                onChange={e => set('record_datetime', e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Thumbnail URL</label>
            <input
              value={form.thumb_url}
              onChange={e => set('thumb_url', e.target.value)}
              placeholder="https://…"
              className={inputCls}
            />
            {form.thumb_url && (
              <div className="mt-2 rounded-lg overflow-hidden border border-wire h-32 bg-surface3">
                <img
                  src={form.thumb_url}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={e => { e.target.style.opacity = 0 }}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Notes / Brief</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Script outline, talking points, brief…"
              rows={5}
              className={inputCls + ' resize-none leading-relaxed'}
            />
          </div>
        </div>
      )}

      {/* Invites tab */}
      {tab === 'invites' && !isNew && (
        <InvitePanel
          card={{ ...card, card_invites: invites }}
          channelName={channelName}
          onInvitesChange={setInvites}
        />
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-wire">
        <div>
          {!isNew && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition-colors"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-300 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.title.trim()}
            className="px-4 py-1.5 text-xs font-medium bg-accent hover:bg-accent-dim text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : isNew ? 'Create video' : 'Save changes'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
