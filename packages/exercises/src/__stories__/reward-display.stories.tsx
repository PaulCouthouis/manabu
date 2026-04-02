import type { Meta, StoryObj } from "@storybook/react-vite"
import {
  RewardDisplay,
  type RewardDisplayProps,
} from "~/components/reward-animation/reward-display.js"

// --- Meta ---

const meta: Meta<RewardDisplayProps> = {
  title: "Exercises/RewardDisplay",
  component: RewardDisplay,
  parameters: {
    layout: "centered",
  },
}
export default meta

type Story = StoryObj<RewardDisplayProps>

// --- Stories ---

export const KanaNew: Story = {
  name: "Kana — New (animated)",
  render: () => {
    return <RewardDisplay text="か" status="new" label="Kana unlocked" />
  },
}

export const KanaReviewed: Story = {
  name: "Kana — Reviewed (no animation)",
  render: () => {
    return <RewardDisplay text="か" status="reviewed" />
  },
}

export const WordNew: Story = {
  name: "Word — New (animated)",
  render: () => {
    return <RewardDisplay text="猫" status="new" label="Word unlocked" />
  },
}

export const WordReviewed: Story = {
  name: "Word — Reviewed (no animation)",
  render: () => {
    return <RewardDisplay text="猫" status="reviewed" />
  },
}

export const CompoundWordNew: Story = {
  name: "Compound word — New (animated)",
  render: () => {
    return <RewardDisplay text="図書館" status="new" label="Word unlocked" />
  },
}
