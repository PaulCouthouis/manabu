import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { RegistryProvider } from "@effect-atom/atom-react"
import { Effect, Layer } from "effect"
import { AnswerValidationApi } from "~/logic/answer-validation.js"
import { BrowserSpeechSynthesisApiLive, TextToSpeech } from "~/logic/audio/text-to-speech.js"
import type { OralProductionConfig } from "~/logic/oral-production-config.js"
import type { SpeechResult } from "~/logic/vocal/speech-recognition.js"
import { SpeechRecognitionApi } from "~/logic/vocal/speech-recognition.js"
import {
  BrowserVoiceRecorderLayer,
  VoiceRecorderProvider,
} from "~/components/voice-recorder/voice-recorder.js"
import {
  OralProduction,
  OralProductionProvider,
  type OralProductionProps,
} from "~/components/oral-production/oral-production.js"

// --- Fake layers ---

function fakeSpeechRecognitionLayer(result: SpeechResult) {
  return Layer.succeed(SpeechRecognitionApi, {
    recognize: (_blob: Blob, _expected: string) => {
      return Effect.succeed(result)
    },
  })
}

const fakeAnswerValidationLayer = Layer.succeed(AnswerValidationApi, {
  validate: (answer: string, expected: string) => {
    return Effect.succeed(
      answer === expected
        ? { kind: "correct" as const, expected }
        : { kind: "incorrect" as const, userAnswer: answer, expected },
    )
  },
})

// --- Story wrapper ---

function OralProductionStory(props: {
  readonly config: OralProductionConfig
  readonly speechResult: SpeechResult
}) {
  const oralProductionLayer = Layer.mergeAll(
    fakeSpeechRecognitionLayer(props.speechResult),
    fakeAnswerValidationLayer,
    Layer.provide(TextToSpeech.Default, BrowserSpeechSynthesisApiLive),
  )

  return (
    <RegistryProvider>
      <VoiceRecorderProvider layer={BrowserVoiceRecorderLayer}>
        <OralProductionProvider layer={oralProductionLayer}>
          <OralProduction config={props.config} onResult={fn()} />
        </OralProductionProvider>
      </VoiceRecorderProvider>
    </RegistryProvider>
  )
}

// --- Meta ---

const meta: Meta<OralProductionProps> = {
  title: "Exercises/OralProduction",
  component: OralProduction,
  parameters: {
    layout: "fullscreen",
  },
}

export default meta

type Story = StoryObj<OralProductionProps>

// --- Configs ---

const wordConfig: OralProductionConfig = {
  meaning: "cat",
  expected: "猫",
}

const sentenceConfig: OralProductionConfig = {
  meaning: "I like cats",
  expected: "猫が好きです",
}

// --- Fake results ---

const matchResult: SpeechResult = {
  kind: "match",
  transcript: "ねこ",
}

// --- Stories ---

export const Word_Listening: Story = {
  name: "Word — Listening (cat → 猫)",
  render: () => {
    return <OralProductionStory config={wordConfig} speechResult={matchResult} />
  },
}

export const Sentence_Listening: Story = {
  name: "Sentence — Listening (I like cats → 猫が好きです)",
  render: () => {
    return <OralProductionStory config={sentenceConfig} speechResult={matchResult} />
  },
}
