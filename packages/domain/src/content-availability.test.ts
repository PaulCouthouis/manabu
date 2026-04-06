import { assert, layer } from "@effect/vitest"
import { Array, DateTime, Effect, Layer, Struct, TestClock } from "effect"
import {
  ContentAvailability,
  ContentItemPort,
  ReviewCardPort,
  type ElementComponent,
  type ElementGrammarPoint,
  type GrammarPointContentItem,
} from "./content-availability.js"
import { ContentItem, ContentItemId } from "./content-item.js"
import { GrammarPointId } from "./grammar-point.js"
import { LinguisticElementId } from "./linguistic-element.js"
import { ReviewCard, ReviewCardId } from "./review-card.js"
import { SkillTypeId } from "./skill-type.js"

// --- Fixtures ---

const skill1 = SkillTypeId(1)
const skill2 = SkillTypeId(2)
const skill4 = SkillTypeId(4)
const skill7 = SkillTypeId(7)
const skill11 = SkillTypeId(11)

const now = DateTime.unsafeMake("2026-04-05T12:00:00Z")
const future = DateTime.add(now, { days: 3 })
const past = DateTime.subtract(now, { days: 1 })

// Kana elements (id 1 = あ, id 2 = い)
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

// Word element (id 5000) in Skill 7
const word_s7 = ContentItem.make({
  id: ContentItemId(201),
  linguisticElementId: LinguisticElementId(5000),
  skillTypeId: skill7,
})
const word_s4 = ContentItem.make({
  id: ContentItemId(202),
  linguisticElementId: LinguisticElementId(5000),
  skillTypeId: skill4,
})

const wordComponents: ReadonlyArray<ElementComponent> = [
  { elementId: LinguisticElementId(5000), componentId: LinguisticElementId(1) },
  { elementId: LinguisticElementId(5000), componentId: LinguisticElementId(2) },
]

// Sentence 70021 (雨が降っている) — 1 GP [が/302] → bootstrap
const sentence1gp_s11 = ContentItem.make({
  id: ContentItemId(301),
  linguisticElementId: LinguisticElementId(70021),
  skillTypeId: skill11,
})

// Sentence 70006 (今日は休日だ) — 2 GP [だ/300, は/301]
const sentence2gp_s11 = ContentItem.make({
  id: ContentItemId(302),
  linguisticElementId: LinguisticElementId(70006),
  skillTypeId: skill11,
})

// Bootstrap sentences already studied (contain individual GPs)
const bootstrapDa_s11 = ContentItem.make({
  id: ContentItemId(303),
  linguisticElementId: LinguisticElementId(70010),
  skillTypeId: skill11,
})
const bootstrapHa_s11 = ContentItem.make({
  id: ContentItemId(304),
  linguisticElementId: LinguisticElementId(70020),
  skillTypeId: skill11,
})

const grammarPointPairs: ReadonlyArray<ElementGrammarPoint> = [
  { elementId: LinguisticElementId(70021), grammarPointId: GrammarPointId(302) },
  { elementId: LinguisticElementId(70006), grammarPointId: GrammarPointId(300) },
  { elementId: LinguisticElementId(70006), grammarPointId: GrammarPointId(301) },
]

const gpContentItems: ReadonlyArray<GrammarPointContentItem> = [
  { grammarPointId: GrammarPointId(300), contentItemId: ContentItemId(303) },
  { grammarPointId: GrammarPointId(301), contentItemId: ContentItemId(304) },
]

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

const makeContentItemPort = (
  allItems: ReadonlyArray<ContentItem>,
  components: ReadonlyArray<ElementComponent> = [],
  grammarPoints: ReadonlyArray<ElementGrammarPoint> = [],
  gpCIs: ReadonlyArray<GrammarPointContentItem> = [],
) => {
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
    findComponentIds: (elementIds) => {
      return Effect.succeed(
        Array.filter(components, (p) => {
          return Array.contains(elementIds, p.elementId)
        }),
      )
    },
    findGrammarPointIds: (elementIds) => {
      return Effect.succeed(
        Array.filter(grammarPoints, (p) => {
          return Array.contains(elementIds, p.elementId)
        }),
      )
    },
    findContentItemsByGrammarPoints: (grammarPointIds) => {
      return Effect.succeed(
        Array.filter(gpCIs, (gci) => {
          return Array.contains(grammarPointIds, gci.grammarPointId)
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

const makeTestLayer = (opts: {
  readonly contentItems: ReadonlyArray<ContentItem>
  readonly reviewCards: ReadonlyArray<ReviewCard>
  readonly components?: ReadonlyArray<ElementComponent>
  readonly grammarPoints?: ReadonlyArray<ElementGrammarPoint>
  readonly gpContentItems?: ReadonlyArray<GrammarPointContentItem>
}) => {
  return ContentAvailability.Default.pipe(
    Layer.provide(
      makeContentItemPort(
        opts.contentItems,
        opts.components ?? [],
        opts.grammarPoints ?? [],
        opts.gpContentItems ?? [],
      ),
    ),
    Layer.provide(makeReviewCardPort(opts.reviewCards)),
  )
}

// --- Layers ---

const allSkill1Items = [kanaA_s1, kanaI_s1, kanaU_s1]
const allItems_s1_s2 = [...allSkill1Items, kanaA_s2, kanaI_s2]
const allItems_components = [...allItems_s1_s2, word_s4, word_s7]
const allItems_gp = [sentence1gp_s11, sentence2gp_s11, bootstrapDa_s11, bootstrapHa_s11]

const EntryPointsLayer = makeTestLayer({ contentItems: allSkill1Items, reviewCards: [] })

const OneNonExpiredLayer = makeTestLayer({
  contentItems: allSkill1Items,
  reviewCards: [makeReviewCard(ContentItemId(1), future)],
})

const OneOverdueLayer = makeTestLayer({
  contentItems: allSkill1Items,
  reviewCards: [makeReviewCard(ContentItemId(1), past)],
})

const AllPrereqsSatisfiedLayer = makeTestLayer({
  contentItems: allItems_s1_s2,
  reviewCards: [makeReviewCard(ContentItemId(1), future), makeReviewCard(ContentItemId(2), future)],
})

const OnePrereqMissingLayer = makeTestLayer({
  contentItems: allItems_s1_s2,
  reviewCards: [makeReviewCard(ContentItemId(1), future)],
})

const NoPrereqContentItemLayer = makeTestLayer({ contentItems: [kanaA_s2], reviewCards: [] })

const AllComponentPrereqsSatisfiedLayer = makeTestLayer({
  contentItems: allItems_components,
  reviewCards: [
    makeReviewCard(ContentItemId(202), future),
    makeReviewCard(ContentItemId(101), future),
    makeReviewCard(ContentItemId(102), future),
  ],
  components: wordComponents,
})

const OneComponentMissingLayer = makeTestLayer({
  contentItems: allItems_components,
  reviewCards: [
    makeReviewCard(ContentItemId(202), future),
    makeReviewCard(ContentItemId(101), future),
  ],
  components: wordComponents,
})

const ComponentNoContentItemLayer = makeTestLayer({
  contentItems: [word_s4, word_s7],
  reviewCards: [makeReviewCard(ContentItemId(202), future)],
  components: wordComponents,
})

// GP layers — Skill 11 prereq is Skill 8, but no ContentItems in Skill 8 → prereqs trivially pass
const Gp1BootstrapLayer = makeTestLayer({
  contentItems: allItems_gp,
  reviewCards: [],
  grammarPoints: grammarPointPairs,
  gpContentItems: gpContentItems,
})

const Gp2AllStudiedLayer = makeTestLayer({
  contentItems: allItems_gp,
  reviewCards: [
    makeReviewCard(ContentItemId(303), future), // だ studied
    makeReviewCard(ContentItemId(304), future), // は studied
  ],
  grammarPoints: grammarPointPairs,
  gpContentItems: gpContentItems,
})

const Gp2OneMissingLayer = makeTestLayer({
  contentItems: allItems_gp,
  reviewCards: [
    makeReviewCard(ContentItemId(303), future), // だ studied, は NOT studied
  ],
  grammarPoints: grammarPointPairs,
  gpContentItems: gpContentItems,
})

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

layer(AllComponentPrereqsSatisfiedLayer)(
  "ContentAvailability — Étape 4 : Composants tous satisfaits (AC7)",
  (it) => {
    it.effect("tous les composants ont ReviewCard valide → retourné", () =>
      Effect.gen(function* () {
        yield* TestClock.setTime(DateTime.toEpochMillis(now))
        const contentAvailability = yield* ContentAvailability
        const items = yield* contentAvailability.getAvailableItems("user1", skill7)

        assert.strictEqual(items.length, 1)
        assert.deepStrictEqual(Array.map(items, Struct.get("id")), [ContentItemId(201)])
      }),
    )
  },
)

layer(OneComponentMissingLayer)(
  "ContentAvailability — Étape 4 : Composant manquant (AC8)",
  (it) => {
    it.effect("un composant sans ReviewCard valide → rejeté", () =>
      Effect.gen(function* () {
        yield* TestClock.setTime(DateTime.toEpochMillis(now))
        const contentAvailability = yield* ContentAvailability
        const items = yield* contentAvailability.getAvailableItems("user1", skill7)

        assert.strictEqual(items.length, 0)
      }),
    )
  },
)

layer(ComponentNoContentItemLayer)(
  "ContentAvailability — Étape 4 : Composant sans ContentItem dans prérequis (AC9)",
  (it) => {
    it.effect("composant sans ContentItem dans le skill prérequis → ignoré", () =>
      Effect.gen(function* () {
        yield* TestClock.setTime(DateTime.toEpochMillis(now))
        const contentAvailability = yield* ContentAvailability
        const items = yield* contentAvailability.getAvailableItems("user1", skill7)

        assert.strictEqual(items.length, 1)
        assert.deepStrictEqual(Array.map(items, Struct.get("id")), [ContentItemId(201)])
      }),
    )
  },
)

layer(Gp1BootstrapLayer)("ContentAvailability — Étape 5 : 1 GP bootstrap (AC10)", (it) => {
  it.effect("sentence skill grammaire, 1 GP → pas de vérification GP", () =>
    Effect.gen(function* () {
      yield* TestClock.setTime(DateTime.toEpochMillis(now))
      const contentAvailability = yield* ContentAvailability
      const items = yield* contentAvailability.getAvailableItems("user1", skill11)

      const ids = Array.map(items, Struct.get("id"))
      assert.ok(Array.contains(ids, ContentItemId(301)))
    }),
  )
})

layer(Gp2AllStudiedLayer)("ContentAvailability — Étape 5 : 2+ GP tous étudiés (AC11)", (it) => {
  it.effect("sentence skill grammaire, 2+ GP, tous étudiés → retourné", () =>
    Effect.gen(function* () {
      yield* TestClock.setTime(DateTime.toEpochMillis(now))
      const contentAvailability = yield* ContentAvailability
      const items = yield* contentAvailability.getAvailableItems("user1", skill11)

      const ids = Array.map(items, Struct.get("id"))
      assert.ok(Array.contains(ids, ContentItemId(302)))
    }),
  )
})

layer(Gp2OneMissingLayer)("ContentAvailability — Étape 5 : 2+ GP un manquant (AC12)", (it) => {
  it.effect("sentence skill grammaire, 2+ GP, un non étudié → rejeté", () =>
    Effect.gen(function* () {
      yield* TestClock.setTime(DateTime.toEpochMillis(now))
      const contentAvailability = yield* ContentAvailability
      const items = yield* contentAvailability.getAvailableItems("user1", skill11)

      const ids = Array.map(items, Struct.get("id"))
      assert.ok(!Array.contains(ids, ContentItemId(302)))
    }),
  )
})

layer(AllComponentPrereqsSatisfiedLayer)(
  "ContentAvailability — Étape 5 : Skill non-grammaire (AC13)",
  (it) => {
    it.effect("mot dans un skill core → pas de check GP", () =>
      Effect.gen(function* () {
        yield* TestClock.setTime(DateTime.toEpochMillis(now))
        const contentAvailability = yield* ContentAvailability
        const items = yield* contentAvailability.getAvailableItems("user1", skill7)

        assert.strictEqual(items.length, 1)
      }),
    )
  },
)
