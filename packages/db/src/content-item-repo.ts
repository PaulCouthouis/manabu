import { SqlClient } from "@effect/sql"
import { ContentItem } from "@manabu/domain"
import type { LinguisticElementId, SkillTypeId } from "@manabu/domain"
import { Effect, Schema } from "effect"

// --- Decoders ---

const decodeContentItem = Schema.decodeUnknown(ContentItem)

// --- Repo ---

export class ContentItemRepo extends Effect.Service<ContentItemRepo>()("ContentItemRepo", {
  effect: Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    const insert = (elementId: LinguisticElementId, skillTypeId: SkillTypeId) =>
      sql`
          INSERT INTO content_item (element_id, skill_type_id)
          VALUES (${Number(elementId)}, ${Number(skillTypeId)})
        `

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
          rows.map((row) =>
            decodeContentItem({
              id: row.id,
              linguisticElementId: row.element_id,
              skillTypeId: row.skill_type_id,
            }),
          ),
        )
      })

    return { insert, findBySkillType }
  }),
}) {}
