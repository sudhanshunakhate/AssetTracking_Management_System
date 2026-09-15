interface ShinyTextProps {
  text: string
  className?: string
  speed?: number
}

/** React Bits — ShinyText (sheen sweep) */
export default function ShinyText({ text, className = '', speed = 3 }: ShinyTextProps) {
  return (
    <span
      className={`inline-block bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(120deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.95) 45%, rgba(255,255,255,0.35) 100%)',
        backgroundSize: '200% auto',
        animation: `shiny ${speed}s linear infinite`,
        WebkitBackgroundClip: 'text',
      }}
    >
      {text}
      <style>{`@keyframes shiny { to { background-position: 200% center; } }`}</style>
    </span>
  )
}
