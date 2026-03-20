import { PgClient } from "@effect/sql-pg"
import { Config } from "effect"

const DatabaseConfig = Config.all({
  host: Config.string("DB_HOST"),
  port: Config.integer("DB_PORT"),
  database: Config.string("DB_NAME"),
  username: Config.string("DB_USER"),
  password: Config.redacted("DB_PASSWORD"),
})

export const SqlLive = PgClient.layerConfig(DatabaseConfig)
