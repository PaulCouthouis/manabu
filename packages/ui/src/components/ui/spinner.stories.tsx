import type { Meta, StoryObj } from "@storybook/react-vite"
import { Spinner } from "./spinner"

const meta: Meta<typeof Spinner> = {
  title: "Components/Spinner",
  component: Spinner,
  argTypes: {
    size: {
      control: "select",
      options: ["inherit", "xs", "sm", "md", "lg", "xl", "2xl"],
    },
  },
}
export default meta

type Story = StoryObj<typeof Spinner>

export const Default: Story = {
  args: { size: "md" },
}

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <Spinner size="xs" />
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
      <Spinner size="xl" />
      <Spinner size="2xl" />
    </div>
  ),
}
