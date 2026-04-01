import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { RegistryProvider } from "@effect-atom/atom-react"
import { Layer, Option } from "effect"
import type { AnswerValidationApi } from "~/logic/answer-validation.js"
import { BrowserSpeechSynthesisApiLive, TextToSpeech } from "~/logic/audio/text-to-speech.js"
import type { OralProductionConfig } from "~/logic/oral-production-config.js"
import type { SpeechResult } from "~/logic/vocal/speech-recognition.js"
import {
  fakeAcceptedValidationLayer,
  fakeAnswerValidationLayer,
  fakeSpeechRecognitionLayer,
} from "~/test-utils/fake-layers.js"
import {
  BrowserVoiceRecorderLayer,
  VoiceRecorderProvider,
} from "~/components/voice-recorder/voice-recorder.js"
import {
  OralProduction,
  OralProductionProvider,
  type OralProductionPhase,
  type OralProductionProps,
} from "~/components/oral-production/oral-production.js"
import { makeFakeAudioBlob } from "~/test-utils/make-fake-audio-blob.js"

const fakeAudio = makeFakeAudioBlob()

// --- Story wrapper ---

function OralProductionStory(props: {
  readonly config: OralProductionConfig
  readonly speechResult: SpeechResult
  readonly validationLayer?: Layer.Layer<AnswerValidationApi>
  readonly initialPhase?: OralProductionPhase
}) {
  const oralProductionLayer = Layer.mergeAll(
    fakeSpeechRecognitionLayer(props.speechResult),
    props.validationLayer ?? fakeAnswerValidationLayer,
    Layer.provide(TextToSpeech.Default, BrowserSpeechSynthesisApiLive),
  )

  return (
    <RegistryProvider>
      <VoiceRecorderProvider layer={BrowserVoiceRecorderLayer}>
        <OralProductionProvider layer={oralProductionLayer}>
          <OralProduction config={props.config} onResult={fn()} initialPhase={props.initialPhase} />
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

const mismatchResult: SpeechResult = {
  kind: "mismatch",
  transcript: "たべる",
}

const mismatchSentenceResult: SpeechResult = {
  kind: "mismatch",
  transcript: "べんきょうをします",
}

const skipResult: SpeechResult = {
  kind: "skip",
}

const noiseResult: SpeechResult = {
  kind: "noise",
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

export const Word_ExactMatch: Story = {
  name: "Word — Exact Match (猫 ✅)",
  render: () => {
    return (
      <OralProductionStory
        config={wordConfig}
        speechResult={matchResult}
        initialPhase={{
          kind: "feedback",
          answerResult: Option.some({ kind: "correct", expected: "猫" }),
          recordingBlob: Option.some(fakeAudio),
        }}
      />
    )
  },
}

export const Sentence_Accepted: Story = {
  name: "Sentence — Accepted (IA validated ✅)",
  render: () => {
    return (
      <OralProductionStory
        config={sentenceConfig}
        speechResult={mismatchSentenceResult}
        validationLayer={fakeAcceptedValidationLayer("べんきょうをします")}
        initialPhase={{
          kind: "feedback",
          answerResult: Option.some({
            kind: "accepted",
            userAnswer: "べんきょうをします",
            expected: "猫が好きです",
          }),
          recordingBlob: Option.some(fakeAudio),
        }}
      />
    )
  },
}

export const Word_Incorrect: Story = {
  name: "Word — Incorrect (❌ + MismatchActionBar)",
  render: () => {
    return (
      <OralProductionStory
        config={wordConfig}
        speechResult={mismatchResult}
        initialPhase={{
          kind: "feedback",
          answerResult: Option.some({
            kind: "incorrect",
            userAnswer: "たべる",
            expected: "猫",
          }),
          recordingBlob: Option.some(fakeAudio),
        }}
      />
    )
  },
}

export const Word_Skip: Story = {
  name: "Word — Skip (⏭️ + replay)",
  render: () => {
    return (
      <OralProductionStory
        config={wordConfig}
        speechResult={skipResult}
        initialPhase={{
          kind: "feedback",
          answerResult: Option.none(),
          recordingBlob: Option.none(),
        }}
      />
    )
  },
}

export const Word_Noise: Story = {
  name: "Word — Noise (micro reste chaud)",
  render: () => {
    return <OralProductionStory config={wordConfig} speechResult={noiseResult} />
  },
}
