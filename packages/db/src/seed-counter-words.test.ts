import { assert, layer } from "@effect/vitest"
import { LinguisticElementId, SkillTypeId, WORD_SKILL_IDS, WordId } from "@manabu/domain"
import { Array, Effect, Option } from "effect"
import { ContentItemRepo } from "./content-item-repo.js"
import { LinguisticElementRepo } from "./linguistic-element-repo.js"
import { runMigrations } from "./migrations/index.js"
import { TestRepoLayer } from "./test-utils.js"

const COUNTER_WORD_IDS = Array.range(10000, 10051)

layer(TestRepoLayer, { timeout: 120_000 })("Seed counter words — PostgreSQL", (it) => {
  // AC-W5 — Chaque mot a exactement 6 ContentItems (skills 4, 6, 7, 8, 9, 10)
  it.effect("each counter word has exactly 6 ContentItems for skills 4, 6, 7, 8, 9, 10", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const contentRepo = yield* ContentItemRepo
      const counterIds = new Set(COUNTER_WORD_IDS)

      for (const skillId of WORD_SKILL_IDS) {
        const items = yield* contentRepo.findBySkillType(SkillTypeId(skillId))
        const counterItems = Array.filter(items, (ci) =>
          counterIds.has(Number(ci.linguisticElementId)),
        )
        assert.strictEqual(
          counterItems.length,
          52,
          `Skill ${skillId} should have 52 counter word ContentItems`,
        )
      }
    }),
  )

  // AC-W6 — 312 ContentItems au total
  it.effect("total of 312 counter word ContentItems", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const contentRepo = yield* ContentItemRepo
      const counterIds = new Set(COUNTER_WORD_IDS)

      let total = 0
      for (const skillId of WORD_SKILL_IDS) {
        const items = yield* contentRepo.findBySkillType(SkillTypeId(skillId))
        const counterItems = Array.filter(items, (ci) =>
          counterIds.has(Number(ci.linguisticElementId)),
        )
        total += counterItems.length
      }

      assert.strictEqual(total, 312)
    }),
  )

  // AC-W7 — Round-trip : données correctes
  it.effect("round-trip: seeded counter words are readable with correct data", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const elemRepo = yield* LinguisticElementRepo

      // Verify first number (一, ID 10000)
      const first = yield* elemRepo.findById(LinguisticElementId(WordId(10000)))
      assert.ok(Option.isSome(first))
      if (Option.isSome(first) && first.value.kind === "word") {
        assert.strictEqual(first.value.written, "一")
        assert.strictEqual(first.value.meaning, "one")
      }

      // Verify a counter combination (3本, ID 10015)
      const counter = yield* elemRepo.findById(LinguisticElementId(WordId(10015)))
      assert.ok(Option.isSome(counter))
      if (Option.isSome(counter) && counter.value.kind === "word") {
        assert.strictEqual(counter.value.written, "3本")
        assert.strictEqual(counter.value.meaning, "three (long objects)")
      }
    }),
  )
})
