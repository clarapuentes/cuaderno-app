export default function Sidebar({
  projects, notes, currentProjectId, onSelectProject, onNewProject, onDeleteProject,
  userEmail, onSignOut, mobileOpen, onCloseMobile,
}) {
  function handleSelect(id) {
    onSelectProject(id)
    onCloseMobile()
  }

  return (
    <>
      <div
        className={'sidebar-overlay' + (mobileOpen ? ' visible' : '')}
        onClick={onCloseMobile}
      ></div>

      <aside className={'sidebar' + (mobileOpen ? ' mobile-open' : '')}>
        <div className="sidebar-top-row">
          <div className="brand"><span className="dot"></span> Cuaderno</div>
          <button className="sidebar-close-mobile" onClick={onCloseMobile} aria-label="Cerrar menú">
            &times;
          </button>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">Proyectos</div>
          <div>
            {projects.length === 0 && (
              <div className="sidebar-empty">Aún no tienes proyectos.</div>
            )}
            {projects.map(p => {
              const count = notes.filter(n => n.project_id === p.id).length
              return (
                <div
                  key={p.id}
                  className={'project-item' + (p.id === currentProjectId ? ' active' : '')}
                  onClick={() => handleSelect(p.id)}
                >
                  <span className="project-name">
                    <span className="project-color-dot" style={{ background: p.color }}></span>
                    <span>{p.name}</span>
                  </span>
                  <span className="project-item-right">
                    <span className="project-count">{count}</span>
                    <button
                      className="project-delete"
                      title="Eliminar proyecto"
                      onClick={(e) => { e.stopPropagation(); onDeleteProject(p.id) }}
                    >
                      &times;
                    </button>
                  </span>
                </div>
              )
            })}
          </div>
          <button className="new-project-btn" onClick={onNewProject}>+ Nuevo proyecto</button>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user">{userEmail}</div>
          <button className="sidebar-signout" onClick={onSignOut}>Cerrar sesión</button>
        </div>
      </aside>
    </>
  )
}
