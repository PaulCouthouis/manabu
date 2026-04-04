import { assert, layer } from "@effect/vitest"
import { FsrsState } from "@manabu/fsrs"
import { DateTime, Effect } from "effect"
import { FsrsScheduler } from "./fsrs-scheduler.js"

const now = DateTime.unsafeMake("2026-04-03T12:00:00Z")
const newState = FsrsState.make({ stability: 0, difficulty: 0, retrievability: 0 })

layer(FsrsScheduler.Default)("FsrsScheduler", (it) => {
  it.effect("review with 1 attempt (good) gives 3-day interval", () =>
    Effect.gen(function* () {
      const scheduler = yield* FsrsScheduler
      const result = scheduler.review(newState, "new", 1, now)

      assert.strictEqual(result.state.stability, 3.173)
      assert.strictEqual(result.cardState, "learning")
    }),
  )

  it.effect("review with 2 attempts (hard) gives shorter interval", () =>
    Effect.gen(function* () {
      const scheduler = yield* FsrsScheduler
      const result = scheduler.review(newState, "new", 2, now)

      assert.strictEqual(result.state.stability, 1.18385)
      assert.strictEqual(result.cardState, "learning")
    }),
  )

  it.effect("review with 3+ attempts (again) gives minimum interval", () =>
    Effect.gen(function* () {
      const scheduler = yield* FsrsScheduler
      const result = scheduler.review(newState, "new", 5, now)

      assert.strictEqual(result.state.stability, 0.40255)
      assert.strictEqual(result.cardState, "learning")
    }),
  )
})
