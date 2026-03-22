import { Brand, Schema } from "effect"
import { validateDag } from "./dag.js"

// --- Base Id ---

export type LinguisticElementId = number & Brand.Brand<"LinguisticElementId">
export const LinguisticElementId = Brand.nominal<LinguisticElementId>()
export const LinguisticElementIdSchema = Schema.Number.pipe(Schema.fromBrand(LinguisticElementId))

// --- Branded Ids par kind ---

export type KanaId = LinguisticElementId & Brand.Brand<"KanaId">
export const KanaId = Brand.nominal<KanaId>()
export const KanaIdSchema = Schema.Number.pipe(Schema.fromBrand(KanaId))

export type KanjiId = LinguisticElementId & Brand.Brand<"KanjiId">
export const KanjiId = Brand.nominal<KanjiId>()
export const KanjiIdSchema = Schema.Number.pipe(Schema.fromBrand(KanjiId))

export type WordId = LinguisticElementId & Brand.Brand<"WordId">
export const WordId = Brand.nominal<WordId>()
export const WordIdSchema = Schema.Number.pipe(Schema.fromBrand(WordId))

export type SentenceId = LinguisticElementId & Brand.Brand<"SentenceId">
export const SentenceId = Brand.nominal<SentenceId>()
export const SentenceIdSchema = Schema.Number.pipe(Schema.fromBrand(SentenceId))

export type GrammarId = LinguisticElementId & Brand.Brand<"GrammarId">
export const GrammarId = Brand.nominal<GrammarId>()
export const GrammarIdSchema = Schema.Number.pipe(Schema.fromBrand(GrammarId))

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
  id: KanaIdSchema,
  kind: kindField("kana"),
  character: Schema.String,
  kanaType: KanaTypeSchema,
  sortOrder: Schema.Number,
}) {}

// --- Kanji ---

export class KanjiElement extends Schema.Class<KanjiElement>("KanjiElement")({
  id: KanjiIdSchema,
  kind: kindField("kanji"),
  character: Schema.String,
  meanings: Schema.Array(Schema.String),
  components: Schema.Array(KanjiIdSchema),
  frequency: Schema.Number,
  strokeCount: Schema.Number,
}) {}

// --- Word ---

export class WordElement extends Schema.Class<WordElement>("WordElement")({
  id: WordIdSchema,
  kind: kindField("word"),
  written: Schema.String,
  meaning: Schema.String,
  components: Schema.NonEmptyArray(Schema.Union(KanaIdSchema, KanjiIdSchema)),
  frequency: Schema.Number,
}) {}

// --- Sentence ---

export class SentenceElement extends Schema.Class<SentenceElement>("SentenceElement")({
  id: SentenceIdSchema,
  kind: kindField("sentence"),
  text: Schema.String,
  meaning: Schema.String,
  components: Schema.NonEmptyArray(Schema.Union(WordIdSchema, GrammarIdSchema)),
  sentenceRank: Schema.Int.pipe(Schema.between(1, 10)),
}) {}

// --- Union discriminée ---

export type LinguisticElement = KanaElement | KanjiElement | WordElement | SentenceElement

export type LinguisticElementKind = LinguisticElement["kind"]

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
