import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { beginLoading, endLoading } from './loadingStore'

/**
 * Brief loading pulse on client-side route changes only.
 * Do NOT pulse on every button click — that raced the click against GlobalLoader
 * and made the entire UI appear dead.
 */
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
    const timer = window.setTimeout(release, 350)
    return () => {
      window.clearTimeout(timer)
      release()
    }
  }, [location.pathname, location.search, navType])

  return null
}
