import { Option } from "effect"
import type { AnswerResult } from "~/logic/answer-validation.js"
import type { ExerciseOutcome } from "~/logic/speech-repeat-config.js"

export function outcomeFromAnswerResult(
  answerResult: Option.Option<AnswerResult>,
): ExerciseOutcome {
  if (Option.isNone(answerResult)) {
    return "skip"
  }
  if (answerResult.value.kind === "correct" || answerResult.value.kind === "accepted") {
    return "success"
  }
  return "failure"
}

export function feedbackKind(
  answerResult: Option.Option<AnswerResult>,
): AnswerResult["kind"] | "skip" {
  if (Option.isNone(answerResult)) {
    return "skip"
  }
  return answerResult.value.kind
}
