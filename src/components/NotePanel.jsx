import { useState, useEffect, useRef } from 'react'

const STATUSES = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en-progreso', label: 'En curso' },
  { value: 'completada', label: 'Hecho' },
]

export default function NotePanel({ open, note, onClose, onSave }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [date, setDate] = useState('')
  const [status, setStatus] = useState('pendiente')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const titleRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setTitle(note?.title ?? '')
    setContent(note?.content ?? '')
    setDate(note?.date ?? new Date().toISOString().slice(0, 10))
    setStatus(note?.status ?? 'pendiente')
    setTags(note?.tags ?? [])
    setTagInput('')
    const t = setTimeout(() => titleRef.current?.focus(), 200)
    return () => clearTimeout(t)
  }, [open, note])

  function addTag(e) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const val = tagInput.trim()
    if (val && !tags.includes(val)) setTags([...tags, val])
    setTagInput('')
  }

  function removeTag(tag) {
    setTags(tags.filter(t => t !== tag))
  }

  function handleSave() {
    if (!title.trim()) {
      titleRef.current?.focus()
      return
    }
    onSave({ title: title.trim(), content: content.trim(), date, status, tags })
  }

  if (!open) return null

  return (
    <div className="doc-overlay">
      <div className="doc-view">
        <div className="doc-topbar">
          <button className="doc-back" onClick={onClose}>← Volver</button>
          <div className="doc-topbar-right">
            <button className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button className="btn-save" onClick={handleSave}>Guardar nota</button>
          </div>
        </div>

        <div className="doc-meta-bar">
          <div className="doc-meta-item">
            <label>Fecha</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          <div className="doc-meta-item">
            <label>Estado</label>
            <div className="status-options">
              {STATUSES.map(s => (
                <button
                  key={s.value}
                  type="button"
                  className={'status-pill' + (status === s.value ? ' sel-' + s.value : '')}
                  onClick={() => setStatus(s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="doc-meta-item doc-meta-tags">
            <label>Etiquetas</label>
            <div className="tags-input-wrap">
              {tags.map(tag => (
                <span key={tag} className="tag-chip">
                  <span>{tag}</span>
                  <button type="button" onClick={() => removeTag(tag)}>&times;</button>
                </span>
              ))}
              <input
                type="text"
                placeholder="Escribe y pulsa Enter..."
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={addTag}
              />
            </div>
          </div>
        </div>

        <div className="doc-page">
          <div className="doc-page-inner">
            <input
              ref={titleRef}
              type="text"
              className="doc-title-input"
              placeholder="Título de la nota"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <textarea
              className="doc-content-textarea"
              placeholder="Escribe aquí los detalles de tu nota..."
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
