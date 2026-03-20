import type { Meta, StoryObj } from "@storybook/react-vite"
import { Loader } from "./loader"

const meta: Meta<typeof Loader> = {
  title: "Components/Loader",
  component: Loader,
  argTypes: {
    visible: { control: "boolean" },
    spinnerPlacement: {
      control: "select",
      options: ["start", "end"],
    },
  },
}
export default meta

type Story = StoryObj<typeof Loader>

export const Default: Story = {
  args: { children: "Contenu" },
}

export const WithText: Story = {
  args: { text: "Chargement…", children: "Contenu" },
}

export const SpinnerEnd: Story = {
  args: { text: "Chargement…", spinnerPlacement: "end", children: "Contenu" },
}

export const Hidden: Story = {
  args: { visible: false, children: "Contenu visible (loader masqué)" },
}
