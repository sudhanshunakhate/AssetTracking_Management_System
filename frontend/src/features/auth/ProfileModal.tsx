import { useEffect, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { changePasswordApi, profileApi, type ProfileResponse } from '@/api/client'

function formatDate(value?: string) {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [y, m, d] = value.slice(0, 10).split('-')
    return `${d}-${m}-${y}`
  }
  return value
}

function formatDateTime(value?: string) {
  if (!value) return null
  try {
    return new Date(value).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

function initialsFrom(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U'
  )
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  const empty = !value || !String(value).trim()
  return (
    <div className="min-w-0 rounded-lg bg-[var(--surface2)]/80 px-3 py-2.5 ring-1 ring-[var(--border)]/80">
      <div className="text-[10px] font-bold tracking-[0.06em] text-[var(--text3)] uppercase">{label}</div>
      <div
        className={`mt-1 truncate text-[13px] font-semibold ${
          empty ? 'text-[var(--text3)]' : 'text-[var(--text)]'
        }`}
        title={empty ? undefined : String(value)}
      >
        {empty ? 'Not set' : value}
      </div>
    </div>
  )
}

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: ReactNode
}) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-baseline gap-2">
        <h3 className="text-[12px] font-bold tracking-wide text-[var(--text)]">{title}</h3>
        {hint && <span className="text-[11px] text-[var(--text3)]">{hint}</span>}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{children}</div>
    </section>
  )
}

/**
 * Own-profile dialog opened from the topbar avatar menu.
 * Shows employee-master details for the logged-in user and lets them change password.
 */
export function ProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'details' | 'password'>('details')

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPw, setSavingPw] = useState(false)
  const [pwMessage, setPwMessage] = useState<string | null>(null)
  const [pwError, setPwError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTab('details')
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPwMessage(null)
    setPwError(null)
    setError(null)
    setLoading(true)
    void profileApi()
      .then(setProfile)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load profile'))
      .finally(() => setLoading(false))
  }, [open])

  const changePassword = async () => {
    setPwError(null)
    setPwMessage(null)
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPwError('All password fields are required.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError('New password and confirm password do not match.')
      return
    }
    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters.')
      return
    }
    setSavingPw(true)
    try {
      const res = await changePasswordApi({ oldPassword, newPassword, confirmPassword })
      setPwMessage(res.message || 'Password changed successfully.')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (e) {
      setPwError(e instanceof Error ? e.message : 'Could not change password')
    } finally {
      setSavingPw(false)
    }
  }

  const fullName = profile
    ? `${profile.firstName ?? ''}${profile.lastName ? ` ${profile.lastName}` : ''}`.trim()
    : ''
  const active = profile?.isActive !== false

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="My Profile"
      subtitle="Account details and security"
      width="max-w-3xl"
      footer={
        tab === 'password' ? (
          <>
            <Button variant="ghost" onClick={onClose} disabled={savingPw}>
              Close
            </Button>
            <Button onClick={() => void changePassword()} disabled={savingPw}>
              {savingPw ? 'Saving…' : 'Update Password'}
            </Button>
          </>
        ) : (
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        )
      }
    >
      {/* Identity banner */}
      <div className="relative mb-4 overflow-hidden rounded-xl bg-gradient-to-br from-[var(--accent)] to-[#1e40af] p-4 text-white shadow-[var(--sh)]">
        <div
          className="pointer-events-none absolute -top-10 -right-8 h-36 w-36 rounded-full bg-white/10"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-12 left-1/3 h-28 w-28 rounded-full bg-white/10"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-center gap-3.5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-[18px] font-bold tracking-wide ring-2 ring-white/30 backdrop-blur-sm">
            {loading ? '…' : initialsFrom(fullName || profile?.loginId || 'U')}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[16px] font-bold tracking-tight">
              {loading ? 'Loading…' : fullName || profile?.loginId || '—'}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11.5px] text-white/85">
              {profile?.designation && <span>{profile.designation}</span>}
              {profile?.designation && profile?.department && <span>·</span>}
              {profile?.department && <span>{profile.department}</span>}
              {!profile?.designation && !profile?.department && !loading && (
                <span>{profile?.role ?? 'User'}</span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {profile?.role && (
                <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10.5px] font-semibold tracking-wide uppercase ring-1 ring-white/25">
                  {profile.role}
                </span>
              )}
              {profile && (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold ${
                    active
                      ? 'bg-[var(--success-lt)] text-[var(--success)]'
                      : 'bg-white/20 text-white'
                  }`}
                >
                  {active ? 'Active' : 'Inactive'}
                </span>
              )}
              {profile?.employeeCode && (
                <span className="rounded-full bg-black/15 px-2.5 py-0.5 font-mono text-[10.5px] text-white/90">
                  {profile.employeeCode}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-1">
        <button
          type="button"
          onClick={() => setTab('details')}
          className={`flex-1 rounded-lg px-3 py-2 text-[12.5px] font-semibold transition ${
            tab === 'details'
              ? 'bg-[var(--surface)] text-[var(--accent)] shadow-[var(--sh)] ring-1 ring-[var(--border)]'
              : 'text-[var(--text2)] hover:text-[var(--text)]'
          }`}
        >
          Profile Details
        </button>
        <button
          type="button"
          onClick={() => setTab('password')}
          className={`flex-1 rounded-lg px-3 py-2 text-[12.5px] font-semibold transition ${
            tab === 'password'
              ? 'bg-[var(--surface)] text-[var(--accent)] shadow-[var(--sh)] ring-1 ring-[var(--border)]'
              : 'text-[var(--text2)] hover:text-[var(--text)]'
          }`}
        >
          Security
        </button>
      </div>

      {loading && (
        <div className="rounded-xl border border-dashed border-[var(--border2)] bg-[var(--surface2)] px-4 py-8 text-center text-[12.5px] text-[var(--text3)]">
          Loading profile…
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-[#fecaca] bg-[var(--danger-lt)] px-3.5 py-3 text-[12.5px] font-medium text-[var(--danger)]">
          {error}
        </div>
      )}

      {!loading && !error && profile && tab === 'details' && (
        <div className="space-y-4">
          <Section title="Identity" hint="Login & employee">
            <InfoRow label="Employee Code" value={profile.employeeCode} />
            <InfoRow label="Login ID" value={profile.loginId} />
            <InfoRow label="First Name" value={profile.firstName} />
            <InfoRow label="Last Name" value={profile.lastName} />
            <InfoRow label="Gender" value={profile.gender} />
            <InfoRow label="Date of Birth" value={formatDate(profile.dob)} />
          </Section>

          <Section title="Contact">
            <InfoRow label="Email" value={profile.email} />
            <InfoRow label="Phone" value={profile.phone} />
            <InfoRow label="Alt. Phone" value={profile.altPhone} />
            <InfoRow label="Base Location" value={profile.baseLocationName} />
          </Section>

          <Section title="Employment">
            <InfoRow label="Designation" value={profile.designation} />
            <InfoRow label="Department" value={profile.department} />
            <InfoRow label="Employment Type" value={profile.employmentType} />
            <InfoRow label="Joining Date" value={formatDate(profile.joiningDate)} />
            <InfoRow label="Reporting To" value={profile.reportingToName} />
            <InfoRow label="Role" value={profile.role} />
          </Section>

          <Section title="Activity">
            <InfoRow label="Status" value={active ? 'Active' : 'Inactive'} />
            <InfoRow label="Last Login" value={formatDateTime(profile.lastLoginOn)} />
          </Section>
        </div>
      )}

      {!loading && tab === 'password' && (
        <div className="space-y-3.5">
          <div className="rounded-xl border border-[var(--accent-mid)] bg-[var(--accent-lt)] px-3.5 py-3 text-[12px] leading-relaxed text-[var(--text2)]">
            Choose a strong password (at least 8 characters). You’ll stay signed in on this device
            after updating.
          </div>
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 shadow-[var(--sh)]">
            <Field label="Current Password" required>
              <Input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                autoComplete="current-password"
              />
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="New Password" required hint="At least 8 characters">
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </Field>
              <Field label="Confirm New Password" required>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </Field>
            </div>
            {pwError && (
              <div className="rounded-lg bg-[var(--danger-lt)] px-3 py-2 text-[11.5px] font-medium text-[var(--danger)]">
                {pwError}
              </div>
            )}
            {pwMessage && (
              <div className="rounded-lg bg-[var(--success-lt)] px-3 py-2 text-[11.5px] font-medium text-[var(--success)]">
                {pwMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
