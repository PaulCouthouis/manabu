import type { Meta, StoryObj } from "@storybook/react-vite"
import { RegistryProvider } from "@effect-atom/atom-react"
import { Effect, Layer } from "effect"
import { useState } from "react"
import {
  BrowserVoiceRecorderLayer,
  VoiceRecorder,
  VoiceRecorderProvider,
  type VoiceRecorderProps,
  type VoiceRecorderState,
} from "~/components/voice-recorder/voice-recorder.js"
import { AudioAnalyserApi } from "~/logic/vocal/audio-analyser.js"
import { MediaRecorderApi } from "~/logic/vocal/media-recorder.js"
import { MicrophoneApi, MicrophoneError } from "~/logic/vocal/microphone.js"
import { VoiceCaptureService } from "~/logic/vocal/voice-capture.js"
import type { AudioStream } from "~/logic/vocal/types.js"

const meta: Meta<VoiceRecorderProps> = {
  title: "Exercises/VoiceRecorder",
  component: VoiceRecorder,
  decorators: [
    (Story) => {
      return (
        <RegistryProvider>
          <Story />
        </RegistryProvider>
      )
    },
  ],
}

export default meta

type Story = StoryObj<VoiceRecorderProps>

// --- Default: vrai micro, waveform live, VAD active ---

export const Default: Story = {
  render: () => {
    const [state, setState] = useState<VoiceRecorderState>("listening")
    return (
      <VoiceRecorderProvider layer={BrowserVoiceRecorderLayer}>
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
      </VoiceRecorderProvider>
    )
  },
}

// --- Paused: démarre paused, toggle vers listening ---

export const Paused: Story = {
  render: () => {
    const [state, setState] = useState<VoiceRecorderState>("paused")
    return (
      <VoiceRecorderProvider layer={BrowserVoiceRecorderLayer}>
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
      </VoiceRecorderProvider>
    )
  },
}

// --- Processing: état figé ---

export const Processing: Story = {
  render: () => {
    return (
      <VoiceRecorderProvider layer={BrowserVoiceRecorderLayer}>
        <VoiceRecorder
          state="processing"
          onSpeechStart={() => {}}
          onSpeechEnd={() => {}}
          onError={() => {}}
        />
      </VoiceRecorderProvider>
    )
  },
}

// --- PermissionDenied: fake micro qui refuse la permission ---

const PermissionDeniedLayer = Layer.provide(
  VoiceCaptureService.Default,
  Layer.mergeAll(
    Layer.succeed(
      MicrophoneApi,
      MicrophoneApi.make({
        acquire: () => {
          return Effect.fail(
            new MicrophoneError({
              reason: "permission-denied",
              message: "User denied permission",
            }),
          )
        },
        release: () => {
          return Effect.void
        },
      }),
    ),
    Layer.succeed(
      AudioAnalyserApi,
      AudioAnalyserApi.make({
        create: () => ({
          getFrequencyData: () => {
            return new Uint8Array(0)
          },
          close: () => {},
        }),
      }),
    ),
    Layer.succeed(
      MediaRecorderApi,
      MediaRecorderApi.make({
        start: () => {
          return Effect.succeed({ stop: () => Effect.succeed(new Blob()) })
        },
      }),
    ),
  ),
)

export const PermissionDenied: Story = {
  render: () => {
    return (
      <VoiceRecorderProvider layer={PermissionDeniedLayer}>
        <VoiceRecorder
          state="listening"
          onSpeechStart={() => {}}
          onSpeechEnd={() => {}}
          onError={(error) => {
            console.error("[VoiceRecorder] Permission denied:", error)
          }}
        />
      </VoiceRecorderProvider>
    )
  },
}

// --- SimulatedWaveform: fake analyser avec sinusoïde ---

const makeSinWaveData = (): Uint8Array => {
  const data = new Uint8Array(64)
  const now = performance.now() / 100
  for (let i = 0; i < 64; i++) {
    data[i] = Math.floor(128 + 80 * Math.sin(now + i * 0.3))
  }
  return data
}

const fakeStream: AudioStream = { _tag: "AudioStream", _raw: null, getTracks: () => [] }

const SimulatedLayer = Layer.provide(
  VoiceCaptureService.Default,
  Layer.mergeAll(
    Layer.succeed(
      MicrophoneApi,
      MicrophoneApi.make({
        acquire: () => {
          return Effect.succeed(fakeStream)
        },
        release: () => {
          return Effect.void
        },
      }),
    ),
    Layer.succeed(
      AudioAnalyserApi,
      AudioAnalyserApi.make({
        create: () => ({
          getFrequencyData: () => {
            return makeSinWaveData()
          },
          close: () => {},
        }),
      }),
    ),
    Layer.succeed(
      MediaRecorderApi,
      MediaRecorderApi.make({
        start: () => {
          return Effect.succeed({ stop: () => Effect.succeed(new Blob()) })
        },
      }),
    ),
  ),
)

export const SimulatedWaveform: Story = {
  render: () => {
    return (
      <VoiceRecorderProvider layer={SimulatedLayer}>
        <VoiceRecorder
          state="listening"
          onSpeechStart={() => {}}
          onSpeechEnd={() => {}}
          onError={() => {}}
        />
      </VoiceRecorderProvider>
    )
  },
}
