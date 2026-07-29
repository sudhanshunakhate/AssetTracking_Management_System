import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  Aurora,
  BlurText,
  ClickSpark,
  GhostCursor,
  GradientText,
  StarBorder,
  TextType,
} from '@/components/react-bits'
import { useAuth } from './AuthContext'

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [loginId, setLoginId] = useState('aditya.kulkarni')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')

  if (user) return <Navigate to="/dashboard" replace />

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const result = login(loginId, password || 'demo')
    if (!result.ok) {
      setError(result.error ?? 'Invalid credentials')
      return
    }
    navigate('/dashboard', { replace: true })
  }

  return (
    <ClickSpark className="fixed inset-0 z-[1000] min-h-screen overflow-hidden" sparkColor="#93c5fd">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#1e3a8a]">
        <Aurora
          colorStops={['#0f172a', '#2563eb', '#1d4ed8']}
          amplitude={1.1}
          blend={0.55}
          speed={0.9}
          className="opacity-80"
        />
      </div>

      {/* React Bits GhostCursor — trails pointer over the login canvas */}
      <GhostCursor
        color="#60a5fa"
        brightness={2}
        edgeIntensity={0}
        trailLength={50}
        inertia={0.5}
        grainIntensity={0.05}
        bloomStrength={0.1}
        bloomRadius={1}
        bloomThreshold={0.025}
        fadeDelayMs={1000}
        fadeDurationMs={1500}
        zIndex={5}
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden text-white lg:block">
            <div className="mb-4 inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[var(--accent)] text-[15px] font-bold">
                  CA
                </div>
                <div>
                  <div className="text-lg font-bold">
                    <GradientText colors={['#bfdbfe', '#ffffff', '#93c5fd', '#bfdbfe']}>
                      CAITS
                    </GradientText>
                  </div>
                  <div className="text-[11px] tracking-[0.3px] text-white/55 uppercase">
                    Centralized Asset & Inventory Tracking
                  </div>
                </div>
              </div>
              <h1 className="mb-3 text-4xl leading-tight font-bold tracking-[-0.5px]">
                <BlurText text="Track every asset. Control every store." />
              </h1>
            <p className="max-w-md text-[14px] leading-relaxed text-white/70">
              <TextType
                text={[
                  'Masters, locations, and access — one system of record.',
                  'Built for IT operations and store governance.',
                  'Phase 1 UI prototype — mock auth, no backend yet.',
                ]}
                typingSpeed={36}
                className="text-white/75"
              />
            </p>
          </div>

          <StarBorder className="w-full max-w-[420px] justify-self-center" color="#60a5fa" speed="5s">
            <form onSubmit={onSubmit} className="w-full rounded-[9px] bg-white px-8 pt-9 pb-7">
              <div className="mb-5 flex items-center gap-3 lg:hidden">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[var(--accent)] text-[13px] font-bold text-white">
                  CA
                </div>
                <div>
                  <div className="text-base font-bold text-[var(--text)]">CAITS</div>
                  <div className="text-[11px] text-[var(--text3)]">Tracking System</div>
                </div>
              </div>

              <div className="mb-1 text-[19px] font-bold text-[var(--text)]">
                Sign in
              </div>
              <div className="mb-5 text-[12.5px] text-[var(--text3)]">
                Enter your Login ID and password to continue
              </div>

              {error && (
                <div className="mb-3.5 rounded-lg border border-[#fecaca] bg-[var(--danger-lt)] px-3 py-2 text-xs text-[var(--danger)]">
                  {error}
                </div>
              )}

              <div className="mb-3.5">
                <label className="mb-1.5 block text-[11.5px] font-semibold text-[var(--text2)]">
                  Login ID
                </label>
                <input
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="firstname.lastname"
                  autoFocus
                  className="w-full rounded-lg border border-[var(--border2)] bg-[var(--surface2)] px-3 py-2.5 text-[13px] text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:bg-white"
                />
              </div>

              <div className="mb-3.5">
                <label className="mb-1.5 block text-[11.5px] font-semibold text-[var(--text2)]">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-[var(--border2)] bg-[var(--surface2)] px-3 py-2.5 text-[13px] text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:bg-white"
                />
              </div>

              <div className="mb-[18px] flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs text-[var(--text2)]">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="accent-[var(--accent)]"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  className="text-xs font-semibold text-[var(--accent)]"
                  onClick={() => setError('Contact your administrator to reset your password.')}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-[var(--accent)] py-[11px] text-[13.5px] font-bold text-white transition hover:bg-[#1d4ed8]"
              >
                Sign In
              </button>

              <div className="mt-5 rounded-lg border border-dashed border-[var(--accent-mid)] bg-[var(--accent-lt)] px-3 py-2.5 text-[11px] leading-relaxed text-[var(--text2)]">
                <b className="text-[var(--accent)]">Demo mode</b> — UI prototype only. Any password
                signs you in. Try Login ID <b className="text-[var(--accent)]">aditya.kulkarni</b>.
              </div>
            </form>
          </StarBorder>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-5 text-center text-[10.5px] text-white/55">
        CAITS · Centralized Asset and Inventory Tracking System
      </div>
    </ClickSpark>
  )
}
