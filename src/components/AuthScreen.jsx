import { useState } from 'react'

export default function AuthScreen({ onSignIn, onSignUp }) {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setSubmitting(true)

    if (mode === 'signin') {
      const { error } = await onSignIn(email, password)
      if (error) setError(traducirError(error.message))
    } else {
      const { error } = await onSignUp(email, password)
      if (error) {
        setError(traducirError(error.message))
      } else {
        setInfo('Cuenta creada. Si tu proyecto requiere confirmación, revisa tu email; si no, ya puedes entrar.')
      }
    }
    setSubmitting(false)
  }

  function traducirError(msg) {
    if (msg.includes('Invalid login credentials')) return 'Email o contraseña incorrectos.'
    if (msg.includes('User already registered')) return 'Ya existe una cuenta con ese email.'
    if (msg.includes('Password should be')) return 'La contraseña debe tener al menos 6 caracteres.'
    return msg
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="brand auth-brand"><span className="dot"></span> Cuaderno</div>
        <p className="auth-subtitle">
          {mode === 'signin' ? 'Entra para ver tus proyectos y notas.' : 'Crea una cuenta para empezar a organizarte.'}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && <div className="auth-message auth-error">{error}</div>}
          {info && <div className="auth-message auth-info">{info}</div>}

          <button type="submit" className="btn-primary auth-submit" disabled={submitting}>
            {submitting ? 'Un momento...' : mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        <button
          type="button"
          className="auth-toggle"
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setInfo('') }}
        >
          {mode === 'signin' ? '¿No tienes cuenta? Crea una' : '¿Ya tienes cuenta? Entra'}
        </button>
      </div>
    </div>
  )
}
