import { type FsrsCardState, FsrsState, mapAttemptsToRating, scheduleReview } from "@manabu/fsrs"
import { DateTime, Effect } from "effect"

export class FsrsScheduler extends Effect.Service<FsrsScheduler>()("FsrsScheduler", {
  succeed: {
    review: (
      state: FsrsState,
      cardState: FsrsCardState,
      attempts: number,
      now: DateTime.Utc,
    ): {
      readonly state: FsrsState
      readonly cardState: FsrsCardState
      readonly nextReviewAt: DateTime.Utc
    } => {
      const rating = mapAttemptsToRating(attempts)
      return scheduleReview(state, cardState, rating, now)
    },
  },
}) {}
