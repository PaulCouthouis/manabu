import { Atom, useAtom, useAtomSet } from "@effect-atom/atom-react"
import { Effect, Layer } from "effect"
import { AudioLines, Keyboard } from "lucide-react"
import React, { useCallback, useContext, useMemo } from "react"
import { styled } from "styled-system/jsx"
import { IconButton } from "@manabu/ui"
import {
  VoiceRecorder,
  type VoiceRecorderState,
} from "~/components/voice-recorder/voice-recorder.js"
import { TextSubmitInput } from "~/components/shared/text-submit-input.js"
import { type InputMode, inputModeAtom } from "~/logic/input-mode.js"
import { SpeechToTextApi } from "~/logic/vocal/speech-to-text.js"
import type { MicrophoneError } from "~/logic/vocal/microphone.js"
import type { Cause } from "effect"

const SKIP_KEYWORD = "skip"

export type MultimodalInputLayer = Layer.Layer<SpeechToTextApi>

export interface MultimodalInputProps {
  readonly onAnswer: (text: string) => void
  readonly onSkip?: () => void
  readonly placeholder?: string
  readonly voiceRecorderState: VoiceRecorderState
  readonly onSpeechStart: () => void
  readonly onError: (error: Cause.Cause<MicrophoneError>) => void
}

function makeRuntime(layer: MultimodalInputLayer) {
  const runtime = Atom.runtime(layer)

  const transcribeAtom = runtime.fn(
    Effect.fnUntraced(function* (blob: Blob) {
      const api = yield* SpeechToTextApi
      return yield* api.transcribe(blob)
    }),
  )

  return { transcribeAtom }
}

type MultimodalInputAtoms = ReturnType<typeof makeRuntime>

const MultimodalInputAtomsContext = React.createContext<MultimodalInputAtoms | null>(null)

export function MultimodalInputProvider(props: {
  readonly layer: MultimodalInputLayer
  readonly children: React.ReactNode
}) {
  const atoms = useMemo(() => {
    return makeRuntime(props.layer)
  }, [props.layer])

  return (
    <MultimodalInputAtomsContext.Provider value={atoms}>
      {props.children}
    </MultimodalInputAtomsContext.Provider>
  )
}

function useAtoms(): MultimodalInputAtoms {
  const atoms = useContext(MultimodalInputAtomsContext)
  if (atoms === null) {
    throw new Error("MultimodalInput must be wrapped in MultimodalInputProvider")
  }
  return atoms
}

const Container = styled("div", {
  base: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "2",
  },
})

function toggleMode(current: InputMode): InputMode {
  return current === "voice" ? "keyboard" : "voice"
}

function isSkipTranscript(transcript: string): boolean {
  return transcript.trim().toLowerCase() === SKIP_KEYWORD
}

export function MultimodalInput(props: MultimodalInputProps) {
  const [mode, setMode] = useAtom(inputModeAtom)

  const { transcribeAtom } = useAtoms()
  const transcribe = useAtomSet(transcribeAtom, { mode: "promiseExit" })

  const handleSpeechEnd = useCallback(
    async (blob: Blob) => {
      const exit = await transcribe(blob)
      if (exit._tag !== "Success") {
        return
      }
      const transcript = exit.value
      if (isSkipTranscript(transcript)) {
        props.onSkip?.()
        return
      }
      props.onAnswer(transcript)
    },
    [props.onAnswer, props.onSkip, transcribe],
  )

  const handleToggle = useCallback(() => {
    setMode(toggleMode(mode))
  }, [mode])

  return (
    <Container>
      {mode === "voice" ? (
        <styled.div flex="1">
          <VoiceRecorder
            state={props.voiceRecorderState}
            onSpeechStart={props.onSpeechStart}
            onSpeechEnd={handleSpeechEnd}
            onError={props.onError}
          />
        </styled.div>
      ) : (
        <TextSubmitInput
          onSubmit={props.onAnswer}
          onSkip={props.onSkip}
          placeholder={props.placeholder}
        />
      )}
      <IconButton
        variant="ghost"
        size="sm"
        aria-label={mode === "voice" ? "Switch to keyboard" : "Switch to voice"}
        onClick={handleToggle}
      >
        {mode === "voice" ? <Keyboard /> : <AudioLines />}
      </IconButton>
    </Container>
  )
}
