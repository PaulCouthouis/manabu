import type { Meta, StoryObj } from "@storybook/react-vite"
import { Text } from "./text"

const meta: Meta<typeof Text> = {
  title: "Components/Text",
  component: Text,
}
export default meta

type Story = StoryObj<typeof Text>

export const Default: Story = {
  args: { children: "Le japonais est une langue fascinante." },
}

export const AsSpan: Story = {
  args: { as: "span", children: "Rendu en <span>" },
}

export const AsHeading: Story = {
  args: { as: "h2", children: "Rendu en <h2>" },
}
