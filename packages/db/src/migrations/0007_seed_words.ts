import type { SqlClient as SqlClientType } from "@effect/sql"
import { SqlClient } from "@effect/sql"
import { wordData } from "@manabu/domain"
import { Array, Effect } from "effect"

const BATCH_SIZE = 500

const WORD_SKILL_IDS = [4, 6, 7, 8, 9, 10]

const insertWordElements = (sql: SqlClientType.SqlClient) => {
  const rows = Array.map(wordData, (w) => ({
    id: Number(w.id),
    kind: "word",
    written: w.written,
    meaning: w.meaning,
    frequency: w.frequency,
  }))
  const batches = Array.chunksOf(rows, BATCH_SIZE)
  return Effect.forEach(
    batches,
    (batch) => sql`INSERT INTO linguistic_element ${sql.insert(batch)}`,
  )
}

const insertComponents = (sql: SqlClientType.SqlClient) => {
  const rows = Array.flatMap(wordData, (w) =>
    Array.map(w.components, (comp, position) => ({
      parent_id: Number(w.id),
      component_id: Number(comp),
      position,
    })),
  )
  const batches = Array.chunksOf(rows, BATCH_SIZE)
  return Effect.forEach(batches, (batch) => sql`INSERT INTO element_component ${sql.insert(batch)}`)
}

const insertContentItems = (sql: SqlClientType.SqlClient) => {
  const items = Array.flatMap(wordData, (w) =>
    Array.map(WORD_SKILL_IDS, (skillId) => ({
      element_id: Number(w.id),
      skill_type_id: skillId,
    })),
  )
  const batches = Array.chunksOf(items, BATCH_SIZE)
  return Effect.forEach(batches, (batch) => sql`INSERT INTO content_item ${sql.insert(batch)}`)
}

const alterComponentPK = (sql: SqlClientType.SqlClient) =>
  Effect.gen(function* () {
    yield* sql`ALTER TABLE element_component DROP CONSTRAINT element_component_pkey`
    yield* sql`ALTER TABLE element_component ADD PRIMARY KEY (parent_id, position)`
  })

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* alterComponentPK(sql)
  yield* insertWordElements(sql)
  yield* insertComponents(sql)
  yield* insertContentItems(sql)
})
