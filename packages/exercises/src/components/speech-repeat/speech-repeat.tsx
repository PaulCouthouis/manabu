import { Atom, useAtomSet } from "@effect-atom/atom-react"
import { Effect, Layer } from "effect"
import { Circle, Volume2 } from "lucide-react"
import React, { useEffect, useState } from "react"
import { styled } from "styled-system/jsx"
import {
  Container,
  ExerciseZone,
  RecorderWrapper,
  SuccessOverlay,
  TranscriptText,
} from "~/components/shared/exercise-layout.js"
import { createExerciseProvider } from "~/components/shared/exercise-provider.js"
import { MismatchActionBar } from "~/components/shared/mismatch-action-bar.js"
import { BrowserBlobUrlApiLive } from "~/logic/audio/blob-url.js"
import { BrowserSpeechSynthesisApiLive, TextToSpeech } from "~/logic/audio/text-to-speech.js"
import type {
  ExerciseResult,
  SpeechRepeatConfig,
  StimulusKind,
} from "~/logic/speech-repeat-config.js"
import { isAudioFirst, outcomeFromSpeechResult } from "~/logic/speech-repeat.js"
import { isSentence } from "~/logic/stimulus-display.js"
import { useAutoplayFeedback } from "~/logic/ui/use-autoplay-feedback.js"
import { useUserAudioPlayback } from "~/logic/ui/use-user-audio-playback.js"
import type { SpeechResult } from "~/logic/vocal/speech-recognition.js"
import { SpeechRecognitionApi } from "~/logic/vocal/speech-recognition.js"
import { VoiceRecorder } from "~/components/voice-recorder/voice-recorder.js"

// --- Types ---

export type SpeechRepeatPhase =
  | { readonly kind: "listening" }
  | { readonly kind: "feedback"; readonly speechResult: SpeechResult; readonly recordingBlob: Blob }

export type SpeechRepeatLayer = Layer.Layer<SpeechRecognitionApi>

export interface SpeechRepeatProps {
  readonly config: SpeechRepeatConfig
  readonly onResult: (result: ExerciseResult) => void
  readonly renderReward?: () => React.ReactNode
  readonly initialPhase?: SpeechRepeatPhase
}

// --- Runtime & atoms ---

function makeAtoms(recognitionLayer: SpeechRepeatLayer) {
  const runtime = Atom.runtime(
    Layer.mergeAll(
      Layer.provide(TextToSpeech.Default, BrowserSpeechSynthesisApiLive),
      BrowserBlobUrlApiLive,
      recognitionLayer,
    ),
  )

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

  return { speakAtom, recognizeAtom }
}

const { Provider: SpeechRepeatProvider, useAtoms } = createExerciseProvider(
  "SpeechRepeat",
  makeAtoms,
)

export { SpeechRepeatProvider }

// --- Styles ---

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

// --- Sub-components ---

function Stimulus(props: { readonly stimulus: StimulusKind }) {
  const { stimulus } = props

  if (stimulus.mode === "audio") {
    return null
  }

  if (stimulus.mode === "visual-kana") {
    return <StimulusText>{stimulus.kana}</StimulusText>
  }

  if (stimulus.mode === "visual-kana-scaffolding") {
    return (
      <StimulusText>
        {stimulus.hint} → {stimulus.kana}
      </StimulusText>
    )
  }

  if (stimulus.mode === "visual-text-furigana") {
    return (
      <StimulusText>
        <ruby>
          {stimulus.text}
          <rp>(</rp>
          <rt>{stimulus.reading}</rt>
          <rp>)</rp>
        </ruby>
      </StimulusText>
    )
  }

  if (isSentence(stimulus.text)) {
    return <SentenceText>{stimulus.text}</SentenceText>
  }
  return <StimulusText>{stimulus.text}</StimulusText>
}

function FeedbackMatch(props: {
  readonly config: SpeechRepeatConfig
  readonly renderReward?: () => React.ReactNode
}) {
  const hasReward = props.config.reward !== "none"

  if (hasReward && props.renderReward) {
    return props.renderReward()
  }
  return (
    <SuccessOverlay>
      <Circle width="100%" height="100%" strokeWidth={0.3} />
    </SuccessOverlay>
  )
}

function FeedbackSkip() {
  return null
}

// --- Hooks ---

function useAutoplayModel(
  phase: SpeechRepeatPhase,
  config: SpeechRepeatConfig,
  speak: (text: string) => void,
) {
  const audioFirst = isAudioFirst(config.stimulus)

  useEffect(() => {
    if (phase.kind === "listening" && audioFirst) {
      speak(config.expected)
    }
  }, [phase.kind, config.expected, audioFirst])

  useAutoplayFeedback(phase.kind === "feedback", config.expected, speak)
}

function mismatchBlob(phase: SpeechRepeatPhase): Blob | null {
  if (phase.kind === "feedback" && phase.speechResult.kind === "mismatch") {
    return phase.recordingBlob
  }
  return null
}

// --- Main component ---

const noopSpeechStart = () => {}

export function SpeechRepeat(props: SpeechRepeatProps) {
  const { config, onResult, renderReward, initialPhase } = props
  const [phase, setPhase] = useState<SpeechRepeatPhase>(initialPhase ?? { kind: "listening" })
  const audioFirst = isAudioFirst(config.stimulus)

  const { speakAtom, recognizeAtom } = useAtoms()
  const speak = useAtomSet(speakAtom)
  const recognize = useAtomSet(recognizeAtom, { mode: "promiseExit" })

  useAutoplayModel(phase, config, speak)
  const playUserAudio = useUserAudioPlayback(mismatchBlob(phase))

  const handlePlayModel = () => {
    speak(config.expected)
  }

  const handleSpeechEnd = async (blob: Blob) => {
    const exit = await recognize({ blob, expected: config.expected })
    if (exit._tag !== "Success") {
      return
    }
    const speechResult = exit.value
    const outcome = outcomeFromSpeechResult(speechResult)
    setPhase({ kind: "feedback", speechResult, recordingBlob: blob })
    onResult({ outcome, speechResult })
  }

  const handleNext = () => {
    setPhase({ kind: "listening" })
  }

  return (
    <Container>
      <ExerciseZone gap="6">
        {phase.kind === "listening" && audioFirst && (
          <PlayButton onClick={handlePlayModel} aria-label="Play model audio">
            <Volume2 />
          </PlayButton>
        )}
        {!audioFirst && <Stimulus stimulus={config.stimulus} />}

        {phase.kind === "feedback" && phase.speechResult.kind === "match" && (
          <FeedbackMatch config={config} renderReward={renderReward} />
        )}
        {phase.kind === "feedback" && phase.speechResult.kind === "mismatch" && (
          <TranscriptText>You said: {phase.speechResult.transcript}</TranscriptText>
        )}
        {phase.kind === "feedback" && phase.speechResult.kind === "skip" && <FeedbackSkip />}
      </ExerciseZone>

      {!(phase.kind === "feedback" && phase.speechResult.kind === "mismatch") && (
        <RecorderWrapper>
          <VoiceRecorder
            state={phase.kind === "listening" ? "listening" : "paused"}
            onSpeechStart={noopSpeechStart}
            onSpeechEnd={handleSpeechEnd}
            onError={(error) => {
              console.error("[SpeechRepeat] microphone error", error)
            }}
          />
        </RecorderWrapper>
      )}
      {phase.kind === "feedback" && phase.speechResult.kind === "mismatch" && (
        <MismatchActionBar
          onPlayModel={handlePlayModel}
          onPlayUser={playUserAudio}
          onNext={handleNext}
        />
      )}
    </Container>
  )
}
