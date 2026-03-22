import { assert, layer } from "@effect/vitest"
import { LinguisticElementId, SkillTypeId, WordId } from "@manabu/domain"
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

const WORD_SKILL_IDS = [4, 6, 7, 8, 9, 10]

layer(TestLayer, { timeout: 120_000 })("Seed words — PostgreSQL", (it) => {
  // AC11 — Chaque mot a exactement 6 ContentItems (skills 4, 6, 7, 8, 9, 10)
  it.effect("each word has exactly 6 ContentItems for skills 4, 6, 7, 8, 9, 10", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const elemRepo = yield* LinguisticElementRepo
      const contentRepo = yield* ContentItemRepo

      const wordElements = yield* elemRepo.findByKind("word")
      assert.strictEqual(wordElements.length, 5000)

      const wordIds = new Set(Array.map(wordElements, (w) => Number(w.id)))

      for (const skillId of WORD_SKILL_IDS) {
        const items = yield* contentRepo.findBySkillType(SkillTypeId(skillId))
        const wordItemIds = new Set(
          Array.map(
            Array.filter(items, (ci) => wordIds.has(Number(ci.linguisticElementId))),
            (ci) => Number(ci.linguisticElementId),
          ),
        )
        for (const wid of wordIds) {
          assert.ok(wordItemIds.has(wid), `Word ${wid} missing Skill ${skillId} ContentItem`)
        }
      }
    }),
  )

  // AC12 — Aucun ContentItem en doublon
  it.effect("no duplicate ContentItems for words", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const contentRepo = yield* ContentItemRepo

      const allItems = yield* Effect.all(
        Array.map(WORD_SKILL_IDS, (sid) => contentRepo.findBySkillType(SkillTypeId(sid))),
      )
      const pairs = Array.flatMap(allItems, (items) =>
        Array.map(items, (ci) => `${ci.linguisticElementId}-${ci.skillTypeId}`),
      )
      const unique = new Set(pairs)
      assert.strictEqual(unique.size, pairs.length)
    }),
  )

  // AC13 — Round-trip seed → lecture → données correctes
  it.effect("round-trip: seeded words are readable with correct data", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const elemRepo = yield* LinguisticElementRepo

      const wordElements = yield* elemRepo.findByKind("word")
      assert.strictEqual(wordElements.length, 5000)

      // Verify first word (ID 5000)
      const first = yield* elemRepo.findById(LinguisticElementId(WordId(5000)))
      assert.ok(Option.isSome(first))
      if (Option.isSome(first) && first.value.kind === "word") {
        assert.ok(first.value.written.length > 0)
        assert.ok(first.value.meaning.length > 0)
        assert.ok(first.value.components.length > 0)
        assert.ok(first.value.frequency > 0)
      }
    }),
  )

  // AC14 — 30 000 ContentItems mots au total
  it.effect("total of 30000 word ContentItems", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const elemRepo = yield* LinguisticElementRepo
      const contentRepo = yield* ContentItemRepo

      const wordElements = yield* elemRepo.findByKind("word")
      const wordIds = new Set(Array.map(wordElements, (w) => Number(w.id)))

      let totalWordItems = 0
      for (const skillId of WORD_SKILL_IDS) {
        const items = yield* contentRepo.findBySkillType(SkillTypeId(skillId))
        const wordItems = Array.filter(items, (ci) => wordIds.has(Number(ci.linguisticElementId)))
        totalWordItems += wordItems.length
      }

      assert.strictEqual(totalWordItems, 30000)
    }),
  )
})
