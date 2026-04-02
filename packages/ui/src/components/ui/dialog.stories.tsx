import { Portal } from "@ark-ui/react/portal"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Button } from "./button"
import * as Dialog from "./dialog"

const meta: Meta<typeof Dialog.Root> = {
  title: "Components/Dialog",
  component: Dialog.Root,
}
export default meta

type Story = StoryObj<typeof Dialog.Root>

export const Default: Story = {
  render: () => {
    return (
      <Dialog.Root defaultOpen>
        <Dialog.Trigger asChild>
          <Button>Open Dialog</Button>
        </Dialog.Trigger>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Dialog Title</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <p>This is a basic dialog with some content.</p>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.CloseTrigger asChild>
                  <Button variant="outline">Close</Button>
                </Dialog.CloseTrigger>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    )
  },
}
