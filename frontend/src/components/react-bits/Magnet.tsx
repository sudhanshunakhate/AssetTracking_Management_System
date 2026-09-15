import { useRef, type MouseEvent, type ReactNode } from 'react'

interface MagnetProps {
  children: ReactNode
  className?: string
  padding?: number
  magnetStrength?: number
}

/** React Bits — Magnet (cursor attraction) */
export default function Magnet({
  children,
  className = '',
  padding = 40,
  magnetStrength = 3,
}: MagnetProps) {
  const ref = useRef<HTMLDivElement>(null)

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - (rect.left + rect.width / 2)
    const y = e.clientY - (rect.top + rect.height / 2)
    if (Math.abs(x) < padding && Math.abs(y) < padding) {
      el.style.transform = `translate(${x / magnetStrength}px, ${y / magnetStrength}px)`
    }
  }

  const onLeave = () => {
    if (ref.current) ref.current.style.transform = 'translate(0px, 0px)'
  }

  return (
    <div
      ref={ref}
      className={`inline-block transition-transform duration-150 ease-out ${className}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </div>
  )
}
