import { useEffect, useRef } from "react"

export function useAutoplayFeedback(
  isFeedback: boolean,
  text: string,
  speak: (text: string) => void,
) {
  const hasPlayed = useRef(false)

  useEffect(() => {
    if (!isFeedback) {
      hasPlayed.current = false
      return
    }
    if (hasPlayed.current) {
      return
    }
    hasPlayed.current = true
    speak(text)
  }, [isFeedback, text, speak])
}
