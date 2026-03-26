import { assert, layer } from "@effect/vitest"
import { Effect, Layer } from "effect"
import {
  type AudioContextHandle,
  AudioAnalyserApi,
  WebAudioContextApi,
} from "~/logic/vocal/audio-analyser.js"
import type { AudioStream } from "~/logic/vocal/types.js"

// --- Fake WebAudio ---

const calls = {
  connected: false,
  disconnected: false,
  closed: false,
}

const fakeContext: AudioContextHandle = {
  createFromStream: () => {
    calls.connected = true
    return {
      analyser: {
        frequencyBinCount: 4,
        getByteFrequencyData: (array: Uint8Array) => {
          array[0] = 10
          array[1] = 20
          array[2] = 30
          array[3] = 40
        },
      },
      disconnect: () => {
        calls.disconnected = true
      },
    }
  },
  close: () => {
    calls.closed = true
  },
}

const TestLayer = Layer.provide(
  AudioAnalyserApi.Default,
  Layer.succeed(WebAudioContextApi, {
    createContext: () => {
      return fakeContext
    },
  }),
)

const fakeStream: AudioStream = { _tag: "AudioStream" }

// --- Tests ---

layer(TestLayer)("AudioAnalyserApi", (it) => {
  it.effect("create branche le MediaStream et retourne un AnalyserHandle → AC5", () =>
    Effect.gen(function* () {
      const api = yield* AudioAnalyserApi
      const handle = api.create(fakeStream)
      assert.isDefined(handle)
      assert.isFunction(handle.getFrequencyData)
      assert.isFunction(handle.close)
      assert.isTrue(calls.connected)
    }),
  )

  it.effect("getFrequencyData retourne un Uint8Array → AC6", () =>
    Effect.gen(function* () {
      const api = yield* AudioAnalyserApi
      const handle = api.create(fakeStream)
      const data = handle.getFrequencyData()
      assert.instanceOf(data, Uint8Array)
      assert.strictEqual(data.length, 4)
      assert.strictEqual(data[0], 10)
      assert.strictEqual(data[3], 40)
    }),
  )

  it.effect("close ferme l'AudioContext → AC7", () =>
    Effect.gen(function* () {
      calls.disconnected = false
      calls.closed = false
      const api = yield* AudioAnalyserApi
      const handle = api.create(fakeStream)
      handle.close()
      assert.isTrue(calls.disconnected)
      assert.isTrue(calls.closed)
    }),
  )
})
