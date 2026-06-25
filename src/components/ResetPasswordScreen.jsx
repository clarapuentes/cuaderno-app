import { useState } from 'react'

export default function ResetPasswordScreen({ onUpdatePassword, onSignOut }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('Las dos contraseñas no coinciden.')
      return
    }

    setSubmitting(true)
    const { error } = await onUpdatePassword(password)
    setSubmitting(false)

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="brand auth-brand"><span className="dot"></span> Cuaderno</div>
        <p className="auth-subtitle">Crea una nueva contraseña para tu cuenta.</p>

        {success ? (
          <>
            <div className="auth-message auth-info">
              Tu contraseña se ha actualizado correctamente.
            </div>
            <button type="button" className="btn-primary auth-submit" onClick={onSignOut}>
              Entrar con la nueva contraseña
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="field">
              <label>Nueva contraseña</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                autoFocus
              />
            </div>
            <div className="field">
              <label>Repite la contraseña</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                autoComplete="new-password"
              />
            </div>

            {error && <div className="auth-message auth-error">{error}</div>}

            <button type="submit" className="btn-primary auth-submit" disabled={submitting}>
              {submitting ? 'Guardando...' : 'Guardar nueva contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
