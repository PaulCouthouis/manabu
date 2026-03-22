import { SqlClient } from "@effect/sql"
import { assert, layer } from "@effect/vitest"
import { Effect } from "effect"
import { runMigrations } from "./migrations/index.js"
import { TestSqlLayer } from "./test-utils.js"

layer(TestSqlLayer, { timeout: 120_000 })("Seed grammar — PostgreSQL", (it) => {
  // US8 AC9 — 259 grammar points dans grammar_point
  it.effect("grammar_point table contains 259 rows", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const sql = yield* SqlClient.SqlClient

      const rows = yield* sql<{ count: string }>`SELECT COUNT(*)::text AS count FROM grammar_point`
      assert.strictEqual(rows[0]!.count, "259")
    }),
  )

  // US8 AC10 — 0 lignes kind = 'grammar' dans linguistic_element
  it.effect("no grammar rows remain in linguistic_element", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const sql = yield* SqlClient.SqlClient

      const rows = yield* sql<{ count: string }>`
        SELECT COUNT(*)::text AS count FROM linguistic_element WHERE kind = 'grammar'
      `
      assert.strictEqual(rows[0]!.count, "0")
    }),
  )

  // US8 AC11 — aucun content item orphelin vers un grammar element
  it.effect("no content items reference grammar element IDs", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const sql = yield* SqlClient.SqlClient

      const rows = yield* sql<{ count: string }>`
        SELECT COUNT(*)::text AS count FROM content_item
        WHERE element_id >= 300 AND element_id <= 558
          AND NOT EXISTS (SELECT 1 FROM linguistic_element WHERE id = content_item.element_id)
      `
      assert.strictEqual(rows[0]!.count, "0")
    }),
  )

  // US8 AC18 (partial) — first grammar point has correct data
  it.effect("grammar_point data matches domain (spot check)", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const sql = yield* SqlClient.SqlClient

      const rows = yield* sql<{
        id: number
        name: string
        explanation: string
        frequency: number
        form_count: number
      }>`SELECT * FROM grammar_point WHERE id = 300`

      assert.strictEqual(rows.length, 1)
      assert.strictEqual(rows[0]!.name, "だ")
      assert.strictEqual(rows[0]!.explanation, "Copula asserting identity or state")
      assert.strictEqual(rows[0]!.frequency, 1)
      assert.strictEqual(rows[0]!.form_count, 1)
    }),
  )
})
