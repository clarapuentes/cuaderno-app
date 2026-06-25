import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useData(userId) {
  const [projects, setProjects] = useState([])
  const [notes, setNotes] = useState([])
  const [listItems, setListItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadAll = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)

    const [projectsRes, notesRes, itemsRes] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: true }),
      supabase.from('notes').select('*').order('updated_at', { ascending: false }),
      supabase.from('list_items').select('*').order('position', { ascending: true }),
    ])

    if (projectsRes.error) setError(projectsRes.error.message)
    if (notesRes.error) setError(notesRes.error.message)
    if (itemsRes.error) setError(itemsRes.error.message)

    setProjects(projectsRes.data ?? [])
    setNotes(notesRes.data ?? [])
    setListItems(itemsRes.data ?? [])
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

  // ---------- NOTAS (y LISTAS, que son notas con type = 'lista') ----------
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
    setListItems(prev => prev.filter(it => it.note_id !== id))
    return true
  }

  // ---------- ITEMS DE LISTA ----------
  async function saveListItems(noteId, items) {
    const previous = listItems.filter(it => it.note_id === noteId)
    const previousIds = new Set(previous.map(it => it.id))
    const currentIds = new Set(items.filter(it => !it.isNew).map(it => it.id))

    const toDelete = previous.filter(it => !currentIds.has(it.id))
    const toUpdate = items.filter(it => !it.isNew && previousIds.has(it.id))
    const toCreate = items.filter(it => it.isNew)

    const ops = []

    if (toDelete.length > 0) {
      ops.push(supabase.from('list_items').delete().in('id', toDelete.map(it => it.id)))
    }
    toUpdate.forEach(it => {
      ops.push(
        supabase.from('list_items')
          .update({ text: it.text, done: it.done, position: it.position })
          .eq('id', it.id)
      )
    })
    if (toCreate.length > 0) {
      ops.push(
        supabase.from('list_items').insert(
          toCreate.map(it => ({
            note_id: noteId,
            user_id: userId,
            text: it.text,
            done: it.done,
            position: it.position,
          }))
        )
      )
    }

    const results = await Promise.all(ops)
    const failed = results.find(r => r.error)
    if (failed) { setError(failed.error.message); return false }

    const { data, error } = await supabase
      .from('list_items')
      .select('*')
      .eq('note_id', noteId)
      .order('position', { ascending: true })

    if (error) { setError(error.message); return false }

    setListItems(prev => [...prev.filter(it => it.note_id !== noteId), ...(data ?? [])])
    return true
  }

  async function toggleListItem(itemId, done) {
    const { data, error } = await supabase
      .from('list_items')
      .update({ done })
      .eq('id', itemId)
      .select()
      .single()
    if (error) { setError(error.message); return null }
    setListItems(prev => prev.map(it => (it.id === itemId ? data : it)))
    return data
  }

  return {
    projects, notes, listItems, loading, error,
    createProject, deleteProject,
    createNote, updateNote, deleteNote,
    saveListItems, toggleListItem,
    reload: loadAll,
  }
}
