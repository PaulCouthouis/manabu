import { styled } from "styled-system/jsx"
import type { MeaningExerciseConfig } from "~/logic/meaning-exercise-config.js"
import { isSentence } from "~/logic/stimulus-display.js"

const StimulusText = styled("span", {
  base: {
    fontSize: "5xl",
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: "tight",
  },
})

const SentenceText = styled("span", {
  base: {
    fontSize: "2xl",
    fontWeight: "medium",
    textAlign: "center",
    lineHeight: "relaxed",
  },
})

export function Stimulus(props: { readonly config: MeaningExerciseConfig }) {
  const { stimulus } = props.config

  if (stimulus.mode === "audio") {
    return null
  }

  if (isSentence(stimulus.text)) {
    return <SentenceText>{stimulus.text}</SentenceText>
  }
  return <StimulusText>{stimulus.text}</StimulusText>
}
