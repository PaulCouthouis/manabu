import { assert, layer } from "@effect/vitest"
import {
  GrammarElement,
  GrammarId,
  KanaElement,
  KanaId,
  KanjiElement,
  KanjiId,
  SentenceElement,
  SentenceId,
  SkillTypeId,
  WordElement,
  WordId,
} from "@manabu/domain"
import { Effect, Layer, Option } from "effect"
import { ContentItemRepo } from "./content-item-repo.js"
import { LinguisticElementRepo } from "./linguistic-element-repo.js"
import { runMigrations } from "./migrations/index.js"
import { SkillTypeRepo } from "./skill-type-repo.js"
import { TestSqlLayer } from "./test-utils.js"

const TestLayer = Layer.mergeAll(
  LinguisticElementRepo.Default,
  ContentItemRepo.Default,
  SkillTypeRepo.Default,
).pipe(Layer.provideMerge(TestSqlLayer))

layer(TestLayer, { timeout: 60_000 })(
  "LinguisticElementRepo & ContentItemRepo — PostgreSQL",
  (it) => {
    // AC7 — Les éléments sont queryables par kind
    it.effect("insert and query kana elements by kind", () =>
      Effect.gen(function* () {
        yield* runMigrations
        const repo = yield* LinguisticElementRepo

        const kana = KanaElement.make({
          id: KanaId(0),
          character: "あ",
          kanaType: "hiragana",
          sortOrder: 1,
        })

        yield* repo.insert(kana)
        const results = yield* repo.findByKind("kana")

        assert.strictEqual(results.length, 1)
        const found = results[0] as KanaElement
        assert.strictEqual(found.kind, "kana")
        assert.strictEqual(found.character, "あ")
        assert.strictEqual(found.kanaType, "hiragana")
        assert.strictEqual(found.sortOrder, 1)
      }),
    )

    // AC9 — Round-trip pour chaque sous-type avec composants
    it.effect("round-trip kanji with components", () =>
      Effect.gen(function* () {
        yield* runMigrations
        const repo = yield* LinguisticElementRepo

        // Insert base kanji first
        const koId = yield* repo.insert(
          KanjiElement.make({
            id: KanjiId(0),
            character: "子",
            meanings: ["child"],
            components: [],
            frequency: 200,
            strokeCount: 3,
          }),
        )

        // Insert composed kanji
        const gakuId = yield* repo.insert(
          KanjiElement.make({
            id: KanjiId(0),
            character: "学",
            meanings: ["study", "learning"],
            components: [koId as KanjiId],
            frequency: 150,
            strokeCount: 8,
          }),
        )

        const found = yield* repo.findById(gakuId)
        assert.ok(Option.isSome(found))
        const gaku = found.value as KanjiElement
        assert.strictEqual(gaku.kind, "kanji")
        assert.strictEqual(gaku.character, "学")
        assert.deepStrictEqual(gaku.meanings, ["study", "learning"])
        assert.strictEqual(gaku.components.length, 1)
        assert.strictEqual(gaku.components[0], koId)
        assert.strictEqual(gaku.frequency, 150)
        assert.strictEqual(gaku.strokeCount, 8)
      }),
    )

    it.effect("round-trip word with kana/kanji components", () =>
      Effect.gen(function* () {
        yield* runMigrations
        const repo = yield* LinguisticElementRepo

        // Insert component elements
        const kanjiId = yield* repo.insert(
          KanjiElement.make({
            id: KanjiId(0),
            character: "食",
            meanings: ["eat"],
            components: [],
            frequency: 300,
            strokeCount: 9,
          }),
        )

        const kanaBeId = yield* repo.insert(
          KanaElement.make({ id: KanaId(0), character: "べ", kanaType: "hiragana", sortOrder: 33 }),
        )

        const kanaRuId = yield* repo.insert(
          KanaElement.make({ id: KanaId(0), character: "る", kanaType: "hiragana", sortOrder: 39 }),
        )

        // Insert word
        const wordId = yield* repo.insert(
          WordElement.make({
            id: WordId(0),
            written: "食べる",
            meaning: "to eat",
            components: [
              kanjiId as KanaId | KanjiId,
              kanaBeId as KanaId | KanjiId,
              kanaRuId as KanaId | KanjiId,
            ],
            frequency: 50,
          }),
        )

        const found = yield* repo.findById(wordId)
        assert.ok(Option.isSome(found))
        const word = found.value as WordElement
        assert.strictEqual(word.kind, "word")
        assert.strictEqual(word.written, "食べる")
        assert.strictEqual(word.meaning, "to eat")
        assert.strictEqual(word.components.length, 3)
        assert.strictEqual(word.frequency, 50)
      }),
    )

    it.effect("round-trip grammar element", () =>
      Effect.gen(function* () {
        yield* runMigrations
        const repo = yield* LinguisticElementRepo

        const grammarId = yield* repo.insert(
          GrammarElement.make({
            id: GrammarId(0),
            name: "が (subject marker)",
            explanation: "Marks the subject",
            frequency: 1,
            formCount: 1,
          }),
        )

        const found = yield* repo.findById(grammarId)
        assert.ok(Option.isSome(found))
        const grammar = found.value as GrammarElement
        assert.strictEqual(grammar.kind, "grammar")
        assert.strictEqual(grammar.name, "が (subject marker)")
        assert.strictEqual(grammar.formCount, 1)
      }),
    )

    it.effect("round-trip sentence with word/grammar components", () =>
      Effect.gen(function* () {
        yield* runMigrations
        const repo = yield* LinguisticElementRepo

        // Insert a kana component first so the word has a valid FK
        const kanaNeId = yield* repo.insert(
          KanaElement.make({ id: KanaId(0), character: "ね", kanaType: "hiragana", sortOrder: 24 }),
        )

        const nekoId = yield* repo.insert(
          WordElement.make({
            id: WordId(0),
            written: "猫",
            meaning: "cat",
            components: [kanaNeId as KanaId | KanjiId],
            frequency: 800,
          }),
        )

        const gaId = yield* repo.insert(
          GrammarElement.make({
            id: GrammarId(0),
            name: "が",
            explanation: "subject marker",
            frequency: 1,
            formCount: 1,
          }),
        )

        const sentenceId = yield* repo.insert(
          SentenceElement.make({
            id: SentenceId(0),
            text: "猫が好きです",
            meaning: "I like cats",
            components: [nekoId as WordId | GrammarId, gaId as WordId | GrammarId],
          }),
        )

        const found = yield* repo.findById(sentenceId)
        assert.ok(Option.isSome(found))
        const sentence = found.value as SentenceElement
        assert.strictEqual(sentence.kind, "sentence")
        assert.strictEqual(sentence.text, "猫が好きです")
        assert.strictEqual(sentence.components.length, 2)
      }),
    )

    // AC8 — Content items queryables par skill type
    it.effect("content items are queryable by skill type", () =>
      Effect.gen(function* () {
        yield* runMigrations
        const elemRepo = yield* LinguisticElementRepo
        const contentRepo = yield* ContentItemRepo
        const skillRepo = yield* SkillTypeRepo
        yield* skillRepo.seed

        const kanjiId = yield* elemRepo.insert(
          KanjiElement.make({
            id: KanjiId(0),
            character: "猫",
            meanings: ["cat"],
            components: [],
            frequency: 800,
            strokeCount: 11,
          }),
        )

        // Insert content item for skill 5 (kanji meaning)
        yield* contentRepo.insert(kanjiId, SkillTypeId(5))

        const items = yield* contentRepo.findBySkillType(SkillTypeId(5))
        assert.strictEqual(items.length, 1)
        const first = items[0]
        assert.ok(first)
        assert.strictEqual(first.skillTypeId, SkillTypeId(5))
      }),
    )

    // AC6 — La contrainte UNIQUE empêche les doublons
    it.effect("UNIQUE constraint prevents duplicate content items", () =>
      Effect.gen(function* () {
        yield* runMigrations
        const elemRepo = yield* LinguisticElementRepo
        const contentRepo = yield* ContentItemRepo
        const skillRepo = yield* SkillTypeRepo
        yield* skillRepo.seed

        const kanjiId = yield* elemRepo.insert(
          KanjiElement.make({
            id: KanjiId(0),
            character: "猫",
            meanings: ["cat"],
            components: [],
            frequency: 800,
            strokeCount: 11,
          }),
        )

        yield* contentRepo.insert(kanjiId, SkillTypeId(5))

        const result = yield* Effect.either(contentRepo.insert(kanjiId, SkillTypeId(5)))
        assert.ok(result._tag === "Left")
      }),
    )
  },
)
