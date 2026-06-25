import { useState, useMemo } from 'react'
import { useAuth } from './hooks/useAuth'
import { useData } from './hooks/useData'
import AuthScreen from './components/AuthScreen'
import ResetPasswordScreen from './components/ResetPasswordScreen'
import Sidebar from './components/Sidebar'
import NoteCard from './components/NoteCard'
import NotePanel from './components/NotePanel'
import ProjectModal from './components/ProjectModal'
import NewItemMenu from './components/NewItemMenu'
import ShareModal from './components/ShareModal'

export default function App() {
  const {
    user, loading: authLoading, recoveryMode,
    signIn, signUp, signOut, sendPasswordReset, updatePassword,
  } = useAuth()

  if (authLoading) {
    return <div className="app-loading">Cargando...</div>
  }

  // Si llega desde el enlace de recuperación de contraseña del email,
  // mostramos esta pantalla antes que nada, incluso si ya hay sesión activa.
  if (recoveryMode) {
    return <ResetPasswordScreen onUpdatePassword={updatePassword} onSignOut={signOut} />
  }

  if (!user) {
    return <AuthScreen onSignIn={signIn} onSignUp={signUp} onSendPasswordReset={sendPasswordReset} />
  }

  return <MainApp user={user} onSignOut={signOut} />
}

function MainApp({ user, onSignOut }) {
  const {
    projects, notes, listItems, members, loading, error,
    createProject, deleteProject,
    createNote, updateNote, deleteNote,
    saveListItems, toggleListItem,
    inviteMember, removeMember,
  } = useData(user.id)

  const [currentProjectId, setCurrentProjectId] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [newNoteType, setNewNoteType] = useState('nota')
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [newItemMenuOpen, setNewItemMenuOpen] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [shareProjectId, setShareProjectId] = useState(null)

  const activeProjectId = currentProjectId ?? (projects[0]?.id ?? null)
  const activeProject = projects.find(p => p.id === activeProjectId) ?? null
  const shareProject = projects.find(p => p.id === shareProjectId) ?? null
  const shareProjectMembers = members.filter(m => m.project_id === shareProjectId)

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

  function getItemsForNote(noteId) {
    return listItems.filter(it => it.note_id === noteId)
  }

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
    await deleteNote(id)
    setPanelOpen(false)
    setEditingNote(null)
  }

  function openNewItemMenu() {
    if (!activeProjectId) {
      window.alert('Crea primero un proyecto para poder añadir notas o listas.')
      return
    }
    setNewItemMenuOpen(true)
  }

  function chooseNewType(type) {
    setNewItemMenuOpen(false)
    setEditingNote(null)
    setNewNoteType(type)
    setPanelOpen(true)
  }

  function openEditNote(note) {
    setEditingNote(note)
    setPanelOpen(true)
  }

  async function handleSaveNote(values, items) {
    if (editingNote) {
      await updateNote(editingNote.id, values)
      if (values.type === 'lista' && items) {
        await saveListItems(editingNote.id, items)
      }
    } else {
      const created = await createNote({ ...values, project_id: activeProjectId })
      if (created && values.type === 'lista' && items && items.length > 0) {
        await saveListItems(created.id, items)
      }
    }
    setPanelOpen(false)
    setEditingNote(null)
  }

  async function handleRemoveMember(memberRowId, projectId) {
    const removingSelf = members.some(
      m => m.id === memberRowId && m.user_id === user.id && m.project_id === projectId
    )
    await removeMember(memberRowId, projectId)
    if (removingSelf) {
      setShareProjectId(null)
      if (activeProjectId === projectId) setCurrentProjectId(null)
    }
  }

  async function handleCreateProject(name, color) {
    const project = await createProject(name, color, user.email)
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
        onShareProject={setShareProjectId}
        userEmail={user.email}
        onSignOut={onSignOut}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <main className="main">
        <div className="main-header">
          <div className="project-title-wrap">
            <div className="project-title-row">
              <button
                className="mobile-menu-btn"
                onClick={() => setMobileSidebarOpen(true)}
                aria-label="Abrir proyectos"
              >
                ☰
              </button>
              <div className="project-title">
                <span className="project-title-dot" style={{ background: activeProject?.color ?? 'transparent' }}></span>
                <span>{activeProject ? activeProject.name : 'Sin proyectos'}</span>
              </div>
            </div>
            <div className="project-meta">
              {loading
                ? 'Cargando...'
                : activeProject
                  ? (projectNoteCount === 1 ? '1 elemento' : `${projectNoteCount} elementos`)
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
                placeholder="Buscar..."
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
            <div className="new-item-wrap">
              <button className="btn-primary" onClick={openNewItemMenu}>+ Nuevo</button>
              <NewItemMenu
                open={newItemMenuOpen}
                onClose={() => setNewItemMenuOpen(false)}
                onChooseNote={() => chooseNewType('nota')}
                onChooseList={() => chooseNewType('lista')}
              />
            </div>
          </div>
        </div>

        {error && <div className="data-error">{error}</div>}

        <NotesGrid
          loading={loading}
          activeProject={activeProject}
          filteredNotes={filteredNotes}
          projectNoteCount={projectNoteCount}
          getItemsForNote={getItemsForNote}
          onEdit={openEditNote}
          onToggleItem={toggleListItem}
        />
      </main>

      <NotePanel
        open={panelOpen}
        note={editingNote}
        noteType={newNoteType}
        listItems={editingNote ? getItemsForNote(editingNote.id) : []}
        onClose={() => { setPanelOpen(false); setEditingNote(null) }}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
      />

      <ProjectModal
        open={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onCreate={handleCreateProject}
      />

      <ShareModal
        open={shareProjectId !== null}
        project={shareProject}
        members={shareProjectMembers}
        currentUserId={user.id}
        onClose={() => setShareProjectId(null)}
        onInvite={inviteMember}
        onRemove={handleRemoveMember}
      />
    </div>
  )
}

function NotesGrid({ loading, activeProject, filteredNotes, projectNoteCount, getItemsForNote, onEdit, onToggleItem }) {
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
              <h3>Este proyecto aún no tiene nada</h3>
              <p>Pulsa "Nuevo" para crear tu primera nota o lista de tareas.</p>
            </>
          ) : (
            <>
              <div className="emoji">🔍</div>
              <h3>No hay nada que coincida</h3>
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
          items={note.type === 'lista' ? getItemsForNote(note.id) : []}
          projectColor={activeProject.color}
          onEdit={onEdit}
          onToggleItem={onToggleItem}
        />
      ))}
    </div>
  )
}
