'use client'

import { useState, useEffect } from 'react'

interface UseStreamingTextReturn {
  displayedText: string
  isComplete: boolean
}

export function useStreamingText(
  text: string,
  speed: number = 12
): UseStreamingTextReturn {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (!text) {
      setDisplayedText('')
      setIsComplete(false)
      return
    }

    setDisplayedText('')
    setIsComplete(false)
    let index = 0

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1))
        index++
      } else {
        setIsComplete(true)
        clearInterval(interval)
      }
    }, speed)

    return () => clearInterval(interval)
  }, [text, speed])

  return { displayedText, isComplete }
}
