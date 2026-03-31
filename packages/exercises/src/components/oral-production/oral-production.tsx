import { Atom, useAtomSet } from "@effect-atom/atom-react"
import { Effect, Layer, Option } from "effect"
import { Circle } from "lucide-react"
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { styled } from "styled-system/jsx"
import type { AnswerResult } from "~/logic/answer-validation.js"
import { AnswerValidationApi } from "~/logic/answer-validation.js"
import { TextToSpeech } from "~/logic/audio/text-to-speech.js"
import type { OralProductionConfig, OralProductionResult } from "~/logic/oral-production-config.js"
import type { ExerciseOutcome } from "~/logic/speech-repeat-config.js"
import { isSentence } from "~/logic/stimulus-display.js"
import { useAutoplayFeedback } from "~/logic/ui/use-autoplay-feedback.js"
import { SpeechRecognitionApi } from "~/logic/vocal/speech-recognition.js"
import { MismatchActionBar } from "~/components/shared/mismatch-action-bar.js"
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

const RecorderWrapper = styled("div", {
  base: {
    width: "100%",
  },
})

// --- Hooks ---

function useUserAudioPlayback(phase: OralProductionPhase) {
  const urlRef = useRef<string | null>(null)

  useEffect(() => {
    if (phase.kind === "feedback" && Option.isSome(phase.recordingBlob)) {
      urlRef.current = URL.createObjectURL(phase.recordingBlob.value)
    }
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
        urlRef.current = null
      }
    }
  }, [phase])

  const playUserAudio = useCallback(() => {
    if (urlRef.current) {
      const audio = new Audio(urlRef.current)
      audio.play()
    }
  }, [phase])

  return playUserAudio
}

// --- Helpers ---

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

function feedbackKind(phase: OralProductionPhase): AnswerResult["kind"] | "skip" | null {
  if (phase.kind !== "feedback") {
    return null
  }
  if (Option.isNone(phase.answerResult)) {
    return "skip"
  }
  return phase.answerResult.value.kind
}

// --- Main component ---

export function OralProduction(props: OralProductionProps) {
  const { config, onResult, initialPhase } = props
  const [phase, setPhase] = useState<OralProductionPhase>(initialPhase ?? { kind: "listening" })

  const { speakAtom, recognizeAtom, validateAtom } = useAtoms()
  const speak = useAtomSet(speakAtom)
  const recognize = useAtomSet(recognizeAtom, { mode: "promiseExit" })
  const validate = useAtomSet(validateAtom, { mode: "promiseExit" })

  useAutoplayFeedback(phase.kind === "feedback", config.expected, speak)
  const playUserAudio = useUserAudioPlayback(phase)

  const handlePlayModel = useCallback(() => {
    speak(config.expected)
  }, [config.expected])

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

  const handleNext = useCallback(() => {
    setPhase({ kind: "listening" })
  }, [])

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
              {(kind === "correct" || kind === "accepted") &&
                (isSentence(config.expected) ? (
                  <RewardSentence>{config.expected}</RewardSentence>
                ) : (
                  <RewardWord>{config.expected}</RewardWord>
                ))}
              {kind === "incorrect" &&
                Option.isSome(phase.answerResult) &&
                phase.answerResult.value.kind === "incorrect" && (
                  <TranscriptText>You said: {phase.answerResult.value.userAnswer}</TranscriptText>
                )}
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

      {kind !== "incorrect" && kind !== "skip" && (
        <RecorderWrapper>
          <VoiceRecorder
            state={phase.kind === "listening" ? "listening" : "paused"}
            onSpeechStart={noopSpeechStart}
            onSpeechEnd={handleSpeechEnd}
            onError={logMicrophoneError}
          />
        </RecorderWrapper>
      )}
      {(kind === "incorrect" || kind === "skip") && (
        <MismatchActionBar
          onPlayModel={handlePlayModel}
          onPlayUser={kind === "incorrect" ? playUserAudio : undefined}
          onNext={handleNext}
        />
      )}
    </Container>
  )
}
