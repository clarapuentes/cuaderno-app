import { useState } from 'react'

export default function AuthScreen({ onSignIn, onSignUp, onSendPasswordReset }) {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup' | 'recover'
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
    } else if (mode === 'signup') {
      const { error } = await onSignUp(email, password)
      if (error) {
        setError(traducirError(error.message))
      } else {
        setInfo('Cuenta creada. Si tu proyecto requiere confirmación, revisa tu email; si no, ya puedes entrar.')
      }
    } else if (mode === 'recover') {
      const { error } = await onSendPasswordReset(email)
      if (error) {
        setError(traducirError(error.message))
      } else {
        setInfo('Te hemos enviado un email con un enlace para crear una nueva contraseña. Revisa también la carpeta de spam.')
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

  function switchMode(newMode) {
    setMode(newMode)
    setError('')
    setInfo('')
  }

  const titles = {
    signin: 'Entra para ver tus proyectos y notas.',
    signup: 'Crea una cuenta para empezar a organizarte.',
    recover: 'Te enviamos un enlace para crear una nueva contraseña.',
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="brand auth-brand"><span className="dot"></span> Cuaderno</div>
        <p className="auth-subtitle">{titles[mode]}</p>

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

          {mode !== 'recover' && (
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
          )}

          {mode === 'signin' && (
            <button
              type="button"
              className="auth-forgot"
              onClick={() => switchMode('recover')}
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}

          {error && <div className="auth-message auth-error">{error}</div>}
          {info && <div className="auth-message auth-info">{info}</div>}

          <button type="submit" className="btn-primary auth-submit" disabled={submitting}>
            {submitting
              ? 'Un momento...'
              : mode === 'signin' ? 'Entrar'
              : mode === 'signup' ? 'Crear cuenta'
              : 'Enviar enlace de recuperación'}
          </button>
        </form>

        {mode === 'recover' ? (
          <button type="button" className="auth-toggle" onClick={() => switchMode('signin')}>
            ← Volver a entrar
          </button>
        ) : (
          <button
            type="button"
            className="auth-toggle"
            onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
          >
            {mode === 'signin' ? '¿No tienes cuenta? Crea una' : '¿Ya tienes cuenta? Entra'}
          </button>
        )}
      </div>
    </div>
  )
}
