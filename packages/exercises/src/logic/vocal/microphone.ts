import { Array, Context, Data, Effect, Layer } from "effect"
import type { AudioStream, AudioStreamTrack } from "~/logic/vocal/types.js"

export class MicrophoneError extends Data.TaggedError("MicrophoneError")<{
  readonly reason: "permission-denied" | "not-available" | "unknown"
  readonly message: string
}> {}

export class GetUserMediaApi extends Context.Tag("GetUserMediaApi")<
  GetUserMediaApi,
  {
    readonly getUserMedia: (constraints: MediaStreamConstraints) => Promise<MediaStream>
  }
>() {}

const mapGetUserMediaError = (error: unknown): MicrophoneError => {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return new MicrophoneError({
        reason: "permission-denied",
        message: error.message,
      })
    }
    if (error.name === "NotFoundError") {
      return new MicrophoneError({
        reason: "not-available",
        message: error.message,
      })
    }
  }
  return new MicrophoneError({
    reason: "unknown",
    message: String(error),
  })
}

const wrapMediaStream = (mediaStream: MediaStream): AudioStream => ({
  _tag: "AudioStream",
  _raw: mediaStream,
  getTracks: (): ReadonlyArray<AudioStreamTrack> => {
    return Array.map(mediaStream.getTracks(), (track) => ({
      stop: () => {
        track.stop()
      },
    }))
  },
})

export class MicrophoneApi extends Effect.Service<MicrophoneApi>()("MicrophoneApi", {
  effect: Effect.gen(function* () {
    const api = yield* GetUserMediaApi
    return {
      acquire: (): Effect.Effect<AudioStream, MicrophoneError> => {
        return Effect.tryPromise({
          try: async () => {
            const mediaStream = await api.getUserMedia({ audio: true })
            return wrapMediaStream(mediaStream)
          },
          catch: mapGetUserMediaError,
        })
      },
      release: (stream: AudioStream): Effect.Effect<void> => {
        return Effect.sync(() => {
          Array.forEach(stream.getTracks(), (track) => {
            track.stop()
          })
        })
      },
    }
  }),
}) {}

export const BrowserGetUserMediaApiLive = Layer.succeed(GetUserMediaApi, {
  getUserMedia: (constraints: MediaStreamConstraints) => {
    return navigator.mediaDevices.getUserMedia(constraints)
  },
})
