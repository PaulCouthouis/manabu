import { PostgreSqlContainer } from "@testcontainers/postgresql"
import { ConfigProvider, Effect, Layer } from "effect"
import { ContentItemRepo } from "./content-item-repo.js"
import { LinguisticElementRepo } from "./linguistic-element-repo.js"
import { ReviewCardRepo } from "./review-card-repo.js"
import { SkillTypeRepo } from "./skill-type-repo.js"
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

export const TestRepoLayer = Layer.mergeAll(
  LinguisticElementRepo.Default,
  ContentItemRepo.Default,
  ReviewCardRepo.Default,
  SkillTypeRepo.Default,
).pipe(Layer.provideMerge(TestSqlLayer))
