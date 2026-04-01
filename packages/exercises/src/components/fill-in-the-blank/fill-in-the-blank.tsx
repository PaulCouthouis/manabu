import { Array, pipe } from "effect"
import { useState } from "react"
import { styled } from "styled-system/jsx"
import { Button } from "@manabu/ui"
import { Container, ExerciseZone } from "~/components/shared/exercise-layout.js"
import type {
  FillInTheBlankConfig,
  FillInTheBlankResult,
  SentenceSegment,
} from "~/logic/fill-in-the-blank-config.js"
import { validateBlanks } from "~/logic/fill-in-the-blank.js"

// --- Phase ---

export type FillInTheBlankPhase =
  | { readonly kind: "filling"; readonly filledBlanks: ReadonlyArray<string> }
  | { readonly kind: "feedback"; readonly result: FillInTheBlankResult }

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
    fontSize: "3xl",
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
    fontSize: "3xl",
    fontWeight: "semibold",
  },
  variants: {
    state: {
      active: {
        borderColor: "colorPalette.9",
        colorPalette: "accent",
        bg: "colorPalette.2",
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
    },
  },
})

const ChoicesGrid = styled("div", {
  base: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "2",
    px: "4",
    pb: "6",
    width: "100%",
  },
})

// --- Helpers ---

function blankState(blankIndex: number, filledCount: number): "active" | "filled" | "pending" {
  if (blankIndex < filledCount) {
    return "filled"
  }
  if (blankIndex === filledCount) {
    return "active"
  }
  return "pending"
}

function renderSegment(segment: SentenceSegment, filledBlanks: ReadonlyArray<string>) {
  if (segment.kind === "text") {
    return <span key={`text-${segment.value}`}>{segment.value}</span>
  }
  const state = blankState(segment.index, filledBlanks.length)
  const label = state === "filled" ? filledBlanks[segment.index] : "＿"
  return (
    <BlankSlot key={`blank-${segment.index}`} state={state}>
      {label}
    </BlankSlot>
  )
}

// --- Component ---

export function FillInTheBlank(props: FillInTheBlankProps) {
  const { config, onResult, initialPhase } = props
  const [phase, setPhase] = useState<FillInTheBlankPhase>(
    initialPhase ?? { kind: "filling", filledBlanks: [] },
  )

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

  const filledBlanks = phase.kind === "filling" ? phase.filledBlanks : []

  return (
    <Container>
      <ExerciseZone>
        <SentenceArea>
          {pipe(
            config.segments,
            Array.map((segment) => {
              return renderSegment(segment, filledBlanks)
            }),
          )}
        </SentenceArea>
      </ExerciseZone>

      <ChoicesGrid>
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
      </ChoicesGrid>
    </Container>
  )
}
