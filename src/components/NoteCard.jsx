const STATUS_LABEL = {
  pendiente: 'Pendiente',
  'en-progreso': 'En progreso',
  completada: 'Completada',
}

function formatDate(isoStr) {
  if (!isoStr) return 'Sin fecha'
  const d = new Date(isoStr + 'T00:00:00')
  if (isNaN(d)) return isoStr
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function NoteCard({ note, projectColor, onEdit, onDelete }) {
  return (
    <div
      className="note-card"
      style={{ '--tab-color': projectColor }}
      onClick={() => onEdit(note)}
    >
      <div className="note-card-top">
        <div className="note-title">{note.title || 'Sin título'}</div>
        <span className={'note-status status-' + note.status}>{STATUS_LABEL[note.status]}</span>
      </div>
      <div className="note-snippet">{note.content || 'Sin contenido.'}</div>
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
