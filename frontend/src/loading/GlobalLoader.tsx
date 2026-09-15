import { useEffect, useRef, useState } from 'react'
import { MorphingInfinity } from '@/components/react-bits/MorphingInfinity'
import { getPendingCount, subscribeLoading } from './loadingStore'

const SHOW_DELAY_MS = 180
const MIN_VISIBLE_MS = 280

/**
 * Visual busy indicator for in-flight API / navigation work.
 * Uses a single overlay (no document capture listeners) so clicks are never
 * swallowed by passive-listener preventDefault or a transparent full-screen trap.
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

  if (!showSpinner) return null

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999] flex cursor-wait items-center justify-center bg-white/45 backdrop-blur-[1px]"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading"
    >
      <MorphingInfinity className="pointer-events-none h-14 w-14 text-[var(--accent)]" />
    </div>
  )
}
