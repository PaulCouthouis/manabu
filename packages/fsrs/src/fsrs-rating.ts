import { Schema } from "effect"

export const FsrsRatingSchema = Schema.Literal("again", "hard", "good")
export type FsrsRating = typeof FsrsRatingSchema.Type

export const FsrsCardStateSchema = Schema.Literal("new", "learning", "review")
export type FsrsCardState = typeof FsrsCardStateSchema.Type
