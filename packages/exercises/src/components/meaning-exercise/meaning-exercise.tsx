import { Atom, useAtomSet } from "@effect-atom/atom-react"
import { Effect, Layer } from "effect"
import { ArrowRight, Circle } from "lucide-react"
import { useEffect, useState } from "react"
import { styled } from "styled-system/jsx"
import { Button } from "@manabu/ui"
import {
  AcceptedTranscript,
  Container,
  FeedbackOverlay,
  StimulusGroup,
  SuccessOverlay,
  TranscriptText,
} from "~/components/shared/exercise-layout.js"
import { createExerciseProvider } from "~/components/shared/exercise-provider.js"
import type { AnswerResult } from "~/logic/answer-validation.js"
import { AnswerValidationApi } from "~/logic/answer-validation.js"
import { TextToSpeech } from "~/logic/audio/text-to-speech.js"
import type { MeaningExerciseConfig } from "~/logic/meaning-exercise-config.js"
import { useAutoplayFeedback } from "~/logic/ui/use-autoplay-feedback.js"
import { MultimodalInput } from "~/components/multimodal-input/multimodal-input.js"
import { ChoicesQCM } from "~/components/meaning-exercise/choices-qcm.js"
import { Stimulus } from "~/components/meaning-exercise/stimulus.js"

export type MeaningExercisePhase =
  | { readonly kind: "answering" }
  | { readonly kind: "feedback"; readonly result: AnswerResult }

export type MeaningExerciseLayer = Layer.Layer<AnswerValidationApi | TextToSpeech>

export interface MeaningExerciseProps {
  readonly config: MeaningExerciseConfig
  readonly onResult: (result: AnswerResult) => void
  readonly onSkip: () => void
  readonly initialPhase?: MeaningExercisePhase
}

function makeAtoms(validationLayer: MeaningExerciseLayer) {
  const runtime = Atom.runtime(validationLayer)

  const validateAtom = runtime.fn(
    Effect.fnUntraced(function* (args: { answer: string; expected: string }) {
      const api = yield* AnswerValidationApi
      return yield* api.validate(args.answer, args.expected)
    }),
  )

  const speakAtom = runtime.fn(
    Effect.fnUntraced(function* (text: string) {
      const tts = yield* TextToSpeech
      yield* tts.speak(text)
    }),
  )

  return { validateAtom, speakAtom }
}

const { Provider: MeaningExerciseProvider, useAtoms } = createExerciseProvider(
  "MeaningExercise",
  makeAtoms,
)

export { MeaningExerciseProvider }

const StimulusZone = styled("div", {
  base: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    width: "100%",
    px: "4",
  },
})

const ExpectedText = styled("span", {
  base: {
    fontSize: "2xl",
    fontWeight: "semibold",
    textAlign: "center",
  },
})

const FullWidth = styled("div", {
  base: {
    width: "100%",
  },
})

const FOOTER_HEIGHT = "152px"

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

export function MeaningExercise(props: MeaningExerciseProps) {
  const { config, onResult, initialPhase } = props
  const [phase, setPhase] = useState<MeaningExercisePhase>(initialPhase ?? { kind: "answering" })

  const { validateAtom, speakAtom } = useAtoms()
  const validate = useAtomSet(validateAtom, { mode: "promiseExit" })
  const speak = useAtomSet(speakAtom)

  const handleSelect = async (answer: string) => {
    const exit = await validate({ answer, expected: config.expected })
    if (exit._tag !== "Success") {
      return
    }
    const result = exit.value
    setPhase({ kind: "feedback", result })
    onResult(result)
  }

  useEffect(() => {
    if (phase.kind === "answering" && config.stimulus.mode === "audio") {
      speak(config.stimulus.text)
    }
  }, [phase.kind, config.stimulus])

  const shouldAutoplay = config.stimulus.mode !== "kanji"
  useAutoplayFeedback(phase.kind === "feedback" && shouldAutoplay, config.stimulus.text, speak)

  const handlePlay = () => {
    speak(config.stimulus.text)
  }

  const handleNext = () => {
    setPhase({ kind: "answering" })
  }

  return (
    <Container>
      <StimulusZone>
        {phase.kind === "feedback" &&
          (phase.result.kind === "correct" || phase.result.kind === "accepted") && (
            <SuccessOverlay>
              <Circle width="100%" height="100%" strokeWidth={0.3} />
            </SuccessOverlay>
          )}

        {phase.kind === "feedback" && config.stimulus.mode === "audio" ? (
          <>
            <ExpectedText>{config.expected}</ExpectedText>
            {phase.result.kind === "incorrect" && (
              <TranscriptText>You said: {phase.result.userAnswer}</TranscriptText>
            )}
          </>
        ) : (
          <StimulusGroup>
            <Stimulus config={config} onPlay={handlePlay} />
            {phase.kind === "feedback" && (
              <FeedbackOverlay>
                <ExpectedText>{config.expected}</ExpectedText>
                {phase.result.kind === "incorrect" && (
                  <TranscriptText>You said: {phase.result.userAnswer}</TranscriptText>
                )}
              </FeedbackOverlay>
            )}
          </StimulusGroup>
        )}

        {phase.kind === "feedback" && phase.result.kind === "accepted" && (
          <AcceptedTranscript>✓ {phase.result.userAnswer}</AcceptedTranscript>
        )}
      </StimulusZone>

      <Footer>
        {phase.kind === "answering" && config.interaction.mode === "qcm" && (
          <ChoicesQCM choices={config.interaction.choices} onSelect={handleSelect} />
        )}
        {phase.kind === "answering" && config.interaction.mode === "free-input" && (
          <FullWidth>
            <MultimodalInput
              voiceRecorderState="listening"
              onAnswer={handleSelect}
              onSkip={props.onSkip}
              onSpeechStart={() => {}}
              onError={(error) => {
                console.error("[MeaningExercise] microphone error", error)
              }}
            />
          </FullWidth>
        )}
        {phase.kind === "feedback" && phase.result.kind === "incorrect" && (
          <Button colorPalette="accent" size="xl" width="100%" onClick={handleNext}>
            Next
            <ArrowRight size={24} />
          </Button>
        )}
      </Footer>
    </Container>
  )
}
