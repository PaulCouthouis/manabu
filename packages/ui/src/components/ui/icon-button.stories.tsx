import type { Meta, StoryObj } from "@storybook/react-vite"
import { Search } from "lucide-react"
import { IconButton } from "./icon-button"

const meta: Meta<typeof IconButton> = {
  title: "Components/IconButton",
  component: IconButton,
  argTypes: {
    variant: {
      control: "select",
      options: ["solid", "outline", "subtle", "ghost", "link"],
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl", "2xl"],
    },
    disabled: { control: "boolean" },
  },
}
export default meta

type Story = StoryObj<typeof IconButton>

export const Solid: Story = {
  args: {
    variant: "solid",
    "aria-label": "Search",
    children: <Search />,
  },
}

export const Outline: Story = {
  args: {
    variant: "outline",
    "aria-label": "Search",
    children: <Search />,
  },
}

export const Subtle: Story = {
  args: {
    variant: "subtle",
    "aria-label": "Search",
    children: <Search />,
  },
}

export const Ghost: Story = {
  args: {
    variant: "ghost",
    "aria-label": "Search",
    children: <Search />,
  },
}

export const Sizes: Story = {
  render: () => {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <IconButton size="xs" aria-label="Search">
          <Search />
        </IconButton>
        <IconButton size="sm" aria-label="Search">
          <Search />
        </IconButton>
        <IconButton size="md" aria-label="Search">
          <Search />
        </IconButton>
        <IconButton size="lg" aria-label="Search">
          <Search />
        </IconButton>
      </div>
    )
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    "aria-label": "Search",
    children: <Search />,
  },
}
