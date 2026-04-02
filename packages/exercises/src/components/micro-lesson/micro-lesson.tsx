import Markdown from "react-markdown"
import { Button, Dialog } from "@manabu/ui"
import { proseStyles } from "~/components/shared/prose-styles.js"

export interface MicroLessonProps {
  readonly content: string
  readonly open: boolean
  readonly onClose: () => void
}

export function MicroLesson(props: MicroLessonProps) {
  const { content, open, onClose } = props
  return (
    <Dialog.Root
      open={open}
      scrollBehavior="inside"
      onOpenChange={(details) => {
        if (!details.open) {
          onClose()
        }
      }}
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>💡 Grammar Points</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <div className={proseStyles}>
              <Markdown>{content}</Markdown>
            </div>
          </Dialog.Body>
          <Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <Button variant="outline">Got it</Button>
            </Dialog.CloseTrigger>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
}
