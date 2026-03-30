export type MeaningStimulusKind =
  | { readonly mode: "kanji"; readonly text: string }
  | { readonly mode: "word"; readonly text: string }
  | { readonly mode: "audio"; readonly text: string }

export type InteractionMode =
  | { readonly mode: "qcm"; readonly choices: ReadonlyArray<string> }
  | { readonly mode: "free-input" }

export interface MeaningExerciseConfig {
  readonly stimulus: MeaningStimulusKind
  readonly interaction: InteractionMode
  readonly expected: string
}
