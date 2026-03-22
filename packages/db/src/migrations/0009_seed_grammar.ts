import type { SqlClient as SqlClientType } from "@effect/sql"
import { SqlClient } from "@effect/sql"
import {
  grammarData,
  skill11Data,
  skill12Data,
  skill13Data,
  skill14Data,
  skill15Data,
} from "@manabu/domain"
import { Array, Effect } from "effect"

const BATCH_SIZE = 500

const skillMapping = [
  { data: skill11Data, skillId: 11 },
  { data: skill12Data, skillId: 12 },
  { data: skill13Data, skillId: 13 },
  { data: skill14Data, skillId: 14 },
  { data: skill15Data, skillId: 15 },
] as const

const insertGrammarElements = (sql: SqlClientType.SqlClient) => {
  const rows = Array.map(grammarData, (g) => ({
    id: Number(g.id),
    kind: "grammar",
    name: g.name,
    explanation: g.explanation,
    frequency: g.frequency,
    form_count: g.formCount,
  }))
  const batches = Array.chunksOf(rows, BATCH_SIZE)
  return Effect.forEach(
    batches,
    (batch) => sql`INSERT INTO linguistic_element ${sql.insert(batch)}`,
  )
}

const insertContentItems = (sql: SqlClientType.SqlClient) => {
  const items = Array.flatMap(skillMapping, ({ data, skillId }) =>
    Array.map(data, (g) => ({
      element_id: Number(g.id),
      skill_type_id: skillId,
    })),
  )
  const batches = Array.chunksOf(items, BATCH_SIZE)
  return Effect.forEach(batches, (batch) => sql`INSERT INTO content_item ${sql.insert(batch)}`)
}

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* insertGrammarElements(sql)
  yield* insertContentItems(sql)
})
