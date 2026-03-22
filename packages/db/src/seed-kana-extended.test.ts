import { assert, layer } from "@effect/vitest"
import { KanaId, LinguisticElementId, SkillTypeId, sokuonChoonIds } from "@manabu/domain"
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

layer(TestLayer, { timeout: 60_000 })("Seed kana extended — PostgreSQL", (it) => {
  // AC-K3 — les 3 sokuon/chōon n'ont aucun ContentItem
  it.effect("sokuon/chōon have no ContentItems", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const contentRepo = yield* ContentItemRepo

      const f1Items = yield* contentRepo.findBySkillType(SkillTypeId(1))
      const f3Items = yield* contentRepo.findBySkillType(SkillTypeId(3))
      const f1ElementIds = new Set(Array.map(f1Items, (ci) => Number(ci.linguisticElementId)))
      const f3ElementIds = new Set(Array.map(f3Items, (ci) => Number(ci.linguisticElementId)))

      for (const id of sokuonChoonIds) {
        assert.ok(!f1ElementIds.has(id), `Sokuon/chōon ${id} should not have F1 ContentItem`)
        assert.ok(!f3ElementIds.has(id), `Sokuon/chōon ${id} should not have F3 ContentItem`)
      }
    }),
  )

  // AC-K4 — les 13 katakana étendus ont chacun 2 ContentItems (Skill 1 + Skill 3)
  it.effect("each extended katakana has 2 ContentItems (Skill 1 + Skill 3)", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const contentRepo = yield* ContentItemRepo

      const f1Items = yield* contentRepo.findBySkillType(SkillTypeId(1))
      const f3Items = yield* contentRepo.findBySkillType(SkillTypeId(3))
      const f1ElementIds = new Set(Array.map(f1Items, (ci) => Number(ci.linguisticElementId)))
      const f3ElementIds = new Set(Array.map(f3Items, (ci) => Number(ci.linguisticElementId)))

      for (let id = 212; id <= 224; id++) {
        assert.ok(f1ElementIds.has(id), `Extended katakana ${id} missing F1 ContentItem`)
        assert.ok(f3ElementIds.has(id), `Extended katakana ${id} missing F3 ContentItem`)
      }
    }),
  )

  // AC-K5 — les tests US5 existants ne sont pas impactés (208 kana standard toujours là)
  it.effect("original 208 kana are still present and correct", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const elemRepo = yield* LinguisticElementRepo

      const allKana = yield* elemRepo.findByKind("kana")
      // 208 standard + 16 extended = 224
      assert.strictEqual(allKana.length, 224)

      // Check original first hiragana is intact
      const first = yield* elemRepo.findById(LinguisticElementId(KanaId(1)))
      assert.ok(Option.isSome(first))
      if (Option.isSome(first) && first.value.kind === "kana") {
        assert.strictEqual(first.value.character, "あ")
      }
    }),
  )

  it.effect("extended kana are readable with correct data", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const elemRepo = yield* LinguisticElementRepo

      const [sokuonH, choon, ti] = yield* Effect.all([
        elemRepo.findById(LinguisticElementId(KanaId(209))),
        elemRepo.findById(LinguisticElementId(KanaId(211))),
        elemRepo.findById(LinguisticElementId(KanaId(212))),
      ])

      // Verify sokuon hiragana
      assert.ok(Option.isSome(sokuonH))
      if (Option.isSome(sokuonH) && sokuonH.value.kind === "kana") {
        assert.strictEqual(sokuonH.value.character, "っ")
        assert.strictEqual(sokuonH.value.kanaType, "hiragana")
      }

      // Verify chōon
      assert.ok(Option.isSome(choon))
      if (Option.isSome(choon) && choon.value.kind === "kana") {
        assert.strictEqual(choon.value.character, "ー")
        assert.strictEqual(choon.value.kanaType, "katakana")
      }

      // Verify extended katakana ティ
      assert.ok(Option.isSome(ti))
      if (Option.isSome(ti) && ti.value.kind === "kana") {
        assert.strictEqual(ti.value.character, "ティ")
        assert.strictEqual(ti.value.kanaType, "katakana")
      }
    }),
  )
})
