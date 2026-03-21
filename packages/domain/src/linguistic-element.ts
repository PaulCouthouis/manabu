import { Brand, Schema } from "effect"
import { validateDag } from "./dag.js"

// --- Id ---

export type LinguisticElementId = number & Brand.Brand<"LinguisticElementId">
export const LinguisticElementId = Brand.nominal<LinguisticElementId>()
export const LinguisticElementIdSchema = Schema.Number.pipe(Schema.fromBrand(LinguisticElementId))

// --- Helpers ---

const kindField = <const K extends string>(kind: K) =>
  Schema.Literal(kind).pipe(
    Schema.propertySignature,
    Schema.withConstructorDefault(() => kind),
  )

// --- Kana ---

export const KanaTypeSchema = Schema.Literal("hiragana", "katakana")
export type KanaType = typeof KanaTypeSchema.Type

export class KanaElement extends Schema.Class<KanaElement>("KanaElement")({
  id: LinguisticElementIdSchema,
  kind: kindField("kana"),
  character: Schema.String,
  kanaType: KanaTypeSchema,
  sortOrder: Schema.Number,
}) {}

// --- Kanji ---

export class KanjiElement extends Schema.Class<KanjiElement>("KanjiElement")({
  id: LinguisticElementIdSchema,
  kind: kindField("kanji"),
  character: Schema.String,
  meanings: Schema.Array(Schema.String),
  components: Schema.Array(LinguisticElementIdSchema),
  frequency: Schema.Number,
  strokeCount: Schema.Number,
}) {}

// --- Word ---

export class WordElement extends Schema.Class<WordElement>("WordElement")({
  id: LinguisticElementIdSchema,
  kind: kindField("word"),
  written: Schema.String,
  meaning: Schema.String,
  components: Schema.NonEmptyArray(LinguisticElementIdSchema),
  frequency: Schema.Number,
}) {}

// --- Sentence ---

export class SentenceElement extends Schema.Class<SentenceElement>("SentenceElement")({
  id: LinguisticElementIdSchema,
  kind: kindField("sentence"),
  text: Schema.String,
  meaning: Schema.String,
  components: Schema.NonEmptyArray(LinguisticElementIdSchema),
}) {}

// --- Grammar ---

export class GrammarElement extends Schema.Class<GrammarElement>("GrammarElement")({
  id: LinguisticElementIdSchema,
  kind: kindField("grammar"),
  name: Schema.String,
  explanation: Schema.String,
  frequency: Schema.Number,
  formCount: Schema.Number,
}) {}

// --- Union discriminée ---

export type LinguisticElement =
  | KanaElement
  | KanjiElement
  | WordElement
  | SentenceElement
  | GrammarElement

// --- Validation du graphe de composants ---

export const validateComponentGraph = (
  elements: ReadonlyArray<{
    readonly id: LinguisticElementId
    readonly components: ReadonlyArray<LinguisticElementId>
  }>,
): boolean => {
  const byId = new Map(elements.map((e) => [e.id, e]))
  return validateDag(
    elements.map((e) => e.id),
    (id) => byId.get(id)?.components ?? [],
  )
}
