import { useEffect, useRef } from 'react'
import { getRsvpStatus } from '../lib/discord'

export default function useRsvpPolling(cardIds, onUpdate) {
  const cbRef = useRef(onUpdate)
  cbRef.current = onUpdate

  const idsKey = cardIds.join(',')

  useEffect(() => {
    if (!idsKey) return

    const poll = async () => {
      try {
        const data = await getRsvpStatus(idsKey.split(','))
        if (data && typeof data === 'object') {
          cbRef.current(data)
        }
      } catch {
        // Polling failures are silent — don't break the UI
      }
    }

    const id = setInterval(poll, 8000)
    return () => clearInterval(id)
  }, [idsKey])
}
