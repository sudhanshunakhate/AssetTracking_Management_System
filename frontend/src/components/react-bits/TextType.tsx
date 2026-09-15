import { useEffect, useState } from 'react'

interface TextTypeProps {
  text: string | string[]
  typingSpeed?: number
  pauseDuration?: number
  className?: string
  showCursor?: boolean
}

/** React Bits — TextType (typewriter) */
export default function TextType({
  text,
  typingSpeed = 45,
  pauseDuration = 1800,
  className = '',
  showCursor = true,
}: TextTypeProps) {
  const phrases = Array.isArray(text) ? text : [text]
  const [index, setIndex] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = phrases[index % phrases.length]
    if (!deleting && displayed === current) {
      const t = setTimeout(() => setDeleting(true), pauseDuration)
      return () => clearTimeout(t)
    }
    if (deleting && displayed === '') {
      setDeleting(false)
      setIndex((i) => (i + 1) % phrases.length)
      return
    }
    const t = setTimeout(
      () => {
        setDisplayed((prev) =>
          deleting ? current.slice(0, prev.length - 1) : current.slice(0, prev.length + 1),
        )
      },
      deleting ? typingSpeed / 1.6 : typingSpeed,
    )
    return () => clearTimeout(t)
  }, [displayed, deleting, index, phrases, typingSpeed, pauseDuration])

  return (
    <span className={className}>
      {displayed}
      {showCursor && <span className="ml-0.5 animate-pulse">|</span>}
    </span>
  )
}
