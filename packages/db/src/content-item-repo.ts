import { SqlClient } from "@effect/sql"
import { ContentItem } from "@manabu/domain"
import type { SkillTypeId } from "@manabu/domain"
import { Array, Effect, Schema } from "effect"

const decodeContentItem = Schema.decodeUnknown(ContentItem)

export class ContentItemRepo extends Effect.Service<ContentItemRepo>()("ContentItemRepo", {
  effect: Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    const findBySkillType = (skillTypeId: SkillTypeId) =>
      Effect.gen(function* () {
        const rows = yield* sql<{
          id: number
          element_id: number
          skill_type_id: number
        }>`
            SELECT * FROM content_item WHERE skill_type_id = ${Number(skillTypeId)} ORDER BY id
          `
        return yield* Effect.all(
          Array.map(rows, (row) =>
            decodeContentItem({
              id: row.id,
              linguisticElementId: row.element_id,
              skillTypeId: row.skill_type_id,
            }),
          ),
        )
      })

    return { findBySkillType }
  }),
}) {}
