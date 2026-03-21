import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* sql`
    CREATE TABLE IF NOT EXISTS content_item (
      id SERIAL PRIMARY KEY,
      element_id INTEGER NOT NULL REFERENCES linguistic_element(id),
      skill_type_id INTEGER NOT NULL REFERENCES skill_type(id),
      UNIQUE (element_id, skill_type_id)
    )
  `
})
