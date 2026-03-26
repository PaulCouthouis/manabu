import { Array, Context, Effect, Layer } from "effect"
import type { AudioStream } from "~/logic/vocal/types.js"

export interface RecorderHandle {
  readonly stop: () => Effect.Effect<Blob>
}

export class BrowserMediaRecorderApi extends Context.Tag("BrowserMediaRecorderApi")<
  BrowserMediaRecorderApi,
  {
    readonly start: (stream: MediaStream) => RecorderHandle
  }
>() {}

export class MediaRecorderApi extends Effect.Service<MediaRecorderApi>()("MediaRecorderApi", {
  effect: Effect.gen(function* () {
    const api = yield* BrowserMediaRecorderApi
    return {
      start: (stream: AudioStream): Effect.Effect<RecorderHandle> => {
        return Effect.sync(() => {
          return api.start(stream as unknown as MediaStream)
        })
      },
    }
  }),
}) {}

export const BrowserMediaRecorderApiLive = Layer.succeed(BrowserMediaRecorderApi, {
  start: (mediaStream: MediaStream): RecorderHandle => {
    let recordedParts: ReadonlyArray<Blob> = Array.empty()
    const recorder = new MediaRecorder(mediaStream)

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedParts = Array.append(recordedParts, event.data)
      }
    }

    recorder.start()

    return {
      stop: (): Effect.Effect<Blob> => {
        return Effect.async<Blob>((resume) => {
          recorder.onstop = () => {
            resume(Effect.succeed(new Blob([...recordedParts], { type: recorder.mimeType })))
          }
          recorder.stop()
        })
      },
    }
  },
})
