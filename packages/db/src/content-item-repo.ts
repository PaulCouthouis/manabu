import { SqlClient } from "@effect/sql"
import {
  ContentItem,
  ContentItemIdSchema,
  GrammarPointIdSchema,
  LinguisticElementIdSchema,
} from "@manabu/domain"
import type {
  ElementComponent,
  ElementGrammarPoint,
  GrammarPointContentItem,
  GrammarPointId,
  LinguisticElementId,
  SkillTypeId,
} from "@manabu/domain"
import { Array, Effect, Schema } from "effect"

type ContentItemRow = { id: number; element_id: number; skill_type_id: number }

const decodeContentItems = Schema.decode(Schema.Array(ContentItem))

const decodeContentItemRows = (rows: ReadonlyArray<ContentItemRow>) => {
  return decodeContentItems(
    Array.map(rows, (row) => ({
      id: row.id,
      linguisticElementId: row.element_id,
      skillTypeId: row.skill_type_id,
    })),
  )
}

const ElementComponentSchema = Schema.Struct({
  elementId: LinguisticElementIdSchema,
  componentId: LinguisticElementIdSchema,
})
const decodeElementComponents = Schema.decode(Schema.Array(ElementComponentSchema))

const ElementGrammarPointSchema = Schema.Struct({
  elementId: LinguisticElementIdSchema,
  grammarPointId: GrammarPointIdSchema,
})
const decodeElementGrammarPoints = Schema.decode(Schema.Array(ElementGrammarPointSchema))

const GrammarPointContentItemSchema = Schema.Struct({
  grammarPointId: GrammarPointIdSchema,
  contentItemId: ContentItemIdSchema,
})
const decodeGrammarPointContentItems = Schema.decode(Schema.Array(GrammarPointContentItemSchema))

export class ContentItemRepo extends Effect.Service<ContentItemRepo>()("ContentItemRepo", {
  effect: Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient

    const findBySkillType = (skillTypeId: SkillTypeId) => {
      return Effect.gen(function* () {
        const rows = yield* sql<ContentItemRow>`
          SELECT * FROM content_item WHERE skill_type_id = ${Number(skillTypeId)} ORDER BY id
        `
        return yield* decodeContentItemRows(rows)
      })
    }

    const findByElementId = (elementId: LinguisticElementId) => {
      return Effect.gen(function* () {
        const rows = yield* sql<ContentItemRow>`
          SELECT * FROM content_item WHERE element_id = ${Number(elementId)} ORDER BY skill_type_id
        `
        return yield* decodeContentItemRows(rows)
      })
    }

    const findByElementAndSkills = (
      elementIds: ReadonlyArray<LinguisticElementId>,
      skillIds: ReadonlyArray<SkillTypeId>,
    ) => {
      return Effect.gen(function* () {
        if (elementIds.length === 0 || skillIds.length === 0) {
          return []
        }
        const eIds = Array.map(elementIds, Number)
        const sIds = Array.map(skillIds, Number)
        const rows = yield* sql<ContentItemRow>`
          SELECT * FROM content_item
          WHERE element_id IN ${sql.in(eIds)}
            AND skill_type_id IN ${sql.in(sIds)}
          ORDER BY id
        `
        return yield* decodeContentItemRows(rows)
      })
    }

    const findComponentIds = (elementIds: ReadonlyArray<LinguisticElementId>) => {
      return Effect.gen(function* () {
        if (elementIds.length === 0) {
          return []
        }
        const ids = Array.map(elementIds, Number)
        const rows = yield* sql<{ parent_id: number; component_id: number }>`
          SELECT parent_id, component_id FROM element_component
          WHERE parent_id IN ${sql.in(ids)}
          ORDER BY parent_id, position
        `
        return yield* decodeElementComponents(
          Array.map(rows, (r) => ({
            elementId: r.parent_id,
            componentId: r.component_id,
          })),
        )
      })
    }

    const findGrammarPointIds = (elementIds: ReadonlyArray<LinguisticElementId>) => {
      return Effect.gen(function* () {
        if (elementIds.length === 0) {
          return []
        }
        const ids = Array.map(elementIds, Number)
        const rows = yield* sql<{ sentence_id: number; grammar_point_id: number }>`
          SELECT sentence_id, grammar_point_id FROM sentence_grammar_point
          WHERE sentence_id IN ${sql.in(ids)}
        `
        return yield* decodeElementGrammarPoints(
          Array.map(rows, (r) => ({
            elementId: r.sentence_id,
            grammarPointId: r.grammar_point_id,
          })),
        )
      })
    }

    const findContentItemsByGrammarPoints = (
      grammarPointIds: ReadonlyArray<GrammarPointId>,
      skillIds: ReadonlyArray<SkillTypeId>,
    ) => {
      return Effect.gen(function* () {
        if (grammarPointIds.length === 0 || skillIds.length === 0) {
          return []
        }
        const gpIds = Array.map(grammarPointIds, Number)
        const sIds = Array.map(skillIds, Number)
        const rows = yield* sql<{ grammar_point_id: number; content_item_id: number }>`
          SELECT DISTINCT sgp.grammar_point_id, ci.id AS content_item_id
          FROM sentence_grammar_point sgp
          JOIN content_item ci ON ci.element_id = sgp.sentence_id
          WHERE sgp.grammar_point_id IN ${sql.in(gpIds)}
            AND ci.skill_type_id IN ${sql.in(sIds)}
        `
        return yield* decodeGrammarPointContentItems(
          Array.map(rows, (r) => ({
            grammarPointId: r.grammar_point_id,
            contentItemId: r.content_item_id,
          })),
        )
      })
    }

    return {
      findBySkillType,
      findByElementId,
      findByElementAndSkills,
      findComponentIds,
      findGrammarPointIds,
      findContentItemsByGrammarPoints,
    }
  }),
}) {}
