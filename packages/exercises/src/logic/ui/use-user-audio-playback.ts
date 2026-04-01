import { useEffect, useRef } from "react"

export function useUserAudioPlayback(blob: Blob | null) {
  const urlRef = useRef<string | null>(null)

  useEffect(() => {
    if (blob !== null) {
      urlRef.current = URL.createObjectURL(blob)
    }
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
        urlRef.current = null
      }
    }
  }, [blob])

  const playUserAudio = () => {
    if (urlRef.current) {
      const audio = new Audio(urlRef.current)
      audio.play()
    }
  }

  return playUserAudio
}
