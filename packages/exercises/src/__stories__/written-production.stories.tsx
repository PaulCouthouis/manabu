import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { RegistryProvider } from "@effect-atom/atom-react"
import { Effect, Layer } from "effect"
import { AnswerValidationApi } from "~/logic/answer-validation.js"
import type { WrittenProductionConfig } from "~/logic/written-production-config.js"
import {
  WrittenProduction,
  WrittenProductionProvider,
  type WrittenProductionProps,
} from "~/components/written-production/written-production.js"

// --- Fake layers ---

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

function WrittenProductionStory(props: {
  readonly config: WrittenProductionConfig
  readonly validationLayer?: Layer.Layer<AnswerValidationApi>
}) {
  const layer = props.validationLayer ?? fakeAnswerValidationLayer

  return (
    <RegistryProvider>
      <WrittenProductionProvider layer={layer}>
        <WrittenProduction config={props.config} onResult={fn()} />
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
