import { Context, Data, Effect, Layer, Option } from "effect"
import type { VoiceInfo } from "~/logic/audio/voice-selection.js"
import { isSpeechSynthesisVoice } from "~/logic/audio/is-speech-synthesis-voice.js"
import { findBestVoice } from "~/logic/audio/voice-selection.js"

export class TextToSpeechError extends Data.TaggedError("TextToSpeechError")<{
  readonly reason: string
}> {}

export class SpeechSynthesisApi extends Context.Tag("SpeechSynthesisApi")<
  SpeechSynthesisApi,
  {
    readonly speak: (
      text: string,
      lang: string,
      rate: number,
      voice: Option.Option<VoiceInfo>,
    ) => void
    readonly getVoices: () => ReadonlyArray<VoiceInfo>
  }
>() {}

function warmUpVoices() {
  if (typeof globalThis.speechSynthesis !== "undefined") {
    globalThis.speechSynthesis.getVoices()
  }
}

warmUpVoices()

export const BrowserSpeechSynthesisApiLive = Layer.succeed(SpeechSynthesisApi, {
  speak: (text: string, lang: string, rate: number, voice: Option.Option<VoiceInfo>) => {
    globalThis.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang
    u.rate = rate
    const resolved = Option.filter(voice, isSpeechSynthesisVoice)
    if (Option.isSome(resolved)) {
      u.voice = resolved.value
    }
    globalThis.speechSynthesis.speak(u)
  },
  getVoices: () => {
    return globalThis.speechSynthesis.getVoices()
  },
})

const SPEECH_RATE = 0.9

export class TextToSpeech extends Effect.Service<TextToSpeech>()("TextToSpeech", {
  effect: Effect.gen(function* () {
    const api = yield* SpeechSynthesisApi
    return {
      speak: (text: string): Effect.Effect<void, TextToSpeechError> => {
        return Effect.try({
          try: () => {
            const voice = findBestVoice(api.getVoices(), "ja-JP")
            api.speak(text, "ja-JP", SPEECH_RATE, voice)
          },
          catch: (e) => {
            return new TextToSpeechError({ reason: String(e) })
          },
        })
      },
    }
  }),
}) {}
