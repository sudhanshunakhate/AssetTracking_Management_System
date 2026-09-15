import { motion } from 'motion/react'
import type { ReactNode } from 'react'

interface FadeContentProps {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  blur?: boolean
}

/** React Bits — FadeContent (mount fade/slide) */
export default function FadeContent({
  children,
  className = '',
  delay = 0,
  duration = 0.45,
  blur = false,
}: FadeContentProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10, filter: blur ? 'blur(8px)' : 'blur(0px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration, delay, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  )
}
