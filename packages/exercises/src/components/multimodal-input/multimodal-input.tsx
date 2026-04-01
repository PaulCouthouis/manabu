import { Atom, useAtom, useAtomSet } from "@effect-atom/atom-react"
import { Effect, Layer } from "effect"
import { AudioLines, Keyboard } from "lucide-react"
import { styled } from "styled-system/jsx"
import { IconButton } from "@manabu/ui"
import { createExerciseProvider } from "~/components/shared/exercise-provider.js"
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

function makeAtoms(layer: MultimodalInputLayer) {
  const runtime = Atom.runtime(layer)

  const transcribeAtom = runtime.fn(
    Effect.fnUntraced(function* (blob: Blob) {
      const api = yield* SpeechToTextApi
      return yield* api.transcribe(blob)
    }),
  )

  return { transcribeAtom }
}

const { Provider: MultimodalInputProvider, useAtoms } = createExerciseProvider(
  "MultimodalInput",
  makeAtoms,
)

export { MultimodalInputProvider }

const Container = styled("div", {
  base: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "2",
  },
})

const FlexOne = styled("div", {
  base: {
    flex: 1,
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

  const handleSpeechEnd = async (blob: Blob) => {
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
  }

  const handleToggle = () => {
    setMode(toggleMode(mode))
  }

  return (
    <Container>
      {mode === "voice" ? (
        <FlexOne>
          <VoiceRecorder
            state={props.voiceRecorderState}
            onSpeechStart={props.onSpeechStart}
            onSpeechEnd={handleSpeechEnd}
            onError={props.onError}
          />
        </FlexOne>
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
