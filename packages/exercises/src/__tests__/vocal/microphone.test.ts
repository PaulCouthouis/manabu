import { assert, layer } from "@effect/vitest"
import { Effect, Layer } from "effect"
import { GetUserMediaApi, MicrophoneApi } from "~/logic/vocal/microphone.js"

// --- Helpers ---

const makeTestLayer = (getUserMedia: () => Promise<MediaStream>) => {
  return Layer.provide(MicrophoneApi.Default, Layer.succeed(GetUserMediaApi, { getUserMedia }))
}

const makeFakeStream = (trackIds: ReadonlyArray<string>) => {
  const stopped: Array<string> = []
  const stream = {
    getTracks: () => {
      return trackIds.map((id) => ({
        id,
        stop: () => {
          stopped.push(id)
        },
      }))
    },
  } as unknown as MediaStream
  return { stream, stopped }
}

// --- acquire ---

const { stream: fakeStream } = makeFakeStream([])

layer(
  makeTestLayer(() => {
    return Promise.resolve(fakeStream)
  }),
)("acquire — succès", (it) => {
  it.effect("retourne le MediaStream → AC1", () =>
    Effect.gen(function* () {
      const api = yield* MicrophoneApi
      const stream = yield* api.acquire()
      assert.strictEqual(stream, fakeStream)
    }),
  )
})

layer(
  makeTestLayer(() => {
    return Promise.reject(new DOMException("Permission denied", "NotAllowedError"))
  }),
)("acquire — permission refusée", (it) => {
  it.effect("retourne MicrophoneError permission-denied → AC2", () =>
    Effect.gen(function* () {
      const api = yield* MicrophoneApi
      const error = yield* api.acquire().pipe(Effect.flip)
      assert.strictEqual(error._tag, "MicrophoneError")
      assert.strictEqual(error.reason, "permission-denied")
    }),
  )
})

layer(
  makeTestLayer(() => {
    return Promise.reject(new DOMException("Device not found", "NotFoundError"))
  }),
)("acquire — device absent", (it) => {
  it.effect("retourne MicrophoneError not-available → AC3", () =>
    Effect.gen(function* () {
      const api = yield* MicrophoneApi
      const error = yield* api.acquire().pipe(Effect.flip)
      assert.strictEqual(error._tag, "MicrophoneError")
      assert.strictEqual(error.reason, "not-available")
    }),
  )
})

// --- release ---

layer(
  makeTestLayer(() => {
    return Promise.resolve({} as unknown as MediaStream)
  }),
)("release — arrête les tracks", (it) => {
  it.effect("stoppe toutes les tracks du MediaStream → AC4", () =>
    Effect.gen(function* () {
      const { stream, stopped } = makeFakeStream(["track-0", "track-1"])
      const api = yield* MicrophoneApi
      yield* api.release(stream)
      assert.deepStrictEqual(stopped, ["track-0", "track-1"])
    }),
  )
})
