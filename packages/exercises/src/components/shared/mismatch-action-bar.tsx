import { ArrowRight, AudioLines, Volume2 } from "lucide-react"
import { styled } from "styled-system/jsx"
import { Button } from "@manabu/ui"

const ActionBar = styled("div", {
  base: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    px: "4",
    py: "3",
    borderTopWidth: "1px",
    borderColor: "border.subtle",
    bg: "bg.subtle",
  },
})

const ActionBarIcon = styled("button", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "12",
    height: "12",
    borderRadius: "full",
    cursor: "pointer",
    color: "fg.muted",
    bg: "transparent",
    _hover: { bg: "bg.muted", color: "fg.default" },
  },
})

export function MismatchActionBar(props: {
  readonly onPlayModel: () => void
  readonly onPlayUser: () => void
  readonly onNext: () => void
}) {
  return (
    <ActionBar>
      <ActionBarIcon onClick={props.onPlayModel} aria-label="Replay model">
        <Volume2 size={32} />
      </ActionBarIcon>
      <Button colorPalette="accent" size="xl" onClick={props.onNext}>
        Next
        <ArrowRight size={24} />
      </Button>
      <ActionBarIcon onClick={props.onPlayUser} aria-label="Replay your recording">
        <AudioLines size={32} />
      </ActionBarIcon>
    </ActionBar>
  )
}
