import { useEffect, useRef } from 'react'

export default function NewItemMenu({ open, onClose, onChooseNote, onChooseList }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="new-item-menu" ref={ref}>
      <button type="button" onClick={onChooseNote}>
        <span className="new-item-menu-icon">📝</span>
        <span>
          <strong>Nota</strong>
          <small>Texto libre</small>
        </span>
      </button>
      <button type="button" onClick={onChooseList}>
        <span className="new-item-menu-icon">☑️</span>
        <span>
          <strong>Lista</strong>
          <small>Tareas con checkbox</small>
        </span>
      </button>
    </div>
  )
}
