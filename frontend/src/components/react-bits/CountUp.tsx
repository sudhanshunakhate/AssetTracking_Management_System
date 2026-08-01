import { useInView, useMotionValue, useSpring } from 'motion/react'
import { useCallback, useEffect, useRef } from 'react'

interface CountUpProps {
  to: number
  from?: number
  delay?: number
  duration?: number
  className?: string
  separator?: string
  prefix?: string
  suffix?: string
}

/** React Bits — CountUp (motion spring) */
export default function CountUp({
  to,
  from = 0,
  delay = 0,
  duration = 2,
  className = '',
  separator = ',',
  prefix = '',
  suffix = '',
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(from)
  const springValue = useSpring(motionValue, {
    damping: 20 + 40 * (1 / duration),
    stiffness: 100 * (1 / duration),
  })
  const isInView = useInView(ref, { once: true, margin: '0px' })

  const formatValue = useCallback(
    (latest: number) => {
      const formatted = Intl.NumberFormat('en-IN', {
        useGrouping: !!separator,
        maximumFractionDigits: 0,
      }).format(Math.round(latest))
      return `${prefix}${separator ? formatted : String(Math.round(latest))}${suffix}`
    },
    [prefix, separator, suffix],
  )

  useEffect(() => {
    if (!isInView) return
    const id = setTimeout(() => motionValue.set(to), delay * 1000)
    return () => clearTimeout(id)
  }, [isInView, motionValue, to, delay])

  useEffect(() => {
    const unsub = springValue.on('change', (latest) => {
      if (ref.current) ref.current.textContent = formatValue(latest)
    })
    return () => unsub()
  }, [springValue, formatValue])

  return (
    <span ref={ref} className={className}>
      {formatValue(from)}
    </span>
  )
}
