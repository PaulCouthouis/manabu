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

            const processFrame = (now: number): Effect.Effect<ReadonlyArray<VoiceCaptureEvent>> => {
              return Effect.gen(function* () {
                const frequencyData = analyser.getFrequencyData()
                const result = detectSpeech(frequencyData, vadState, now)
                vadState = result.state

                const base: ReadonlyArray<VoiceCaptureEvent> = [
                  { kind: "frequencyData", data: frequencyData },
                ]

                const speechEvent = yield* resolveSpeechEvent(result.event)

                return Array.match(speechEvent, {
                  onEmpty: () => {
                    return base
                  },
                  onNonEmpty: (events) => {
                    return Array.appendAll(base, events)
                  },
                })
              })
            }

            const resolveSpeechEvent = (event: {
              readonly kind: string
            }): Effect.Effect<ReadonlyArray<VoiceCaptureEvent>> => {
              if (event.kind === "speechStart") {
                return Effect.gen(function* () {
                  const handle = yield* recorderApi.start(stream)
                  recorder = Option.some(handle)
                  return [{ kind: "speechStart" as const }]
                })
              }
              if (event.kind === "speechEnd") {
                return Option.match(recorder, {
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
              return Effect.succeed(Array.empty())
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
