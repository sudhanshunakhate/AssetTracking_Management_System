import { motion } from 'motion/react'

interface BlurTextProps {
  text: string
  className?: string
  delay?: number
}

/** React Bits — BlurText (blur-to-crisp reveal) */
export default function BlurText({ text, className = '', delay = 0 }: BlurTextProps) {
  const words = text.split(' ')
  return (
    <span className={`inline-flex flex-wrap gap-x-[0.3em] ${className}`}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={{ opacity: 0, filter: 'blur(10px)', y: 8 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          transition={{ duration: 0.5, delay: delay + i * 0.08, ease: 'easeOut' }}
          className="inline-block"
        >
          {word}
        </motion.span>
      ))}
    </span>
  )
}
