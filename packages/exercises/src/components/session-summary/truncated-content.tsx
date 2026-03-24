import { useState } from "react"
import { styled } from "styled-system/jsx"
import { Tooltip } from "@manabu/ui"
import { isTextTruncated } from "../../logic/is-text-truncated.js"

const ItemText = styled("span", {
  base: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: "lg",
    color: "fg.default",
  },
})

export function TruncatedContent(props: {
  readonly tooltipText: string
  readonly children: React.ReactNode
}) {
  const [truncated, setTruncated] = useState(false)
  const ref = (node: HTMLSpanElement | null) => {
    if (node) {
      setTruncated(isTextTruncated(node))
    }
  }

  return (
    <Tooltip content={props.tooltipText} disabled={!truncated}>
      <ItemText ref={ref}>{props.children}</ItemText>
    </Tooltip>
  )
}
