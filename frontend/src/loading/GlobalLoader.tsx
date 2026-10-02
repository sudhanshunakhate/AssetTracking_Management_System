import { useEffect, useRef, useState } from 'react'
import { MorphingInfinity } from '@/components/react-bits/MorphingInfinity'
import { getPendingCount, subscribeLoading } from './loadingStore'

const SHOW_DELAY_MS = 180
const MIN_VISIBLE_MS = 280

/**
 * Full-screen busy overlay for in-flight API / navigation work.
 * While visible it captures pointer/keyboard input so nothing behind can be clicked.
 */
export function GlobalLoader() {
  const [showSpinner, setShowSpinner] = useState(false)
  const spinnerRef = useRef(false)
  const showAtRef = useRef(0)
  const showTimer = useRef<number | null>(null)
  const hideTimer = useRef<number | null>(null)

  useEffect(() => {
    const clearShow = () => {
      if (showTimer.current != null) {
        window.clearTimeout(showTimer.current)
        showTimer.current = null
      }
    }
    const clearHide = () => {
      if (hideTimer.current != null) {
        window.clearTimeout(hideTimer.current)
        hideTimer.current = null
      }
    }

    const sync = () => {
      const busy = getPendingCount() > 0
      if (busy) {
        clearHide()
        if (spinnerRef.current || showTimer.current != null) return
        showTimer.current = window.setTimeout(() => {
          showTimer.current = null
          showAtRef.current = Date.now()
          spinnerRef.current = true
          setShowSpinner(true)
        }, SHOW_DELAY_MS)
        return
      }

      clearShow()
      if (!spinnerRef.current) return

      const elapsed = Date.now() - showAtRef.current
      const wait = Math.max(0, MIN_VISIBLE_MS - elapsed)
      clearHide()
      hideTimer.current = window.setTimeout(() => {
        hideTimer.current = null
        spinnerRef.current = false
        setShowSpinner(false)
      }, wait)
    }

    const unsub = subscribeLoading(sync)
    sync()
    return () => {
      unsub()
      clearShow()
      clearHide()
    }
  }, [])

  useEffect(() => {
    if (!showSpinner) return

    const prevOverflow = document.body.style.overflow
    const prevCursor = document.body.style.cursor
    document.body.style.overflow = 'hidden'
    document.body.style.cursor = 'wait'

    const block = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
    }

    // Capture phase so clicks never reach UI behind the overlay.
    const opts: AddEventListenerOptions = { capture: true }
    const events: Array<keyof DocumentEventMap> = [
      'pointerdown',
      'mousedown',
      'mouseup',
      'click',
      'dblclick',
      'touchstart',
      'touchend',
      'contextmenu',
      'wheel',
      'keydown',
      'keyup',
    ]
    for (const ev of events) document.addEventListener(ev, block, opts)

    return () => {
      document.body.style.overflow = prevOverflow
      document.body.style.cursor = prevCursor
      for (const ev of events) document.removeEventListener(ev, block, opts)
    }
  }, [showSpinner])

  if (!showSpinner) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex cursor-wait items-center justify-center bg-transparent"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      onMouseDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      onPointerDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      <MorphingInfinity className="pointer-events-none h-14 w-14 text-[var(--accent)]" />
    </div>
  )
}
