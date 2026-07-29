import { useCallback, useRef, type ReactNode, type MouseEvent } from 'react'

interface ClickSparkProps {
  children: ReactNode
  sparkColor?: string
  sparkCount?: number
  className?: string
}

/** React Bits — ClickSpark (click particle bursts) */
export default function ClickSpark({
  children,
  sparkColor = '#2563eb',
  sparkCount = 8,
  className = '',
}: ClickSparkProps) {
  const ref = useRef<HTMLDivElement>(null)

  const spark = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const root = ref.current
      if (!root) return
      const rect = root.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      for (let i = 0; i < sparkCount; i++) {
        const angle = (Math.PI * 2 * i) / sparkCount
        const dist = 18 + Math.random() * 14
        const dot = document.createElement('span')
        dot.style.cssText = `
          position:absolute;left:${x}px;top:${y}px;width:4px;height:4px;
          border-radius:50%;background:${sparkColor};pointer-events:none;
          transform:translate(-50%,-50%);opacity:1;transition:transform .45s ease-out,opacity .45s ease-out;
        `
        root.appendChild(dot)
        requestAnimationFrame(() => {
          dot.style.transform = `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px))`
          dot.style.opacity = '0'
        })
        setTimeout(() => dot.remove(), 500)
      }
    },
    [sparkColor, sparkCount],
  )

  return (
    <div ref={ref} className={`relative ${className}`} onClick={spark}>
      {children}
    </div>
  )
}
