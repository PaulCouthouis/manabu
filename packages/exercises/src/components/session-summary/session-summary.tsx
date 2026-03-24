import { Atom, useAtomSet } from "@effect-atom/atom-react"
import { Effect, Layer } from "effect"
import { Check, CircleCheck, Mic, Volume2 } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { styled } from "styled-system/jsx"
import { Button, Card, Text, Tooltip } from "@manabu/ui"
import type { DrillItem } from "../../logic/drill-queue.js"
import type {
  SessionSummaryAttemptedItem,
  SessionSummarySucceededItem,
} from "../../logic/session-summary.js"
import { BrowserSpeechSynthesisApiLive, TextToSpeech } from "../../logic/text-to-speech.js"
import { BrowserBlobUrlApiLive } from "./blob-url.js"
import { isTextTruncated } from "./is-text-truncated.js"
import { playAudio } from "./audio-playback.js"

export interface SessionSummaryProps<A> {
  readonly succeeded: ReadonlyArray<SessionSummarySucceededItem<A>>
  readonly attempted: ReadonlyArray<SessionSummaryAttemptedItem<A>>
  readonly total: number
  readonly renderContent: (item: DrillItem<A>) => React.ReactNode
}

const ExerciseRuntime = Atom.runtime(
  Layer.mergeAll(
    Layer.provide(TextToSpeech.Default, BrowserSpeechSynthesisApiLive),
    BrowserBlobUrlApiLive,
  ),
)

const speakAtom = ExerciseRuntime.fn(
  Effect.fnUntraced(function* (text: string) {
    const tts = yield* TextToSpeech
    yield* tts.speak(text)
  }),
)

const Container = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "3",
  },
})

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

const ItemRow = styled("div", {
  base: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "2",
    paddingBlock: "3",
    paddingInline: "3",
  },
})

const ItemText = styled("span", {
  base: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: "lg",
  },
  variants: {
    dimmed: {
      true: { color: "fg.disabled" },
      false: { color: "fg.default" },
    },
  },
  defaultVariants: {
    dimmed: false,
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

const ButtonPlaceholder = styled("span", {
  base: {
    width: "12",
    height: "10",
    flexShrink: 0,
  },
})

const SPEAK_ICON_COLOR = "var(--colors-jade-11)"
const RECORD_ICON_COLOR = "var(--colors-fg-subtle)"
const HEADER_CHECK_COLOR = "var(--colors-jade-9)"
const SUCCESS_CHECK_COLOR = "var(--colors-jade-11)"

function TruncatedContent(props: {
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

function BadgeOrCheck(props: { readonly attempts: number }) {
  if (props.attempts > 1) {
    return <AttemptsBadge>×{props.attempts}</AttemptsBadge>
  }
  return (
    <SuccessBadge>
      <Check size={12} color={SUCCESS_CHECK_COLOR} />
    </SuccessBadge>
  )
}

function SucceededItemRow<A>(props: {
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

  function handleSpeak() {
    props.speak(props.item.modelText)
  }

  function handlePlayRecording() {
    if (audioRef.current) {
      playAudio(audioRef.current, blobUrl)
    }
  }

  return (
    <Card.Root>
      <ItemRow>
        {props.item.isNew && <NewBadge>new</NewBadge>}
        <TruncatedContent tooltipText={props.item.modelText}>
          {props.renderContent(props.item.item)}
        </TruncatedContent>
        <Button variant="ghost" size="md" aria-label="Écouter le modèle" onClick={handleSpeak}>
          <Volume2 size={20} color={SPEAK_ICON_COLOR} />
        </Button>
        <Button
          variant="ghost"
          size="md"
          aria-label="Écouter l'enregistrement"
          onClick={handlePlayRecording}
        >
          <Mic size={20} color={RECORD_ICON_COLOR} />
        </Button>
        <BadgeSlot>
          <BadgeOrCheck attempts={props.item.attempts} />
        </BadgeSlot>
        <audio ref={audioRef} hidden />
      </ItemRow>
    </Card.Root>
  )
}

function AttemptedItemRow<A>(props: {
  readonly item: SessionSummaryAttemptedItem<A>
  readonly speak: (text: string) => void
}) {
  function handleSpeak() {
    props.speak(props.item.modelText)
  }

  return (
    <Card.Root>
      <ItemRow>
        <ItemText dimmed>─ ─ ─</ItemText>
        <Button variant="ghost" size="md" aria-label="Écouter le modèle" onClick={handleSpeak}>
          <Volume2 size={20} color={SPEAK_ICON_COLOR} />
        </Button>
        <ButtonPlaceholder />
        <BadgeSlot>
          {props.item.attempts > 1 && <AttemptsBadge>×{props.item.attempts}</AttemptsBadge>}
        </BadgeSlot>
      </ItemRow>
    </Card.Root>
  )
}

function Header(props: { readonly succeeded: number; readonly total: number }) {
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

export function SessionSummary<A>(props: SessionSummaryProps<A>) {
  const speak = useAtomSet(speakAtom)

  return (
    <Container>
      <Header succeeded={props.succeeded.length} total={props.total} />
      {props.succeeded.map((item, i) => {
        return (
          <SucceededItemRow key={i} item={item} renderContent={props.renderContent} speak={speak} />
        )
      })}
      {props.attempted.map((item, i) => {
        return <AttemptedItemRow key={i} item={item} speak={speak} />
      })}
    </Container>
  )
}
