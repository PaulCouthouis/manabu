import { Atom, useAtomSet } from "@effect-atom/atom-react"
import { Effect, Layer } from "effect"
import { ArrowRight, Circle } from "lucide-react"
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { styled } from "styled-system/jsx"
import { Button } from "@manabu/ui"
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
  readonly initialPhase?: MeaningExercisePhase
}

function makeRuntime(validationLayer: MeaningExerciseLayer) {
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

type MeaningExerciseAtoms = ReturnType<typeof makeRuntime>

const MeaningExerciseAtomsContext = React.createContext<MeaningExerciseAtoms | null>(null)

export function MeaningExerciseProvider(props: {
  readonly layer: MeaningExerciseLayer
  readonly children: React.ReactNode
}) {
  const atoms = useMemo(() => {
    return makeRuntime(props.layer)
  }, [props.layer])

  return (
    <MeaningExerciseAtomsContext.Provider value={atoms}>
      {props.children}
    </MeaningExerciseAtomsContext.Provider>
  )
}

function useAtoms(): MeaningExerciseAtoms {
  const atoms = useContext(MeaningExerciseAtomsContext)
  if (atoms === null) {
    throw new Error("MeaningExercise must be wrapped in MeaningExerciseProvider")
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

const ExpectedText = styled("span", {
  base: {
    fontSize: "2xl",
    fontWeight: "semibold",
    textAlign: "center",
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

  const handleSelect = useCallback(
    async (answer: string) => {
      const exit = await validate({ answer, expected: config.expected })
      if (exit._tag !== "Success") {
        return
      }
      const result = exit.value
      setPhase({ kind: "feedback", result })
      onResult(result)
    },
    [config.expected, onResult],
  )

  useEffect(() => {
    if (phase.kind === "answering" && config.stimulus.mode === "audio") {
      speak(config.stimulus.text)
    }
  }, [phase.kind, config.stimulus])

  const shouldAutoplay = config.stimulus.mode !== "kanji"
  useAutoplayFeedback(phase.kind === "feedback" && shouldAutoplay, config.stimulus.text, speak)

  const handlePlay = useCallback(() => {
    speak(config.stimulus.text)
  }, [config.stimulus])

  const handleNext = useCallback(() => {
    setPhase({ kind: "answering" })
  }, [])

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
          <styled.div width="100%">
            <MultimodalInput
              voiceRecorderState="listening"
              onAnswer={handleSelect}
              onSpeechStart={() => {}}
              onError={(error) => {
                console.error("[MeaningExercise] microphone error", error)
              }}
            />
          </styled.div>
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
