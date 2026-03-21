import { SqlClient } from "@effect/sql"
import { assert, layer } from "@effect/vitest"
import { Effect } from "effect"
import { TestSqlLayer } from "./test-utils.js"

layer(TestSqlLayer, { timeout: 60_000 })("SqlLive — PostgreSQL integration", (it) => {
  it.effect("SELECT 1 retourne 1 via @effect/sql-pg", () =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      const rows = yield* sql<{ result: number }>`SELECT 1 AS result`

      assert.strictEqual(rows.length, 1)
      assert.strictEqual(rows[0]?.result, 1)
    }),
  )
})
