import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* sql`
    CREATE TABLE IF NOT EXISTS skill_type (
      id INTEGER PRIMARY KEY,
      family TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      format TEXT NOT NULL,
      open BOOLEAN NOT NULL DEFAULT false
    )
  `
})
