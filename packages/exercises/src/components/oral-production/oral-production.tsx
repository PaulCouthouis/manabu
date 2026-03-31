import { Atom, useAtomSet } from "@effect-atom/atom-react"
import { Effect, Layer, Option } from "effect"
import React, { useCallback, useContext, useMemo, useState } from "react"
import { styled } from "styled-system/jsx"
import type { AnswerResult } from "~/logic/answer-validation.js"
import { AnswerValidationApi } from "~/logic/answer-validation.js"
import { TextToSpeech } from "~/logic/audio/text-to-speech.js"
import type { OralProductionConfig, OralProductionResult } from "~/logic/oral-production-config.js"
import type { ExerciseOutcome } from "~/logic/speech-repeat-config.js"
import { useAutoplayFeedback } from "~/logic/ui/use-autoplay-feedback.js"
import { SpeechRecognitionApi } from "~/logic/vocal/speech-recognition.js"
import { VoiceRecorder } from "~/components/voice-recorder/voice-recorder.js"

// --- Types ---

export type OralProductionPhase =
  | { readonly kind: "listening" }
  | {
      readonly kind: "feedback"
      readonly answerResult: Option.Option<AnswerResult>
      readonly recordingBlob: Option.Option<Blob>
    }

export type OralProductionLayer = Layer.Layer<
  SpeechRecognitionApi | AnswerValidationApi | TextToSpeech
>

export interface OralProductionProps {
  readonly config: OralProductionConfig
  readonly onResult: (result: OralProductionResult) => void
  readonly initialPhase?: OralProductionPhase
}

// --- Runtime & atoms ---

function makeRuntime(layer: OralProductionLayer) {
  const runtime = Atom.runtime(layer)

  const speakAtom = runtime.fn(
    Effect.fnUntraced(function* (text: string) {
      const tts = yield* TextToSpeech
      yield* tts.speak(text)
    }),
  )

  const recognizeAtom = runtime.fn(
    Effect.fnUntraced(function* (args: { blob: Blob; expected: string }) {
      const api = yield* SpeechRecognitionApi
      return yield* api.recognize(args.blob, args.expected)
    }),
  )

  const validateAtom = runtime.fn(
    Effect.fnUntraced(function* (args: { answer: string; expected: string }) {
      const api = yield* AnswerValidationApi
      return yield* api.validate(args.answer, args.expected)
    }),
  )

  return { speakAtom, recognizeAtom, validateAtom }
}

type OralProductionAtoms = ReturnType<typeof makeRuntime>

const OralProductionAtomsContext = React.createContext<OralProductionAtoms | null>(null)

export function OralProductionProvider(props: {
  readonly layer: OralProductionLayer
  readonly children: React.ReactNode
}) {
  const atoms = useMemo(() => {
    return makeRuntime(props.layer)
  }, [props.layer])

  return (
    <OralProductionAtomsContext.Provider value={atoms}>
      {props.children}
    </OralProductionAtomsContext.Provider>
  )
}

function useAtoms(): OralProductionAtoms {
  const atoms = useContext(OralProductionAtomsContext)
  if (atoms === null) {
    throw new Error("OralProduction must be wrapped in OralProductionProvider")
  }
  return atoms
}

// --- Styles ---

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
    gap: "6",
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

const RecorderWrapper = styled("div", {
  base: {
    width: "100%",
  },
})

// --- Main component ---

const noopSpeechStart = () => {}
const logMicrophoneError = (error: unknown) => {
  console.error("[OralProduction] microphone error", error)
}

function outcomeFromAnswerResult(answerResult: Option.Option<AnswerResult>): ExerciseOutcome {
  if (Option.isNone(answerResult)) {
    return "skip"
  }
  if (answerResult.value.kind === "correct" || answerResult.value.kind === "accepted") {
    return "success"
  }
  return "failure"
}

export function OralProduction(props: OralProductionProps) {
  const { config, onResult, initialPhase } = props
  const [phase, setPhase] = useState<OralProductionPhase>(initialPhase ?? { kind: "listening" })

  const { speakAtom, recognizeAtom, validateAtom } = useAtoms()
  const speak = useAtomSet(speakAtom)
  const recognize = useAtomSet(recognizeAtom, { mode: "promiseExit" })
  const validate = useAtomSet(validateAtom, { mode: "promiseExit" })

  useAutoplayFeedback(phase.kind === "feedback", config.expected, speak)

  const emitFeedback = useCallback(
    (answerResult: Option.Option<AnswerResult>, blob: Blob) => {
      setPhase({ kind: "feedback", answerResult, recordingBlob: Option.some(blob) })
      onResult({ outcome: outcomeFromAnswerResult(answerResult), answerResult })
    },
    [onResult],
  )

  const handleSpeechEnd = useCallback(
    async (blob: Blob) => {
      const srExit = await recognize({ blob, expected: config.expected })
      if (srExit._tag !== "Success") {
        return
      }
      const speechResult = srExit.value

      if (speechResult.kind === "noise") {
        return
      }

      if (speechResult.kind === "skip") {
        emitFeedback(Option.none(), blob)
        return
      }

      if (speechResult.kind === "match") {
        emitFeedback(Option.some({ kind: "correct", expected: config.expected }), blob)
        return
      }

      // mismatch → cascade to AnswerValidationApi
      const valExit = await validate({ answer: speechResult.transcript, expected: config.expected })
      if (valExit._tag !== "Success") {
        return
      }
      emitFeedback(Option.some(valExit.value), blob)
    },
    [config.expected, emitFeedback],
  )

  return (
    <Container>
      <ExerciseZone>
        <MeaningText>{config.meaning}</MeaningText>
      </ExerciseZone>

      <RecorderWrapper>
        <VoiceRecorder
          state={phase.kind === "listening" ? "listening" : "paused"}
          onSpeechStart={noopSpeechStart}
          onSpeechEnd={handleSpeechEnd}
          onError={logMicrophoneError}
        />
      </RecorderWrapper>
    </Container>
  )
}
