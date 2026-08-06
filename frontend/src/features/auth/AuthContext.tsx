import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getToken,
  loginApi,
  logoutApi,
  markUserActivity,
  maybeRefreshSession,
  meApi,
  setSessionExpiredHandler,
  setToken,
  type AccessScope,
  type MenuPermission,
} from '@/api/client'
import { invalidateCache } from '@/api/requestCache'

type AuthUser = {
  loginId: string
  displayName: string
  role: string
  userId?: number
  employeeId?: number
}

/** What the logged-in user is allowed to see, as returned by /auth/me. */
export type DataScope = {
  entityId?: number
  buAccessScope: AccessScope
  allowedBuIds: number[]
  locationAccessScope: AccessScope
  allowedLocationIds: number[]
  defaultLocationId?: number
}

const UNRESTRICTED: DataScope = {
  buAccessScope: 'ALL',
  allowedBuIds: [],
  locationAccessScope: 'ALL',
  allowedLocationIds: [],
}

type AuthContextValue = {
  user: AuthUser | null
  menuPermissions: MenuPermission[]
  favouriteMenuCodes: string[]
  setFavouriteMenuCodes: (codes: string[]) => void
  permissionsReady: boolean
  scope: DataScope
  /** True when the user may see every location. The API is the authority; this is for wording. */
  seesAllLocations: boolean
  canViewMenu: (menuCode: string) => boolean
  canCreateMenu: (menuCode: string) => boolean
  canEditMenu: (menuCode: string) => boolean
  canDeleteMenu: (menuCode: string) => boolean
  canApproveMenu: (menuCode: string) => boolean
  canRejectMenu: (menuCode: string) => boolean
  refreshPermissions: () => Promise<void>
  login: (loginId: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)
const STORAGE_KEY = 'caits.auth'
const PERMS_KEY = 'caits.menuPermissions'
const SCOPE_KEY = 'caits.dataScope'
const FAVS_KEY = 'caits.favouriteMenus'

function readStored(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

function readStoredScope(): DataScope {
  try {
    const raw = sessionStorage.getItem(SCOPE_KEY)
    return raw ? (JSON.parse(raw) as DataScope) : UNRESTRICTED
  } catch {
    return UNRESTRICTED
  }
}

function storeScope(scope: DataScope) {
  sessionStorage.setItem(SCOPE_KEY, JSON.stringify(scope))
}

function readStoredPerms(): MenuPermission[] {
  try {
    const raw = sessionStorage.getItem(PERMS_KEY)
    return raw ? (JSON.parse(raw) as MenuPermission[]) : []
  } catch {
    return []
  }
}

function storePerms(perms: MenuPermission[]) {
  sessionStorage.setItem(PERMS_KEY, JSON.stringify(perms))
}

function readStoredFavs(): string[] {
  try {
    const raw = sessionStorage.getItem(FAVS_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function storeFavs(codes: string[]) {
  sessionStorage.setItem(FAVS_KEY, JSON.stringify(codes))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = readStored()
    if (stored && !getToken()) {
      sessionStorage.removeItem(STORAGE_KEY)
      sessionStorage.removeItem(PERMS_KEY)
      sessionStorage.removeItem(SCOPE_KEY)
      sessionStorage.removeItem(FAVS_KEY)
      return null
    }
    return stored
  })
  const [menuPermissions, setMenuPermissions] = useState<MenuPermission[]>(() =>
    getToken() ? readStoredPerms() : [],
  )
  const [favouriteMenuCodes, setFavouriteMenuCodesState] = useState<string[]>(() =>
    getToken() ? readStoredFavs() : [],
  )
  const [permissionsReady, setPermissionsReady] = useState(() => !getToken() || readStoredPerms().length > 0)
  const [scope, setScope] = useState<DataScope>(() => (getToken() ? readStoredScope() : UNRESTRICTED))

  const clearLocalSession = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(PERMS_KEY)
    sessionStorage.removeItem(SCOPE_KEY)
    sessionStorage.removeItem(FAVS_KEY)
    setMenuPermissions([])
    setFavouriteMenuCodesState([])
    setScope(UNRESTRICTED)
    setPermissionsReady(true)
    setUser(null)
  }, [])

  const setFavouriteMenuCodes = useCallback((codes: string[]) => {
    setFavouriteMenuCodesState(codes)
    storeFavs(codes)
  }, [])

  // Expired JWT → clear session and go to login (no "Access Denied" page state).
  useEffect(() => {
    setSessionExpiredHandler(() => {
      clearLocalSession()
      invalidateCache()
      navigate('/login', { replace: true })
    })
    return () => setSessionExpiredHandler(null)
  }, [clearLocalSession, navigate])

  // While working: activity bumps the clock; near expiry we refresh the JWT instead of logging out.
  useEffect(() => {
    if (!user) return
    markUserActivity()
    const onActivity = () => {
      markUserActivity()
      void maybeRefreshSession()
    }
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'scroll', 'focus']
    for (const ev of events) window.addEventListener(ev, onActivity, { passive: true })
    const tick = window.setInterval(() => {
      void maybeRefreshSession()
    }, 60_000)
    return () => {
      for (const ev of events) window.removeEventListener(ev, onActivity)
      window.clearInterval(tick)
    }
  }, [user])

  const applyMe = useCallback(async () => {
    if (!getToken()) {
      setMenuPermissions([])
      setFavouriteMenuCodesState([])
      setScope(UNRESTRICTED)
      setPermissionsReady(true)
      return
    }
    const me = await meApi()
    const perms = me.menuPermissions ?? []
    setMenuPermissions(perms)
    storePerms(perms)
    const favs = me.favouriteMenuCodes ?? []
    setFavouriteMenuCodesState(favs)
    storeFavs(favs)
    const nextScope: DataScope = {
      entityId: me.entityId,
      buAccessScope: me.buAccessScope ?? 'ALL',
      allowedBuIds: me.allowedBuIds ?? [],
      locationAccessScope: me.locationAccessScope ?? 'ALL',
      allowedLocationIds: me.allowedLocationIds ?? [],
      defaultLocationId: me.defaultLocationId,
    }
    setScope(nextScope)
    storeScope(nextScope)
    setPermissionsReady(true)
    setUser((prev) => {
      if (!prev) return prev
      const next = {
        ...prev,
        displayName: me.employeeName || prev.displayName,
        role: me.role || prev.role,
        userId: me.userId ?? prev.userId,
        employeeId: me.employeeId ?? prev.employeeId,
        loginId: me.loginId || prev.loginId,
      }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const seesAllLocations = scope.locationAccessScope !== 'SELECTED'

  useEffect(() => {
    if (!getToken()) {
      setPermissionsReady(true)
      return
    }
    void applyMe().catch(() => {
      setPermissionsReady(true)
    })
  }, [applyMe])

  const canViewMenu = useCallback(
    (menuCode: string) => {
      const hit = menuPermissions.find((p) => p.menuCode === menuCode)
      return Boolean(hit?.view)
    },
    [menuPermissions],
  )

  const canCreateMenu = useCallback(
    (menuCode: string) => {
      const hit = menuPermissions.find((p) => p.menuCode === menuCode)
      return Boolean(hit?.create)
    },
    [menuPermissions],
  )

  const canEditMenu = useCallback(
    (menuCode: string) => {
      const hit = menuPermissions.find((p) => p.menuCode === menuCode)
      return Boolean(hit?.edit)
    },
    [menuPermissions],
  )

  const canDeleteMenu = useCallback(
    (menuCode: string) => {
      const hit = menuPermissions.find((p) => p.menuCode === menuCode)
      return Boolean(hit?.delete)
    },
    [menuPermissions],
  )

  const canApproveMenu = useCallback(
    (menuCode: string) => {
      const hit = menuPermissions.find((p) => p.menuCode === menuCode)
      return Boolean(hit?.approve)
    },
    [menuPermissions],
  )

  const canRejectMenu = useCallback(
    (menuCode: string) => {
      const hit = menuPermissions.find((p) => p.menuCode === menuCode)
      return Boolean(hit?.reject)
    },
    [menuPermissions],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      menuPermissions,
      favouriteMenuCodes,
      setFavouriteMenuCodes,
      permissionsReady,
      scope,
      seesAllLocations,
      canViewMenu,
      canCreateMenu,
      canEditMenu,
      canDeleteMenu,
      canApproveMenu,
      canRejectMenu,
      refreshPermissions: applyMe,
      login: async (loginId, password) => {
        if (!loginId.trim() || !password) {
          return { ok: false, error: 'Enter Login ID and password to continue.' }
        }
        try {
          const res = await loginApi(loginId.trim(), password)
          setToken(res.token, res.expiresIn)
          markUserActivity()
          invalidateCache('auth:me')
          const next: AuthUser = {
            loginId: loginId.trim().toLowerCase(),
            displayName: res.user.employeeName,
            role: res.user.roleCode,
            userId: res.user.userId,
          }
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
          setUser(next)
          setPermissionsReady(false)
          try {
            await applyMe()
          } catch {
            setMenuPermissions([])
            storePerms([])
            setFavouriteMenuCodesState([])
            storeFavs([])
            setScope(UNRESTRICTED)
          } finally {
            setPermissionsReady(true)
          }
          return { ok: true }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Login failed'
          return { ok: false, error: message }
        }
      },
      logout: async () => {
        await logoutApi()
        clearLocalSession()
      },
    }),
    [
      user,
      menuPermissions,
      favouriteMenuCodes,
      setFavouriteMenuCodes,
      permissionsReady,
      scope,
      seesAllLocations,
      canViewMenu,
      canCreateMenu,
      canEditMenu,
      canDeleteMenu,
      canApproveMenu,
      canRejectMenu,
      applyMe,
      clearLocalSession,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
