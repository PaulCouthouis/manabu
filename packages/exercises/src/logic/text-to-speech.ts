import { Context, Data, Effect, Layer } from "effect"

export class TextToSpeechError extends Data.TaggedError("TextToSpeechError")<{
  readonly reason: string
}> {}

export interface Utterance {
  readonly text: string
  readonly lang: string
}

export class SpeechSynthesisApi extends Context.Tag("SpeechSynthesisApi")<
  SpeechSynthesisApi,
  { readonly speak: (utterance: Utterance) => void }
>() {}

export const BrowserSpeechSynthesisApiLive = Layer.succeed(SpeechSynthesisApi, {
  speak: (utterance: Utterance) => {
    const u = new SpeechSynthesisUtterance(utterance.text)
    u.lang = utterance.lang
    globalThis.speechSynthesis.speak(u)
  },
})

export class TextToSpeech extends Effect.Service<TextToSpeech>()("TextToSpeech", {
  effect: Effect.gen(function* () {
    const api = yield* SpeechSynthesisApi
    return {
      speak: (text: string): Effect.Effect<void, TextToSpeechError> => {
        return Effect.try({
          try: () => {
            api.speak({ text, lang: "ja-JP" })
          },
          catch: (e) => {
            return new TextToSpeechError({ reason: String(e) })
          },
        })
      },
    }
  }),
}) {}
