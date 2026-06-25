const STATUS_LABEL = {
  pendiente: 'Pendiente',
  'en-progreso': 'En progreso',
  completada: 'Completada',
}

const MAX_PREVIEW_ITEMS = 5

function formatDate(isoStr) {
  if (!isoStr) return 'Sin fecha'
  const d = new Date(isoStr + 'T00:00:00')
  if (isNaN(d)) return isoStr
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function NoteCard({ note, projectColor, items, onEdit, onDelete, onToggleItem }) {
  const isList = note.type === 'lista'
  const visibleItems = isList ? items.slice(0, MAX_PREVIEW_ITEMS) : []
  const doneCount = isList ? items.filter(it => it.done).length : 0
  const remainingCount = isList ? items.length - visibleItems.length : 0

  return (
    <div
      className="note-card"
      style={{ '--tab-color': projectColor }}
      onClick={() => onEdit(note)}
    >
      <div className="note-card-top">
        <div className="note-title">
          {isList && <span className="note-title-icon">☑️</span>}
          {note.title || 'Sin título'}
        </div>
        <span className={'note-status status-' + note.status}>{STATUS_LABEL[note.status]}</span>
      </div>

      {isList ? (
        <div className="note-list-preview">
          {items.length === 0 && <div className="note-snippet">Lista vacía.</div>}
          {visibleItems.map(item => (
            <div key={item.id} className="note-list-preview-row">
              <button
                type="button"
                className={'list-checkbox list-checkbox-sm' + (item.done ? ' checked' : '')}
                onClick={(e) => { e.stopPropagation(); onToggleItem(item.id, !item.done) }}
                aria-label={item.done ? 'Marcar como pendiente' : 'Marcar como hecho'}
              >
                {item.done && (
                  <svg width="10" height="8" viewBox="0 0 12 10" fill="none">
                    <path d="M1 5L4.2 8.2L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              <span className={'note-list-preview-text' + (item.done ? ' done' : '')}>{item.text}</span>
            </div>
          ))}
          {remainingCount > 0 && (
            <div className="note-list-preview-more">+{remainingCount} más</div>
          )}
          {items.length > 0 && (
            <div className="note-list-progress">{doneCount} de {items.length} hechas</div>
          )}
        </div>
      ) : (
        <div className="note-snippet">{note.content || 'Sin contenido.'}</div>
      )}

      {note.tags && note.tags.length > 0 && (
        <div className="note-tags">
          {note.tags.map(tag => <span key={tag} className="note-tag">{tag}</span>)}
        </div>
      )}
      <div className="note-card-bottom">
        <span>{formatDate(note.date)}</span>
        <span className="note-actions">
          <button className="icon-btn edit-note" title="Editar" onClick={(e) => { e.stopPropagation(); onEdit(note) }}>✎</button>
          <button className="icon-btn danger delete-note" title="Eliminar" onClick={(e) => { e.stopPropagation(); onDelete(note.id) }}>🗑</button>
        </span>
      </div>
    </div>
  )
}
