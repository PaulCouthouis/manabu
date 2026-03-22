import { assert, layer } from "@effect/vitest"
import { SkillTypeId } from "@manabu/domain"
import { Array, Effect, Layer } from "effect"
import { ContentItemRepo } from "./content-item-repo.js"
import { runMigrations } from "./migrations/index.js"
import { SkillTypeRepo } from "./skill-type-repo.js"
import { TestSqlLayer } from "./test-utils.js"

const TestLayer = Layer.mergeAll(ContentItemRepo.Default, SkillTypeRepo.Default).pipe(
  Layer.provideMerge(TestSqlLayer),
)

const GRAMMAR_SKILL_IDS = [11, 12, 13, 14, 15]
const GRAMMAR_COUNTS: Record<number, number> = { 11: 80, 12: 93, 13: 28, 14: 14, 15: 44 }

// These tests validate the current seed grammar migrations (0009).
// They will be rewritten at US8 step 4 when grammar moves to its own table.
layer(TestLayer, { timeout: 120_000 })("Seed grammar — PostgreSQL", (it) => {
  // AC8 — Chaque GrammarElement a exactement 1 ContentItem
  it.effect("each grammar element has exactly 1 ContentItem for its skill", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const contentRepo = yield* ContentItemRepo

      for (const skillId of GRAMMAR_SKILL_IDS) {
        const items = yield* contentRepo.findBySkillType(SkillTypeId(skillId))
        const grammarItems = Array.filter(items, (ci) => {
          const eid = Number(ci.linguisticElementId)
          return eid >= 300 && eid <= 558
        })
        assert.strictEqual(
          grammarItems.length,
          GRAMMAR_COUNTS[skillId],
          `Skill ${skillId} should have ${GRAMMAR_COUNTS[skillId]} grammar ContentItems, got ${grammarItems.length}`,
        )
      }
    }),
  )

  // AC9 — Aucun ContentItem en doublon
  it.effect("no duplicate ContentItems for grammar", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const contentRepo = yield* ContentItemRepo

      const allItems = yield* Effect.all(
        Array.map(GRAMMAR_SKILL_IDS, (sid) => contentRepo.findBySkillType(SkillTypeId(sid))),
      )
      const grammarPairs = Array.flatMap(allItems, (items) =>
        Array.map(
          Array.filter(items, (ci) => {
            const eid = Number(ci.linguisticElementId)
            return eid >= 300 && eid <= 558
          }),
          (ci) => `${ci.linguisticElementId}-${ci.skillTypeId}`,
        ),
      )
      const unique = new Set(grammarPairs)
      assert.strictEqual(unique.size, grammarPairs.length)
    }),
  )

  // AC11 — 259 ContentItems grammaire au total
  it.effect("total of 259 grammar ContentItems", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const contentRepo = yield* ContentItemRepo

      let total = 0
      for (const skillId of GRAMMAR_SKILL_IDS) {
        const items = yield* contentRepo.findBySkillType(SkillTypeId(skillId))
        const grammarItems = Array.filter(items, (ci) => {
          const eid = Number(ci.linguisticElementId)
          return eid >= 300 && eid <= 558
        })
        total += grammarItems.length
      }

      assert.strictEqual(total, 259)
    }),
  )
})
