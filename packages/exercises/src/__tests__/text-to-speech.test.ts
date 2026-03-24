import { assert, layer } from "@effect/vitest"
import { Effect, Layer } from "effect"
import type { Utterance } from "../logic/text-to-speech.js"
import { SpeechSynthesisApi, TextToSpeech } from "../logic/text-to-speech.js"

const calls: Array<Utterance> = []

const TestApiLayer = Layer.succeed(SpeechSynthesisApi, {
  speak: (utterance: Utterance) => {
    calls.push(utterance)
  },
})

const TestLayer = Layer.provide(TextToSpeech.Default, TestApiLayer)

layer(TestLayer)("TextToSpeech", (it) => {
  it.effect("speak transmet le texte avec lang ja-JP à l'API", () =>
    Effect.gen(function* () {
      calls.length = 0
      const tts = yield* TextToSpeech
      yield* tts.speak("こんにちは")
      assert.deepStrictEqual(calls, [{ text: "こんにちは", lang: "ja-JP" }])
    }),
  )
})

const FailingApiLayer = Layer.succeed(SpeechSynthesisApi, {
  speak: () => {
    throw new Error("not available")
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
