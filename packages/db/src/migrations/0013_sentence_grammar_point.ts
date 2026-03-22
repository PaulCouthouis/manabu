import type { SqlClient as SqlClientType } from "@effect/sql"
import { SqlClient } from "@effect/sql"
import { sentenceData } from "@manabu/domain"
import { Array, Effect } from "effect"

const BATCH_SIZE = 500

const insertSentenceGrammarPoints = (sql: SqlClientType.SqlClient) => {
  const rows = Array.flatMap(sentenceData, (s) =>
    Array.map(s.grammarPoints, (gpId) => ({
      sentence_id: Number(s.id),
      grammar_point_id: Number(gpId),
    })),
  )
  const seen = new Set<string>()
  const unique = Array.filter(rows, (r) => {
    const key = `${r.sentence_id}-${r.grammar_point_id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  const batches = Array.chunksOf(unique, BATCH_SIZE)
  return Effect.forEach(
    batches,
    (batch) => sql`INSERT INTO sentence_grammar_point ${sql.insert(batch)}`,
  )
}

const insertGrammarContentItems = (sql: SqlClientType.SqlClient) => {
  const grammarPointToSkill = (gpId: number): number => {
    if (gpId >= 300 && gpId <= 379) return 11
    if (gpId >= 380 && gpId <= 472) return 12
    if (gpId >= 473 && gpId <= 500) return 13
    if (gpId >= 501 && gpId <= 514) return 14
    if (gpId >= 515 && gpId <= 558) return 15
    throw new Error(`Unknown grammar point ID: ${gpId}`)
  }

  const allItems = Array.flatMap(sentenceData, (s) =>
    Array.map(s.grammarPoints, (gpId) => ({
      element_id: Number(s.id),
      skill_type_id: grammarPointToSkill(Number(gpId)),
    })),
  )
  const seenItems = new Set<string>()
  const items = Array.filter(allItems, (r) => {
    const key = `${r.element_id}-${r.skill_type_id}`
    if (seenItems.has(key)) return false
    seenItems.add(key)
    return true
  })
  const batches = Array.chunksOf(items, BATCH_SIZE)
  return Effect.forEach(batches, (batch) => sql`INSERT INTO content_item ${sql.insert(batch)}`)
}

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* sql`
    CREATE TABLE IF NOT EXISTS sentence_grammar_point (
      sentence_id INTEGER NOT NULL REFERENCES linguistic_element(id),
      grammar_point_id INTEGER NOT NULL REFERENCES grammar_point(id),
      PRIMARY KEY (sentence_id, grammar_point_id)
    )
  `

  yield* insertSentenceGrammarPoints(sql)
  yield* insertGrammarContentItems(sql)
})
