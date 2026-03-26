import { Duration, Option } from "effect"

interface SpeechDetectorConfig {
  readonly volumeThreshold: number
  readonly speechMinDuration: Duration.Duration
  readonly silenceMinDuration: Duration.Duration
}

export interface SpeechDetectorState {
  readonly isSpeaking: boolean
  readonly speakingStartedAt: Option.Option<number>
  readonly silenceStartedAt: Option.Option<number>
}

export type SpeechEvent =
  | { readonly kind: "speechStart" }
  | { readonly kind: "speechEnd" }
  | { readonly kind: "none" }

export const initialState: SpeechDetectorState = {
  isSpeaking: false,
  speakingStartedAt: Option.none(),
  silenceStartedAt: Option.none(),
}

export const defaultConfig: SpeechDetectorConfig = {
  volumeThreshold: 30,
  speechMinDuration: Duration.millis(30),
  silenceMinDuration: Duration.millis(800),
}

const computeAverageVolume = (frequencyData: Uint8Array): number => {
  if (frequencyData.length === 0) {
    return 0
  }
  return (
    frequencyData.reduce((acc, v) => {
      return acc + v
    }, 0) / frequencyData.length
  )
}

const none: SpeechEvent = { kind: "none" }
const speechStart: SpeechEvent = { kind: "speechStart" }
const speechEnd: SpeechEvent = { kind: "speechEnd" }

export const detectSpeech = (
  frequencyData: Uint8Array,
  state: SpeechDetectorState,
  now: number,
): { readonly state: SpeechDetectorState; readonly event: SpeechEvent } => {
  const volume = computeAverageVolume(frequencyData)
  const isLoud = volume >= defaultConfig.volumeThreshold

  if (state.isSpeaking) {
    return handleSpeakingState(state, now, isLoud)
  }
  return handleSilentState(state, now, isLoud)
}

const handleSilentState = (
  state: SpeechDetectorState,
  now: number,
  isLoud: boolean,
): { readonly state: SpeechDetectorState; readonly event: SpeechEvent } => {
  if (!isLoud) {
    return {
      state: { ...state, speakingStartedAt: Option.none() },
      event: none,
    }
  }

  const startedAt = Option.getOrElse(state.speakingStartedAt, () => {
    return now
  })
  const elapsed = now - startedAt

  if (elapsed >= Duration.toMillis(defaultConfig.speechMinDuration)) {
    return {
      state: {
        isSpeaking: true,
        speakingStartedAt: Option.some(startedAt),
        silenceStartedAt: Option.none(),
      },
      event: speechStart,
    }
  }

  return {
    state: { ...state, speakingStartedAt: Option.some(startedAt) },
    event: none,
  }
}

const handleSpeakingState = (
  state: SpeechDetectorState,
  now: number,
  isLoud: boolean,
): { readonly state: SpeechDetectorState; readonly event: SpeechEvent } => {
  if (isLoud) {
    return {
      state: { ...state, silenceStartedAt: Option.none() },
      event: none,
    }
  }

  const silenceStart = Option.getOrElse(state.silenceStartedAt, () => {
    return now
  })
  const elapsed = now - silenceStart

  if (elapsed >= Duration.toMillis(defaultConfig.silenceMinDuration)) {
    return {
      state: {
        isSpeaking: false,
        speakingStartedAt: Option.none(),
        silenceStartedAt: Option.none(),
      },
      event: speechEnd,
    }
  }

  return {
    state: { ...state, silenceStartedAt: Option.some(silenceStart) },
    event: none,
  }
}
