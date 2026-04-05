import { DateTime, Schema } from "effect"
import { describe, expect, it } from "vitest"
import { ContentItemId } from "./content-item.js"
import { ReviewCard, ReviewCardId } from "./review-card.js"

describe("ReviewCard", () => {
  const now = DateTime.unsafeMake("2026-04-05T12:00:00Z")
  const testUuid = ReviewCardId("550e8400-e29b-41d4-a716-446655440000")

  // AC7 — ReviewCard.make() crée une instance valide
  it("creates a valid instance with make()", () => {
    const card = ReviewCard.make({
      id: testUuid,
      userId: "user-abc-123",
      contentItemId: ContentItemId(42),
      createdAt: now,
      nextReviewAt: now,
    })

    expect(card.id).toBe(testUuid)
    expect(card.userId).toBe("user-abc-123")
    expect(card.contentItemId).toBe(ContentItemId(42))
    expect(card.createdAt).toBe(now)
    expect(card.nextReviewAt).toBe(now)
  })

  // AC8 — id est un UUID validé
  it("rejects invalid UUID format", () => {
    const decode = Schema.decodeUnknownSync(ReviewCard)

    expect(() =>
      decode({
        id: "not-a-uuid",
        userId: "user-abc-123",
        contentItemId: 42,
        createdAt: now,
        nextReviewAt: now,
      }),
    ).toThrow()
  })
})
