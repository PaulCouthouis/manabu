import { Array, pipe } from "effect"
import type { BlankDefinition, FillInTheBlankResult } from "~/logic/fill-in-the-blank-config.js"

export function validateBlanks(
  filledBlanks: ReadonlyArray<string>,
  blanks: ReadonlyArray<BlankDefinition>,
): FillInTheBlankResult {
  const blankResults = pipe(
    Array.zip(blanks, filledBlanks),
    Array.map(([blank, userChoice]) => {
      return {
        index: blank.index,
        userChoice,
        correctAnswer: blank.correctAnswer,
        isCorrect: userChoice === blank.correctAnswer,
      }
    }),
  )
  return {
    outcome: pipe(
      blankResults,
      Array.every((r) => {
        return r.isCorrect
      }),
    )
      ? "success"
      : "failure",
    blankResults,
  }
}
