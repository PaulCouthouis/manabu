import { assert, layer } from "@effect/vitest"
import { Array, DateTime, Effect, Layer, Struct, TestClock } from "effect"
import { ContentAvailability, ContentItemPort, ReviewCardPort } from "./content-availability.js"
import { ContentItem, ContentItemId } from "./content-item.js"
import { LinguisticElementId } from "./linguistic-element.js"
import { ReviewCard, ReviewCardId } from "./review-card.js"
import { SkillTypeId } from "./skill-type.js"

// --- Fixtures ---

const skill1 = SkillTypeId(1)

const kanaA = ContentItem.make({
  id: ContentItemId(1),
  linguisticElementId: LinguisticElementId(1),
  skillTypeId: skill1,
})

const kanaI = ContentItem.make({
  id: ContentItemId(2),
  linguisticElementId: LinguisticElementId(2),
  skillTypeId: skill1,
})

const kanaU = ContentItem.make({
  id: ContentItemId(3),
  linguisticElementId: LinguisticElementId(3),
  skillTypeId: skill1,
})

const now = DateTime.unsafeMake("2026-04-05T12:00:00Z")
const future = DateTime.add(now, { days: 3 })
const past = DateTime.subtract(now, { days: 1 })

const makeReviewCard = (contentItemId: ContentItemId, nextReviewAt: DateTime.Utc) => {
  return ReviewCard.make({
    id: ReviewCardId(crypto.randomUUID()),
    userId: "user1",
    contentItemId,
    createdAt: DateTime.unsafeMake("2025-01-01T00:00:00Z"),
    nextReviewAt,
  })
}

// --- Fakes ---

const FakeContentItemPort = Layer.succeed(ContentItemPort, {
  findBySkillType: (skillId) => {
    if (skillId === skill1) {
      return Effect.succeed([kanaA, kanaI, kanaU])
    }
    return Effect.succeed([])
  },
})

// --- Helpers ---

const makeReviewCardPort = (cards: Array<ReviewCard>) => {
  return Layer.succeed(ReviewCardPort, {
    findByUserAndContentItems: () => {
      return Effect.succeed(cards)
    },
  })
}

const makeTestLayer = (reviewCards: Array<ReviewCard>) => {
  return ContentAvailability.Default.pipe(
    Layer.provide(FakeContentItemPort),
    Layer.provide(makeReviewCardPort(reviewCards)),
  )
}

// --- Tests ---

const NoReviewCardsLayer = makeTestLayer([])
const OneNonExpiredLayer = makeTestLayer([makeReviewCard(ContentItemId(1), future)])
const OneOverdueLayer = makeTestLayer([makeReviewCard(ContentItemId(1), past)])

layer(NoReviewCardsLayer)("ContentAvailability — Étape 1 : Entry points", (it) => {
  it.effect("Skill 1 (0 prérequis), 3 items nouveaux → les 3 retournés", () =>
    Effect.gen(function* () {
      const contentAvailability = yield* ContentAvailability
      const items = yield* contentAvailability.getAvailableItems("user1", skill1)

      assert.strictEqual(items.length, 3)
      assert.deepStrictEqual(Array.map(items, Struct.get("id")), [
        ContentItemId(1),
        ContentItemId(2),
        ContentItemId(3),
      ])
    }),
  )
})

layer(OneNonExpiredLayer)("ContentAvailability — Étape 2 : Exclure les items non expirés", (it) => {
  it.effect("item avec ReviewCard nextReviewAt > now → exclu (AC2)", () =>
    Effect.gen(function* () {
      yield* TestClock.setTime(DateTime.toEpochMillis(now))
      const contentAvailability = yield* ContentAvailability
      const items = yield* contentAvailability.getAvailableItems("user1", skill1)

      assert.strictEqual(items.length, 2)
      assert.deepStrictEqual(Array.map(items, Struct.get("id")), [
        ContentItemId(2),
        ContentItemId(3),
      ])
    }),
  )
})

layer(OneOverdueLayer)("ContentAvailability — Étape 2 : Garder les overdue", (it) => {
  it.effect("item avec ReviewCard nextReviewAt < now → retourné (AC3)", () =>
    Effect.gen(function* () {
      yield* TestClock.setTime(DateTime.toEpochMillis(now))
      const contentAvailability = yield* ContentAvailability
      const items = yield* contentAvailability.getAvailableItems("user1", skill1)

      assert.strictEqual(items.length, 3)
    }),
  )
})
