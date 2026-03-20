import type { Meta, StoryObj } from "@storybook/react-vite"
import { AbsoluteCenter } from "./absolute-center"

const meta: Meta<typeof AbsoluteCenter> = {
  title: "Components/AbsoluteCenter",
  component: AbsoluteCenter,
  argTypes: {
    axis: {
      control: "select",
      options: ["horizontal", "vertical", "both"],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ position: "relative", height: 200, border: "1px dashed gray" }}>
        <Story />
      </div>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof AbsoluteCenter>

export const Both: Story = {
  args: { axis: "both", children: "Centré" },
}

export const Horizontal: Story = {
  args: { axis: "horizontal", children: "Horizontal" },
}

export const Vertical: Story = {
  args: { axis: "vertical", children: "Vertical" },
}
