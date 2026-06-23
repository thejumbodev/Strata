const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const HOURS   = ['1','2','3','4','5','6','7','8','9','10','11','12']
const MINUTES = ['00','15','30','45']

function range(start, end) {
  const out = []
  for (let i = start; i <= end; i++) out.push(i)
  return out
}

const now   = new Date()
const YEARS = range(now.getFullYear() - 2, now.getFullYear() + 5)
const DAYS  = range(1, 31)

function fromISO(iso) {
  if (!iso) return { month: 'January', day: 1, year: now.getFullYear(), hour: '12', minute: '00', ampm: 'PM' }
  const d = new Date(iso)
  let h = d.getHours()
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  const rawMin = d.getMinutes()
  const minute = MINUTES.reduce((prev, cur) =>
    Math.abs(parseInt(cur) - rawMin) < Math.abs(parseInt(prev) - rawMin) ? cur : prev
  )
  return { month: MONTHS[d.getMonth()], day: d.getDate(), year: d.getFullYear(), hour: String(h), minute, ampm }
}

function toISO({ month, day, year, hour, minute, ampm }) {
  const monthIdx = MONTHS.indexOf(month)
  let h = parseInt(hour)
  if (ampm === 'PM' && h !== 12) h += 12
  if (ampm === 'AM' && h === 12) h = 0
  return new Date(year, monthIdx, day, h, parseInt(minute)).toISOString()
}

export default function DateTimePicker({ value, onChange }) {
  const parsed = fromISO(value)
  const update = (key, val) => onChange(toISO({ ...parsed, [key]: val }))

  const selStyle = {
    padding: '6px 28px 6px 10px',
    fontSize: 13,
    cursor: 'pointer',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Date row */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <select value={parsed.month} onChange={e => update('month', e.target.value)} style={selStyle}>
          {MONTHS.map(m => <option key={m}>{m}</option>)}
        </select>
        <select value={parsed.day} onChange={e => update('day', Number(e.target.value))} style={{ ...selStyle, width: 62 }}>
          {DAYS.map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={parsed.year} onChange={e => update('year', Number(e.target.value))} style={{ ...selStyle, width: 80 }}>
          {YEARS.map(y => <option key={y}>{y}</option>)}
        </select>
      </div>

      {/* Time row */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <select value={parsed.hour} onChange={e => update('hour', e.target.value)} style={{ ...selStyle, width: 62 }}>
          {HOURS.map(h => <option key={h}>{h}</option>)}
        </select>
        <select value={parsed.minute} onChange={e => update('minute', e.target.value)} style={{ ...selStyle, width: 62 }}>
          {MINUTES.map(m => <option key={m}>{m}</option>)}
        </select>

        {/* AM/PM toggle */}
        <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          {['AM', 'PM'].map(p => (
            <button
              key={p}
              onClick={() => update('ampm', p)}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 500,
                background: parsed.ampm === p ? 'rgba(124,106,247,0.18)' : 'transparent',
                color: parsed.ampm === p ? 'var(--accent)' : 'var(--text3)',
                transition: 'all 0.15s ease',
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {value && (
          <button
            onClick={() => onChange(null)}
            style={{ color: 'var(--text3)', fontSize: 12, marginLeft: 4, transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = 'var(--danger)'}
            onMouseLeave={e => e.target.style.color = 'var(--text3)'}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
