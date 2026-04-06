import { SqlClient } from "@effect/sql"
import { ReviewCard } from "@manabu/domain"
import type { ContentItemId } from "@manabu/domain"
import { Array, DateTime, Effect, Schema } from "effect"

type ReviewCardRow = {
  id: string
  user_id: string
  content_item_id: number
  created_at: Date
  next_review_at: Date
}

const decodeReviewCards = Schema.decode(Schema.Array(ReviewCard))

const decodeRows = (rows: ReadonlyArray<ReviewCardRow>) => {
  const mapped = Array.map(rows, (row) => ({
    id: row.id,
    userId: row.user_id,
    contentItemId: row.content_item_id,
    createdAt: DateTime.unsafeMake(row.created_at),
    nextReviewAt: DateTime.unsafeMake(row.next_review_at),
  }))
  return decodeReviewCards(mapped)
}

export class ReviewCardRepo extends Effect.Service<ReviewCardRepo>()("ReviewCardRepo", {
  effect: Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    const findByUserAndContentItems = (
      userId: string,
      contentItemIds: ReadonlyArray<ContentItemId>,
    ) => {
      return Effect.gen(function* () {
        if (contentItemIds.length === 0) {
          return []
        }
        const ids = Array.map(contentItemIds, Number)
        const rows = yield* sql<ReviewCardRow>`
          SELECT * FROM review_card
          WHERE user_id = ${userId}
            AND content_item_id IN ${sql.in(ids)}
        `
        return yield* decodeRows(rows)
      })
    }

    return { findByUserAndContentItems }
  }),
}) {}
