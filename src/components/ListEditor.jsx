import { useRef } from 'react'

let tempIdCounter = 0
function tempId() {
  tempIdCounter += 1
  return `tmp-${Date.now()}-${tempIdCounter}`
}

export function newListItem(text = '') {
  return { id: tempId(), text, done: false, position: 0, isNew: true }
}

export default function ListEditor({ items, onChange }) {
  const inputsRef = useRef({})

  function updateItem(id, changes) {
    onChange(items.map(it => (it.id === id ? { ...it, ...changes } : it)))
  }

  function toggleDone(id) {
    updateItem(id, { done: !items.find(it => it.id === id)?.done })
  }

  function removeItem(id) {
    onChange(items.filter(it => it.id !== id))
  }

  function addItemAfter(id) {
    const index = items.findIndex(it => it.id === id)
    const item = newListItem('')
    const newItems = [...items]
    newItems.splice(index + 1, 0, item)
    onChange(newItems.map((it, i) => ({ ...it, position: i })))
    requestAnimationFrame(() => inputsRef.current[item.id]?.focus())
  }

  function addItemAtEnd() {
    const item = newListItem('')
    onChange([...items, { ...item, position: items.length }])
    requestAnimationFrame(() => inputsRef.current[item.id]?.focus())
  }

  function handleKeyDown(e, id) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addItemAfter(id)
    } else if (e.key === 'Backspace' && e.target.value === '' && items.length > 1) {
      e.preventDefault()
      removeItem(id)
    }
  }

  return (
    <div className="list-editor">
      {items.map(item => (
        <div key={item.id} className={'list-editor-row' + (item.done ? ' done' : '')}>
          <button
            type="button"
            className={'list-checkbox' + (item.done ? ' checked' : '')}
            onClick={() => toggleDone(item.id)}
            aria-label={item.done ? 'Marcar como pendiente' : 'Marcar como hecho'}
          >
            {item.done && (
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                <path d="M1 5L4.2 8.2L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
          <input
            ref={el => { inputsRef.current[item.id] = el }}
            type="text"
            className="list-item-input"
            placeholder="Elemento de la lista..."
            value={item.text}
            onChange={e => updateItem(item.id, { text: e.target.value })}
            onKeyDown={e => handleKeyDown(e, item.id)}
          />
          <button
            type="button"
            className="list-item-remove"
            onClick={() => removeItem(item.id)}
            aria-label="Eliminar elemento"
          >
            &times;
          </button>
        </div>
      ))}

      <button type="button" className="list-add-btn" onClick={addItemAtEnd}>
        + Añadir elemento
      </button>
    </div>
  )
}
