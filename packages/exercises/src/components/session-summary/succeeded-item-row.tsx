import { Check, Mic } from "lucide-react"
import { useEffect, useMemo, useRef } from "react"
import { styled } from "styled-system/jsx"
import { Button } from "@manabu/ui"
import type { DrillItem } from "../../logic/drill-queue.js"
import type { SessionSummarySucceededItem } from "../../logic/session-summary.js"
import { playAudio } from "../../logic/audio-playback.js"
import { TruncatedContent } from "./truncated-content.js"
import { SummaryItemRow } from "./summary-item-row.js"

const NewBadge = styled("span", {
  base: {
    fontSize: "xs",
    fontWeight: "bold",
    color: "white",
    bg: "jade.9",
    borderRadius: "sm",
    paddingInline: "1.5",
    paddingBlock: "1",
    lineHeight: "tight",
    letterSpacing: "wide",
    textTransform: "uppercase",
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

const SuccessBadge = styled("span", {
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "5",
    height: "5",
    borderRadius: "full",
    bg: "jade.3",
  },
})

const RECORD_ICON_COLOR = "var(--colors-fg-subtle)"
const SUCCESS_CHECK_COLOR = "var(--colors-jade-11)"

function RightBadge(props: { readonly attempts: number }) {
  if (props.attempts > 1) {
    return <AttemptsBadge>×{props.attempts}</AttemptsBadge>
  }
  return (
    <SuccessBadge>
      <Check size={12} color={SUCCESS_CHECK_COLOR} />
    </SuccessBadge>
  )
}

export function SucceededItemRow<A>(props: {
  readonly item: SessionSummarySucceededItem<A>
  readonly renderContent: (item: DrillItem<A>) => React.ReactNode
  readonly speak: (text: string) => void
}) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const blobUrl = useMemo(() => {
    return URL.createObjectURL(props.item.recordingBlob)
  }, [props.item.recordingBlob])

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(blobUrl)
    }
  }, [blobUrl])

  function handlePlayRecording() {
    if (audioRef.current) {
      playAudio(audioRef.current, blobUrl)
    }
  }

  const recordButton = (
    <Button
      variant="ghost"
      size="md"
      aria-label="Écouter l'enregistrement"
      onClick={handlePlayRecording}
    >
      <Mic size={20} color={RECORD_ICON_COLOR} />
    </Button>
  )

  return (
    <SummaryItemRow
      modelText={props.item.modelText}
      speak={props.speak}
      extraButton={recordButton}
      rightBadge={<RightBadge attempts={props.item.attempts} />}
    >
      {props.item.isNew && <NewBadge>new</NewBadge>}
      <TruncatedContent tooltipText={props.item.modelText}>
        {props.renderContent(props.item.item)}
      </TruncatedContent>
      <audio ref={audioRef} hidden />
    </SummaryItemRow>
  )
}
