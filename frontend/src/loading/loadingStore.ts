/** Lightweight global loading counter for API calls, navigation, and UI actions. */

type Listener = () => void

let pending = 0
const listeners = new Set<Listener>()

function notify() {
  listeners.forEach((fn) => fn())
}

export function getPendingCount() {
  return pending
}

export function beginLoading() {
  pending += 1
  notify()
}

export function endLoading() {
  pending = Math.max(0, pending - 1)
  notify()
}

/** Brief busy pulse for clicks/navigation when no API is in flight yet. */
export function pulseLoading(ms = 450) {
  beginLoading()
  window.setTimeout(() => endLoading(), ms)
}

export function subscribeLoading(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
