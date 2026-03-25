import { Atom, useAtomSet } from "@effect-atom/atom-react"
import { Effect, Layer } from "effect"
import { styled } from "styled-system/jsx"
import type { DrillItem } from "~/logic/session/drill-queue.js"
import type {
  SessionSummaryAttemptedItem,
  SessionSummarySucceededItem,
} from "~/logic/session/session-summary.js"
import { BrowserSpeechSynthesisApiLive, TextToSpeech } from "~/logic/audio/text-to-speech.js"
import { BrowserBlobUrlApiLive } from "~/logic/audio/blob-url.js"
import { Header } from "~/components/session-summary/header.js"
import { SucceededItemRow } from "~/components/session-summary/succeeded-item-row.js"
import { AttemptedItemRow } from "~/components/session-summary/attempted-item-row.js"

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
