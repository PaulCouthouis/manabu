import type { Meta, StoryObj } from "@storybook/react-vite"
import { Span } from "./span"

const meta: Meta<typeof Span> = {
  title: "Components/Span",
  component: Span,
}
export default meta

type Story = StoryObj<typeof Span>

export const Default: Story = {
  args: { children: "Texte inline" },
}

export const WithStyles: Story = {
  args: {
    children: "Texte stylé",
    fontWeight: "bold",
    color: "jade.11",
  },
}
