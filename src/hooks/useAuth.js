import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recoveryMode, setRecoveryMode] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      // Supabase dispara este evento cuando alguien llega desde el enlace
      // de recuperación de contraseña del email.
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function signUp(email, password) {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error }
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function sendPasswordReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    return { error }
  }

  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (!error) setRecoveryMode(false)
    return { error }
  }

  return {
    session,
    user: session?.user ?? null,
    loading,
    recoveryMode,
    signUp,
    signIn,
    signOut,
    sendPasswordReset,
    updatePassword,
  }
}
