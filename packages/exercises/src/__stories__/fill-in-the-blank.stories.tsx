import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { RegistryProvider } from "@effect-atom/atom-react"
import { Layer } from "effect"
import type { FillInTheBlankConfig } from "~/logic/fill-in-the-blank-config.js"
import { BrowserSpeechSynthesisApiLive, TextToSpeech } from "~/logic/audio/text-to-speech.js"
import {
  FillInTheBlank,
  FillInTheBlankProvider,
  type FillInTheBlankPhase,
  type FillInTheBlankProps,
} from "~/components/fill-in-the-blank/fill-in-the-blank.js"

// --- Story wrapper ---

const ttsLayer = Layer.provide(TextToSpeech.Default, BrowserSpeechSynthesisApiLive)

const sampleLessonContent = `## は (topic marker)

Marks the **topic** of the sentence — what the sentence is about.

**Example:** 私**は**学生です。(*I* am a student.)

## が (subject marker)

Marks the **grammatical subject**, especially for new information or emphasis.

**Example:** 雨**が**降っている。(It *is raining*.)
`

function FillInTheBlankStory(props: {
  readonly config: FillInTheBlankConfig
  readonly initialPhase?: FillInTheBlankPhase
}) {
  return (
    <RegistryProvider>
      <FillInTheBlankProvider layer={ttsLayer}>
        <FillInTheBlank
          config={props.config}
          onResult={fn()}
          lessonContent={sampleLessonContent}
          initialPhase={props.initialPhase}
        />
      </FillInTheBlankProvider>
    </RegistryProvider>
  )
}

// --- Meta ---

const meta: Meta<FillInTheBlankProps> = {
  title: "Exercises/FillInTheBlank",
  component: FillInTheBlank,
  parameters: {
    layout: "fullscreen",
  },
}

export default meta

type Story = StoryObj<FillInTheBlankProps>

// --- Configs ---

// Skill 12 — Conjugation: 彼女は毎日＿＿＿います。(走って)
const conjugationConfig: FillInTheBlankConfig = {
  segments: [
    { kind: "text", value: "彼女は毎日" },
    { kind: "blank", index: 0 },
    { kind: "text", value: "います。" },
  ],
  blanks: [{ index: 0, correctAnswer: "走って" }],
  choices: ["走って", "食べて", "飲んで", "読んで", "書いて"],
  fullSentence: "彼女は毎日走っています。",
}

// Skill 13 — Keigo: 先生が＿＿＿。(いらっしゃいます)
const keigoConfig: FillInTheBlankConfig = {
  segments: [
    { kind: "text", value: "先生が" },
    { kind: "blank", index: 0 },
    { kind: "text", value: "。" },
  ],
  blanks: [{ index: 0, correctAnswer: "いらっしゃいます" }],
  choices: ["います", "おります", "いらっしゃいます", "ございます"],
  fullSentence: "先生がいらっしゃいます。",
}

// Skill 15 — Counter: 猫が＿＿＿います。(三匹)
const counterConfig: FillInTheBlankConfig = {
  segments: [
    { kind: "text", value: "猫が" },
    { kind: "blank", index: 0 },
    { kind: "text", value: "います。" },
  ],
  blanks: [{ index: 0, correctAnswer: "三匹" }],
  choices: ["三本", "三匹", "三枚", "三個", "三台"],
  fullSentence: "猫が三匹います。",
}

// Skill 11 — Particles: 私＿東京に行きます。(は)
const particlesConfig: FillInTheBlankConfig = {
  segments: [
    { kind: "text", value: "私" },
    { kind: "blank", index: 0 },
    { kind: "text", value: "東京に行きます。" },
  ],
  blanks: [{ index: 0, correctAnswer: "は" }],
  choices: ["は", "が", "を", "に", "で", "へ", "と", "も", "の", "か", "よ", "ね"],
  fullSentence: "私は東京に行きます。",
}

// Skill 11 — Particles multi-blank (2 trous): 私＿東京＿行きます。(は, に)
const particlesMultiConfig: FillInTheBlankConfig = {
  segments: [
    { kind: "text", value: "私" },
    { kind: "blank", index: 0 },
    { kind: "text", value: "東京" },
    { kind: "blank", index: 1 },
    { kind: "text", value: "行きます。" },
  ],
  blanks: [
    { index: 0, correctAnswer: "は" },
    { index: 1, correctAnswer: "に" },
  ],
  choices: ["は", "が", "を", "に", "で", "へ", "と", "も", "の", "か", "よ", "ね"],
  fullSentence: "私は東京に行きます。",
}

// Skill 11 — Particles 3 blanks: 友達＿私＿本＿くれた。(が, に, を)
const particlesThreeConfig: FillInTheBlankConfig = {
  segments: [
    { kind: "text", value: "友達" },
    { kind: "blank", index: 0 },
    { kind: "text", value: "私" },
    { kind: "blank", index: 1 },
    { kind: "text", value: "本" },
    { kind: "blank", index: 2 },
    { kind: "text", value: "くれた。" },
  ],
  blanks: [
    { index: 0, correctAnswer: "が" },
    { index: 1, correctAnswer: "に" },
    { index: 2, correctAnswer: "を" },
  ],
  choices: ["は", "が", "を", "に", "で", "へ", "と", "も", "の", "か", "よ", "ね"],
  fullSentence: "友達が私に本をくれた。",
}

// --- Answering Stories ---

export const Skill11_Particles_Answering: Story = {
  name: "Skill 11 — Particles (私＿東京に行きます)",
  render: () => {
    return <FillInTheBlankStory config={particlesConfig} />
  },
}

export const Skill11_Particles_MultiBlank: Story = {
  name: "Skill 11 — Particles 2 blanks (私＿東京＿行きます)",
  render: () => {
    return <FillInTheBlankStory config={particlesMultiConfig} />
  },
}

export const Skill11_Particles_ThreeBlanks: Story = {
  name: "Skill 11 — Particles 3 blanks (友達＿私＿本＿くれた)",
  render: () => {
    return <FillInTheBlankStory config={particlesThreeConfig} />
  },
}

export const Skill12_Conjugation_Answering: Story = {
  name: "Skill 12 — Conjugation (彼女は毎日＿＿＿います)",
  render: () => {
    return <FillInTheBlankStory config={conjugationConfig} />
  },
}

export const Skill13_Keigo_Answering: Story = {
  name: "Skill 13 — Keigo (先生が＿＿＿)",
  render: () => {
    return <FillInTheBlankStory config={keigoConfig} />
  },
}

export const Skill15_Counter_Answering: Story = {
  name: "Skill 15 — Counter (猫が＿＿＿います)",
  render: () => {
    return <FillInTheBlankStory config={counterConfig} />
  },
}

// --- Feedback Stories ---

export const Skill11_Correct: Story = {
  name: "Skill 11 — Correct (私は東京に行きます ✅)",
  render: () => {
    return (
      <FillInTheBlankStory
        config={particlesMultiConfig}
        initialPhase={{
          kind: "feedback",
          result: {
            outcome: "success",
            blankResults: [
              { index: 0, userChoice: "は", correctAnswer: "は", isCorrect: true },
              { index: 1, userChoice: "に", correctAnswer: "に", isCorrect: true },
            ],
          },
        }}
      />
    )
  },
}

export const Skill11_Incorrect: Story = {
  name: "Skill 11 — Incorrect (で→に ❌)",
  render: () => {
    return (
      <FillInTheBlankStory
        config={particlesMultiConfig}
        initialPhase={{
          kind: "feedback",
          result: {
            outcome: "failure",
            blankResults: [
              { index: 0, userChoice: "は", correctAnswer: "は", isCorrect: true },
              { index: 1, userChoice: "で", correctAnswer: "に", isCorrect: false },
            ],
          },
        }}
      />
    )
  },
}

export const Skill12_Correct: Story = {
  name: "Skill 12 — Correct (走って ✅)",
  render: () => {
    return (
      <FillInTheBlankStory
        config={conjugationConfig}
        initialPhase={{
          kind: "feedback",
          result: {
            outcome: "success",
            blankResults: [
              { index: 0, userChoice: "走って", correctAnswer: "走って", isCorrect: true },
            ],
          },
        }}
      />
    )
  },
}

export const Skill12_Incorrect: Story = {
  name: "Skill 12 — Incorrect (食べて→走って ❌)",
  render: () => {
    return (
      <FillInTheBlankStory
        config={conjugationConfig}
        initialPhase={{
          kind: "feedback",
          result: {
            outcome: "failure",
            blankResults: [
              { index: 0, userChoice: "食べて", correctAnswer: "走って", isCorrect: false },
            ],
          },
        }}
      />
    )
  },
}
