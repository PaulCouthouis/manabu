import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState } from "react"
import {
  VoiceRecorder,
  type VoiceRecorderProps,
  type VoiceRecorderState,
} from "~/components/voice-recorder/voice-recorder.js"

const meta: Meta<VoiceRecorderProps> = {
  title: "VoiceRecorder",
  component: VoiceRecorder,
}

export default meta

type Story = StoryObj<VoiceRecorderProps>

// --- Default: vrai micro, waveform live, VAD active ---

export const Default: Story = {
  render: () => {
    const [state, setState] = useState<VoiceRecorderState>("listening")
    return (
      <VoiceRecorder
        state={state}
        onSpeechStart={() => {
          console.log("[VoiceRecorder] speechStart — recording")
        }}
        onSpeechEnd={(blob) => {
          console.log("[VoiceRecorder] speechEnd", blob.size, "bytes — playing back")
          setState("processing")
          const url = URL.createObjectURL(blob)
          const audio = new Audio(url)
          audio.onplay = () => {
            setState("paused")
          }
          audio.onended = () => {
            URL.revokeObjectURL(url)
            setState("listening")
          }
          audio.play()
        }}
        onError={(error) => {
          console.error("[VoiceRecorder] error", error)
        }}
      />
    )
  },
}

// --- Paused: démarre paused, toggle vers listening ---

export const Paused: Story = {
  render: () => {
    const [state, setState] = useState<VoiceRecorderState>("paused")
    return (
      <div>
        <VoiceRecorder
          state={state}
          onSpeechStart={() => {
            console.log("[VoiceRecorder] speechStart — recording")
          }}
          onSpeechEnd={(blob) => {
            console.log("[VoiceRecorder] speechEnd", blob.size, "bytes — playing back")
            setState("processing")
            const url = URL.createObjectURL(blob)
            const audio = new Audio(url)
            audio.onplay = () => {
              setState("paused")
            }
            audio.onended = () => {
              URL.revokeObjectURL(url)
              setState("paused")
            }
            audio.play()
          }}
          onError={(error) => {
            console.error("[VoiceRecorder] error", error)
          }}
        />
        <button
          onClick={() => {
            setState((s) => {
              return s === "paused" ? "listening" : "paused"
            })
          }}
          style={{ marginTop: 16 }}
        >
          Toggle {state === "paused" ? "▶ Start" : "⏸ Pause"}
        </button>
      </div>
    )
  },
}

// --- Processing: état figé ---

export const Processing: Story = {
  render: () => {
    return (
      <VoiceRecorder
        state="processing"
        onSpeechStart={() => {}}
        onSpeechEnd={() => {}}
        onError={() => {}}
      />
    )
  },
}
