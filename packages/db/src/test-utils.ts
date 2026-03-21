import { PostgreSqlContainer } from "@testcontainers/postgresql"
import { ConfigProvider, Effect, Layer } from "effect"
import { SqlLive } from "./sql-live.js"

export const TestSqlLayer = Layer.unwrapScoped(
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
