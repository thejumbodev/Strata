import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

function Btn({ onClick, active, title, children }) {
  return (
    <button
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      style={{
        width: 28, height: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 5, fontSize: 12, fontWeight: 700,
        background: active ? 'rgba(124,106,247,0.22)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text2)',
        transition: 'all 0.15s ease',
        cursor: 'pointer', border: 'none', flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}

export default function RichTextEditor({ content, onChange, fullPage }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: fullPage
          ? 'Start writing your brief, script, or video notes...'
          : 'Start writing your brief, script notes, or ideas...',
      }),
    ],
    content: content || null,
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
    editorProps: { attributes: { class: 'tiptap' } },
  })

  if (!editor) return null

  const a = editor.isActive.bind(editor)

  return (
    // fullPage wrapper enables .tiptap-full-wrapper CSS overrides (15px, 1.8 lh)
    <div className={fullPage ? 'tiptap-full-wrapper' : ''} style={{ minHeight: fullPage ? 0 : 160, position: 'relative' }}>
      <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} className="tiptap-bubble">
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={a('heading', { level: 1 })} title="Heading 1">H1</Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={a('heading', { level: 2 })} title="Heading 2">H2</Btn>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={a('bold')} title="Bold">
          <strong style={{ fontWeight: 700 }}>B</strong>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={a('italic')} title="Italic">
          <em>I</em>
        </Btn>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={a('bulletList')} title="Bullet list">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor">
            <circle cx="1.5" cy="3"  r="1.2"/><rect x="4" y="2"  width="9" height="2" rx="1"/>
            <circle cx="1.5" cy="7"  r="1.2"/><rect x="4" y="6"  width="9" height="2" rx="1"/>
            <circle cx="1.5" cy="11" r="1.2"/><rect x="4" y="10" width="6" height="2" rx="1"/>
          </svg>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={a('orderedList')} title="Ordered list">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor">
            <rect x="4" y="2"  width="9" height="2" rx="1"/>
            <rect x="4" y="6"  width="9" height="2" rx="1"/>
            <rect x="4" y="10" width="6" height="2" rx="1"/>
            <text x="0.5" y="4.5"  fontSize="4.5" fontFamily="monospace">1</text>
            <text x="0.5" y="8.5"  fontSize="4.5" fontFamily="monospace">2</text>
            <text x="0.5" y="12.5" fontSize="4.5" fontFamily="monospace">3</text>
          </svg>
        </Btn>
      </BubbleMenu>

      <EditorContent editor={editor} />
    </div>
  )
}
