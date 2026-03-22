import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* sql`
    CREATE TABLE IF NOT EXISTS grammar_point (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      explanation TEXT NOT NULL,
      frequency INTEGER NOT NULL,
      form_count INTEGER NOT NULL
    )
  `

  yield* sql`
    INSERT INTO grammar_point (id, name, explanation, frequency, form_count)
    SELECT id, name, explanation, frequency, form_count
    FROM linguistic_element
    WHERE kind = 'grammar'
  `

  yield* sql`
    DELETE FROM content_item
    WHERE element_id IN (SELECT id FROM linguistic_element WHERE kind = 'grammar')
  `

  yield* sql`
    DELETE FROM element_component
    WHERE component_id IN (SELECT id FROM linguistic_element WHERE kind = 'grammar')
  `

  yield* sql`
    DELETE FROM linguistic_element WHERE kind = 'grammar'
  `
})
