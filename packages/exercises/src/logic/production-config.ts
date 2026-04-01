import type { Option } from "effect"
import type { AnswerResult } from "~/logic/answer-validation.js"
import type { ExerciseOutcome } from "~/logic/speech-repeat-config.js"

export interface ProductionConfig {
  readonly meaning: string
  readonly expected: string
}

export interface ProductionResult {
  readonly outcome: ExerciseOutcome
  readonly answerResult: Option.Option<AnswerResult>
}
