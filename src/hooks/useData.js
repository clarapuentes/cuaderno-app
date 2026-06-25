import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useData(userId) {
  const [projects, setProjects] = useState([])
  const [notes, setNotes] = useState([])
  const [listItems, setListItems] = useState([])
  const [members, setMembers] = useState([]) // [{ id, project_id, user_id, email, added_at }]
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

    const loadedProjects = projectsRes.data ?? []
    setProjects(loadedProjects)
    setNotes(notesRes.data ?? [])
    setListItems(itemsRes.data ?? [])

    // Cargamos los miembros de todos los proyectos visibles, uno por uno
    // (son pocos en la práctica, así que el coste es insignificante).
    const memberResults = await Promise.all(
      loadedProjects.map(p => supabase.rpc('get_project_members', { p_project_id: p.id }))
    )
    const allMembers = memberResults.flatMap((res, i) =>
      (res.data ?? []).map(m => ({ ...m, project_id: loadedProjects[i].id }))
    )
    setMembers(allMembers)

    setLoading(false)
  }, [userId])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // ---------- PROYECTOS ----------
  async function createProject(name, color, userEmail) {
    const { data, error } = await supabase
      .from('projects')
      .insert({ name, color, user_id: userId })
      .select()
      .single()
    if (error) { setError(error.message); return null }
    setProjects(prev => [...prev, data])

    // Un trigger en la base de datos añade automáticamente al creador
    // como miembro; aquí solo reflejamos ese estado en la interfaz.
    setMembers(prev => [
      ...prev,
      { id: `local-${data.id}`, project_id: data.id, user_id: userId, email: userEmail ?? null, added_at: new Date().toISOString() },
    ])

    return data
  }

  async function deleteProject(id) {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) { setError(error.message); return false }
    setProjects(prev => prev.filter(p => p.id !== id))
    setNotes(prev => prev.filter(n => n.project_id !== id))
    setMembers(prev => prev.filter(m => m.project_id !== id))
    return true
  }

  // ---------- MIEMBROS ----------
  // Devuelve: 'ok' | 'user_not_found' | 'already_member' | 'not_authorized' | 'error'
  async function inviteMember(projectId, email) {
    const { data, error } = await supabase.rpc('invite_member_by_email', {
      p_project_id: projectId,
      p_email: email,
    })
    if (error) { setError(error.message); return 'error' }
    if (data === 'ok') {
      const { data: memberRows } = await supabase.rpc('get_project_members', { p_project_id: projectId })
      setMembers(prev => [
        ...prev.filter(m => m.project_id !== projectId),
        ...(memberRows ?? []).map(m => ({ ...m, project_id: projectId })),
      ])
    }
    return data
  }

  async function removeMember(memberRowId, projectId) {
    const { error } = await supabase.from('project_members').delete().eq('id', memberRowId)
    if (error) { setError(error.message); return false }
    setMembers(prev => prev.filter(m => m.id !== memberRowId))
    // Si me he quitado a mí misma del proyecto, ya no debería verlo más.
    const stillMember = members.some(m => m.project_id === projectId && m.user_id === userId && m.id !== memberRowId)
    if (!stillMember) {
      setProjects(prev => prev.filter(p => p.id !== projectId))
    }
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
  // Sincroniza el array completo de items de una lista de una sola vez:
  // borra los que ya no están, actualiza los existentes y crea los nuevos.
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

    // Releemos los items de esta nota desde el servidor para tener IDs reales.
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
    projects, notes, listItems, members, loading, error,
    createProject, deleteProject,
    createNote, updateNote, deleteNote,
    saveListItems, toggleListItem,
    inviteMember, removeMember,
    reload: loadAll,
  }
}
