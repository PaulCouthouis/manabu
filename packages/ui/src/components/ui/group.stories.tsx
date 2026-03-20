import type { Meta, StoryObj } from "@storybook/react-vite"
import { Button } from "./button"
import { Group } from "./group"

const meta: Meta<typeof Group> = {
  title: "Components/Group",
  component: Group,
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
    attached: { control: "boolean" },
    grow: { control: "boolean" },
  },
}
export default meta

type Story = StoryObj<typeof Group>

export const Horizontal: Story = {
  render: (args) => (
    <Group {...args}>
      <Button variant="outline">Un</Button>
      <Button variant="outline">Deux</Button>
      <Button variant="outline">Trois</Button>
    </Group>
  ),
  args: { orientation: "horizontal" },
}

export const Vertical: Story = {
  render: (args) => (
    <Group {...args}>
      <Button variant="outline">Un</Button>
      <Button variant="outline">Deux</Button>
      <Button variant="outline">Trois</Button>
    </Group>
  ),
  args: { orientation: "vertical" },
}

export const Attached: Story = {
  render: (args) => (
    <Group {...args}>
      <Button variant="outline">Un</Button>
      <Button variant="outline">Deux</Button>
      <Button variant="outline">Trois</Button>
    </Group>
  ),
  args: { attached: true },
}

export const Grow: Story = {
  render: (args) => (
    <Group {...args} style={{ width: "100%" }}>
      <Button variant="outline">Un</Button>
      <Button variant="outline">Deux</Button>
      <Button variant="outline">Trois</Button>
    </Group>
  ),
  args: { grow: true },
}
