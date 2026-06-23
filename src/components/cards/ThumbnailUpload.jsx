import { useRef, useState } from 'react'

function resizeToDataUrl(file, maxW = 1280, maxH = 720, quality = 0.82) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let { width: w, height: h } = img
        if (w > maxW) { h = (h * maxW) / w; w = maxW }
        if (h > maxH) { w = (w * maxH) / h; h = maxH }
        const canvas = document.createElement('canvas')
        canvas.width  = Math.round(w)
        canvas.height = Math.round(h)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

// fullPage: uses 16:9 aspect ratio (for document view), otherwise fixed height
export default function ThumbnailUpload({ value, onChange, fullPage }) {
  const fileRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = async (file) => {
    if (!file?.type.startsWith('image/')) return
    const dataUrl = await resizeToDataUrl(file)
    onChange(dataUrl)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const imgStyle = fullPage
    ? { width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }
    : { width: '100%', height: '100%', objectFit: 'cover', display: 'block' }

  const containerStyle = fullPage
    ? { width: '100%', aspectRatio: '16/9', borderRadius: 10, overflow: 'hidden', background: 'var(--card)', cursor: 'pointer', position: 'relative' }
    : { position: 'relative', height: 144, borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--card)', cursor: 'pointer' }

  const emptyZoneStyle = fullPage
    ? { width: '100%', aspectRatio: '16/9', borderRadius: 10, border: `1.5px dashed ${dragging ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`, background: dragging ? 'rgba(124,106,247,0.04)' : 'var(--input)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'border-color 0.2s, background 0.2s' }
    : { height: 116, borderRadius: 'var(--radius)', border: `1.5px dashed ${dragging ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`, background: dragging ? 'rgba(124,106,247,0.04)' : 'var(--input)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'border-color 0.2s, background 0.2s' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {value ? (
        /* ── Existing thumbnail ── */
        <div onClick={() => fileRef.current.click()} style={containerStyle}>
          <img src={value} alt="Thumbnail" style={imgStyle} />
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0)', transition: 'background 0.2s' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.52)'
              e.currentTarget.querySelector('span').style.opacity = '1'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(0,0,0,0)'
              e.currentTarget.querySelector('span').style.opacity = '0'
            }}
          >
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 500, opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              Replace thumbnail
            </span>
          </div>
        </div>
      ) : (
        /* ── Empty upload zone ── */
        <>
          <div
            onClick={() => fileRef.current.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            style={emptyZoneStyle}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--text3)' }}>
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <span style={{ color: 'var(--text3)', fontSize: 13 }}>Drop a thumbnail or click to upload</span>
          </div>

          {/* URL paste — only shown when no thumbnail */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '2px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
            <span style={{ color: 'var(--text3)', fontSize: 11, opacity: 0.7 }}>or paste a URL</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
          </div>
          <input
            type="url"
            placeholder="https://..."
            defaultValue=""
            onBlur={e => { if (e.target.value.trim()) onChange(e.target.value.trim()) }}
            style={{ width: '100%', padding: '7px 12px', fontSize: 13 }}
          />
        </>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
    </div>
  )
}
