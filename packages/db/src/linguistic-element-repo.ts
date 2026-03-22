import { SqlClient } from "@effect/sql"
import type { LinguisticElement, LinguisticElementId, LinguisticElementKind } from "@manabu/domain"
import { KanaElement, KanjiElement, SentenceElement, WordElement } from "@manabu/domain"
import { Array, Effect, Option, ParseResult, Record, Schema } from "effect"

interface ElementRow {
  readonly id: number
  readonly kind: LinguisticElementKind
  readonly character: string | null
  readonly kana_type: string | null
  readonly sort_order: number | null
  readonly meanings: ReadonlyArray<string> | null
  readonly frequency: number | null
  readonly stroke_count: number | null
  readonly written: string | null
  readonly meaning: string | null
  readonly text: string | null
  readonly name: string | null
  readonly explanation: string | null
  readonly form_count: number | null
  readonly sentence_rank: number | null
}

interface ComponentRow {
  readonly parent_id: number
  readonly component_id: number
}

const decodeKana = Schema.decodeUnknown(KanaElement)
const decodeKanji = Schema.decodeUnknown(KanjiElement)
const decodeWord = Schema.decodeUnknown(WordElement)
const decodeSentence = Schema.decodeUnknown(SentenceElement)

const decodeRow = (
  row: ElementRow,
  components: ReadonlyArray<number>,
): Effect.Effect<LinguisticElement, ParseResult.ParseError> => {
  switch (row.kind) {
    case "kana":
      return decodeKana({
        id: row.id,
        kind: "kana",
        character: row.character,
        kanaType: row.kana_type,
        sortOrder: row.sort_order,
      })
    case "kanji":
      return decodeKanji({
        id: row.id,
        kind: "kanji",
        character: row.character,
        meanings: row.meanings,
        components,
        frequency: row.frequency,
        strokeCount: row.stroke_count,
      })
    case "word":
      return decodeWord({
        id: row.id,
        kind: "word",
        written: row.written,
        meaning: row.meaning,
        components,
        frequency: row.frequency,
      })
    case "sentence":
      return decodeSentence({
        id: row.id,
        kind: "sentence",
        text: row.text,
        meaning: row.meaning,
        components,
        sentenceRank: row.sentence_rank,
      })
    default:
      return Effect.die(new Error(`Unknown element kind: ${row.kind}`))
  }
}

// --- Repo ---

export class LinguisticElementRepo extends Effect.Service<LinguisticElementRepo>()(
  "LinguisticElementRepo",
  {
    effect: Effect.gen(function* () {
      const sql = yield* SqlClient.SqlClient

      const findById = (id: LinguisticElementId) =>
        Effect.gen(function* () {
          const rows = yield* sql<ElementRow>`
            SELECT * FROM linguistic_element WHERE id = ${Number(id)}
          `
          return yield* Array.head(rows).pipe(
            Option.match({
              onNone: () => Effect.succeed(Option.none<LinguisticElement>()),
              onSome: (row) =>
                Effect.gen(function* () {
                  const comps = yield* sql<ComponentRow>`
                    SELECT component_id FROM element_component WHERE parent_id = ${row.id} ORDER BY position
                  `
                  const element = yield* decodeRow(
                    row,
                    Array.map(comps, (r) => r.component_id),
                  )
                  return Option.some(element)
                }),
            }),
          )
        })

      const findByKind = (kind: LinguisticElementKind) =>
        Effect.gen(function* () {
          const rows = yield* sql<ElementRow>`
            SELECT * FROM linguistic_element WHERE kind = ${kind} ORDER BY id
          `
          if (Array.isEmptyReadonlyArray(rows)) return Array.empty<LinguisticElement>()

          const ids = Array.map(rows, (r) => r.id)
          const allComps = yield* sql<ComponentRow>`
            SELECT parent_id, component_id FROM element_component
            WHERE parent_id IN ${sql.in(ids)}
            ORDER BY parent_id, position
          `

          const compsByParent = Array.groupBy(allComps, (c) => String(c.parent_id))

          return yield* Effect.all(
            Array.map(rows, (row) =>
              decodeRow(
                row,
                Record.get(compsByParent, String(row.id)).pipe(
                  Option.map(Array.map((c) => c.component_id)),
                  Option.getOrElse(() => Array.empty<number>()),
                ),
              ),
            ),
          )
        })

      return { findById, findByKind }
    }),
  },
) {}
