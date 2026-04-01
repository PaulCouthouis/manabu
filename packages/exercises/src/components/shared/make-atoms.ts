import { Effect } from "effect"
import type { Atom } from "@effect-atom/atom-react"
import { AnswerValidationApi } from "~/logic/answer-validation.js"
import { TextToSpeech } from "~/logic/audio/text-to-speech.js"

export function makeSpeakAtom(runtime: Atom.AtomRuntime<TextToSpeech>) {
  return runtime.fn(
    Effect.fnUntraced(function* (text: string) {
      const tts = yield* TextToSpeech
      yield* tts.speak(text)
    }),
  )
}

export function makeValidateAtom(runtime: Atom.AtomRuntime<AnswerValidationApi>) {
  return runtime.fn(
    Effect.fnUntraced(function* (args: { answer: string; expected: string }) {
      const api = yield* AnswerValidationApi
      return yield* api.validate(args.answer, args.expected)
    }),
  )
}
