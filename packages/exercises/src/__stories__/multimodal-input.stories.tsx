import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { RegistryProvider } from "@effect-atom/atom-react"
import { Effect, Layer } from "effect"
import { useState } from "react"
import {
  BrowserVoiceRecorderLayer,
  VoiceRecorderProvider,
  type VoiceRecorderState,
} from "~/components/voice-recorder/voice-recorder.js"
import {
  MultimodalInput,
  MultimodalInputProvider,
  type MultimodalInputProps,
} from "~/components/multimodal-input/multimodal-input.js"
import { SpeechToTextApi } from "~/logic/vocal/speech-to-text.js"

const fakeSpeechToTextLayer = Layer.succeed(SpeechToTextApi, {
  transcribe: (_blob: Blob) => {
    return Effect.succeed("fake transcript")
  },
})

const meta: Meta<MultimodalInputProps> = {
  title: "Exercises/MultimodalInput",
  component: MultimodalInput,
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

type Story = StoryObj<MultimodalInputProps>

const onAnswer = fn().mockName("onAnswer")
const onSkip = fn().mockName("onSkip")
const onSpeechStart = fn().mockName("onSpeechStart")
const onError = fn().mockName("onError")

export const VoiceMode: Story = {
  render: () => {
    const [state, setState] = useState<VoiceRecorderState>("listening")
    return (
      <VoiceRecorderProvider layer={BrowserVoiceRecorderLayer}>
        <MultimodalInputProvider layer={fakeSpeechToTextLayer}>
          <MultimodalInput
            voiceRecorderState={state}
            onAnswer={(text) => {
              onAnswer(text)
              setState("processing")
              setTimeout(() => {
                setState("listening")
              }, 1000)
            }}
            onSkip={onSkip}
            onSpeechStart={onSpeechStart}
            onError={onError}
          />
        </MultimodalInputProvider>
      </VoiceRecorderProvider>
    )
  },
}
