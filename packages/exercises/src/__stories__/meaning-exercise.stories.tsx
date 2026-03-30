import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { RegistryProvider } from "@effect-atom/atom-react"
import { Effect, Layer } from "effect"
import { AnswerValidationApi } from "~/logic/answer-validation.js"
import type { MeaningExerciseConfig } from "~/logic/meaning-exercise-config.js"
import {
  MeaningExercise,
  MeaningExerciseProvider,
  type MeaningExerciseProps,
} from "~/components/meaning-exercise/meaning-exercise.js"

const fakeAnswerValidationLayer = Layer.succeed(AnswerValidationApi, {
  validate: (answer: string, expected: string) => {
    return Effect.succeed(
      answer === expected
        ? { kind: "correct" as const, expected }
        : { kind: "incorrect" as const, userAnswer: answer, expected },
    )
  },
})

function MeaningExerciseStory(props: { readonly config: MeaningExerciseConfig }) {
  return (
    <RegistryProvider>
      <MeaningExerciseProvider layer={fakeAnswerValidationLayer}>
        <MeaningExercise config={props.config} onResult={fn()} />
      </MeaningExerciseProvider>
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

export const QCM2: Story = {
  name: "QCM 2 choices",
  render: () => {
    return (
      <MeaningExerciseStory
        config={{
          stimulus: { mode: "visual", text: "学" },
          interaction: { mode: "qcm", choices: ["study", "dog"] },
          expected: "study",
        }}
      />
    )
  },
}

export const QCM4: Story = {
  name: "QCM 4 choices",
  render: () => {
    return (
      <MeaningExerciseStory
        config={{
          stimulus: { mode: "visual", text: "犬" },
          interaction: {
            mode: "qcm",
            choices: ["dog", "cat", "bird", "fish"],
          },
          expected: "dog",
        }}
      />
    )
  },
}

export const WordQCM2: Story = {
  name: "Word — QCM 2 (先生)",
  render: () => {
    return (
      <MeaningExerciseStory
        config={{
          stimulus: { mode: "visual", text: "先生" },
          interaction: { mode: "qcm", choices: ["teacher", "student"] },
          expected: "teacher",
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
          stimulus: { mode: "visual", text: "食べる" },
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
