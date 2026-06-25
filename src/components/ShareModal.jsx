import { useState } from 'react'

export default function ShareModal({ open, project, members, currentUserId, onClose, onInvite, onRemove }) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState(null) // { type: 'error' | 'success', text }
  const [submitting, setSubmitting] = useState(false)

  if (!open || !project) return null

  async function handleInvite(e) {
    e.preventDefault()
    setMessage(null)
    const trimmed = email.trim()
    if (!trimmed) return

    setSubmitting(true)
    const result = await onInvite(project.id, trimmed)
    setSubmitting(false)

    if (result === 'ok') {
      setMessage({ type: 'success', text: `${trimmed} ya tiene acceso al proyecto.` })
      setEmail('')
    } else if (result === 'user_not_found') {
      setMessage({ type: 'error', text: 'Esa persona no tiene cuenta en Cuaderno todavía.' })
    } else if (result === 'already_member') {
      setMessage({ type: 'error', text: 'Esa persona ya forma parte del proyecto.' })
    } else if (result === 'not_authorized') {
      setMessage({ type: 'error', text: 'No tienes permiso para invitar en este proyecto.' })
    } else {
      setMessage({ type: 'error', text: 'No se ha podido enviar la invitación. Inténtalo de nuevo.' })
    }
  }

  function handleRemove(member) {
    const isSelf = member.user_id === currentUserId
    const msg = isSelf
      ? '¿Seguro que quieres salir de este proyecto? Dejarás de verlo.'
      : `¿Quitar a ${member.email} de este proyecto?`
    if (window.confirm(msg)) {
      onRemove(member.id, project.id)
    }
  }

  return (
    <div className="modal-mini visible">
      <div className="modal-mini-box share-modal-box">
        <h3>Compartir «{project.name}»</h3>
        <p className="share-modal-hint">
          Invita a alguien por su email. Solo puedes invitar a personas que ya tengan cuenta en Cuaderno.
        </p>

        <form onSubmit={handleInvite} className="share-invite-form">
          <input
            type="email"
            placeholder="email@ejemplo.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="modal-mini-input"
          />
          <button type="submit" className="btn-save" disabled={submitting}>
            {submitting ? 'Enviando...' : 'Invitar'}
          </button>
        </form>

        {message && (
          <div className={'auth-message ' + (message.type === 'error' ? 'auth-error' : 'auth-info')}>
            {message.text}
          </div>
        )}

        <div className="share-members-list">
          <div className="share-members-label">Miembros ({members.length})</div>
          {members.map(member => (
            <div key={member.id} className="share-member-row">
              <span className="share-member-email">
                {member.email}
                {member.user_id === currentUserId && <span className="share-member-you"> (tú)</span>}
              </span>
              <button
                type="button"
                className="share-member-remove"
                onClick={() => handleRemove(member)}
                title={member.user_id === currentUserId ? 'Salir del proyecto' : 'Quitar del proyecto'}
              >
                {member.user_id === currentUserId ? 'Salir' : 'Quitar'}
              </button>
            </div>
          ))}
        </div>

        <div className="modal-mini-actions">
          <button className="btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}
