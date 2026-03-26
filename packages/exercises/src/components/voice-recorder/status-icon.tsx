import { LoaderCircle, Mic, MicOff } from "lucide-react"
import { styled } from "styled-system/jsx"
import type { VoiceRecorderState } from "~/components/voice-recorder/voice-recorder.js"

const ICON_SIZE = 20

const IconContainer = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  variants: {
    animate: {
      pulse: {
        animation: "skeleton-pulse",
      },
      spin: {
        animation: "spin",
      },
      none: {},
    },
    state: {
      listening: {
        color: "colorPalette.9",
      },
      processing: {
        color: "fg.muted",
      },
      paused: {
        color: "fg.disabled",
      },
      error: {
        color: "fg.disabled",
      },
    },
  },
})

export function StatusIcon(props: { readonly state: VoiceRecorderState | "error" }) {
  if (props.state === "listening") {
    return (
      <IconContainer animate="pulse" state="listening">
        <Mic size={ICON_SIZE} />
      </IconContainer>
    )
  }

  if (props.state === "processing") {
    return (
      <IconContainer animate="spin" state="processing">
        <LoaderCircle size={ICON_SIZE} />
      </IconContainer>
    )
  }

  return (
    <IconContainer animate="none" state={props.state}>
      <MicOff size={ICON_SIZE} />
    </IconContainer>
  )
}
