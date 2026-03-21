import type { SqlClient as SqlClientType } from "@effect/sql"
import { SqlClient } from "@effect/sql"
import { kanjiData } from "@manabu/domain"
import { Array, Effect } from "effect"

const BATCH_SIZE = 500

const insertKanjiElements = (sql: SqlClientType.SqlClient) => {
  const rows = Array.map(kanjiData, (k) => ({
    id: Number(k.id),
    kind: "kanji",
    character: k.character,
    meanings: JSON.stringify(k.meanings),
    frequency: k.frequency,
    stroke_count: k.strokeCount,
  }))
  const batches = Array.chunksOf(rows, BATCH_SIZE)
  return Effect.forEach(
    batches,
    (batch) => sql`INSERT INTO linguistic_element ${sql.insert(batch)}`,
  )
}

const insertComponents = (sql: SqlClientType.SqlClient) => {
  const rows = Array.flatMap(kanjiData, (k) =>
    Array.map(k.components, (comp, position) => ({
      parent_id: Number(k.id),
      component_id: Number(comp),
      position,
    })),
  )
  if (Array.isEmptyReadonlyArray(rows)) return Effect.void
  const batches = Array.chunksOf(rows, BATCH_SIZE)
  return Effect.forEach(batches, (batch) => sql`INSERT INTO element_component ${sql.insert(batch)}`)
}

const insertContentItems = (sql: SqlClientType.SqlClient) => {
  const items = Array.map(kanjiData, (k) => ({
    element_id: Number(k.id),
    skill_type_id: 5,
  }))
  const batches = Array.chunksOf(items, BATCH_SIZE)
  return Effect.forEach(batches, (batch) => sql`INSERT INTO content_item ${sql.insert(batch)}`)
}

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* insertKanjiElements(sql)
  yield* insertComponents(sql)
  yield* insertContentItems(sql)
})
