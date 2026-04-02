import { styled } from "styled-system/jsx"

export type RewardDisplayProps =
  | { readonly text: string; readonly status: "new"; readonly label: string }
  | { readonly text: string; readonly status: "reviewed" }

const Container = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1",
  },
  variants: {
    animated: {
      true: {
        animation: "rewardReveal 500ms ease-out forwards",
        _motionReduce: {
          animation: "none",
        },
      },
    },
  },
})

const GlowWrapper = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "full",
    padding: "4",
  },
  variants: {
    glowing: {
      true: {
        animation: "rewardGlow 1s ease-in-out 500ms",
        _motionReduce: {
          animation: "none",
        },
      },
    },
  },
})

const RewardText = styled("span", {
  base: {
    fontSize: "6xl",
    lineHeight: 1,
  },
})

const Label = styled("span", {
  base: {
    fontSize: "sm",
    color: "fg.muted",
  },
})

export function RewardDisplay(props: RewardDisplayProps) {
  const isNew = props.status === "new"

  return (
    <Container animated={isNew}>
      <GlowWrapper glowing={isNew}>
        <RewardText>{props.text}</RewardText>
      </GlowWrapper>
      {isNew && <Label>{props.label}</Label>}
    </Container>
  )
}
