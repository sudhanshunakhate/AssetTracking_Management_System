export function StatusBadge({ status }: { status: string }) {
  const active = status === 'Active'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
        active
          ? 'bg-[var(--success-lt)] text-[var(--success)]'
          : 'bg-[var(--border)] text-[var(--text3)]'
      }`}
    >
      <span
        className={`h-[5px] w-[5px] shrink-0 rounded-full ${
          active ? 'bg-[var(--success)]' : 'bg-[var(--text3)]'
        }`}
      />
      {status}
    </span>
  )
}

export function Pill({ children }: { children: string }) {
  return (
    <span className="inline-flex rounded-full border border-[var(--warm-mid)]/50 bg-[var(--warm-lt)] px-2 py-0.5 text-[10.5px] font-semibold text-[var(--warm-deep)]">
      {children}
    </span>
  )
}
