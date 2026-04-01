import { Atom, useAtomSet } from "@effect-atom/atom-react"
import { Array, Effect, Layer, pipe } from "effect"
import { ArrowRight, Undo2 } from "lucide-react"
import { useState } from "react"
import { styled } from "styled-system/jsx"
import { Button, IconButton } from "@manabu/ui"
import {
  Container,
  ExerciseZone,
  FeedbackOverlay,
  StimulusGroup,
} from "~/components/shared/exercise-layout.js"
import { createExerciseProvider } from "~/components/shared/exercise-provider.js"
import type {
  BlankResult,
  FillInTheBlankConfig,
  FillInTheBlankResult,
  SentenceSegment,
} from "~/logic/fill-in-the-blank-config.js"
import { validateBlanks } from "~/logic/fill-in-the-blank.js"
import { TextToSpeech } from "~/logic/audio/text-to-speech.js"
import { useAutoplayFeedback } from "~/logic/ui/use-autoplay-feedback.js"

// --- Phase ---

export type FillInTheBlankPhase =
  | { readonly kind: "filling"; readonly filledBlanks: ReadonlyArray<string> }
  | { readonly kind: "feedback"; readonly result: FillInTheBlankResult }

// --- Provider ---

export type FillInTheBlankLayer = Layer.Layer<TextToSpeech>

function makeAtoms(layer: FillInTheBlankLayer) {
  const runtime = Atom.runtime(layer)

  const speakAtom = runtime.fn(
    Effect.fnUntraced(function* (text: string) {
      const tts = yield* TextToSpeech
      yield* tts.speak(text)
    }),
  )

  return { speakAtom }
}

const { Provider: FillInTheBlankProvider, useAtoms } = createExerciseProvider(
  "FillInTheBlank",
  makeAtoms,
)

export { FillInTheBlankProvider }

// --- Props ---

export interface FillInTheBlankProps {
  readonly config: FillInTheBlankConfig
  readonly onResult: (result: FillInTheBlankResult) => void
  readonly initialPhase?: FillInTheBlankPhase
}

// --- Styled ---

const SentenceArea = styled("div", {
  base: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: "1",
    fontSize: "2xl",
    fontWeight: "semibold",
    lineHeight: "relaxed",
    px: "4",
  },
})

const BlankSlot = styled("span", {
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "12",
    px: "3",
    py: "1",
    borderRadius: "md",
    borderWidth: "2px",
    fontSize: "2xl",
    fontWeight: "semibold",
  },
  variants: {
    state: {
      active: {
        borderColor: "gray.light.9",
        bg: "gray.light.2",
      },
      filled: {
        borderColor: "border.subtle",
        bg: "bg.subtle",
      },
      pending: {
        borderColor: "border.subtle",
        borderStyle: "dashed",
        color: "fg.subtle",
      },
      correct: {
        borderColor: "jade.light.9",
        bg: "jade.light.2",
        color: "jade.light.11",
      },
      incorrect: {
        borderColor: "red.light.9",
        bg: "red.light.2",
        color: "red.light.11",
      },
    },
  },
})

const FooterZone = styled("div", {
  base: {
    width: "100%",
    minHeight: "280px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    px: "4",
    pb: "4",
    gap: "2",
  },
})

const ChoicesRow = styled("div", {
  base: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "2",
    width: "100%",
  },
})

const CorrectionLine = styled("span", {
  base: {
    color: "fg.muted",
    fontSize: "lg",
  },
})

// --- Helpers ---

function fillingBlankState(
  blankIndex: number,
  filledCount: number,
): "active" | "filled" | "pending" {
  if (blankIndex < filledCount) {
    return "filled"
  }
  if (blankIndex === filledCount) {
    return "active"
  }
  return "pending"
}

function feedbackBlankState(blankResult: BlankResult): "correct" | "incorrect" {
  return blankResult.isCorrect ? "correct" : "incorrect"
}

function renderTextSegment(value: string) {
  return <span key={`text-${value}`}>{value}</span>
}

function renderFillingSegment(segment: SentenceSegment, filledBlanks: ReadonlyArray<string>) {
  if (segment.kind === "text") {
    return renderTextSegment(segment.value)
  }
  const state = fillingBlankState(segment.index, filledBlanks.length)
  const label = state === "filled" ? filledBlanks[segment.index] : "＿"
  return (
    <BlankSlot key={`blank-${segment.index}`} state={state}>
      {label}
    </BlankSlot>
  )
}

function renderFeedbackSegment(segment: SentenceSegment, blankResults: ReadonlyArray<BlankResult>) {
  if (segment.kind === "text") {
    return renderTextSegment(segment.value)
  }
  const blankResult = blankResults[segment.index]
  if (!blankResult) {
    return null
  }
  return (
    <BlankSlot key={`blank-${segment.index}`} state={feedbackBlankState(blankResult)}>
      {blankResult.correctAnswer}
    </BlankSlot>
  )
}

function incorrectBlanks(blankResults: ReadonlyArray<BlankResult>): ReadonlyArray<BlankResult> {
  return pipe(
    blankResults,
    Array.filter((r) => {
      return !r.isCorrect
    }),
  )
}

// --- Component ---

export function FillInTheBlank(props: FillInTheBlankProps) {
  const { config, onResult, initialPhase } = props
  const [phase, setPhase] = useState<FillInTheBlankPhase>(
    initialPhase ?? { kind: "filling", filledBlanks: [] },
  )

  const { speakAtom } = useAtoms()
  const speak = useAtomSet(speakAtom)

  useAutoplayFeedback(phase.kind === "feedback", config.fullSentence, speak)

  const handleChoiceTap = (choice: string) => {
    if (phase.kind !== "filling") {
      return
    }
    const nextFilled = pipe(phase.filledBlanks, Array.append(choice))
    if (nextFilled.length === config.blanks.length) {
      const result = validateBlanks(nextFilled, config.blanks)
      setPhase({ kind: "feedback", result })
      onResult(result)
    } else {
      setPhase({ kind: "filling", filledBlanks: nextFilled })
    }
  }

  const handleUndo = () => {
    if (phase.kind !== "filling" || phase.filledBlanks.length === 0) {
      return
    }
    setPhase({ kind: "filling", filledBlanks: Array.dropRight(phase.filledBlanks, 1) })
  }

  const isMultiBlank = config.blanks.length > 1
  const canUndo = phase.kind === "filling" && phase.filledBlanks.length > 0
  const isFailure = phase.kind === "feedback" && phase.result.outcome === "failure"
  return (
    <Container>
      <ExerciseZone>
        <StimulusGroup>
          <SentenceArea>
            {phase.kind === "filling" &&
              pipe(
                config.segments,
                Array.map((segment) => {
                  return renderFillingSegment(segment, phase.filledBlanks)
                }),
              )}
            {phase.kind === "feedback" &&
              pipe(
                config.segments,
                Array.map((segment) => {
                  return renderFeedbackSegment(segment, phase.result.blankResults)
                }),
              )}
          </SentenceArea>

          {isFailure && (
            <FeedbackOverlay>
              {pipe(
                incorrectBlanks(phase.result.blankResults),
                Array.map((r) => {
                  return (
                    <CorrectionLine key={r.index}>
                      ✗ {r.userChoice} → ✓ {r.correctAnswer}
                    </CorrectionLine>
                  )
                }),
              )}
            </FeedbackOverlay>
          )}
        </StimulusGroup>
      </ExerciseZone>

      <FooterZone>
        {isMultiBlank && (
          <IconButton
            variant="ghost"
            size="md"
            aria-label="Undo"
            onClick={handleUndo}
            disabled={!canUndo}
            visibility={phase.kind === "filling" ? "visible" : "hidden"}
          >
            <Undo2 />
          </IconButton>
        )}
        {isFailure ? (
          <Button colorPalette="accent" size="xl" width="100%">
            Next
            <ArrowRight size={24} />
          </Button>
        ) : (
          <ChoicesRow>
            {pipe(
              config.choices,
              Array.map((choice, i) => {
                return (
                  <Button
                    key={`${choice}-${i}`}
                    variant="outline"
                    size="lg"
                    fontWeight="normal"
                    onClick={() => {
                      handleChoiceTap(choice)
                    }}
                    disabled={phase.kind === "feedback"}
                  >
                    {choice}
                  </Button>
                )
              }),
            )}
          </ChoicesRow>
        )}
      </FooterZone>
    </Container>
  )
}
