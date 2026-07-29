import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type AuthUser = { loginId: string; displayName: string; role: string }

type AuthContextValue = {
  user: AuthUser | null
  login: (loginId: string, password: string) => { ok: boolean; error?: string }
  logout: () => void
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
  const [user, setUser] = useState<AuthUser | null>(() => readStored())

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: (loginId, password) => {
        if (!loginId.trim() || !password) {
          return { ok: false, error: 'Enter Login ID and password to continue.' }
        }
        const next: AuthUser = {
          loginId: loginId.trim().toLowerCase(),
          displayName: loginId
            .trim()
            .split('.')
            .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
            .join(' '),
          role: 'Super Administrator',
        }
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        setUser(next)
        return { ok: true }
      },
      logout: () => {
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
