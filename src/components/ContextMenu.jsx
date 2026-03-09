import { useEffect, useRef } from 'react'

/**
 * Context menu triggered by right-click or long-press. Renders at position with items.
 * @param {{ x: number, y: number } | null} position - client coordinates; null hides
 * @param {{ id: string, label: string, onClick: () => void }[]} items
 * @param {() => void} onClose - called when menu should close (click outside, escape, or item chosen)
 */
export default function ContextMenu({ position, items, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!position) return
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('click', handleClick, true)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('click', handleClick, true)
      document.removeEventListener('keydown', handleKey)
    }
  }, [position, onClose])

  if (!position) return null

  return (
    <div
      ref={ref}
      className="fixed z-[100] min-w-[160px] py-1 bg-white rounded-lg shadow-lg border border-gray-200"
      style={{ left: position.x, top: position.y }}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          onClick={() => {
            item.onClick?.()
            onClose()
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
