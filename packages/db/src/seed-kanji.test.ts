import { assert, layer } from "@effect/vitest"
import { KanjiId, LinguisticElementId, SkillTypeId } from "@manabu/domain"
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

layer(TestLayer, { timeout: 60_000 })("Seed kanji — PostgreSQL", (it) => {
  // AC9 — Chaque kanji a exactement 1 ContentItem Skill 5
  it.effect("each kanji has exactly 1 ContentItem for Skill 5", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const elemRepo = yield* LinguisticElementRepo
      const contentRepo = yield* ContentItemRepo

      const kanjiElements = yield* elemRepo.findByKind("kanji")
      assert.strictEqual(kanjiElements.length, 2136)

      const skill5Items = yield* contentRepo.findBySkillType(SkillTypeId(5))
      assert.strictEqual(skill5Items.length, 2136)

      const kanjiIds = new Set(Array.map(kanjiElements, (k) => Number(k.id)))
      const itemElementIds = new Set(Array.map(skill5Items, (ci) => Number(ci.linguisticElementId)))

      for (const id of kanjiIds) {
        assert.ok(itemElementIds.has(id), `Kanji ${id} missing Skill 5 ContentItem`)
      }
    }),
  )

  // AC10 — Aucun ContentItem en doublon
  it.effect("no duplicate ContentItems for kanji", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const contentRepo = yield* ContentItemRepo

      const skill5Items = yield* contentRepo.findBySkillType(SkillTypeId(5))
      const pairs = Array.map(skill5Items, (ci) => `${ci.linguisticElementId}-${ci.skillTypeId}`)
      const unique = new Set(pairs)
      assert.strictEqual(unique.size, pairs.length)
    }),
  )

  // AC11 — Round-trip seed → lecture → données correctes
  it.effect("round-trip: seeded kanji are readable with correct data", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const elemRepo = yield* LinguisticElementRepo

      const kanjiElements = yield* elemRepo.findByKind("kanji")
      assert.strictEqual(kanjiElements.length, 2136)

      // Verify first kanji (人, most frequent in Aozora)
      const first = yield* elemRepo.findById(LinguisticElementId(KanjiId(1000)))
      assert.ok(Option.isSome(first))
      if (Option.isSome(first) && first.value.kind === "kanji") {
        assert.strictEqual(first.value.character, "人")
        assert.ok(first.value.meanings.length >= 1)
        assert.strictEqual(first.value.strokeCount, 2)
      }

      // Verify a kanji with components (休 id=1739, components: 人 + 木)
      const yasu = yield* elemRepo.findById(LinguisticElementId(KanjiId(1739)))
      assert.ok(Option.isSome(yasu))
      if (Option.isSome(yasu) && yasu.value.kind === "kanji") {
        assert.strictEqual(yasu.value.character, "休")
        assert.ok(yasu.value.components.length > 0)
      }
    }),
  )
})
