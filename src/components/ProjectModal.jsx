import { useState, useEffect } from 'react'

const COLORS = ['#5B5BD6', '#C98A3E', '#7A9B76', '#BD5B62', '#3E8FB0', '#9B6FB3']

export default function ProjectModal({ open, onClose, onCreate }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])

  useEffect(() => {
    if (open) { setName(''); setColor(COLORS[0]) }
  }, [open])

  if (!open) return null

  function handleCreate() {
    if (!name.trim()) return
    onCreate(name.trim(), color)
  }

  return (
    <div className="modal-mini visible">
      <div className="modal-mini-box">
        <h3>Nuevo proyecto</h3>
        <input
          type="text"
          placeholder="Nombre del proyecto"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          autoFocus
          className="modal-mini-input"
        />
        <div>
          <label className="modal-mini-label">Color</label>
          <div className="color-options">
            {COLORS.map(c => (
              <div
                key={c}
                className={'color-swatch' + (c === color ? ' selected' : '')}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>
        <div className="modal-mini-actions">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-save" onClick={handleCreate}>Crear</button>
        </div>
      </div>
    </div>
  )
}
