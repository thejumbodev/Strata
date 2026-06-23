const PROXY = 'https://jumbo-proxy-production.up.railway.app'

async function post(path, body) {
  const res = await fetch(`${PROXY}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error((await res.text().catch(() => res.statusText)) || path)
  return res.json().catch(() => ({}))
}

// Returns the OAuth URL that adds the Strata bot to a Discord server
export async function getInviteUrl() {
  const res = await fetch(`${PROXY}/discord/invite-url`)
  if (!res.ok) throw new Error('Failed to fetch invite URL')
  const { url } = await res.json()
  return url
}

// Send a DM invite to a Discord user (token handled server-side)
export async function sendInvite({ userId, memberId, cardId, channelName, title, unixTimestamp }) {
  return post('/send-invite', { userId, memberId, cardId, channelName, title, unixTimestamp })
}

// Ping confirmed attendees in an alerts channel (token handled server-side)
export async function pingAlerts({ channelId, userIds, title }) {
  return post('/ping-alerts', { channelId, userIds, title })
}

// Poll RSVP statuses for a list of card IDs
export async function getRsvpStatus(cardIds) {
  if (!cardIds?.length) return {}
  const res = await fetch(`${PROXY}/rsvp-status?cardIds=${cardIds.join(',')}`)
  if (!res.ok) throw new Error('RSVP fetch failed')
  return res.json()
}

// Fetch members of a Discord guild (token handled server-side)
export async function getGuildMembers({ guildId }) {
  const res = await fetch(`${PROXY}/discord/members?guildId=${encodeURIComponent(guildId)}`)
  if (!res.ok) throw new Error((await res.text().catch(() => res.statusText)) || 'Failed to fetch members')
  return res.json()
}
