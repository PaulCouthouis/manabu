import { SqlClient } from "@effect/sql"
import type { LinguisticElement, LinguisticElementId, LinguisticElementKind } from "@manabu/domain"
import {
  GrammarElement,
  GrammarIdSchema,
  KanaElement,
  KanaIdSchema,
  KanjiElement,
  KanjiIdSchema,
  SentenceElement,
  SentenceIdSchema,
  WordElement,
  WordIdSchema,
} from "@manabu/domain"
import { Array, Effect, Option, ParseResult, Record, Schema } from "effect"

// --- Row types ---

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
}

interface ComponentRow {
  readonly parent_id: number
  readonly component_id: number
}

interface InsertedRow {
  readonly id: number
}

// --- Decoders ---

const decodeKana = Schema.decodeUnknown(KanaElement)
const decodeKanji = Schema.decodeUnknown(KanjiElement)
const decodeWord = Schema.decodeUnknown(WordElement)
const decodeSentence = Schema.decodeUnknown(SentenceElement)
const decodeGrammar = Schema.decodeUnknown(GrammarElement)

const decodeKanaId = Schema.decodeUnknown(KanaIdSchema)
const decodeKanjiId = Schema.decodeUnknown(KanjiIdSchema)
const decodeWordId = Schema.decodeUnknown(WordIdSchema)
const decodeSentenceId = Schema.decodeUnknown(SentenceIdSchema)
const decodeGrammarId = Schema.decodeUnknown(GrammarIdSchema)

// --- Helpers ---

const getInsertedId = (rows: ReadonlyArray<InsertedRow>) =>
  Array.head(rows).pipe(
    Option.map((row) => row.id),
    Option.getOrThrow,
  )

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
      })
    case "grammar":
      return decodeGrammar({
        id: row.id,
        kind: "grammar",
        name: row.name,
        explanation: row.explanation,
        frequency: row.frequency,
        formCount: row.form_count,
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

      const insertComponents = (
        parentId: number,
        componentIds: ReadonlyArray<LinguisticElementId>,
      ) =>
        Effect.gen(function* () {
          if (Array.isEmptyReadonlyArray(componentIds)) return
          const rows = Array.map(componentIds, (compId, i) => ({
            parent_id: parentId,
            component_id: Number(compId),
            position: i,
          }))
          yield* sql`INSERT INTO element_component ${sql.insert(rows)}`
        })

      const insert = (element: LinguisticElement) =>
        Effect.gen(function* () {
          switch (element.kind) {
            case "kana": {
              const rows = yield* sql<InsertedRow>`
                INSERT INTO linguistic_element (kind, character, kana_type, sort_order)
                VALUES ('kana', ${element.character}, ${element.kanaType}, ${element.sortOrder})
                RETURNING id
              `
              return yield* decodeKanaId(getInsertedId(rows))
            }
            case "kanji": {
              const rows = yield* sql<InsertedRow>`
                INSERT INTO linguistic_element (kind, character, meanings, frequency, stroke_count)
                VALUES ('kanji', ${element.character}, ${JSON.stringify(element.meanings)}, ${element.frequency}, ${element.strokeCount})
                RETURNING id
              `
              const id = getInsertedId(rows)
              yield* insertComponents(id, element.components)
              return yield* decodeKanjiId(id)
            }
            case "word": {
              const rows = yield* sql<InsertedRow>`
                INSERT INTO linguistic_element (kind, written, meaning, frequency)
                VALUES ('word', ${element.written}, ${element.meaning}, ${element.frequency})
                RETURNING id
              `
              const id = getInsertedId(rows)
              yield* insertComponents(id, element.components)
              return yield* decodeWordId(id)
            }
            case "sentence": {
              const rows = yield* sql<InsertedRow>`
                INSERT INTO linguistic_element (kind, text, meaning)
                VALUES ('sentence', ${element.text}, ${element.meaning})
                RETURNING id
              `
              const id = getInsertedId(rows)
              yield* insertComponents(id, element.components)
              return yield* decodeSentenceId(id)
            }
            case "grammar": {
              const rows = yield* sql<InsertedRow>`
                INSERT INTO linguistic_element (kind, name, explanation, frequency, form_count)
                VALUES ('grammar', ${element.name}, ${element.explanation}, ${element.frequency}, ${element.formCount})
                RETURNING id
              `
              return yield* decodeGrammarId(getInsertedId(rows))
            }
          }
        })

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

      return { insert, findById, findByKind }
    }),
  },
) {}
