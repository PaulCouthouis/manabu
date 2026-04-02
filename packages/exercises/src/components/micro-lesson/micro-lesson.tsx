import Markdown from "react-markdown"
import { css } from "styled-system/css"
import { Button, Dialog } from "@manabu/ui"

export interface MicroLessonProps {
  readonly content: string
  readonly open: boolean
  readonly onClose: () => void
}

const proseStyles = css({
  "& h1, & h2, & h3": {
    fontWeight: "semibold",
    mt: "4",
    mb: "2",
    _first: { mt: "0" },
  },
  "& h1": { fontSize: "xl" },
  "& h2": { fontSize: "lg" },
  "& h3": { fontSize: "md" },
  "& p": { mb: "3", lineHeight: "relaxed" },
  "& ul, & ol": { pl: "6", mb: "3" },
  "& li": { mb: "1" },
  "& strong": { fontWeight: "semibold" },
  "& code": {
    bg: "bg.subtle",
    px: "1",
    py: "0.5",
    borderRadius: "sm",
    fontSize: "sm",
  },
})

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
