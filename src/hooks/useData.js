import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useData(userId) {
  const [projects, setProjects] = useState([])
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadAll = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)

    const [projectsRes, notesRes] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: true }),
      supabase.from('notes').select('*').order('updated_at', { ascending: false }),
    ])

    if (projectsRes.error) setError(projectsRes.error.message)
    if (notesRes.error) setError(notesRes.error.message)

    setProjects(projectsRes.data ?? [])
    setNotes(notesRes.data ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // ---------- PROYECTOS ----------
  async function createProject(name, color) {
    const { data, error } = await supabase
      .from('projects')
      .insert({ name, color, user_id: userId })
      .select()
      .single()
    if (error) { setError(error.message); return null }
    setProjects(prev => [...prev, data])
    return data
  }

  async function deleteProject(id) {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) { setError(error.message); return false }
    setProjects(prev => prev.filter(p => p.id !== id))
    setNotes(prev => prev.filter(n => n.project_id !== id))
    return true
  }

  // ---------- NOTAS ----------
  async function createNote(note) {
    const { data, error } = await supabase
      .from('notes')
      .insert({ ...note, user_id: userId })
      .select()
      .single()
    if (error) { setError(error.message); return null }
    setNotes(prev => [data, ...prev])
    return data
  }

  async function updateNote(id, changes) {
    const { data, error } = await supabase
      .from('notes')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) { setError(error.message); return null }
    setNotes(prev => prev.map(n => (n.id === id ? data : n)))
    return data
  }

  async function deleteNote(id) {
    const { error } = await supabase.from('notes').delete().eq('id', id)
    if (error) { setError(error.message); return false }
    setNotes(prev => prev.filter(n => n.id !== id))
    return true
  }

  return {
    projects, notes, loading, error,
    createProject, deleteProject,
    createNote, updateNote, deleteNote,
    reload: loadAll,
  }
}
