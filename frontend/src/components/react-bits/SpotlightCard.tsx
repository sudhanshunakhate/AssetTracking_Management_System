import { useRef, type MouseEvent, type ReactNode } from 'react'

interface SpotlightCardProps {
  children: ReactNode
  className?: string
  spotlightColor?: string
}

/** React Bits — SpotlightCard (cursor spotlight) */
export default function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(37, 99, 235, 0.12)',
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--spot-x', `${e.clientX - rect.left}px`)
    el.style.setProperty('--spot-y', `${e.clientY - rect.top}px`)
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={`relative overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--sh)] ${className}`}
      style={{
        backgroundImage: `radial-gradient(500px circle at var(--spot-x, 50%) var(--spot-y, 50%), ${spotlightColor}, transparent 45%)`,
      }}
    >
      {children}
    </div>
  )
}
