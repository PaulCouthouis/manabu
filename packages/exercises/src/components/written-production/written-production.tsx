import { Atom, useAtomSet } from "@effect-atom/atom-react"
import { Layer, Option } from "effect"
import { ArrowRight, Circle } from "lucide-react"
import { useState } from "react"
import { styled } from "styled-system/jsx"
import { Button, IconButton } from "@manabu/ui"
import {
  AcceptedTranscript,
  Container,
  ExerciseZone,
  FeedbackOverlay,
  MeaningText,
  RewardSentence,
  RewardWord,
  StimulusGroup,
  SuccessOverlay,
  TranscriptText,
} from "~/components/shared/exercise-layout.js"
import { createExerciseProvider } from "~/components/shared/exercise-provider.js"
import { makeValidateAtom } from "~/components/shared/make-atoms.js"
import type { AnswerResult } from "~/logic/answer-validation.js"
import { AnswerValidationApi } from "~/logic/answer-validation.js"
import { feedbackKind, outcomeFromAnswerResult } from "~/logic/answer-feedback.js"
import { isSentence } from "~/logic/stimulus-display.js"
import type {
  WrittenProductionConfig,
  WrittenProductionResult,
} from "~/logic/written-production-config.js"
import { TextSubmitInput } from "~/components/shared/text-submit-input.js"
import { IMEHelpModal, IMEHelpModalProvider } from "~/components/ime-help-modal/ime-help-modal.js"
import { BrowserUserAgentApiLive } from "~/logic/user-agent.js"

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

function makeAtoms(layer: WrittenProductionLayer) {
  const runtime = Atom.runtime(layer)
  return { validateAtom: makeValidateAtom(runtime) }
}

const { Provider: WrittenProductionProvider, useAtoms } = createExerciseProvider(
  "WrittenProduction",
  makeAtoms,
)

export { WrittenProductionProvider }

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
    gap: "2",
    px: "2",
  },
})

function ExpectedText(props: { readonly text: string }) {
  if (isSentence(props.text)) {
    return <RewardSentence>{props.text}</RewardSentence>
  }
  return <RewardWord>{props.text}</RewardWord>
}

export function WrittenProduction(props: WrittenProductionProps) {
  const { config, onResult, initialPhase } = props
  const [phase, setPhase] = useState<WrittenProductionPhase>(initialPhase ?? { kind: "answering" })
  const [imeHelpOpen, setImeHelpOpen] = useState(false)

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

  const kind = phase.kind === "feedback" ? feedbackKind(phase.answerResult) : null

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
          <>
            <IconButton
              variant="outline"
              height="48px"
              aria-label="Keyboard help"
              css={{ flexShrink: "0" }}
              onClick={() => {
                setImeHelpOpen(true)
              }}
            >
              <styled.span fontSize="2xl" fontWeight="bold">
                ?
              </styled.span>
            </IconButton>
            <TextSubmitInput
              onSubmit={handleSubmit}
              onSkip={handleSkip}
              placeholder="「日本語で入力」"
            />
          </>
        )}
        {(kind === "incorrect" || kind === "skip") && (
          <Button colorPalette="accent" size="xl" width="100%" onClick={handleNext}>
            Next
            <ArrowRight size={24} />
          </Button>
        )}
      </Footer>
      <IMEHelpModalProvider layer={BrowserUserAgentApiLive}>
        <IMEHelpModal
          open={imeHelpOpen}
          onClose={() => {
            setImeHelpOpen(false)
          }}
        />
      </IMEHelpModalProvider>
    </Container>
  )
}
