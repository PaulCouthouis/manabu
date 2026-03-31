import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import {
  TextSubmitInput,
  type TextSubmitInputProps,
} from "~/components/shared/text-submit-input.js"

const meta: Meta<TextSubmitInputProps> = {
  title: "Exercises/TextSubmitInput",
  component: TextSubmitInput,
}

export default meta

type Story = StoryObj<TextSubmitInputProps>

const onSubmit = fn().mockName("onSubmit")
const onSkip = fn().mockName("onSkip")

export const Default: Story = {
  render: () => {
    return <TextSubmitInput onSubmit={onSubmit} />
  },
}

export const WithSkip: Story = {
  render: () => {
    return <TextSubmitInput onSubmit={onSubmit} onSkip={onSkip} />
  },
}

export const CustomPlaceholder: Story = {
  render: () => {
    return <TextSubmitInput onSubmit={onSubmit} onSkip={onSkip} placeholder="日本語で入力" />
  },
}

export const Disabled: Story = {
  render: () => {
    return <TextSubmitInput onSubmit={onSubmit} onSkip={onSkip} disabled />
  },
}
