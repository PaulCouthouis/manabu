import type { SqlClient as SqlClientType } from "@effect/sql"
import { SqlClient } from "@effect/sql"
import { kanaData, SkillType, SkillTypes, type KanaElement } from "@manabu/domain"
import { Array, Effect, Schema } from "effect"

const encodeSkillTypes = Schema.encode(Schema.Array(SkillType))

const seedSkillTypes = (sql: SqlClientType.SqlClient) =>
  Effect.gen(function* () {
    const values = yield* encodeSkillTypes(Array.fromIterable(SkillTypes))
    yield* sql`INSERT INTO skill_type ${sql.insert(values)} ON CONFLICT (id) DO NOTHING`
  })

const insertKanaElements = (sql: SqlClientType.SqlClient) => {
  const rows = Array.map(kanaData, (k) => ({
    id: Number(k.id),
    kind: "kana",
    character: k.character,
    kana_type: k.kanaType,
    sort_order: k.sortOrder,
  }))
  return sql`INSERT INTO linguistic_element ${sql.insert(rows)}`
}

const kanaToContentItems = (k: KanaElement) => {
  const eid = Number(k.id)
  return k.kanaType === "hiragana"
    ? [
        { element_id: eid, skill_type_id: 1 },
        { element_id: eid, skill_type_id: 2 },
      ]
    : [{ element_id: eid, skill_type_id: 3 }]
}

const insertContentItems = (sql: SqlClientType.SqlClient) => {
  const items = Array.flatMap(kanaData, kanaToContentItems)
  return sql`INSERT INTO content_item ${sql.insert(items)}`
}

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* seedSkillTypes(sql)
  yield* insertKanaElements(sql)
  yield* insertContentItems(sql)
})
