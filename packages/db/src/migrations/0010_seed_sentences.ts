import type { SqlClient as SqlClientType } from "@effect/sql"
import { SqlClient } from "@effect/sql"
import { SENTENCE_SKILL_IDS, sentenceData } from "@manabu/domain"
import { Array, Effect } from "effect"

const BATCH_SIZE = 500

const addSentenceRankColumn = (sql: SqlClientType.SqlClient) =>
  sql`ALTER TABLE linguistic_element ADD COLUMN IF NOT EXISTS sentence_rank INTEGER`

const insertSentenceElements = (sql: SqlClientType.SqlClient) => {
  const rows = Array.map(sentenceData, (s) => ({
    id: Number(s.id),
    kind: "sentence",
    text: s.text,
    meaning: s.meaning,
    sentence_rank: s.sentenceRank,
  }))
  const batches = Array.chunksOf(rows, BATCH_SIZE)
  return Effect.forEach(
    batches,
    (batch) => sql`INSERT INTO linguistic_element ${sql.insert(batch)}`,
  )
}

const insertComponents = (sql: SqlClientType.SqlClient) => {
  const rows = Array.flatMap(sentenceData, (s) =>
    Array.map(s.components, (comp, position) => ({
      parent_id: Number(s.id),
      component_id: Number(comp),
      position,
    })),
  )
  const batches = Array.chunksOf(rows, BATCH_SIZE)
  return Effect.forEach(batches, (batch) => sql`INSERT INTO element_component ${sql.insert(batch)}`)
}

const insertContentItems = (sql: SqlClientType.SqlClient) => {
  const items = Array.flatMap(sentenceData, (s) =>
    Array.map(SENTENCE_SKILL_IDS, (skillId) => ({
      element_id: Number(s.id),
      skill_type_id: skillId,
    })),
  )
  const batches = Array.chunksOf(items, BATCH_SIZE)
  return Effect.forEach(batches, (batch) => sql`INSERT INTO content_item ${sql.insert(batch)}`)
}

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* addSentenceRankColumn(sql)
  yield* insertSentenceElements(sql)
  yield* insertComponents(sql)
  yield* insertContentItems(sql)
})
