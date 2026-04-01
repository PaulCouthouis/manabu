import { Effect, Layer } from "effect"
import { AnswerValidationApi } from "~/logic/answer-validation.js"
import { SpeechRecognitionApi, type SpeechResult } from "~/logic/vocal/speech-recognition.js"
import { SpeechToTextApi } from "~/logic/vocal/speech-to-text.js"

export const fakeAnswerValidationLayer = Layer.succeed(AnswerValidationApi, {
  validate: (answer: string, expected: string) => {
    return Effect.succeed(
      answer === expected
        ? { kind: "correct" as const, expected }
        : { kind: "incorrect" as const, userAnswer: answer, expected },
    )
  },
})

export function fakeAcceptedValidationLayer(userAnswer: string) {
  return Layer.succeed(AnswerValidationApi, {
    validate: (_answer: string, expected: string) => {
      return Effect.succeed({
        kind: "accepted" as const,
        userAnswer,
        expected,
      })
    },
  })
}

export function fakeSpeechRecognitionLayer(result: SpeechResult) {
  return Layer.succeed(SpeechRecognitionApi, {
    recognize: (_blob: Blob, _expected: string) => {
      return Effect.succeed(result)
    },
  })
}

export const fakeSpeechToTextLayer = Layer.succeed(SpeechToTextApi, {
  transcribe: (_blob: Blob) => {
    return Effect.succeed("fake transcript")
  },
})
