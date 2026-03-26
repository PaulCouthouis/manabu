import { assert, layer } from "@effect/vitest"
import { Effect, Layer } from "effect"
import { BrowserMediaRecorderApi, MediaRecorderApi } from "~/logic/vocal/media-recorder.js"
import type { AudioStream } from "~/logic/vocal/types.js"

// --- Fake ---

const fakeBlob = new Blob(["fake-audio"], { type: "audio/webm" })

const calls = {
  started: false,
  stopped: false,
}

const TestLayer = Layer.provide(
  MediaRecorderApi.Default,
  Layer.succeed(BrowserMediaRecorderApi, {
    start: () => {
      calls.started = true
      return {
        stop: () => {
          calls.stopped = true
          return Effect.succeed(fakeBlob)
        },
      }
    },
  }),
)

const fakeStream: AudioStream = { _tag: "AudioStream", getTracks: () => [] }

// --- Tests ---

layer(TestLayer)("MediaRecorderApi", (it) => {
  it.effect("start démarre l'enregistrement → AC15", () =>
    Effect.gen(function* () {
      const api = yield* MediaRecorderApi
      yield* api.start(fakeStream)
      assert.isTrue(calls.started)
    }),
  )

  it.effect("stop retourne un Blob audio → AC16", () =>
    Effect.gen(function* () {
      const api = yield* MediaRecorderApi
      const handle = yield* api.start(fakeStream)
      const blob = yield* handle.stop()
      assert.instanceOf(blob, Blob)
      assert.strictEqual(blob.type, "audio/webm")
    }),
  )
})
