import type { DrillSummaryEntry } from "./drill-queue.js"

export interface SessionSummarySucceededItem<A> extends DrillSummaryEntry<A> {
  readonly kind: "succeeded"
  readonly modelText: string
  readonly recordingBlob: Blob
  readonly isNew: boolean
}

export interface SessionSummaryAttemptedItem<A> extends DrillSummaryEntry<A> {
  readonly kind: "attempted"
  readonly modelText: string
  readonly isNew: boolean
}

export type SessionSummaryItem<A> = SessionSummarySucceededItem<A> | SessionSummaryAttemptedItem<A>
