import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getToken,
  loginApi,
  logoutApi,
  meApi,
  setToken,
  type MenuPermission,
} from '@/api/client'

type AuthUser = { loginId: string; displayName: string; role: string; userId?: number }

type AuthContextValue = {
  user: AuthUser | null
  menuPermissions: MenuPermission[]
  permissionsReady: boolean
  canViewMenu: (menuCode: string) => boolean
  canCreateMenu: (menuCode: string) => boolean
  canEditMenu: (menuCode: string) => boolean
  canDeleteMenu: (menuCode: string) => boolean
  refreshPermissions: () => Promise<void>
  login: (loginId: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)
const STORAGE_KEY = 'caits.auth'
const PERMS_KEY = 'caits.menuPermissions'

function readStored(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = readStored()
    if (stored && !getToken()) {
      sessionStorage.removeItem(STORAGE_KEY)
      sessionStorage.removeItem(PERMS_KEY)
      return null
    }
    return stored
  })
  const [menuPermissions, setMenuPermissions] = useState<MenuPermission[]>(() =>
    getToken() ? readStoredPerms() : [],
  )
  const [permissionsReady, setPermissionsReady] = useState(() => !getToken() || readStoredPerms().length > 0)

  const applyMe = useCallback(async () => {
    if (!getToken()) {
      setMenuPermissions([])
      setPermissionsReady(true)
      return
    }
    const me = await meApi()
    const perms = me.menuPermissions ?? []
    setMenuPermissions(perms)
    storePerms(perms)
    setPermissionsReady(true)
    setUser((prev) => {
      if (!prev) return prev
      const next = {
        ...prev,
        displayName: me.employeeName || prev.displayName,
        role: me.role || prev.role,
        userId: me.userId ?? prev.userId,
      }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

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

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      menuPermissions,
      permissionsReady,
      canViewMenu,
      canCreateMenu,
      canEditMenu,
      canDeleteMenu,
      refreshPermissions: applyMe,
      login: async (loginId, password) => {
        if (!loginId.trim() || !password) {
          return { ok: false, error: 'Enter Login ID and password to continue.' }
        }
        try {
          const res = await loginApi(loginId.trim(), password)
          setToken(res.token)
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
            const me = await meApi()
            const perms = me.menuPermissions ?? []
            setMenuPermissions(perms)
            storePerms(perms)
          } catch {
            setMenuPermissions([])
            storePerms([])
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
        sessionStorage.removeItem(STORAGE_KEY)
        sessionStorage.removeItem(PERMS_KEY)
        setMenuPermissions([])
        setPermissionsReady(true)
        setUser(null)
      },
    }),
    [user, menuPermissions, permissionsReady, canViewMenu, canCreateMenu, canEditMenu, canDeleteMenu, applyMe],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
