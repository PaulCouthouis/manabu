import { describe, expectTypeOf, it } from "vitest"
import type { SessionSummaryAttemptedItem, SessionSummarySucceededItem } from "./session-summary.js"

describe("SessionSummary types", () => {
  // AC1 — Les types sont définis avec le discriminant `kind`
  it("succeeded item a kind: 'succeeded'", () => {
    expectTypeOf<SessionSummarySucceededItem<string>>().toHaveProperty("kind")
    expectTypeOf<SessionSummarySucceededItem<string>["kind"]>().toEqualTypeOf<"succeeded">()
  })

  it("attempted item a kind: 'attempted'", () => {
    expectTypeOf<SessionSummaryAttemptedItem<string>>().toHaveProperty("kind")
    expectTypeOf<SessionSummaryAttemptedItem<string>["kind"]>().toEqualTypeOf<"attempted">()
  })

  // AC2 — recordingBlob présent uniquement sur succeeded, absent sur attempted
  it("succeeded item a recordingBlob", () => {
    expectTypeOf<SessionSummarySucceededItem<string>>().toHaveProperty("recordingBlob")
    expectTypeOf<SessionSummarySucceededItem<string>["recordingBlob"]>().toEqualTypeOf<Blob>()
  })

  it("attempted item n'a pas recordingBlob", () => {
    expectTypeOf<SessionSummaryAttemptedItem<string>>().not.toHaveProperty("recordingBlob")
  })
})
