import { Volume2 } from "lucide-react"
import { styled } from "styled-system/jsx"
import { Button, Card } from "@manabu/ui"

const Row = styled("div", {
  base: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "2",
    paddingBlock: "3",
    paddingInline: "3",
  },
})

const BadgeSlot = styled("span", {
  base: {
    width: "8",
    display: "inline-flex",
    justifyContent: "center",
    flexShrink: 0,
  },
})

const SPEAK_ICON_COLOR = "var(--colors-jade-11)"

export function SummaryItemRow(props: {
  readonly modelText: string
  readonly speak: (text: string) => void
  readonly extraButton: React.ReactNode
  readonly rightBadge: React.ReactNode
  readonly children: React.ReactNode
}) {
  function handleSpeak() {
    props.speak(props.modelText)
  }

  return (
    <Card.Root>
      <Row>
        {props.children}
        <Button variant="ghost" size="md" aria-label="Écouter le modèle" onClick={handleSpeak}>
          <Volume2 size={20} color={SPEAK_ICON_COLOR} />
        </Button>
        {props.extraButton}
        <BadgeSlot>{props.rightBadge}</BadgeSlot>
      </Row>
    </Card.Root>
  )
}
