export type SentenceSegment =
  | { readonly kind: "text"; readonly value: string }
  | { readonly kind: "blank"; readonly index: number }

export interface BlankDefinition {
  readonly index: number
  readonly correctAnswer: string
}

export interface FillInTheBlankConfig {
  readonly segments: ReadonlyArray<SentenceSegment>
  readonly blanks: ReadonlyArray<BlankDefinition>
  readonly choices: ReadonlyArray<string>
  readonly fullSentence: string
}

export type FillInTheBlankOutcome = "success" | "failure"

export interface BlankResult {
  readonly index: number
  readonly userChoice: string
  readonly correctAnswer: string
  readonly isCorrect: boolean
}

export interface FillInTheBlankResult {
  readonly outcome: FillInTheBlankOutcome
  readonly blankResults: ReadonlyArray<BlankResult>
}
