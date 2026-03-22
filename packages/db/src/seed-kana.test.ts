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

layer(TestLayer, { timeout: 60_000 })("Seed kana — PostgreSQL", (it) => {
  it.effect("findById returns a seeded kana by id", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const repo = yield* LinguisticElementRepo

      const found = yield* repo.findById(LinguisticElementId(KanaId(1)))
      assert.ok(Option.isSome(found))
      if (Option.isSome(found) && found.value.kind === "kana") {
        assert.strictEqual(found.value.character, "あ")
        assert.strictEqual(found.value.kanaType, "hiragana")
        assert.strictEqual(found.value.sortOrder, 1)
      }
    }),
  )

  it.effect("findById returns None for non-existent id", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const repo = yield* LinguisticElementRepo

      const found = yield* repo.findById(LinguisticElementId(KanaId(9999)))
      assert.ok(Option.isNone(found))
    }),
  )

  it.effect("findByKind returns all seeded kana (208 standard + 16 extended)", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const repo = yield* LinguisticElementRepo

      const results = yield* repo.findByKind("kana")
      assert.strictEqual(results.length, 224)
    }),
  )

  it.effect("findByKind returns empty for unseeded kinds", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const repo = yield* LinguisticElementRepo

      const results = yield* repo.findByKind("word")
      assert.strictEqual(results.length, 0)
    }),
  )

  // AC5 — Chaque hiragana standard a un ContentItem F1 et F2
  it.effect("each standard hiragana has ContentItems for F1 and F2", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const elemRepo = yield* LinguisticElementRepo
      const contentRepo = yield* ContentItemRepo

      const kanaElements = yield* elemRepo.findByKind("kana")
      const standardHiragana = Array.filter(
        kanaElements,
        (k) => k.kind === "kana" && k.kanaType === "hiragana" && !sokuonChoonIds.has(k.id),
      )

      assert.strictEqual(standardHiragana.length, 104)

      const f2Items = yield* contentRepo.findBySkillType(SkillTypeId(2))

      // Each standard hiragana should have one F1 and one F2 ContentItem
      const hiraganaIds = new Set(Array.map(standardHiragana, (k) => Number(k.id)))
      const f2ElementIds = new Set(Array.map(f2Items, (ci) => Number(ci.linguisticElementId)))

      for (const id of hiraganaIds) {
        assert.ok(f2ElementIds.has(id), `Hiragana ${id} missing F2 ContentItem`)
      }
    }),
  )

  // AC6 — Chaque katakana (standard + étendu, sauf sokuon/chōon) a un ContentItem F3
  it.effect("each katakana with ContentItems has F3", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const elemRepo = yield* LinguisticElementRepo
      const contentRepo = yield* ContentItemRepo

      const kanaElements = yield* elemRepo.findByKind("kana")
      const katakanaWithF3 = Array.filter(
        kanaElements,
        (k) => k.kind === "kana" && k.kanaType === "katakana" && !sokuonChoonIds.has(k.id),
      )

      // 104 standard + 13 extended = 117
      assert.strictEqual(katakanaWithF3.length, 117)

      const f3Items = yield* contentRepo.findBySkillType(SkillTypeId(3))
      const katakanaIds = new Set(Array.map(katakanaWithF3, (k) => Number(k.id)))
      const f3ElementIds = new Set(Array.map(f3Items, (ci) => Number(ci.linguisticElementId)))

      for (const id of katakanaIds) {
        assert.ok(f3ElementIds.has(id), `Katakana ${id} missing F3 ContentItem`)
      }
    }),
  )

  // AC7 — Aucun ContentItem en doublon
  it.effect("no duplicate ContentItems", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const contentRepo = yield* ContentItemRepo

      const f1 = yield* contentRepo.findBySkillType(SkillTypeId(1))
      const f2 = yield* contentRepo.findBySkillType(SkillTypeId(2))
      const f3 = yield* contentRepo.findBySkillType(SkillTypeId(3))

      const allPairs = Array.map(
        [...f1, ...f2, ...f3],
        (ci) => `${ci.linguisticElementId}-${ci.skillTypeId}`,
      )
      const unique = new Set(allPairs)
      assert.strictEqual(unique.size, allPairs.length)
    }),
  )

  // AC8 — Round-trip seed → lecture → données correctes
  it.effect("round-trip: seeded kana are readable with correct data", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const elemRepo = yield* LinguisticElementRepo

      const kanaElements = yield* elemRepo.findByKind("kana")
      assert.strictEqual(kanaElements.length, 224)

      // Verify first hiragana
      const first = kanaElements[0]
      assert.ok(first)
      assert.strictEqual(first.kind, "kana")
      if (first.kind === "kana") {
        assert.strictEqual(first.character, "あ")
        assert.strictEqual(first.kanaType, "hiragana")
        assert.strictEqual(first.sortOrder, 1)
      }

      // Verify first katakana
      const firstKatakana = Array.findFirst(
        kanaElements,
        (k) => k.kind === "kana" && k.kanaType === "katakana",
      )
      assert.ok(Option.isSome(firstKatakana))
      if (Option.isSome(firstKatakana) && firstKatakana.value.kind === "kana") {
        assert.strictEqual(firstKatakana.value.character, "ア")
        assert.strictEqual(firstKatakana.value.sortOrder, 105)
      }
    }),
  )
})
