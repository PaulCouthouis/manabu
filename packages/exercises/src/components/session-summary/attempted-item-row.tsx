import { styled } from "styled-system/jsx"
import type { SessionSummaryAttemptedItem } from "~/logic/session/session-summary.js"
import { SummaryItemRow } from "~/components/session-summary/summary-item-row.js"

const PlaceholderText = styled("span", {
  base: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: "lg",
    color: "fg.disabled",
  },
})

const AttemptsBadge = styled("span", {
  base: {
    fontSize: "xs",
    fontWeight: "medium",
    color: "jade.11",
    bg: "jade.3",
    borderRadius: "full",
    paddingInline: "2",
    paddingBlock: "0.5",
    lineHeight: "tight",
  },
})

const ButtonPlaceholder = styled("span", {
  base: {
    width: "12",
    height: "10",
    flexShrink: 0,
  },
})

export function AttemptedItemRow<A>(props: {
  readonly item: SessionSummaryAttemptedItem<A>
  readonly speak: (text: string) => void
}) {
  return (
    <SummaryItemRow
      modelText={props.item.modelText}
      speak={props.speak}
      extraButton={<ButtonPlaceholder />}
      rightBadge={
        props.item.attempts > 1 ? <AttemptsBadge>×{props.item.attempts}</AttemptsBadge> : null
      }
    >
      <PlaceholderText>─ ─ ─</PlaceholderText>
    </SummaryItemRow>
  )
}
