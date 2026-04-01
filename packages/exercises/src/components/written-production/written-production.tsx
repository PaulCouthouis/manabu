import { Atom, useAtomSet } from "@effect-atom/atom-react"
import { Effect, Layer, Option } from "effect"
import { ArrowRight, Circle } from "lucide-react"
import React, { useContext, useMemo, useState } from "react"
import { styled } from "styled-system/jsx"
import { Button } from "@manabu/ui"
import type { AnswerResult } from "~/logic/answer-validation.js"
import { AnswerValidationApi } from "~/logic/answer-validation.js"
import { isSentence } from "~/logic/stimulus-display.js"
import type {
  WrittenProductionConfig,
  WrittenProductionResult,
} from "~/logic/written-production-config.js"
import { TextSubmitInput } from "~/components/shared/text-submit-input.js"

export type WrittenProductionPhase =
  | { readonly kind: "answering" }
  | {
      readonly kind: "feedback"
      readonly answerResult: Option.Option<AnswerResult>
    }

export type WrittenProductionLayer = Layer.Layer<AnswerValidationApi>

export interface WrittenProductionProps {
  readonly config: WrittenProductionConfig
  readonly onResult: (result: WrittenProductionResult) => void
  readonly initialPhase?: WrittenProductionPhase
}

function makeRuntime(layer: WrittenProductionLayer) {
  const runtime = Atom.runtime(layer)

  const validateAtom = runtime.fn(
    Effect.fnUntraced(function* (args: { answer: string; expected: string }) {
      const api = yield* AnswerValidationApi
      return yield* api.validate(args.answer, args.expected)
    }),
  )

  return { validateAtom }
}

type WrittenProductionAtoms = ReturnType<typeof makeRuntime>

const WrittenProductionAtomsContext = React.createContext<WrittenProductionAtoms | null>(null)

export function WrittenProductionProvider(props: {
  readonly layer: WrittenProductionLayer
  readonly children: React.ReactNode
}) {
  const atoms = useMemo(() => {
    return makeRuntime(props.layer)
  }, [props.layer])

  return (
    <WrittenProductionAtomsContext.Provider value={atoms}>
      {props.children}
    </WrittenProductionAtomsContext.Provider>
  )
}

function useAtoms(): WrittenProductionAtoms {
  const atoms = useContext(WrittenProductionAtomsContext)
  if (atoms === null) {
    throw new Error("WrittenProduction must be wrapped in WrittenProductionProvider")
  }
  return atoms
}

const Container = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    height: "100dvh",
    overflow: "hidden",
  },
})

const ExerciseZone = styled("div", {
  base: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    width: "100%",
  },
})

const MeaningText = styled("span", {
  base: {
    fontSize: "3xl",
    fontWeight: "semibold",
    textAlign: "center",
    lineHeight: "relaxed",
    px: "4",
  },
})

const StimulusGroup = styled("div", {
  base: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
})

const FeedbackOverlay = styled("div", {
  base: {
    position: "absolute",
    top: "100%",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2",
    pt: "4",
    whiteSpace: "nowrap",
  },
})

const RewardWord = styled("span", {
  base: {
    fontSize: "4xl",
    fontWeight: "bold",
    textAlign: "center",
  },
})

const RewardSentence = styled("span", {
  base: {
    fontSize: "2xl",
    fontWeight: "medium",
    textAlign: "center",
    lineHeight: "relaxed",
  },
})

const TranscriptText = styled("span", {
  base: {
    fontSize: "2xl",
    color: "fg.muted",
    fontStyle: "italic",
    textAlign: "center",
  },
})

const AcceptedTranscript = styled("span", {
  base: {
    position: "absolute",
    bottom: "4",
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: "lg",
    color: "colorPalette.11",
    colorPalette: "accent",
    textAlign: "center",
    whiteSpace: "nowrap",
  },
})

const SuccessOverlay = styled("div", {
  base: {
    position: "absolute",
    inset: "0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    bg: "transparent",
    color: "colorPalette.11",
    colorPalette: "accent",
  },
})

const FOOTER_HEIGHT = "80px"

const Footer = styled("div", {
  base: {
    width: "100%",
    height: FOOTER_HEIGHT,
    borderTopWidth: "1px",
    borderColor: "border.subtle",
    bg: "bg.subtle",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    px: "4",
  },
})

function ExpectedText(props: { readonly text: string }) {
  if (isSentence(props.text)) {
    return <RewardSentence>{props.text}</RewardSentence>
  }
  return <RewardWord>{props.text}</RewardWord>
}

function feedbackKind(phase: WrittenProductionPhase): AnswerResult["kind"] | "skip" | null {
  if (phase.kind !== "feedback") {
    return null
  }
  if (Option.isNone(phase.answerResult)) {
    return "skip"
  }
  return phase.answerResult.value.kind
}

function outcomeFromAnswerResult(answerResult: Option.Option<AnswerResult>) {
  if (Option.isNone(answerResult)) {
    return "skip"
  }
  if (answerResult.value.kind === "correct" || answerResult.value.kind === "accepted") {
    return "success"
  }
  return "failure"
}

export function WrittenProduction(props: WrittenProductionProps) {
  const { config, onResult, initialPhase } = props
  const [phase, setPhase] = useState<WrittenProductionPhase>(initialPhase ?? { kind: "answering" })

  const { validateAtom } = useAtoms()
  const validate = useAtomSet(validateAtom, { mode: "promiseExit" })

  const emitFeedback = (answerResult: Option.Option<AnswerResult>) => {
    setPhase({ kind: "feedback", answerResult })
    onResult({ outcome: outcomeFromAnswerResult(answerResult), answerResult })
  }

  const handleSubmit = async (answer: string) => {
    const exit = await validate({ answer, expected: config.expected })
    if (exit._tag !== "Success") {
      return
    }
    emitFeedback(Option.some(exit.value))
  }

  const handleSkip = () => {
    emitFeedback(Option.none())
  }

  const handleNext = () => {
    setPhase({ kind: "answering" })
  }

  const kind = feedbackKind(phase)

  return (
    <Container>
      <ExerciseZone>
        {(kind === "correct" || kind === "accepted") && (
          <SuccessOverlay>
            <Circle width="100%" height="100%" strokeWidth={0.3} />
          </SuccessOverlay>
        )}

        <StimulusGroup>
          <MeaningText>{config.meaning}</MeaningText>
          {phase.kind === "feedback" && (
            <FeedbackOverlay>
              {(kind === "correct" || kind === "accepted") && (
                <ExpectedText text={config.expected} />
              )}
              {kind === "incorrect" &&
                Option.isSome(phase.answerResult) &&
                phase.answerResult.value.kind === "incorrect" && (
                  <>
                    <ExpectedText text={config.expected} />
                    <TranscriptText>
                      You wrote: {phase.answerResult.value.userAnswer}
                    </TranscriptText>
                  </>
                )}
              {kind === "skip" && <ExpectedText text={config.expected} />}
            </FeedbackOverlay>
          )}
        </StimulusGroup>

        {kind === "accepted" &&
          phase.kind === "feedback" &&
          Option.isSome(phase.answerResult) &&
          phase.answerResult.value.kind === "accepted" && (
            <AcceptedTranscript>✓ {phase.answerResult.value.userAnswer}</AcceptedTranscript>
          )}
      </ExerciseZone>

      <Footer>
        {phase.kind === "answering" && (
          <TextSubmitInput
            onSubmit={handleSubmit}
            onSkip={handleSkip}
            placeholder="「日本語で入力」"
          />
        )}
        {(kind === "incorrect" || kind === "skip") && (
          <Button colorPalette="accent" size="xl" width="100%" onClick={handleNext}>
            Next
            <ArrowRight size={24} />
          </Button>
        )}
      </Footer>
    </Container>
  )
}
