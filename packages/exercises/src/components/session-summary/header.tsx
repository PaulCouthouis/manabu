import { CircleCheck } from "lucide-react"
import { styled } from "styled-system/jsx"
import { Text } from "@manabu/ui"

const HeaderRow = styled("div", {
  base: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: "2",
    marginBottom: "1",
  },
})

const HEADER_CHECK_COLOR = "var(--colors-jade-9)"

export function Header(props: { readonly succeeded: number; readonly total: number }) {
  const isComplete = props.succeeded === props.total
  if (isComplete) {
    return (
      <HeaderRow>
        <CircleCheck size={22} color={HEADER_CHECK_COLOR} />
        <Text color="jade.11" fontWeight="semibold" fontSize="lg">
          Session complete
        </Text>
      </HeaderRow>
    )
  }
  return (
    <HeaderRow>
      <Text color="fg.muted" fontWeight="semibold" fontSize="lg">
        You completed {props.succeeded}/{props.total}
      </Text>
    </HeaderRow>
  )
}
