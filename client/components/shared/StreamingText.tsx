'use client'

import { useStreamingText } from '@/hooks/useStreamingText'
import { useEffect } from 'react'

interface StreamingTextProps {
  text: string
  speed?: number
  onComplete?: () => void
  className?: string
}

export function StreamingText({
  text,
  speed = 12,
  onComplete,
  className = '',
}: StreamingTextProps) {
  const { displayedText, isComplete } = useStreamingText(text, speed)

  useEffect(() => {
    if (isComplete && onComplete) {
      onComplete()
    }
  }, [isComplete, onComplete])

  return (
    <span className={className}>
      {displayedText}
      {!isComplete && (
        <span className="ml-0.5 inline-block w-2 h-4 bg-accent animate-[blink_0.6s_infinite]">
          <style>{`
            @keyframes blink {
              0%, 49% { opacity: 1; }
              50%, 100% { opacity: 0; }
            }
          `}</style>
        </span>
      )}
    </span>
  )
}
