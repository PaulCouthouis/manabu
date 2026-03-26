import { assert, layer } from "@effect/vitest"
import { Array, Effect, Layer } from "effect"
import { AudioAnalyserApi } from "~/logic/vocal/audio-analyser.js"
import { MicrophoneApi } from "~/logic/vocal/microphone.js"
import { MediaRecorderApi } from "~/logic/vocal/media-recorder.js"
import { VoiceCaptureService } from "~/logic/vocal/voice-capture.js"
import type { AudioStream } from "~/logic/vocal/types.js"

// --- Fakes ---

const fakeStream: AudioStream = { _tag: "AudioStream", getTracks: () => [] }

const makeFakeFrequencyData = (volume: number): Uint8Array => {
  const data = new Uint8Array(4)
  data.fill(volume)
  return data
}

let currentVolume = 0

const released = { value: false }
const analyserClosed = { value: false }
const recorderStarted = { value: false }
const recorderStopped = { value: false }

const fakeBlob = new Blob(["fake"], { type: "audio/webm" })

const FakeMicrophoneApi = Layer.succeed(MicrophoneApi, {
  acquire: () => {
    return Effect.succeed(fakeStream)
  },
  release: () => {
    released.value = true
    return Effect.void
  },
})

const FakeAudioAnalyserApi = Layer.succeed(AudioAnalyserApi, {
  create: () => {
    return {
      getFrequencyData: () => {
        return makeFakeFrequencyData(currentVolume)
      },
      close: () => {
        analyserClosed.value = true
      },
    }
  },
})

const FakeMediaRecorderApi = Layer.succeed(MediaRecorderApi, {
  start: () => {
    recorderStarted.value = true
    return Effect.succeed({
      stop: () => {
        recorderStopped.value = true
        return Effect.succeed(fakeBlob)
      },
    })
  },
})

const TestLayer = Layer.provide(
  VoiceCaptureService.Default,
  Layer.mergeAll(FakeMicrophoneApi, FakeAudioAnalyserApi, FakeMediaRecorderApi),
)

const resetFakes = () => {
  currentVolume = 0
  released.value = false
  analyserClosed.value = false
  recorderStarted.value = false
  recorderStopped.value = false
}

// --- Tests ---

layer(TestLayer)("VoiceCaptureService", (it) => {
  it.effect("processFrame émet frequencyData à chaque frame → AC17, AC20", () =>
    Effect.gen(function* () {
      resetFakes()
      currentVolume = 5
      const service = yield* VoiceCaptureService
      const session = yield* service.start()
      const events = yield* session.processFrame(0)
      const frequencyEvents = Array.filter(events, (e) => {
        return e.kind === "frequencyData"
      })
      assert.strictEqual(frequencyEvents.length, 1)
      yield* session.close()
    }),
  )

  it.effect("sur speechStart, le MediaRecorder est démarré → AC18", () =>
    Effect.gen(function* () {
      resetFakes()
      const service = yield* VoiceCaptureService
      const session = yield* service.start()

      // Parole au-dessus du seuil pendant 150ms
      currentVolume = 100
      yield* session.processFrame(0)
      yield* session.processFrame(75)
      yield* session.processFrame(150)

      assert.isTrue(recorderStarted.value)
      yield* session.close()
    }),
  )

  it.effect("sur speechEnd, le MediaRecorder est stoppé et un Blob est émis → AC19", () =>
    Effect.gen(function* () {
      resetFakes()
      const service = yield* VoiceCaptureService
      const session = yield* service.start()

      // Parole puis silence
      currentVolume = 100
      yield* session.processFrame(0)
      yield* session.processFrame(75)
      yield* session.processFrame(150) // speechStart

      currentVolume = 0
      yield* session.processFrame(200)
      yield* session.processFrame(400)
      const events = yield* session.processFrame(600) // speechEnd après 400ms de silence

      assert.isTrue(recorderStopped.value)
      const blobEvent = Array.findFirst(events, (e) => {
        return e.kind === "speechEnd"
      })
      assert.isTrue(blobEvent._tag === "Some")
      yield* session.close()
    }),
  )

  it.effect("close libère les ressources → AC21", () =>
    Effect.gen(function* () {
      resetFakes()
      const service = yield* VoiceCaptureService
      const session = yield* service.start()
      yield* session.close()
      assert.isTrue(released.value)
      assert.isTrue(analyserClosed.value)
    }),
  )
})
