import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { beginLoading, endLoading, pulseLoading } from './loadingStore'

function isInteractiveTarget(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null
  // Links navigate via the route effect — pulsing on pointerdown steals the click
  // once GlobalLoader covers the screen (even briefly).
  const el = target.closest(
    'button, [role="button"], input[type="submit"], input[type="button"], summary, [data-loading]',
  )
  if (!(el instanceof HTMLElement)) return null
  if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') return null
  if (el.closest('[data-no-loader]')) return null
  if (el.closest('a[href]')) return null
  return el
}

/** Starts the global loader on route changes and interactive clicks. */
export function AppBusyBridge() {
  const location = useLocation()
  const navType = useNavigationType()

  useEffect(() => {
    beginLoading()
    let released = false
    const release = () => {
      if (released) return
      released = true
      endLoading()
    }
    const timer = window.setTimeout(release, 500)
    return () => {
      window.clearTimeout(timer)
      release()
    }
  }, [location.pathname, location.search, navType])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      const el = isInteractiveTarget(event.target)
      if (!el) return
      pulseLoading(420)
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [])

  return null
}
