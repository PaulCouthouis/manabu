import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { RegistryProvider } from "@effect-atom/atom-react"
import { Layer, Option } from "effect"
import { fakeAnswerValidationLayer } from "~/test-utils/fake-layers.js"
import type { WrittenProductionConfig } from "~/logic/written-production-config.js"
import {
  WrittenProduction,
  WrittenProductionProvider,
  type WrittenProductionPhase,
  type WrittenProductionProps,
} from "~/components/written-production/written-production.js"

// --- Story wrapper ---

function WrittenProductionStory(props: {
  readonly config: WrittenProductionConfig
  readonly validationLayer?: Layer.Layer<AnswerValidationApi>
  readonly initialPhase?: WrittenProductionPhase
}) {
  const layer = props.validationLayer ?? fakeAnswerValidationLayer

  return (
    <RegistryProvider>
      <WrittenProductionProvider layer={layer}>
        <WrittenProduction
          config={props.config}
          onResult={fn()}
          initialPhase={props.initialPhase}
        />
      </WrittenProductionProvider>
    </RegistryProvider>
  )
}

// --- Meta ---

const meta: Meta<WrittenProductionProps> = {
  title: "Exercises/WrittenProduction",
  component: WrittenProduction,
  parameters: {
    layout: "fullscreen",
  },
}

export default meta

type Story = StoryObj<WrittenProductionProps>

// --- Configs ---

const wordConfig: WrittenProductionConfig = {
  meaning: "cat",
  expected: "猫",
}

const sentenceConfig: WrittenProductionConfig = {
  meaning: "I like cats",
  expected: "猫が好きです",
}

// --- Stories ---

export const Word_Answering: Story = {
  name: "Word — Answering (cat → 猫)",
  render: () => {
    return <WrittenProductionStory config={wordConfig} />
  },
}

export const Sentence_Answering: Story = {
  name: "Sentence — Answering (I like cats → 猫が好きです)",
  render: () => {
    return <WrittenProductionStory config={sentenceConfig} />
  },
}

export const Word_Correct: Story = {
  name: "Word — Correct (猫 ✅)",
  render: () => {
    return (
      <WrittenProductionStory
        config={wordConfig}
        initialPhase={{
          kind: "feedback",
          answerResult: Option.some({ kind: "correct", expected: "猫" }),
        }}
      />
    )
  },
}

export const Sentence_Accepted: Story = {
  name: "Sentence — Accepted (IA validated ✅)",
  render: () => {
    return (
      <WrittenProductionStory
        config={sentenceConfig}
        initialPhase={{
          kind: "feedback",
          answerResult: Option.some({
            kind: "accepted",
            userAnswer: "猫が好きです",
            expected: "猫が好きです",
          }),
        }}
      />
    )
  },
}

export const Word_Incorrect: Story = {
  name: "Word — Incorrect (❌ + Next)",
  render: () => {
    return (
      <WrittenProductionStory
        config={wordConfig}
        initialPhase={{
          kind: "feedback",
          answerResult: Option.some({
            kind: "incorrect",
            userAnswer: "べんきょう",
            expected: "猫",
          }),
        }}
      />
    )
  },
}

export const Word_Skip: Story = {
  name: "Word — Skip (⏭️ + Next)",
  render: () => {
    return (
      <WrittenProductionStory
        config={wordConfig}
        initialPhase={{
          kind: "feedback",
          answerResult: Option.none(),
        }}
      />
    )
  },
}
