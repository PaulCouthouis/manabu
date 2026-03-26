import { Array, Effect, Option } from "effect"
import { AudioAnalyserApi } from "~/logic/vocal/audio-analyser.js"
import {
  type SpeechDetectorState,
  detectSpeech,
  initialState,
} from "~/logic/vocal/detect-speech.js"
import type { RecorderHandle } from "~/logic/vocal/media-recorder.js"
import { MediaRecorderApi } from "~/logic/vocal/media-recorder.js"
import { type MicrophoneError, MicrophoneApi } from "~/logic/vocal/microphone.js"

export type VoiceCaptureEvent =
  | { readonly kind: "frequencyData"; readonly data: Uint8Array }
  | { readonly kind: "speechStart" }
  | { readonly kind: "speechEnd"; readonly blob: Blob }

export interface VoiceCaptureSession {
  readonly processFrame: (now: number) => Effect.Effect<ReadonlyArray<VoiceCaptureEvent>>
  readonly close: () => Effect.Effect<void>
}

export class VoiceCaptureService extends Effect.Service<VoiceCaptureService>()(
  "VoiceCaptureService",
  {
    effect: Effect.gen(function* () {
      const mic = yield* MicrophoneApi
      const analyserApi = yield* AudioAnalyserApi
      const recorderApi = yield* MediaRecorderApi

      return {
        start: (): Effect.Effect<VoiceCaptureSession, MicrophoneError> => {
          return Effect.gen(function* () {
            const stream = yield* mic.acquire()
            const analyser = analyserApi.create(stream)

            let vadState: SpeechDetectorState = initialState
            let recorder: Option.Option<RecorderHandle> = Option.none()
            let wasLoudPrevFrame = false

            const processFrame = (now: number): Effect.Effect<ReadonlyArray<VoiceCaptureEvent>> => {
              return Effect.gen(function* () {
                const frequencyData = analyser.getFrequencyData()
                const prevState = vadState
                const result = detectSpeech(frequencyData, vadState, now)
                vadState = result.state

                const base: ReadonlyArray<VoiceCaptureEvent> = [
                  { kind: "frequencyData", data: frequencyData },
                ]

                const recorderEvents = yield* handleRecorder(prevState, result)

                return Array.match(recorderEvents, {
                  onEmpty: () => {
                    return base
                  },
                  onNonEmpty: (events) => {
                    return Array.appendAll(base, events)
                  },
                })
              })
            }

            const handleRecorder = (
              prevState: SpeechDetectorState,
              result: {
                readonly state: SpeechDetectorState
                readonly event: { readonly kind: string }
              },
            ): Effect.Effect<ReadonlyArray<VoiceCaptureEvent>> => {
              return Effect.gen(function* () {
                const isNowLoud = Option.isSome(result.state.speakingStartedAt)
                const wasQuiet = !wasLoudPrevFrame
                wasLoudPrevFrame = isNowLoud

                // Début de bruit → démarrer l'enregistrement préventivement
                if (isNowLoud && wasQuiet && Option.isNone(recorder)) {
                  const handle = yield* recorderApi.start(stream)
                  recorder = Option.some(handle)
                }

                // Faux positif : le bruit s'arrête avant speechStart (jamais passé en isSpeaking) → annuler
                if (
                  !isNowLoud &&
                  !result.state.isSpeaking &&
                  !prevState.isSpeaking &&
                  Option.isSome(recorder)
                ) {
                  yield* recorder.value.stop()
                  recorder = Option.none()
                  return Array.empty<VoiceCaptureEvent>()
                }

                // speechStart confirmé → émettre l'event (recorder déjà actif)
                if (result.event.kind === "speechStart") {
                  return [{ kind: "speechStart" as const }]
                }

                // speechEnd → stopper et émettre le blob
                if (result.event.kind === "speechEnd") {
                  return yield* Option.match(recorder, {
                    onNone: () => {
                      return Effect.succeed(Array.empty<VoiceCaptureEvent>())
                    },
                    onSome: (handle) => {
                      return Effect.gen(function* () {
                        const blob = yield* handle.stop()
                        recorder = Option.none()
                        return [{ kind: "speechEnd" as const, blob }]
                      })
                    },
                  })
                }

                return Array.empty()
              })
            }

            const close = (): Effect.Effect<void> => {
              return Effect.gen(function* () {
                yield* Option.match(recorder, {
                  onNone: () => {
                    return Effect.void
                  },
                  onSome: (handle) => {
                    return Effect.gen(function* () {
                      yield* handle.stop()
                      recorder = Option.none()
                    })
                  },
                })
                analyser.close()
                yield* mic.release(stream)
              })
            }

            return { processFrame, close }
          })
        },
      }
    }),
  },
) {}
