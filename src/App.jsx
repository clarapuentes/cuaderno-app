import { useState, useMemo } from 'react'
import { useAuth } from './hooks/useAuth'
import { useData } from './hooks/useData'
import AuthScreen from './components/AuthScreen'
import Sidebar from './components/Sidebar'
import NoteCard from './components/NoteCard'
import NotePanel from './components/NotePanel'
import ProjectModal from './components/ProjectModal'

export default function App() {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth()

  if (authLoading) {
    return <div className="app-loading">Cargando...</div>
  }

  if (!user) {
    return <AuthScreen onSignIn={signIn} onSignUp={signUp} />
  }

  return <MainApp user={user} onSignOut={signOut} />
}

function MainApp({ user, onSignOut }) {
  const {
    projects, notes, loading, error,
    createProject, deleteProject,
    createNote, updateNote, deleteNote,
  } = useData(user.id)

  const [currentProjectId, setCurrentProjectId] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [projectModalOpen, setProjectModalOpen] = useState(false)

  const activeProjectId = currentProjectId ?? (projects[0]?.id ?? null)
  const activeProject = projects.find(p => p.id === activeProjectId) ?? null

  const filteredNotes = useMemo(() => {
    return notes
      .filter(n => n.project_id === activeProjectId)
      .filter(n => !statusFilter || n.status === statusFilter)
      .filter(n => {
        if (!search.trim()) return true
        const haystack = (n.title + ' ' + n.content + ' ' + (n.tags || []).join(' ')).toLowerCase()
        return haystack.includes(search.trim().toLowerCase())
      })
  }, [notes, activeProjectId, statusFilter, search])

  const projectNoteCount = notes.filter(n => n.project_id === activeProjectId).length

  async function handleDeleteProject(id) {
    const project = projects.find(p => p.id === id)
    const count = notes.filter(n => n.project_id === id).length
    const msg = count > 0
      ? `Eliminar "${project.name}" borrará también sus ${count} nota(s). ¿Continuar?`
      : `¿Eliminar el proyecto "${project.name}"?`
    if (!window.confirm(msg)) return
    await deleteProject(id)
    if (activeProjectId === id) setCurrentProjectId(null)
  }

  async function handleDeleteNote(id) {
    if (!window.confirm('¿Eliminar esta nota? Esta acción no se puede deshacer.')) return
    await deleteNote(id)
  }

  function openNewNote() {
    if (!activeProjectId) {
      window.alert('Crea primero un proyecto para poder añadir notas.')
      return
    }
    setEditingNote(null)
    setPanelOpen(true)
  }

  function openEditNote(note) {
    setEditingNote(note)
    setPanelOpen(true)
  }

  async function handleSaveNote(values) {
    if (editingNote) {
      await updateNote(editingNote.id, values)
    } else {
      await createNote({ ...values, project_id: activeProjectId })
    }
    setPanelOpen(false)
    setEditingNote(null)
  }

  async function handleCreateProject(name, color) {
    const project = await createProject(name, color)
    if (project) {
      setCurrentProjectId(project.id)
      setProjectModalOpen(false)
    }
  }

  return (
    <div className="app">
      <Sidebar
        projects={projects}
        notes={notes}
        currentProjectId={activeProjectId}
        onSelectProject={setCurrentProjectId}
        onNewProject={() => setProjectModalOpen(true)}
        onDeleteProject={handleDeleteProject}
        userEmail={user.email}
        onSignOut={onSignOut}
      />

      <main className="main">
        <div className="main-header">
          <div className="project-title-wrap">
            <div className="project-title">
              <span className="project-title-dot" style={{ background: activeProject?.color ?? 'transparent' }}></span>
              <span>{activeProject ? activeProject.name : 'Sin proyectos'}</span>
            </div>
            <div className="project-meta">
              {loading
                ? 'Cargando...'
                : activeProject
                  ? (projectNoteCount === 1 ? '1 nota' : `${projectNoteCount} notas`)
                  : 'Crea un proyecto para empezar a tomar notas'}
            </div>
          </div>

          <div className="toolbar">
            <div className="search-box">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Buscar notas..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="en-progreso">En progreso</option>
              <option value="completada">Completada</option>
            </select>
            <button className="btn-primary" onClick={openNewNote}>+ Nueva nota</button>
          </div>
        </div>

        {error && <div className="data-error">{error}</div>}

        <NotesGrid
          loading={loading}
          activeProject={activeProject}
          filteredNotes={filteredNotes}
          projectNoteCount={projectNoteCount}
          onEdit={openEditNote}
          onDelete={handleDeleteNote}
        />
      </main>

      <NotePanel
        open={panelOpen}
        note={editingNote}
        onClose={() => { setPanelOpen(false); setEditingNote(null) }}
        onSave={handleSaveNote}
      />

      <ProjectModal
        open={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onCreate={handleCreateProject}
      />
    </div>
  )
}

function NotesGrid({ loading, activeProject, filteredNotes, projectNoteCount, onEdit, onDelete }) {
  if (loading) {
    return <div className="notes-grid"><div className="empty-state full-row"><p>Cargando tus notas...</p></div></div>
  }

  if (!activeProject) {
    return (
      <div className="notes-grid">
        <div className="empty-state full-row">
          <div className="emoji">🗂️</div>
          <h3>Crea tu primer proyecto</h3>
          <p>Los proyectos agrupan tus notas. Empieza creando uno desde el panel lateral.</p>
        </div>
      </div>
    )
  }

  if (filteredNotes.length === 0) {
    return (
      <div className="notes-grid">
        <div className="empty-state full-row">
          {projectNoteCount === 0 ? (
            <>
              <div className="emoji">📝</div>
              <h3>Este proyecto aún no tiene notas</h3>
              <p>Pulsa "Nueva nota" para escribir tu primera idea, tarea o recordatorio.</p>
            </>
          ) : (
            <>
              <div className="emoji">🔍</div>
              <h3>No hay notas que coincidan</h3>
              <p>Prueba a cambiar el texto de búsqueda o el filtro de estado.</p>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="notes-grid">
      {filteredNotes.map(note => (
        <NoteCard
          key={note.id}
          note={note}
          projectColor={activeProject.color}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
