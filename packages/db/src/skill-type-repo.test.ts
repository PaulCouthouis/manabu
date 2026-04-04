import { assert, layer } from "@effect/vitest"
import { Array, Effect, Layer, Option } from "effect"
import { SkillTypeRepo } from "./skill-type-repo.js"
import { runMigrations } from "./migrations/index.js"
import { TestSqlLayer } from "./test-utils.js"

const TestLayer = Layer.provideMerge(SkillTypeRepo.Default, TestSqlLayer)

layer(TestLayer, { timeout: 60_000 })("SkillTypeRepo — PostgreSQL integration", (it) => {
  // AC6 — Les skill types sont persistés et queryables par famille
  it.effect("seed persists all skill types and they are queryable by family", () =>
    Effect.gen(function* () {
      const repo = yield* SkillTypeRepo

      // Run migrations
      yield* runMigrations

      // Seed
      yield* repo.seed

      // Query all
      const all = yield* repo.findAll
      assert.strictEqual(all.length, 15)

      // Query by family
      const foundations = yield* repo.findByFamily("Foundation")
      assert.strictEqual(foundations.length, 3)

      const core = yield* repo.findByFamily("Core")
      assert.strictEqual(core.length, 7)

      const grammar = yield* repo.findByFamily("Grammar")
      assert.strictEqual(grammar.length, 5)

      // Verify a specific skill type
      const first = Array.findFirst(foundations, (s) => s.code === "F1")
      assert.ok(Option.isSome(first))
      assert.strictEqual(first.value.name, "Syllable listening & repetition")
      assert.strictEqual(first.value.family, "Foundation")
    }),
  )
})
