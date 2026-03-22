import { assert, layer } from "@effect/vitest"
import { GrammarId, LinguisticElementId, SkillTypeId } from "@manabu/domain"
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

const GRAMMAR_SKILL_IDS = [11, 12, 13, 14, 15]
const GRAMMAR_COUNTS: Record<number, number> = { 11: 80, 12: 93, 13: 28, 14: 14, 15: 44 }

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

  // AC10 — Round-trip seed → lecture → données correctes
  it.effect("round-trip: seeded grammar elements are readable with correct data", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const elemRepo = yield* LinguisticElementRepo

      const grammarElements = yield* elemRepo.findByKind("grammar")
      assert.strictEqual(grammarElements.length, 259)

      // Verify first element (だ, ID 300)
      const first = yield* elemRepo.findById(LinguisticElementId(GrammarId(300)))
      assert.ok(Option.isSome(first))
      if (Option.isSome(first) && first.value.kind === "grammar") {
        assert.strictEqual(first.value.name, "だ")
        assert.strictEqual(first.value.explanation, "Copula asserting identity or state")
        assert.strictEqual(first.value.frequency, 1)
        assert.strictEqual(first.value.formCount, 1)
      }
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
