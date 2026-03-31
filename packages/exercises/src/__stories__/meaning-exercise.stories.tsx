import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { RegistryProvider } from "@effect-atom/atom-react"
import { Effect, Layer } from "effect"
import { AnswerValidationApi } from "~/logic/answer-validation.js"
import { BrowserSpeechSynthesisApiLive, TextToSpeech } from "~/logic/audio/text-to-speech.js"
import { SpeechToTextApi } from "~/logic/vocal/speech-to-text.js"
import type { MeaningExerciseConfig } from "~/logic/meaning-exercise-config.js"
import {
  MeaningExercise,
  MeaningExerciseProvider,
  type MeaningExerciseLayer,
  type MeaningExerciseProps,
} from "~/components/meaning-exercise/meaning-exercise.js"
import { MultimodalInputProvider } from "~/components/multimodal-input/multimodal-input.js"
import {
  BrowserVoiceRecorderLayer,
  VoiceRecorderProvider,
} from "~/components/voice-recorder/voice-recorder.js"

const fakeAnswerValidationLayer = Layer.succeed(AnswerValidationApi, {
  validate: (answer: string, expected: string) => {
    return Effect.succeed(
      answer === expected
        ? { kind: "correct" as const, expected }
        : { kind: "incorrect" as const, userAnswer: answer, expected },
    )
  },
})

const fakeSpeechToTextLayer = Layer.succeed(SpeechToTextApi, {
  transcribe: (_blob: Blob) => {
    return Effect.succeed("fake transcript")
  },
})

const fakeAcceptedValidationLayer = Layer.succeed(AnswerValidationApi, {
  validate: (_answer: string, expected: string) => {
    return Effect.succeed({
      kind: "accepted" as const,
      userAnswer: "to learn",
      expected,
    })
  },
})

const meaningExerciseLayer = Layer.mergeAll(
  fakeAnswerValidationLayer,
  Layer.provide(TextToSpeech.Default, BrowserSpeechSynthesisApiLive),
)

const acceptedMeaningExerciseLayer = Layer.mergeAll(
  fakeAcceptedValidationLayer,
  Layer.provide(TextToSpeech.Default, BrowserSpeechSynthesisApiLive),
)

function MeaningExerciseStory(props: {
  readonly config: MeaningExerciseConfig
  readonly layer?: MeaningExerciseLayer
}) {
  return (
    <RegistryProvider>
      <VoiceRecorderProvider layer={BrowserVoiceRecorderLayer}>
        <MultimodalInputProvider layer={fakeSpeechToTextLayer}>
          <MeaningExerciseProvider layer={props.layer ?? meaningExerciseLayer}>
            <MeaningExercise config={props.config} onResult={fn()} />
          </MeaningExerciseProvider>
        </MultimodalInputProvider>
      </VoiceRecorderProvider>
    </RegistryProvider>
  )
}

const meta: Meta<MeaningExerciseProps> = {
  title: "Exercises/MeaningExercise",
  component: MeaningExercise,
  parameters: {
    layout: "fullscreen",
  },
}

export default meta

type Story = StoryObj<MeaningExerciseProps>

export const Skill5_KanjiQCM2: Story = {
  name: "Skill 5 — Kanji QCM 2 (学)",
  render: () => {
    return (
      <MeaningExerciseStory
        config={{
          stimulus: { mode: "kanji", text: "学" },
          interaction: { mode: "qcm", choices: ["study", "play"] },
          expected: "study",
        }}
      />
    )
  },
}

export const Skill5_KanjiQCM4: Story = {
  name: "Skill 5 — Kanji QCM 4 (犬)",
  render: () => {
    return (
      <MeaningExerciseStory
        config={{
          stimulus: { mode: "kanji", text: "犬" },
          interaction: {
            mode: "qcm",
            choices: ["dog", "cat", "wolf", "fox"],
          },
          expected: "dog",
        }}
      />
    )
  },
}

export const Skill6_AudioQCM4: Story = {
  name: "Skill 6 — Audio QCM 4 (猫)",
  render: () => {
    return (
      <MeaningExerciseStory
        config={{
          stimulus: { mode: "audio", text: "猫" },
          interaction: {
            mode: "qcm",
            choices: ["cat", "dog", "bird", "fish"],
          },
          expected: "cat",
        }}
      />
    )
  },
}

export const Skill8_SingleKanjiWordQCM4: Story = {
  name: "Skill 8 — Word 1 kanji QCM 4 (猫)",
  render: () => {
    return (
      <MeaningExerciseStory
        config={{
          stimulus: { mode: "word", text: "猫" },
          interaction: {
            mode: "qcm",
            choices: ["cat", "dog", "bird", "fish"],
          },
          expected: "cat",
        }}
      />
    )
  },
}

export const Skill8_WordQCM4: Story = {
  name: "Skill 8 — Word QCM 4 (先生)",
  render: () => {
    return (
      <MeaningExerciseStory
        config={{
          stimulus: { mode: "word", text: "先生" },
          interaction: {
            mode: "qcm",
            choices: ["teacher", "student", "doctor", "parent"],
          },
          expected: "teacher",
        }}
      />
    )
  },
}

export const Skill8_SentenceQCM4: Story = {
  name: "Skill 8 — Sentence QCM 4 (猫が好きです)",
  render: () => {
    return (
      <MeaningExerciseStory
        config={{
          stimulus: { mode: "word", text: "猫が好きです" },
          interaction: {
            mode: "qcm",
            choices: ["I like cats", "I hate cats", "I have a cat", "I see a cat"],
          },
          expected: "I like cats",
        }}
      />
    )
  },
}

export const WordQCM4: Story = {
  name: "Word — QCM 4 (食べる)",
  render: () => {
    return (
      <MeaningExerciseStory
        config={{
          stimulus: { mode: "word", text: "食べる" },
          interaction: {
            mode: "qcm",
            choices: ["to eat", "to drink", "to sleep", "to run"],
          },
          expected: "to eat",
        }}
      />
    )
  },
}

export const Skill5_FreeInput: Story = {
  name: "Skill 5 — Free input (学)",
  render: () => {
    return (
      <MeaningExerciseStory
        config={{
          stimulus: { mode: "kanji", text: "学" },
          interaction: { mode: "free-input" },
          expected: "study",
        }}
      />
    )
  },
}

export const Skill6_FreeInput: Story = {
  name: "Skill 6 — Free input (猫)",
  render: () => {
    return (
      <MeaningExerciseStory
        config={{
          stimulus: { mode: "audio", text: "猫" },
          interaction: { mode: "free-input" },
          expected: "cat",
        }}
      />
    )
  },
}

export const Skill8_FreeInput: Story = {
  name: "Skill 8 — Free input (先生)",
  render: () => {
    return (
      <MeaningExerciseStory
        config={{
          stimulus: { mode: "word", text: "先生" },
          interaction: { mode: "free-input" },
          expected: "teacher",
        }}
      />
    )
  },
}

export const Accepted_WordQCM: Story = {
  name: "Accepted — Word QCM (学ぶ → accepted 'to learn')",
  render: () => {
    return (
      <MeaningExerciseStory
        layer={acceptedMeaningExerciseLayer}
        config={{
          stimulus: { mode: "word", text: "学ぶ" },
          interaction: {
            mode: "qcm",
            choices: ["to learn", "to teach", "to read", "to write"],
          },
          expected: "to study",
        }}
      />
    )
  },
}

export const Accepted_AudioFreeInput: Story = {
  name: "Accepted — Audio Free input (猫 → accepted)",
  render: () => {
    return (
      <MeaningExerciseStory
        layer={acceptedMeaningExerciseLayer}
        config={{
          stimulus: { mode: "audio", text: "猫" },
          interaction: { mode: "free-input" },
          expected: "cat",
        }}
      />
    )
  },
}
