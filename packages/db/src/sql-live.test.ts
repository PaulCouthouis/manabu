import { PostgreSqlContainer } from "@testcontainers/postgresql"
import { SqlClient } from "@effect/sql"
import { assert, layer } from "@effect/vitest"
import { ConfigProvider, Effect, Layer } from "effect"
import { SqlLive } from "./sql-live.js"

const TestSqlLive = Layer.unwrapScoped(
  Effect.gen(function* () {
    const container = yield* Effect.acquireRelease(
      Effect.promise(() => new PostgreSqlContainer("postgres:17").start()),
      (c) => Effect.promise(() => c.stop()),
    )

    const configProvider = ConfigProvider.fromMap(
      new Map([
        ["DB_HOST", container.getHost()],
        ["DB_PORT", container.getMappedPort(5432).toString()],
        ["DB_NAME", container.getDatabase()],
        ["DB_USER", container.getUsername()],
        ["DB_PASSWORD", container.getPassword()],
      ]),
    )

    return Layer.provide(SqlLive, Layer.setConfigProvider(configProvider))
  }),
)

layer(TestSqlLive, { timeout: 60_000 })("SqlLive — PostgreSQL integration", (it) => {
  it.effect("SELECT 1 retourne 1 via @effect/sql-pg", () =>
    Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient
      const rows = yield* sql<{ result: number }>`SELECT 1 AS result`

      assert.strictEqual(rows.length, 1)
      assert.strictEqual(rows[0]?.result, 1)
    }),
  )
})
