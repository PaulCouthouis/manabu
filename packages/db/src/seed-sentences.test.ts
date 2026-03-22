import { assert, layer } from "@effect/vitest"
import { LinguisticElementId, SENTENCE_SKILL_IDS, SentenceId, SkillTypeId } from "@manabu/domain"
import { Array, Effect, Layer, Option } from "effect"
import { ContentItemRepo } from "./content-item-repo.js"
import { LinguisticElementRepo } from "./linguistic-element-repo.js"
import { runMigrations } from "./migrations/index.js"
import { SkillTypeRepo } from "./skill-type-repo.js"
import { TestSqlLayer } from "./test-utils.js"

const TestLayer = Layer.mergeAll(
  LinguisticElementRepo.Default,
  ContentItemRepo.Default,
  SkillTypeRepo.Default,
).pipe(Layer.provideMerge(TestSqlLayer))

layer(TestLayer, { timeout: 180_000 })("Seed sentences — PostgreSQL", (it) => {
  // AC20 — chaque SentenceElement a exactement 7 ContentItems
  it.effect("each sentence element has exactly 7 ContentItems (skills 4-10)", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const contentRepo = yield* ContentItemRepo

      for (const skillId of SENTENCE_SKILL_IDS) {
        const items = yield* contentRepo.findBySkillType(SkillTypeId(skillId))
        const sentenceItems = Array.filter(items, (ci) => {
          const eid = Number(ci.linguisticElementId)
          return eid >= 70001 && eid <= 72590
        })
        assert.strictEqual(
          sentenceItems.length,
          2590,
          `Skill ${skillId} should have 2590 sentence ContentItems, got ${sentenceItems.length}`,
        )
      }
    }),
  )

  // AC21 — 12950 ContentItems sentences au total
  it.effect("total of 12950 sentence ContentItems", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const contentRepo = yield* ContentItemRepo

      let total = 0
      for (const skillId of SENTENCE_SKILL_IDS) {
        const items = yield* contentRepo.findBySkillType(SkillTypeId(skillId))
        const sentenceItems = Array.filter(items, (ci) => {
          const eid = Number(ci.linguisticElementId)
          return eid >= 70001 && eid <= 72590
        })
        total += sentenceItems.length
      }

      assert.strictEqual(total, 18130)
    }),
  )

  // AC22 — aucun ContentItem en doublon
  it.effect("no duplicate ContentItems for sentences", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const contentRepo = yield* ContentItemRepo

      const allItems = yield* Effect.all(
        Array.map(SENTENCE_SKILL_IDS, (sid) => contentRepo.findBySkillType(SkillTypeId(sid))),
      )
      const sentencePairs = Array.flatMap(allItems, (items) =>
        Array.map(
          Array.filter(items, (ci) => {
            const eid = Number(ci.linguisticElementId)
            return eid >= 70001 && eid <= 72590
          }),
          (ci) => `${ci.linguisticElementId}-${ci.skillTypeId}`,
        ),
      )
      const unique = new Set(sentencePairs)
      assert.strictEqual(unique.size, sentencePairs.length)
    }),
  )

  // AC23 — round-trip seed → lecture → données correctes
  it.effect("round-trip: seeded sentence elements are readable with correct data", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const elemRepo = yield* LinguisticElementRepo

      const sentenceElements = yield* elemRepo.findByKind("sentence")
      assert.strictEqual(sentenceElements.length, 2590)

      // Verify first sentence (ID 70001)
      const first = yield* elemRepo.findById(LinguisticElementId(SentenceId(70001)))
      assert.ok(Option.isSome(first))
      if (Option.isSome(first) && first.value.kind === "sentence") {
        assert.ok(first.value.text.length > 0)
        assert.ok(first.value.meaning.length > 0)
        assert.strictEqual(first.value.sentenceRank, 1)
        assert.ok(first.value.components.length > 0)
      }
    }),
  )
})
