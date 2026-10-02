const POPUP_SHOWN_KEY = 'caits.ntfPopup.lastShownMaxId'

function popupStorageKey(userId?: number) {
  return `${POPUP_SHOWN_KEY}.${userId ?? 'anon'}`
}

export function readLoginNtfPopupLastShownMaxId(userId?: number): number {
  try {
    const raw = sessionStorage.getItem(popupStorageKey(userId))
    const n = raw == null ? 0 : Number(raw)
    return Number.isFinite(n) ? n : 0
  } catch {
    return 0
  }
}

export function writeLoginNtfPopupLastShownMaxId(userId: number | undefined, maxId: number) {
  try {
    sessionStorage.setItem(popupStorageKey(userId), String(maxId))
  } catch {
    /* ignore */
  }
}

/** Clears "already shown" so the next login can present unread once again. */
export function clearLoginNotificationPopupState(userId?: number) {
  try {
    if (userId != null) sessionStorage.removeItem(popupStorageKey(userId))
    sessionStorage.removeItem(popupStorageKey(undefined))
  } catch {
    /* ignore */
  }
}
