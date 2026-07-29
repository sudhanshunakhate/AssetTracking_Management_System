interface GradientTextProps {
  children: string
  className?: string
  colors?: string[]
  animationSpeed?: number
}

/** React Bits — GradientText */
export default function GradientText({
  children,
  className = '',
  colors = ['#93c5fd', '#2563eb', '#1e40af', '#93c5fd'],
  animationSpeed = 6,
}: GradientTextProps) {
  return (
    <span
      className={`inline-block bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: `linear-gradient(90deg, ${colors.join(',')})`,
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        animation: `gradSweep ${animationSpeed}s linear infinite`,
      }}
    >
      {children}
      <style>{`@keyframes gradSweep { to { background-position: 200% center; } }`}</style>
    </span>
  )
}
