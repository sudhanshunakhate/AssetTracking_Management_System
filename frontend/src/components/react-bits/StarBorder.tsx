import type { CSSProperties, ReactNode } from 'react'

interface StarBorderProps {
  children: ReactNode
  className?: string
  color?: string
  speed?: string
}

/** React Bits — StarBorder */
export default function StarBorder({
  children,
  className = '',
  color = '#2563eb',
  speed = '4s',
}: StarBorderProps) {
  const style = {
    '--spd': speed,
    background: `conic-gradient(from 0deg, transparent 0 70%, ${color} 85%, transparent 100%)`,
    animation: `spin ${speed} linear infinite`,
  } as CSSProperties

  return (
    <div className={`relative inline-block overflow-hidden rounded-[10px] p-[1px] ${className}`}>
      <div className="pointer-events-none absolute inset-[-200%]" style={style} />
      <div className="relative rounded-[9px] bg-[var(--surface)]">{children}</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
