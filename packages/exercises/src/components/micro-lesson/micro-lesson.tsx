import { Lightbulb } from "lucide-react"
import Markdown from "react-markdown"
import { Button, Dialog } from "@manabu/ui"
import { Prose } from "~/components/shared/prose-styles.js"

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
            <Dialog.Title>
              <Lightbulb size={20} /> Grammar Points
            </Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <Prose>
              <Markdown>{content}</Markdown>
            </Prose>
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
