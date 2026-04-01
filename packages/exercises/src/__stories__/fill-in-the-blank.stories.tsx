import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import type { FillInTheBlankConfig } from "~/logic/fill-in-the-blank-config.js"
import {
  FillInTheBlank,
  type FillInTheBlankProps,
} from "~/components/fill-in-the-blank/fill-in-the-blank.js"

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

// --- Stories ---

export const Skill11_Particles_Answering: Story = {
  name: "Skill 11 — Particles (私＿東京に行きます)",
  render: () => {
    return <FillInTheBlank config={particlesConfig} onResult={fn()} />
  },
}

export const Skill12_Conjugation_Answering: Story = {
  name: "Skill 12 — Conjugation (彼女は毎日＿＿＿います)",
  render: () => {
    return <FillInTheBlank config={conjugationConfig} onResult={fn()} />
  },
}

export const Skill13_Keigo_Answering: Story = {
  name: "Skill 13 — Keigo (先生が＿＿＿)",
  render: () => {
    return <FillInTheBlank config={keigoConfig} onResult={fn()} />
  },
}

export const Skill15_Counter_Answering: Story = {
  name: "Skill 15 — Counter (猫が＿＿＿います)",
  render: () => {
    return <FillInTheBlank config={counterConfig} onResult={fn()} />
  },
}
