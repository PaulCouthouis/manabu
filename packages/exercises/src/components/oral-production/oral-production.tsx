import { Atom, useAtomSet } from "@effect-atom/atom-react"
import { Effect, Layer, Option } from "effect"
import { Circle } from "lucide-react"
import { useState } from "react"
import {
  AcceptedTranscript,
  Container,
  ExerciseZone,
  FeedbackOverlay,
  MeaningText,
  RecorderWrapper,
  RewardSentence,
  RewardWord,
  StimulusGroup,
  SuccessOverlay,
  TranscriptText,
} from "~/components/shared/exercise-layout.js"
import { createExerciseProvider } from "~/components/shared/exercise-provider.js"
import { makeSpeakAtom, makeValidateAtom } from "~/components/shared/make-atoms.js"
import { MismatchActionBar } from "~/components/shared/mismatch-action-bar.js"
import type { AnswerResult } from "~/logic/answer-validation.js"
import { AnswerValidationApi } from "~/logic/answer-validation.js"
import { feedbackKind, outcomeFromAnswerResult } from "~/logic/answer-feedback.js"
import { TextToSpeech } from "~/logic/audio/text-to-speech.js"
import type { OralProductionConfig, OralProductionResult } from "~/logic/oral-production-config.js"
import { isSentence } from "~/logic/stimulus-display.js"
import { useAutoplayFeedback } from "~/logic/ui/use-autoplay-feedback.js"
import { useUserAudioPlayback } from "~/logic/ui/use-user-audio-playback.js"
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

function makeAtoms(layer: OralProductionLayer) {
  const runtime = Atom.runtime(layer)

  const recognizeAtom = runtime.fn(
    Effect.fnUntraced(function* (args: { blob: Blob; expected: string }) {
      const api = yield* SpeechRecognitionApi
      return yield* api.recognize(args.blob, args.expected)
    }),
  )

  return {
    speakAtom: makeSpeakAtom(runtime),
    recognizeAtom,
    validateAtom: makeValidateAtom(runtime),
  }
}

const { Provider: OralProductionProvider, useAtoms } = createExerciseProvider(
  "OralProduction",
  makeAtoms,
)

export { OralProductionProvider }

// --- Styles (component-specific removed — see exercise-layout) ---

// --- Helpers ---

const noopSpeechStart = () => {}
const logMicrophoneError = (error: unknown) => {
  console.error("[OralProduction] microphone error", error)
}

function feedbackBlob(phase: OralProductionPhase): Blob | null {
  if (phase.kind === "feedback" && Option.isSome(phase.recordingBlob)) {
    return phase.recordingBlob.value
  }
  return null
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
  const playUserAudio = useUserAudioPlayback(feedbackBlob(phase))

  const handlePlayModel = () => {
    speak(config.expected)
  }

  const emitFeedback = (answerResult: Option.Option<AnswerResult>, blob: Blob) => {
    setPhase({ kind: "feedback", answerResult, recordingBlob: Option.some(blob) })
    onResult({ outcome: outcomeFromAnswerResult(answerResult), answerResult })
  }

  const handleSpeechEnd = async (blob: Blob) => {
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
  }

  const handleNext = () => {
    setPhase({ kind: "listening" })
  }

  const kind = phase.kind === "feedback" ? feedbackKind(phase.answerResult) : null

  return (
    <Container>
      <ExerciseZone gap="6">
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
