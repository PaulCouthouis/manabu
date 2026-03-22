import { SqlClient } from "@effect/sql"
import { assert, layer } from "@effect/vitest"
import { Effect } from "effect"
import { runMigrations } from "./migrations/index.js"
import { TestSqlLayer } from "./test-utils.js"

const insertTestUser = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql`
    INSERT INTO "user" (id, name, email) VALUES ('test-user-1', 'Test User', 'test@example.com')
    ON CONFLICT DO NOTHING
  `
})

layer(TestSqlLayer, { timeout: 120_000 })("ReviewCard — PostgreSQL", (it) => {
  // AC16 — table review_card créée avec les bonnes colonnes et FK
  it.effect("creates review_card table with correct schema", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const sql = yield* SqlClient.SqlClient

      yield* insertTestUser

      yield* sql`
        INSERT INTO review_card (user_id, content_item_id, next_review_at)
        VALUES ('test-user-1', 1, NOW() + INTERVAL '1 day')
      `

      const rows = yield* sql<{ id: number; user_id: string; content_item_id: number }>`
        SELECT id, user_id, content_item_id FROM review_card WHERE user_id = 'test-user-1'
      `

      assert.strictEqual(rows.length, 1)
      assert.strictEqual(rows[0]!.user_id, "test-user-1")
      assert.strictEqual(rows[0]!.content_item_id, 1)
    }),
  )

  // AC17 — contrainte UNIQUE (user_id, content_item_id)
  it.effect("enforces unique constraint on (user_id, content_item_id)", () =>
    Effect.gen(function* () {
      yield* runMigrations
      const sql = yield* SqlClient.SqlClient

      yield* insertTestUser

      yield* sql`
        INSERT INTO review_card (user_id, content_item_id, next_review_at)
        VALUES ('test-user-1', 2, NOW() + INTERVAL '1 day')
      `

      const result = yield* Effect.either(
        sql`
          INSERT INTO review_card (user_id, content_item_id, next_review_at)
          VALUES ('test-user-1', 2, NOW() + INTERVAL '2 days')
        `,
      )

      assert.ok(result._tag === "Left")
    }),
  )
})
