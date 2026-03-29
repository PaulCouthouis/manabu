import type { ExerciseResult, StimulusKind } from "~/logic/speech-repeat-config.js"
import type { SpeechResult } from "~/logic/vocal/speech-recognition.js"

export function outcomeFromSpeechResult(result: SpeechResult): ExerciseResult["outcome"] {
  if (result.kind === "match") {
    return "success"
  }
  if (result.kind === "skip") {
    return "skip"
  }
  return "failure"
}

export function isAudioFirst(stimulus: StimulusKind): boolean {
  return stimulus.mode === "audio"
}
