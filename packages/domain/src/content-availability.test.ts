import { assert, layer } from "@effect/vitest"
import { Array, DateTime, Effect, Layer, Struct, TestClock } from "effect"
import { ContentAvailability, ContentItemPort, ReviewCardPort } from "./content-availability.js"
import { ContentItem, ContentItemId } from "./content-item.js"
import { LinguisticElementId } from "./linguistic-element.js"
import { ReviewCard, ReviewCardId } from "./review-card.js"
import { SkillTypeId } from "./skill-type.js"

// --- Fixtures ---

const skill1 = SkillTypeId(1)
const skill2 = SkillTypeId(2)

const now = DateTime.unsafeMake("2026-04-05T12:00:00Z")
const future = DateTime.add(now, { days: 3 })
const past = DateTime.subtract(now, { days: 1 })

// Skill 1 items (entry point, no prereqs)
const kanaA_s1 = ContentItem.make({
  id: ContentItemId(1),
  linguisticElementId: LinguisticElementId(1),
  skillTypeId: skill1,
})
const kanaI_s1 = ContentItem.make({
  id: ContentItemId(2),
  linguisticElementId: LinguisticElementId(2),
  skillTypeId: skill1,
})
const kanaU_s1 = ContentItem.make({
  id: ContentItemId(3),
  linguisticElementId: LinguisticElementId(3),
  skillTypeId: skill1,
})

// Skill 2 items (prereq: Skill 1)
const kanaA_s2 = ContentItem.make({
  id: ContentItemId(101),
  linguisticElementId: LinguisticElementId(1),
  skillTypeId: skill2,
})
const kanaI_s2 = ContentItem.make({
  id: ContentItemId(102),
  linguisticElementId: LinguisticElementId(2),
  skillTypeId: skill2,
})

const makeReviewCard = (contentItemId: ContentItemId, nextReviewAt: DateTime.Utc) => {
  return ReviewCard.make({
    id: ReviewCardId(crypto.randomUUID()),
    userId: "user1",
    contentItemId,
    createdAt: DateTime.unsafeMake("2025-01-01T00:00:00Z"),
    nextReviewAt,
  })
}

// --- Helpers ---

const makeContentItemPort = (allItems: ReadonlyArray<ContentItem>) => {
  return Layer.succeed(ContentItemPort, {
    findBySkillType: (skillId) => {
      return Effect.succeed(
        Array.filter(allItems, (ci) => {
          return ci.skillTypeId === skillId
        }),
      )
    },
    findByElementAndSkills: (elementIds, skillIds) => {
      return Effect.succeed(
        Array.filter(allItems, (ci) => {
          return (
            Array.contains(elementIds, ci.linguisticElementId) &&
            Array.contains(skillIds, ci.skillTypeId)
          )
        }),
      )
    },
  })
}

const makeReviewCardPort = (cards: ReadonlyArray<ReviewCard>) => {
  return Layer.succeed(ReviewCardPort, {
    findByUserAndContentItems: (_userId, contentItemIds) => {
      return Effect.succeed(
        Array.filter(cards, (rc) => {
          return Array.contains(contentItemIds, rc.contentItemId)
        }),
      )
    },
  })
}

const makeTestLayer = (
  contentItems: ReadonlyArray<ContentItem>,
  reviewCards: ReadonlyArray<ReviewCard>,
) => {
  return ContentAvailability.Default.pipe(
    Layer.provide(makeContentItemPort(contentItems)),
    Layer.provide(makeReviewCardPort(reviewCards)),
  )
}

// --- Layers ---

const allSkill1Items = [kanaA_s1, kanaI_s1, kanaU_s1]
const allItems_s1_s2 = [...allSkill1Items, kanaA_s2, kanaI_s2]

const EntryPointsLayer = makeTestLayer(allSkill1Items, [])
const OneNonExpiredLayer = makeTestLayer(allSkill1Items, [makeReviewCard(ContentItemId(1), future)])
const OneOverdueLayer = makeTestLayer(allSkill1Items, [makeReviewCard(ContentItemId(1), past)])
const AllPrereqsSatisfiedLayer = makeTestLayer(allItems_s1_s2, [
  makeReviewCard(ContentItemId(1), future),
  makeReviewCard(ContentItemId(2), future),
])
const OnePrereqMissingLayer = makeTestLayer(allItems_s1_s2, [
  makeReviewCard(ContentItemId(1), future),
])
const NoPrereqContentItemLayer = makeTestLayer([kanaA_s2], [])

// --- Tests ---

layer(EntryPointsLayer)("ContentAvailability — Étape 1 : Entry points", (it) => {
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

layer(AllPrereqsSatisfiedLayer)(
  "ContentAvailability — Étape 3 : Prérequis satisfait (AC4)",
  (it) => {
    it.effect("ContentItem(E, P) existe + ReviewCard valide → retourné", () =>
      Effect.gen(function* () {
        yield* TestClock.setTime(DateTime.toEpochMillis(now))
        const contentAvailability = yield* ContentAvailability
        const items = yield* contentAvailability.getAvailableItems("user1", skill2)

        assert.strictEqual(items.length, 2)
        assert.deepStrictEqual(Array.map(items, Struct.get("id")), [
          ContentItemId(101),
          ContentItemId(102),
        ])
      }),
    )
  },
)

layer(OnePrereqMissingLayer)(
  "ContentAvailability — Étape 3 : Prérequis non satisfait (AC5)",
  (it) => {
    it.effect("ContentItem(E, P) existe + ReviewCard absente → rejeté", () =>
      Effect.gen(function* () {
        yield* TestClock.setTime(DateTime.toEpochMillis(now))
        const contentAvailability = yield* ContentAvailability
        const items = yield* contentAvailability.getAvailableItems("user1", skill2)

        assert.strictEqual(items.length, 1)
        assert.deepStrictEqual(Array.map(items, Struct.get("id")), [ContentItemId(101)])
      }),
    )
  },
)

layer(NoPrereqContentItemLayer)(
  "ContentAvailability — Étape 3 : Pas de ContentItem dans le prérequis (AC6)",
  (it) => {
    it.effect("ContentItem(E, P) n'existe pas → pas de dépendance, retourné", () =>
      Effect.gen(function* () {
        yield* TestClock.setTime(DateTime.toEpochMillis(now))
        const contentAvailability = yield* ContentAvailability
        const items = yield* contentAvailability.getAvailableItems("user1", skill2)

        assert.strictEqual(items.length, 1)
        assert.deepStrictEqual(Array.map(items, Struct.get("id")), [ContentItemId(101)])
      }),
    )
  },
)
