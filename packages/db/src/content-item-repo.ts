import { SqlClient } from "@effect/sql"
import { ContentItem } from "@manabu/domain"
import type { LinguisticElementId, SkillTypeId } from "@manabu/domain"
import { Array, Effect, Schema } from "effect"

const decodeContentItem = Schema.decodeUnknown(ContentItem)

type ContentItemRow = { id: number; element_id: number; skill_type_id: number }

const decodeRows = (rows: ReadonlyArray<ContentItemRow>) =>
  Effect.all(
    Array.map(rows, (row) =>
      decodeContentItem({
        id: row.id,
        linguisticElementId: row.element_id,
        skillTypeId: row.skill_type_id,
      }),
    ),
  )

export class ContentItemRepo extends Effect.Service<ContentItemRepo>()("ContentItemRepo", {
  effect: Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    const findBySkillType = (skillTypeId: SkillTypeId) =>
      Effect.gen(function* () {
        const rows = yield* sql<ContentItemRow>`
            SELECT * FROM content_item WHERE skill_type_id = ${Number(skillTypeId)} ORDER BY id
          `
        return yield* decodeRows(rows)
      })

    const findByElementId = (elementId: LinguisticElementId) =>
      Effect.gen(function* () {
        const rows = yield* sql<ContentItemRow>`
            SELECT * FROM content_item WHERE element_id = ${Number(elementId)} ORDER BY skill_type_id
          `
        return yield* decodeRows(rows)
      })

    return { findBySkillType, findByElementId }
  }),
}) {}
