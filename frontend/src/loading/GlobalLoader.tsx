import { useEffect, useRef, useState } from 'react'
import { MorphingInfinity } from '@/components/react-bits/MorphingInfinity'
import { getPendingCount, subscribeLoading } from './loadingStore'

const SHOW_DELAY_MS = 120
const MIN_VISIBLE_MS = 280

/** Full-app overlay using MorphingInfinity while the app is busy. */
export function GlobalLoader() {
  const [visible, setVisible] = useState(false)
  const visibleRef = useRef(false)
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
        if (visibleRef.current || showTimer.current != null) return
        showTimer.current = window.setTimeout(() => {
          showTimer.current = null
          showAtRef.current = Date.now()
          visibleRef.current = true
          setVisible(true)
        }, SHOW_DELAY_MS)
        return
      }

      clearShow()
      if (!visibleRef.current) return

      const elapsed = Date.now() - showAtRef.current
      const wait = Math.max(0, MIN_VISIBLE_MS - elapsed)
      clearHide()
      hideTimer.current = window.setTimeout(() => {
        hideTimer.current = null
        visibleRef.current = false
        setVisible(false)
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

  if (!visible) return null

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center bg-white/55 backdrop-blur-[1px]"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading"
    >
      <MorphingInfinity className="h-14 w-14 text-[var(--accent)]" />
    </div>
  )
}
