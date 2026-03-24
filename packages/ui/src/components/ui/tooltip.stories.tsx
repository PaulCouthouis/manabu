import type { Meta, StoryObj } from "@storybook/react-vite"
import { Button } from "./button"
import { Tooltip } from "./tooltip"

const meta: Meta<typeof Tooltip> = {
  title: "Components/Tooltip",
  component: Tooltip,
  argTypes: {
    content: { control: "text" },
    showArrow: { control: "boolean" },
    disabled: { control: "boolean" },
  },
}
export default meta

type Story = StoryObj<typeof Tooltip>

export const Default: Story = {
  args: {
    content: "Ceci est un tooltip",
    children: <Button>Survole-moi</Button>,
  },
}

export const Disabled: Story = {
  args: {
    content: "Ce tooltip ne s'affichera pas",
    disabled: true,
    children: <Button variant="subtle">Désactivé</Button>,
  },
}

export const LongContent: Story = {
  args: {
    content: "彼女は毎朝六時に起きてジョギングをする。これは非常に長いテキストです。",
    showArrow: true,
    children: <Button variant="ghost">Texte long</Button>,
  },
}
