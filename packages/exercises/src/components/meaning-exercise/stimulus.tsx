import { Volume2 } from "lucide-react"
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

const PlayButton = styled("button", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "50vw",
    height: "50vw",
    maxWidth: "300px",
    maxHeight: "300px",
    borderRadius: "full",
    bg: "colorPalette.3",
    cursor: "pointer",
    color: "colorPalette.11",
    colorPalette: "accent",
    _hover: { bg: "colorPalette.4" },
    "& svg": {
      width: "50%",
      height: "50%",
    },
  },
})

export function Stimulus(props: {
  readonly config: MeaningExerciseConfig
  readonly onPlay?: () => void
}) {
  const { stimulus } = props.config

  if (stimulus.mode === "audio") {
    return (
      <PlayButton onClick={props.onPlay} aria-label="Play audio">
        <Volume2 />
      </PlayButton>
    )
  }

  if (stimulus.mode === "word" && isSentence(stimulus.text)) {
    return <SentenceText>{stimulus.text}</SentenceText>
  }
  return <StimulusText>{stimulus.text}</StimulusText>
}
