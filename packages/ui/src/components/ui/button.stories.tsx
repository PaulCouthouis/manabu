import type { Meta, StoryObj } from "@storybook/react-vite"
import { Button, ButtonGroup } from "./button"

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  argTypes: {
    variant: {
      control: "select",
      options: ["solid", "outline", "subtle", "ghost", "link"],
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl", "2xl"],
    },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
  },
}
export default meta

type Story = StoryObj<typeof Button>

export const Solid: Story = {
  args: { variant: "solid", children: "Solid" },
}

export const Outline: Story = {
  args: { variant: "outline", children: "Outline" },
}

export const Subtle: Story = {
  args: { variant: "subtle", children: "Subtle" },
}

export const Ghost: Story = {
  args: { variant: "ghost", children: "Ghost" },
}

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Button size="xs">xs</Button>
      <Button size="sm">sm</Button>
      <Button size="md">md</Button>
      <Button size="lg">lg</Button>
      <Button size="xl">xl</Button>
      <Button size="2xl">2xl</Button>
    </div>
  ),
}

export const Loading: Story = {
  args: { loading: true, children: "Loading" },
}

export const LoadingWithText: Story = {
  args: { loading: true, loadingText: "Chargement…", children: "Submit" },
}

export const Disabled: Story = {
  args: { disabled: true, children: "Disabled" },
}

export const Group: Story = {
  render: () => (
    <ButtonGroup variant="outline">
      <Button>Un</Button>
      <Button>Deux</Button>
      <Button>Trois</Button>
    </ButtonGroup>
  ),
}

export const GroupAttached: Story = {
  render: () => (
    <ButtonGroup variant="outline" attached>
      <Button>Un</Button>
      <Button>Deux</Button>
      <Button>Trois</Button>
    </ButtonGroup>
  ),
}
