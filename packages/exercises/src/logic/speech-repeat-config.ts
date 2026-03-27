import type { SpeechResult } from "~/logic/vocal/speech-recognition.js"

export type StimulusKind =
  | { readonly mode: "audio" }
  | { readonly mode: "visual-kana"; readonly kana: string }
  | { readonly mode: "visual-kana-scaffolding"; readonly hint: string; readonly kana: string }
  | { readonly mode: "visual-text"; readonly text: string }
  | { readonly mode: "visual-text-furigana"; readonly text: string; readonly reading: string }

export type RewardKind = "kana-unlocked" | "word-unlocked" | "none"

export interface SpeechRepeatConfig {
  readonly stimulus: StimulusKind
  readonly expected: string
  readonly reward: RewardKind
  readonly modelAudioSrc: string
}

export type ExerciseOutcome = "success" | "failure" | "skip"

export interface ExerciseResult {
  readonly outcome: ExerciseOutcome
  readonly speechResult: SpeechResult
}
