import { SqlClient } from "@effect/sql"
import { assert, layer } from "@effect/vitest"
import { Effect } from "effect"
import { runMigrations } from "./migrations/index.js"
import { TestSqlLayer } from "./test-utils.js"

layer(TestSqlLayer, { timeout: 120_000 })("Sentence grammar points — PostgreSQL", (it) => {
  // US8 AC12 — element_component ne contient plus de liens vers des grammar points
  it.effect("element_component has no grammar point references", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const sql = yield* SqlClient.SqlClient

      const rows = yield* sql<{ count: string }>`
        SELECT COUNT(*)::text AS count FROM element_component
        WHERE component_id IN (SELECT id FROM grammar_point)
      `
      assert.strictEqual(rows[0]!.count, "0")
    }),
  )

  // US8 AC13 — sentence_grammar_point contient les bons liens
  it.effect("sentence_grammar_point has correct links", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const sql = yield* SqlClient.SqlClient

      const rows = yield* sql<{ count: string }>`
        SELECT COUNT(*)::text AS count FROM sentence_grammar_point
      `
      const count = Number(rows[0]!.count)
      // Every sentence has at least 1 grammar point, ranks 6-8 have 2, ranks 9-10 have 3
      assert.ok(count > 2590, `Expected > 2590 grammar point links, got ${count}`)

      // All sentence_ids reference existing sentences
      const orphanSentences = yield* sql<{ count: string }>`
        SELECT COUNT(*)::text AS count FROM sentence_grammar_point sgp
        WHERE NOT EXISTS (SELECT 1 FROM linguistic_element WHERE id = sgp.sentence_id)
      `
      assert.strictEqual(orphanSentences[0]!.count, "0")

      // All grammar_point_ids reference existing grammar points
      const orphanGps = yield* sql<{ count: string }>`
        SELECT COUNT(*)::text AS count FROM sentence_grammar_point sgp
        WHERE NOT EXISTS (SELECT 1 FROM grammar_point WHERE id = sgp.grammar_point_id)
      `
      assert.strictEqual(orphanGps[0]!.count, "0")
    }),
  )

  // US8 AC14 — sentences have content items on grammar skills
  it.effect("sentences have content items on appropriate grammar skills", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const sql = yield* SqlClient.SqlClient

      // Each grammar skill (11-15) should have sentence content items
      for (const skillId of [11, 12, 13, 14, 15]) {
        const rows = yield* sql<{ count: string }>`
          SELECT COUNT(*)::text AS count FROM content_item
          WHERE skill_type_id = ${skillId}
            AND element_id >= 70001 AND element_id <= 72590
        `
        const count = Number(rows[0]!.count)
        assert.ok(count > 0, `Skill ${skillId} should have sentence content items, got ${count}`)
      }
    }),
  )

  // US8 AC15 — total content items includes grammar skills
  it.effect("total sentence content items includes grammar skills", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const sql = yield* SqlClient.SqlClient

      const rows = yield* sql<{ count: string }>`
        SELECT COUNT(*)::text AS count FROM content_item
        WHERE element_id >= 70001 AND element_id <= 72590
      `
      const count = Number(rows[0]!.count)
      // 2590 sentences × 7 core skills = 18130, plus grammar skill content items
      assert.ok(count > 18130, `Expected > 18130 sentence content items, got ${count}`)
    }),
  )
})
