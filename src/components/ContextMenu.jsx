import { useState, useRef, useEffect, useCallback } from 'react'

const LONG_PRESS_MS = 450
const MOVE_CANCEL_PX = 10

/**
 * Hook que detecta click derecho (desktop) y pulsación larga (móvil/táctil)
 * sobre un elemento, y devuelve la posición donde abrir un menú contextual.
 *
 * Uso:
 *   const { menuState, bind, closeMenu } = useContextMenu()
 *   <div {...bind}>...</div>
 *   {menuState && <ContextMenu x={menuState.x} y={menuState.y} onClose={closeMenu}>...</ContextMenu>}
 */
export function useContextMenu() {
  const [menuState, setMenuState] = useState(null) // { x, y } | null
  const pressTimer = useRef(null)
  const startPos = useRef({ x: 0, y: 0 })
  const longPressFired = useRef(false)

  const openAt = useCallback((x, y) => {
    setMenuState({ x, y })
  }, [])

  const closeMenu = useCallback(() => setMenuState(null), [])

  function handleContextMenu(e) {
    e.preventDefault()
    openAt(e.clientX, e.clientY)
  }

  function clearPressTimer() {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
  }

  function handleTouchStart(e) {
    if (e.touches.length !== 1) return
    const touch = e.touches[0]
    startPos.current = { x: touch.clientX, y: touch.clientY }
    longPressFired.current = false
    pressTimer.current = setTimeout(() => {
      longPressFired.current = true
      openAt(touch.clientX, touch.clientY)
      if (navigator.vibrate) navigator.vibrate(8)
    }, LONG_PRESS_MS)
  }

  function handleTouchMove(e) {
    if (!pressTimer.current) return
    const touch = e.touches[0]
    const dx = Math.abs(touch.clientX - startPos.current.x)
    const dy = Math.abs(touch.clientY - startPos.current.y)
    if (dx > MOVE_CANCEL_PX || dy > MOVE_CANCEL_PX) {
      clearPressTimer()
    }
  }

  function handleTouchEnd() {
    clearPressTimer()
  }

  // Si la pulsación larga disparó el menú, evitamos que el click normal
  // (onClick del padre) se ejecute justo después al levantar el dedo.
  function handleClickCapture(e) {
    if (longPressFired.current) {
      e.stopPropagation()
      e.preventDefault()
      longPressFired.current = false
    }
  }

  const bind = {
    onContextMenu: handleContextMenu,
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: clearPressTimer,
    onClickCapture: handleClickCapture,
  }

  return { menuState, bind, closeMenu }
}

export function ContextMenu({ x, y, onClose, children }) {
  const ref = useRef(null)
  const [pos, setPos] = useState({ x, y })

  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    function handleEscape(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  // Ajusta la posición para que el menú no se salga de la pantalla.
  useEffect(() => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const margin = 8
    let adjustedX = x
    let adjustedY = y
    if (x + rect.width > window.innerWidth - margin) {
      adjustedX = window.innerWidth - rect.width - margin
    }
    if (y + rect.height > window.innerHeight - margin) {
      adjustedY = window.innerHeight - rect.height - margin
    }
    setPos({ x: Math.max(margin, adjustedX), y: Math.max(margin, adjustedY) })
  }, [x, y])

  return (
    <div
      className="context-menu"
      ref={ref}
      style={{ left: pos.x, top: pos.y }}
      onClick={onClose}
    >
      {children}
    </div>
  )
}
