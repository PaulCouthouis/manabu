import { Field } from "@ark-ui/react/field"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Input } from "./input"

const meta: Meta<typeof Input> = {
  title: "Components/Input",
  component: Input,
  decorators: [
    (Story) => {
      return (
        <Field.Root>
          <Story />
        </Field.Root>
      )
    },
  ],
  argTypes: {
    size: {
      control: "select",
      options: ["2xs", "xs", "sm", "md", "lg", "xl", "2xl"],
    },
    disabled: { control: "boolean" },
  },
}
export default meta

type Story = StoryObj<typeof Input>

export const Default: Story = {
  args: {
    placeholder: "Type something...",
  },
}

export const Sizes: Story = {
  render: () => {
    return (
      <Field.Root>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Input size="sm" placeholder="sm" />
          <Input size="md" placeholder="md" />
          <Input size="lg" placeholder="lg" />
          <Input size="xl" placeholder="xl" />
        </div>
      </Field.Root>
    )
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: "Disabled",
  },
}
