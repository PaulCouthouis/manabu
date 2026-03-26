import { useAtom } from "@effect-atom/atom-react"
import { AudioLines, Keyboard } from "lucide-react"
import { useState } from "react"
import { styled } from "styled-system/jsx"
import { IconButton, Input } from "@manabu/ui"
import {
  VoiceRecorder,
  type VoiceRecorderState,
} from "~/components/voice-recorder/voice-recorder.js"
import { type AnswerResult, type InputMode, inputModeAtom } from "~/logic/input-mode.js"
import type { MicrophoneError } from "~/logic/vocal/microphone.js"
import type { Cause } from "effect"

// --- Types ---

export interface MultimodalInputProps {
  readonly onAnswer: (result: AnswerResult) => void
  readonly placeholder?: string
  readonly voiceRecorderState: VoiceRecorderState
  readonly onSpeechStart: () => void
  readonly onError: (error: Cause.Cause<MicrophoneError>) => void
}

// --- Styles ---

const Container = styled("div", {
  base: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "2",
  },
})

// --- Helpers ---

function toggleMode(current: InputMode): InputMode {
  return current === "voice" ? "keyboard" : "voice"
}

// --- Component ---

export function MultimodalInput(props: MultimodalInputProps) {
  const [mode, setMode] = useAtom(inputModeAtom)
  const [text, setText] = useState("")

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || text.trim() === "") {
      return
    }
    props.onAnswer({ mode: "keyboard", text: text.trim() })
    setText("")
  }

  const handleSpeechEnd = (blob: Blob) => {
    props.onAnswer({ mode: "voice", audio: blob })
  }

  const handleToggle = () => {
    setMode(toggleMode(mode))
  }

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
        <Input
          flex="1"
          height="48px"
          placeholder={props.placeholder ?? "Type your answer..."}
          enterKeyHint="send"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
          }}
          onKeyDown={handleKeyDown}
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
