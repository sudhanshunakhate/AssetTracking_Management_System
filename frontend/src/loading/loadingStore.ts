/** Lightweight global loading counter for API calls and navigation. */

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

export function subscribeLoading(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
