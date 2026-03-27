import { Atom, useAtomSet } from "@effect-atom/atom-react"
import { Effect, Layer } from "effect"
import { ArrowRight, AudioLines, Circle, Volume2 } from "lucide-react"
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { styled } from "styled-system/jsx"
import { Button } from "@manabu/ui"
import { BrowserBlobUrlApiLive } from "~/logic/audio/blob-url.js"
import { BrowserSpeechSynthesisApiLive, TextToSpeech } from "~/logic/audio/text-to-speech.js"
import type {
  ExerciseResult,
  SpeechRepeatConfig,
  StimulusKind,
} from "~/logic/speech-repeat-config.js"
import type { SpeechResult } from "~/logic/vocal/speech-recognition.js"
import { SpeechRecognitionApi } from "~/logic/vocal/speech-recognition.js"
import { VoiceRecorder } from "~/components/voice-recorder/voice-recorder.js"

// --- Types ---

export type SpeechRepeatPhase =
  | { readonly kind: "listening" }
  | { readonly kind: "feedback"; readonly speechResult: SpeechResult }

export type SpeechRepeatLayer = Layer.Layer<SpeechRecognitionApi>

export interface SpeechRepeatProps {
  readonly config: SpeechRepeatConfig
  readonly onResult: (result: ExerciseResult) => void
  readonly renderReward?: () => React.ReactNode
  readonly initialPhase?: SpeechRepeatPhase
}

// --- Runtime & atoms ---

function makeRuntime(recognitionLayer: SpeechRepeatLayer) {
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

type SpeechRepeatAtoms = ReturnType<typeof makeRuntime>

const SpeechRepeatAtomsContext = React.createContext<SpeechRepeatAtoms | null>(null)

export function SpeechRepeatProvider(props: {
  readonly layer: SpeechRepeatLayer
  readonly children: React.ReactNode
}) {
  const atoms = useMemo(() => {
    return makeRuntime(props.layer)
  }, [props.layer])

  return (
    <SpeechRepeatAtomsContext.Provider value={atoms}>
      {props.children}
    </SpeechRepeatAtomsContext.Provider>
  )
}

function useAtoms(): SpeechRepeatAtoms {
  const atoms = useContext(SpeechRepeatAtomsContext)
  if (atoms === null) {
    throw new Error("SpeechRepeat must be wrapped in SpeechRepeatProvider")
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

const TranscriptText = styled("span", {
  base: {
    fontSize: "2xl",
    color: "fg.muted",
    fontStyle: "italic",
    textAlign: "center",
  },
})

const ActionBar = styled("div", {
  base: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    px: "4",
    py: "3",
    borderTopWidth: "1px",
    borderColor: "border.subtle",
    bg: "bg.subtle",
  },
})

const ActionBarIcon = styled("button", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "12",
    height: "12",
    borderRadius: "full",
    cursor: "pointer",
    color: "fg.muted",
    bg: "transparent",
    _hover: { bg: "bg.muted", color: "fg.default" },
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

const RecorderWrapper = styled("div", {
  base: {
    width: "100%",
  },
})

// --- Pure helpers ---

function outcomeFromSpeechResult(result: SpeechResult): ExerciseResult["outcome"] {
  if (result.kind === "match") {
    return "success"
  }
  if (result.kind === "skip") {
    return "skip"
  }
  return "failure"
}

function isAudioFirst(stimulus: StimulusKind): boolean {
  return stimulus.mode === "audio"
}

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

  return <SentenceText>{stimulus.text}</SentenceText>
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

function MismatchActionBar(props: {
  readonly onPlayModel: () => void
  readonly onPlayUser: () => void
  readonly onNext: () => void
}) {
  return (
    <ActionBar>
      <ActionBarIcon onClick={props.onPlayModel} aria-label="Replay model">
        <Volume2 size={32} />
      </ActionBarIcon>
      <Button colorPalette="accent" size="xl" onClick={props.onNext}>
        Next
        <ArrowRight size={24} />
      </Button>
      <ActionBarIcon onClick={props.onPlayUser} aria-label="Replay your recording">
        <AudioLines size={32} />
      </ActionBarIcon>
    </ActionBar>
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
  const hasPlayed = useRef(false)
  const audioFirst = isAudioFirst(config.stimulus)

  useEffect(() => {
    if (phase.kind === "listening" && audioFirst) {
      speak(config.expected)
    }
  }, [phase.kind, config.expected, audioFirst])

  useEffect(() => {
    if (phase.kind !== "feedback") {
      hasPlayed.current = false
      return
    }
    if (hasPlayed.current) {
      return
    }
    hasPlayed.current = true
    const timer = setTimeout(() => {
      speak(config.expected)
    }, 500)
    return () => {
      clearTimeout(timer)
    }
  }, [phase.kind, config.expected])
}

function useUserAudioPlayback(phase: SpeechRepeatPhase) {
  const urlRef = useRef<string | null>(null)

  useEffect(() => {
    if (phase.kind === "feedback" && phase.speechResult.kind === "mismatch") {
      urlRef.current = URL.createObjectURL(phase.speechResult.audio)
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
  const playUserAudio = useUserAudioPlayback(phase)

  const handlePlayModel = useCallback(() => {
    speak(config.expected)
  }, [config.expected])

  const handleSpeechEnd = useCallback(
    async (blob: Blob) => {
      const exit = await recognize({ blob, expected: config.expected })
      if (exit._tag !== "Success") {
        return
      }
      const speechResult = exit.value
      const outcome = outcomeFromSpeechResult(speechResult)
      setPhase({ kind: "feedback", speechResult })
      onResult({ outcome, speechResult })
    },
    [config.expected, onResult],
  )

  const handleNext = useCallback(() => {
    setPhase({ kind: "listening" })
  }, [])

  return (
    <Container>
      <ExerciseZone>
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

      {phase.kind === "listening" && (
        <RecorderWrapper>
          <VoiceRecorder
            state="listening"
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
