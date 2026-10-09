import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  Aurora,
  BlurText,
  ClickSpark,
  GhostCursor,
  StarBorder,
  TextType,
} from '@/components/react-bits'
import { forgotPasswordOtpApi, resetPasswordOtpApi } from '@/api/client'
import { useAuth } from './AuthContext'

const LOGO_SRC = '/logo/caits-login.png?v=2'
const PRESENTS_MARK = '/logo/presents-mark.png'
const REMEMBER_KEY = 'caits.rememberLoginId'
const CRAFTED_NAMES = ['Sanika Sapkale', 'Sudhanshu Nakhate'] as const

export function LoginPage() {
  const { user, sessionReady, login } = useAuth()
  const navigate = useNavigate()
  const [loginId, setLoginId] = useState(() => localStorage.getItem(REMEMBER_KEY) ?? '')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(() => Boolean(localStorage.getItem(REMEMBER_KEY)))
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [forgotBusy, setForgotBusy] = useState(false)
  
  const [mode, setMode] = useState<'login' | 'forgot' | 'reset'>('login')
  const [resetEmail, setResetEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [craftedIndex, setCraftedIndex] = useState(0)
  const [craftedVisible, setCraftedVisible] = useState(true)

  useEffect(() => {
    if (!remember) localStorage.removeItem(REMEMBER_KEY)
  }, [remember])

  useEffect(() => {
    const id = window.setInterval(() => {
      setCraftedVisible(false)
      window.setTimeout(() => {
        setCraftedIndex((i) => (i + 1) % CRAFTED_NAMES.length)
        setCraftedVisible(true)
      }, 280)
    }, 2800)
    return () => window.clearInterval(id)
  }, [])

  if (!sessionReady) return null
  if (user) return <Navigate to="/dashboard" replace />

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setInfo('')
    try {
      const result = await login(loginId, password)
      if (!result.ok) {
        setError(result.error ?? 'Invalid credentials')
        return
      }
      if (remember) localStorage.setItem(REMEMBER_KEY, loginId.trim())
      else localStorage.removeItem(REMEMBER_KEY)
      navigate('/dashboard', { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  const onForgotSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    if (!resetEmail.trim()) {
      setError('Enter your registered email address.')
      return
    }
    setForgotBusy(true)
    try {
      const res = await forgotPasswordOtpApi(resetEmail.trim())
      setInfo(res.message || 'OTP sent to registered email if account exists.')
      setMode('reset')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to request OTP')
    } finally {
      setForgotBusy(false)
    }
  }

  const onResetSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    if (!otp.trim() || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      const res = await resetPasswordOtpApi({
        email: resetEmail.trim(),
        otp: otp.trim(),
        newPassword,
        confirmPassword,
      })
      setInfo(res.message || 'Password has been reset successfully. Please log in.')
      setMode('login')
      setOtp('')
      setNewPassword('')
      setConfirmPassword('')
      setResetEmail('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password')
    } finally {
      setSubmitting(false)
    }
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

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 pb-16">
        <div className="grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden text-white lg:block">
            <div className="mb-5">
              <img
                src={LOGO_SRC}
                alt="CAITS"
                width={280}
                height={238}
                className="h-auto w-[min(100%,220px)] object-contain"
              />
              <div className="mt-2 text-[11px] tracking-[0.3px] text-white/55 uppercase">
                Centralized Asset & Inventory Tracking
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
                  'Sign in with your CAITS Login ID to continue.',
                ]}
                typingSpeed={36}
                className="text-white/75"
              />
            </p>
          </div>

          <StarBorder className="w-full max-w-[420px] justify-self-center" color="#60a5fa" speed="5s">
            <form onSubmit={onSubmit} className="w-full rounded-[9px] bg-white px-8 pt-9 pb-7">
              <div className="mb-5 flex flex-col items-center text-center lg:hidden">
                <img
                  src={LOGO_SRC}
                  alt="CAITS"
                  width={280}
                  height={238}
                  className="h-auto w-[min(100%,160px)] object-contain"
                />
              </div>

              {mode === 'login' && (
                <>
                  <div className="mb-1 text-[19px] font-bold text-[var(--text)]">Sign in</div>
                  <div className="mb-5 text-[12.5px] text-[var(--text3)]">
                    Enter your Login ID and password to continue
                  </div>

                  {error && (
                    <div className="mb-3.5 rounded-lg border border-[#fecaca] bg-[var(--danger-lt)] px-3 py-2 text-xs text-[var(--danger)]">
                      {error}
                    </div>
                  )}
                  {info && (
                    <div className="mb-3.5 rounded-lg border border-[#bbf7d0] bg-[var(--success-lt)] px-3 py-2 text-xs text-[var(--success)]">
                      {info}
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
                      Remember Login ID
                    </label>
                    <button
                      type="button"
                      className="text-xs font-semibold text-[var(--accent)] hover:underline"
                      onClick={() => {
                        setMode('forgot')
                        setError('')
                        setInfo('')
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="brand-cta w-full rounded-lg py-[11px] text-[13.5px] font-bold text-white shadow-[var(--brand-glow)] disabled:opacity-60"
                  >
                    {submitting ? 'Signing in…' : 'Sign In'}
                  </button>
                </>
              )}

              {mode === 'forgot' && (
                <>
                  <div className="mb-1 text-[19px] font-bold text-[var(--text)]">Forgot Password</div>
                  <div className="mb-5 text-[12.5px] text-[var(--text3)]">
                    Enter your registered email address to receive an OTP.
                  </div>

                  {error && (
                    <div className="mb-3.5 rounded-lg border border-[#fecaca] bg-[var(--danger-lt)] px-3 py-2 text-xs text-[var(--danger)]">
                      {error}
                    </div>
                  )}
                  {info && (
                    <div className="mb-3.5 rounded-lg border border-[#bbf7d0] bg-[var(--success-lt)] px-3 py-2 text-xs text-[var(--success)]">
                      {info}
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="mb-1.5 block text-[11.5px] font-semibold text-[var(--text2)]">
                      Email Address
                    </label>
                    <input
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="user@example.com"
                      autoFocus
                      className="w-full rounded-lg border border-[var(--border2)] bg-[var(--surface2)] px-3 py-2.5 text-[13px] text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:bg-white"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      className="w-1/3 rounded-lg border border-[var(--border2)] bg-[var(--surface1)] py-[11px] text-[13.5px] font-bold text-[var(--text)] transition hover:bg-[var(--surface2)]"
                      onClick={() => {
                        setMode('login')
                        setError('')
                        setInfo('')
                      }}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={forgotBusy}
                      onClick={onForgotSubmit}
                      className="brand-cta w-2/3 rounded-lg py-[11px] text-[13.5px] font-bold text-white shadow-[var(--brand-glow)] disabled:opacity-60"
                    >
                      {forgotBusy ? 'Sending…' : 'Send OTP'}
                    </button>
                  </div>
                </>
              )}

              {mode === 'reset' && (
                <>
                  <div className="mb-1 text-[19px] font-bold text-[var(--text)]">Reset Password</div>
                  <div className="mb-5 text-[12.5px] text-[var(--text3)]">
                    Enter the 8-digit OTP sent to your email, and choose a new password.
                  </div>

                  {error && (
                    <div className="mb-3.5 rounded-lg border border-[#fecaca] bg-[var(--danger-lt)] px-3 py-2 text-xs text-[var(--danger)]">
                      {error}
                    </div>
                  )}
                  {info && (
                    <div className="mb-3.5 rounded-lg border border-[#bbf7d0] bg-[var(--success-lt)] px-3 py-2 text-xs text-[var(--success)]">
                      {info}
                    </div>
                  )}

                  <div className="mb-3.5">
                    <label className="mb-1.5 block text-[11.5px] font-semibold text-[var(--text2)]">
                      8-Digit OTP
                    </label>
                    <input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter OTP"
                      autoFocus
                      maxLength={8}
                      className="w-full rounded-lg border border-[var(--border2)] bg-[var(--surface2)] px-3 py-2.5 text-[13px] tracking-widest text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:bg-white"
                    />
                  </div>

                  <div className="mb-3.5">
                    <label className="mb-1.5 block text-[11.5px] font-semibold text-[var(--text2)]">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-[var(--border2)] bg-[var(--surface2)] px-3 py-2.5 text-[13px] text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:bg-white"
                    />
                  </div>

                  <div className="mb-5">
                    <label className="mb-1.5 block text-[11.5px] font-semibold text-[var(--text2)]">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-[var(--border2)] bg-[var(--surface2)] px-3 py-2.5 text-[13px] text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:bg-white"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      className="w-1/3 rounded-lg border border-[var(--border2)] bg-[var(--surface1)] py-[11px] text-[13.5px] font-bold text-[var(--text)] transition hover:bg-[var(--surface2)]"
                      onClick={() => {
                        setMode('login')
                        setError('')
                        setInfo('')
                        setOtp('')
                        setNewPassword('')
                        setConfirmPassword('')
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={onResetSubmit}
                      className="brand-cta w-2/3 rounded-lg py-[11px] text-[13.5px] font-bold text-white shadow-[var(--brand-glow)] disabled:opacity-60"
                    >
                      {submitting ? 'Resetting…' : 'Reset Password'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </StarBorder>
        </div>
      </div>

      {/* Bottom center: logo + presents CAITS */}
      <div className="pointer-events-none absolute inset-x-0 bottom-5 z-20 flex items-center justify-center gap-2 text-[11px] text-white/55">
        <img
          src={PRESENTS_MARK}
          alt=""
          width={22}
          height={22}
          className="h-[22px] w-[22px] rounded-full object-cover"
        />
        <span>presents CAITS</span>
      </div>

      {/* Bottom right: Crafted by rotating names — fixed width so the pill doesn't jump */}
      <div className="absolute right-4 bottom-4 z-20 sm:right-6 sm:bottom-5">
        <div className="inline-flex h-7 w-[190px] items-center rounded-full border border-slate-200 bg-white px-2.5 shadow-[0_3px_10px_rgba(15,23,42,0.1)]">
          <span className="shrink-0 text-[10.5px] text-slate-600">Crafted by&nbsp;</span>
          <span className="relative min-w-0 flex-1 overflow-hidden text-left">
            <span
              className="block truncate text-[10.5px] font-bold text-emerald-800 transition-opacity duration-300"
              style={{ opacity: craftedVisible ? 1 : 0 }}
            >
              {CRAFTED_NAMES[craftedIndex]}
            </span>
          </span>
        </div>
      </div>
    </ClickSpark>
  )
}
