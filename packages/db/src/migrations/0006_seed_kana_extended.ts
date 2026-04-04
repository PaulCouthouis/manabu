import type { SqlClient as SqlClientType } from "@effect/sql"
import { SqlClient } from "@effect/sql"
import { kanaExtendedData, sokuonChoonIds } from "@manabu/domain"
import { Array, Effect, HashSet } from "effect"

const insertKanaElements = (sql: SqlClientType.SqlClient) => {
  const rows = Array.map(kanaExtendedData, (k) => ({
    id: Number(k.id),
    kind: "kana",
    character: k.character,
    kana_type: k.kanaType,
    sort_order: k.sortOrder,
  }))
  return sql`INSERT INTO linguistic_element ${sql.insert(rows)}`
}

const insertContentItems = (sql: SqlClientType.SqlClient) => {
  const extendedKatakana = Array.filter(kanaExtendedData, (k) => {
    return !HashSet.has(sokuonChoonIds, k.id)
  })
  const items = Array.flatMap(extendedKatakana, (k) => [
    { element_id: Number(k.id), skill_type_id: 1 },
    { element_id: Number(k.id), skill_type_id: 3 },
  ])
  return sql`INSERT INTO content_item ${sql.insert(items)}`
}

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* insertKanaElements(sql)
  yield* insertContentItems(sql)
})
