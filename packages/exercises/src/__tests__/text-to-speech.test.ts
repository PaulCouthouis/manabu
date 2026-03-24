import { assert, layer } from "@effect/vitest"
import { Effect, Layer, Option } from "effect"
import type { VoiceInfo } from "../logic/voice-selection.js"
import { SpeechSynthesisApi, TextToSpeech } from "../logic/text-to-speech.js"

const calls: Array<{ text: string; lang: string; rate: number; voice: Option.Option<VoiceInfo> }> =
  []

const TestApiLayer = Layer.succeed(SpeechSynthesisApi, {
  speak: (text: string, lang: string, rate: number, voice: Option.Option<VoiceInfo>) => {
    calls.push({ text, lang, rate, voice })
  },
  getVoices: () => {
    return [{ name: "TestVoice", lang: "ja-JP", localService: true }]
  },
})

const TestLayer = Layer.provide(TextToSpeech.Default, TestApiLayer)

layer(TestLayer)("TextToSpeech", (it) => {
  it.effect("speak transmet le texte avec lang ja-JP, rate 0.9 et la meilleure voix", () =>
    Effect.gen(function* () {
      calls.length = 0
      const tts = yield* TextToSpeech
      yield* tts.speak("こんにちは")
      assert.strictEqual(calls.length, 1)
      const call = calls[0]!
      assert.strictEqual(call.text, "こんにちは")
      assert.strictEqual(call.lang, "ja-JP")
      assert.strictEqual(call.rate, 0.9)
      assert.isTrue(Option.isSome(call.voice))
      assert.strictEqual(Option.getOrThrow(call.voice).name, "TestVoice")
    }),
  )
})

const FailingApiLayer = Layer.succeed(SpeechSynthesisApi, {
  speak: () => {
    throw new Error("not available")
  },
  getVoices: () => {
    return []
  },
})

const FailingLayer = Layer.provide(TextToSpeech.Default, FailingApiLayer)

layer(FailingLayer)("TextToSpeech — API indisponible", (it) => {
  it.effect("speak retourne TextToSpeechError", () =>
    Effect.gen(function* () {
      const tts = yield* TextToSpeech
      const error = yield* tts.speak("こんにちは").pipe(Effect.flip)
      assert.strictEqual(error._tag, "TextToSpeechError")
    }),
  )
})
