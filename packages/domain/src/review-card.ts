import { Brand, Schema } from "effect"
import { ContentItemIdSchema } from "./content-item.js"

// --- Id ---

export type ReviewCardId = string & Brand.Brand<"ReviewCardId">
export const ReviewCardId = Brand.nominal<ReviewCardId>()
export const ReviewCardIdSchema = Schema.UUID.pipe(Schema.fromBrand(ReviewCardId))

// --- Review Card ---

export class ReviewCard extends Schema.Class<ReviewCard>("ReviewCard")({
  id: ReviewCardIdSchema,
  userId: Schema.String,
  contentItemId: ContentItemIdSchema,
  createdAt: Schema.DateFromSelf,
  nextReviewAt: Schema.DateFromSelf,
}) {}
