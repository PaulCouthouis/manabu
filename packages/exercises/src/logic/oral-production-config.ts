import type { Option } from "effect"
import type { AnswerResult } from "~/logic/answer-validation.js"
import type { ExerciseOutcome } from "~/logic/speech-repeat-config.js"

export interface OralProductionConfig {
  readonly meaning: string
  readonly expected: string
}

export interface OralProductionResult {
  readonly outcome: ExerciseOutcome
  readonly answerResult: Option.Option<AnswerResult>
}
