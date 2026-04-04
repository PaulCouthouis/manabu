import { DateTime, Equal } from "effect"
import { describe, expect, it } from "vitest"
import { FsrsState } from "./fsrs-state.js"
import { scheduleReview } from "./schedule-review.js"

const now = DateTime.unsafeMake("2026-04-03T12:00:00Z")
const newState = FsrsState.make({ stability: 0, difficulty: 0, retrievability: 0 })

function expectDate(actual: DateTime.Utc, expected: string): void {
  expect(Equal.equals(actual, DateTime.unsafeMake(expected))).toBe(true)
}

describe("scheduleReview — new card", () => {
  // AC9 — Good sur nouvelle carte
  it("Good on new card", () => {
    const result = scheduleReview(newState, "new", "good", now)

    expect(result.state.stability).toBe(3.173)
    expect(result.state.difficulty).toBeCloseTo(5.2824, 4)
    expect(result.cardState).toBe("learning")
    expectDate(result.nextReviewAt, "2026-04-06T12:00:00Z")
  })

  // AC10 — Hard sur nouvelle carte
  it("Hard on new card", () => {
    const result = scheduleReview(newState, "new", "hard", now)

    expect(result.state.stability).toBe(1.18385)
    expect(result.state.difficulty).toBeCloseTo(6.4883, 4)
    expect(result.cardState).toBe("learning")
    expectDate(result.nextReviewAt, "2026-04-04T12:00:00Z")
  })

  // AC11 — Again sur nouvelle carte
  it("Again on new card", () => {
    const result = scheduleReview(newState, "new", "again", now)

    expect(result.state.stability).toBe(0.40255)
    expect(result.state.difficulty).toBe(7.1949)
    expect(result.cardState).toBe("learning")
    expectDate(result.nextReviewAt, "2026-04-04T12:00:00Z")
  })

  // AC12 — Stability ordering: Good > Hard > Again
  it("stability ordering: Good > Hard > Again", () => {
    const good = scheduleReview(newState, "new", "good", now)
    const hard = scheduleReview(newState, "new", "hard", now)
    const again = scheduleReview(newState, "new", "again", now)

    expect(good.state.stability).toBeGreaterThan(hard.state.stability)
    expect(hard.state.stability).toBeGreaterThan(again.state.stability)
  })
})

describe("scheduleReview — successive reviews", () => {
  // AC13 — 5 Good successifs → intervalles croissants
  it("5 successive Good produce growing intervals", () => {
    const step1 = scheduleReview(newState, "new", "good", now)
    const step2 = scheduleReview(step1.state, step1.cardState, "good", step1.nextReviewAt)
    const step3 = scheduleReview(step2.state, step2.cardState, "good", step2.nextReviewAt)
    const step4 = scheduleReview(step3.state, step3.cardState, "good", step3.nextReviewAt)
    const step5 = scheduleReview(step4.state, step4.cardState, "good", step4.nextReviewAt)

    expect(step1.state.stability).toBeCloseTo(3.173, 3)
    expect(step2.state.stability).toBeCloseTo(11.1313, 3)
    expect(step3.state.stability).toBeCloseTo(35.1704, 3)
    expect(step4.state.stability).toBeCloseTo(101.3916, 3)
    expect(step5.state.stability).toBeCloseTo(269.6627, 3)

    expectDate(step1.nextReviewAt, "2026-04-06T12:00:00Z")
    expectDate(step2.nextReviewAt, "2026-04-17T12:00:00Z")
    expectDate(step3.nextReviewAt, "2026-05-22T12:00:00Z")
    expectDate(step4.nextReviewAt, "2026-08-31T12:00:00Z")
    expectDate(step5.nextReviewAt, "2027-05-27T12:00:00Z")
  })

  // AC14 + AC15 — Again après 5 Good
  it("Again after 5 Good contracts stability without total reset", () => {
    const step1 = scheduleReview(newState, "new", "good", now)
    const step2 = scheduleReview(step1.state, step1.cardState, "good", step1.nextReviewAt)
    const step3 = scheduleReview(step2.state, step2.cardState, "good", step2.nextReviewAt)
    const step4 = scheduleReview(step3.state, step3.cardState, "good", step3.nextReviewAt)
    const step5 = scheduleReview(step4.state, step4.cardState, "good", step4.nextReviewAt)

    const lapse = scheduleReview(step5.state, step5.cardState, "again", step5.nextReviewAt)

    expect(lapse.state.stability).toBeCloseTo(8.6118, 3)
    expect(lapse.state.difficulty).toBeCloseTo(8.1898, 3)
    expect(lapse.cardState).toBe("learning")
    expectDate(lapse.nextReviewAt, "2027-06-04T12:00:00Z")

    // AC14 — stability > 0, less than before
    expect(lapse.state.stability).toBeGreaterThan(0)
    expect(lapse.state.stability).toBeLessThan(step5.state.stability)

    // AC15 — stability after lapse > stability of Again on new card
    const againOnNew = scheduleReview(newState, "new", "again", now)
    expect(lapse.state.stability).toBeGreaterThan(againOnNew.state.stability)
  })
})

describe("scheduleReview — cardState transitions", () => {
  // AC16
  it("new → learning on first review", () => {
    const result = scheduleReview(newState, "new", "good", now)
    expect(result.cardState).toBe("learning")
  })

  it("learning → review after Good", () => {
    const first = scheduleReview(newState, "new", "good", now)
    const second = scheduleReview(first.state, "learning", "good", first.nextReviewAt)
    expect(second.cardState).toBe("review")
  })

  it("review → learning on Again", () => {
    const first = scheduleReview(newState, "new", "good", now)
    const second = scheduleReview(first.state, "learning", "good", first.nextReviewAt)
    const lapse = scheduleReview(second.state, "review", "again", second.nextReviewAt)
    expect(lapse.cardState).toBe("learning")
  })
})
