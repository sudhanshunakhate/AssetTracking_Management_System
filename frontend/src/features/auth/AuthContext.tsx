import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { loginApi, logoutApi, setToken, getToken } from '@/api/client'

type AuthUser = { loginId: string; displayName: string; role: string; userId?: number }

type AuthContextValue = {
  user: AuthUser | null
  login: (loginId: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)
const STORAGE_KEY = 'caits.auth'

function readStored(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = readStored()
    if (stored && !getToken()) {
      sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    return stored
  })

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
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
          return { ok: true }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Login failed'
          return { ok: false, error: message }
        }
      },
      logout: async () => {
        await logoutApi()
        sessionStorage.removeItem(STORAGE_KEY)
        setUser(null)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
