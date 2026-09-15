import { motion } from 'motion/react'
import type { ReactNode } from 'react'

interface AnimatedContentProps {
  children: ReactNode
  className?: string
  direction?: 'up' | 'down' | 'left' | 'right'
  delay?: number
  distance?: number
}

/** React Bits — AnimatedContent */
export default function AnimatedContent({
  children,
  className = '',
  direction = 'up',
  delay = 0,
  distance = 18,
}: AnimatedContentProps) {
  const offset = {
    up: { y: distance, x: 0 },
    down: { y: -distance, x: 0 },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
  }[direction]

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offset }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
