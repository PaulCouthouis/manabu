import { DateTime } from "effect"
import type { FsrsCardState, FsrsRating } from "./fsrs-rating.js"
import { defaultFsrsParams, type FsrsParams } from "./fsrs-params.js"
import { FsrsState } from "./fsrs-state.js"

// FSRS v5 constants
// Source: https://github.com/open-spaced-repetition/fsrs4anki/blob/v5.0.0/fsrs4anki_scheduler.js
const DECAY = -0.5
const FACTOR = Math.pow(0.9, 1 / DECAY) - 1

type Weights = FsrsParams["weights"]

const ratingIndex: Record<FsrsRating, number> = {
  again: 1,
  hard: 2,
  good: 3,
}

function clampDifficulty(d: number): number {
  return Math.min(Math.max(d, 0), 10)
}

function initialStability(rating: FsrsRating, w: Weights): number {
  return Math.max(w[ratingIndex[rating] - 1] ?? 0.1, 0.1)
}

function initialDifficulty(rating: FsrsRating, w: Weights): number {
  const g = ratingIndex[rating]
  return clampDifficulty(w[4] - Math.exp(w[5] * (g - 1)) + 1)
}

function forgettingCurve(elapsedDays: number, stability: number): number {
  if (stability === 0) {
    return 0
  }
  return Math.pow(1 + (FACTOR * elapsedDays) / stability, DECAY)
}

function nextInterval(stability: number, requestRetention: number): number {
  return Math.max((stability / FACTOR) * (Math.pow(requestRetention, 1 / DECAY) - 1), 1)
}

function recallStability(d: number, s: number, r: number, rating: FsrsRating, w: Weights): number {
  const hardPenalty = rating === "hard" ? w[15] : 1
  return (
    s *
    (1 +
      Math.exp(w[8]) *
        (11 - d) *
        Math.pow(s, -w[9]) *
        (Math.exp((1 - r) * w[10]) - 1) *
        hardPenalty)
  )
}

function lapseStability(d: number, s: number, r: number, w: Weights): number {
  return Math.max(
    Math.min(
      w[11] * Math.pow(d, -w[12]) * (Math.pow(s + 1, w[13]) - 1) * Math.exp((1 - r) * w[14]),
      s,
    ),
    0.1,
  )
}

function nextDifficulty(d: number, rating: FsrsRating, w: Weights): number {
  const g = ratingIndex[rating]
  const nextD = d - w[6] * (g - 3)
  const meanReverted = w[7] * initialDifficulty("good", w) + (1 - w[7]) * nextD
  return clampDifficulty(meanReverted)
}

function nextCardState(current: FsrsCardState, rating: FsrsRating): FsrsCardState {
  if (rating === "again") {
    return "learning"
  }
  if (current === "review") {
    return "review"
  }
  return current === "new" ? "learning" : "review"
}

export function scheduleReview(
  state: FsrsState,
  cardState: FsrsCardState,
  rating: FsrsRating,
  now: DateTime.Utc,
  params: FsrsParams = defaultFsrsParams,
): {
  readonly state: FsrsState
  readonly cardState: FsrsCardState
  readonly nextReviewAt: DateTime.Utc
} {
  const w = params.weights

  if (cardState === "new") {
    const s = initialStability(rating, w)
    const d = initialDifficulty(rating, w)
    const interval = nextInterval(s, params.requestRetention)
    const nextReviewAt = DateTime.add(now, { days: interval })

    return {
      state: FsrsState.make({ stability: s, difficulty: d, retrievability: 0 }),
      cardState: nextCardState(cardState, rating),
      nextReviewAt,
    }
  }

  // Assumes on-time review: elapsedDays ≈ scheduled interval → r ≈ requestRetention.
  // Actual elapsed time tracking will be added with ReviewCard.lastReviewAt (US27).
  const elapsedDays =
    state.stability > 0 ? nextInterval(state.stability, params.requestRetention) : 1
  const r = forgettingCurve(elapsedDays, state.stability)

  const newStability =
    rating === "again"
      ? lapseStability(state.difficulty, state.stability, r, w)
      : recallStability(state.difficulty, state.stability, r, rating, w)

  const d = nextDifficulty(state.difficulty, rating, w)
  const interval = nextInterval(newStability, params.requestRetention)
  const nextReviewAt = DateTime.add(now, { days: interval })

  return {
    state: FsrsState.make({ stability: newStability, difficulty: d, retrievability: r }),
    cardState: nextCardState(cardState, rating),
    nextReviewAt,
  }
}
