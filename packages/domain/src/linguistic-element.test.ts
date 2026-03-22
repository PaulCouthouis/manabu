import { Schema } from "effect"
import { describe, expect, it } from "vitest"
import { GrammarPointId } from "./grammar-point.js"
import {
  KanaElement,
  KanaId,
  KanjiElement,
  KanjiId,
  SentenceElement,
  SentenceId,
  validateComponentGraph,
  WordElement,
  WordId,
} from "./linguistic-element.js"

describe("LinguisticElement", () => {
  // --- Fixtures ---

  const kanaA = KanaElement.make({
    id: KanaId(1),
    character: "あ",
    kanaType: "hiragana",
    sortOrder: 1,
  })

  const kanjiKo = KanjiElement.make({
    id: KanjiId(100),
    character: "子",
    meanings: ["child"],
    components: [],
    frequency: 200,
    strokeCount: 3,
  })

  const kanjiGaku = KanjiElement.make({
    id: KanjiId(101),
    character: "学",
    meanings: ["study", "learning"],
    components: [KanjiId(100)],
    frequency: 150,
    strokeCount: 8,
  })

  const wordTaberu = WordElement.make({
    id: WordId(200),
    written: "食べる",
    meaning: "to eat",
    components: [KanjiId(102), KanaId(10), KanaId(11)],
    frequency: 50,
  })

  const wordSugoi = WordElement.make({
    id: WordId(201),
    written: "すごい",
    meaning: "amazing",
    components: [KanaId(12), KanaId(13), KanaId(14)],
    frequency: 120,
  })

  const sentence = SentenceElement.make({
    id: SentenceId(400),
    text: "猫が好きです",
    meaning: "I like cats",
    components: [WordId(202), WordId(203), WordId(204)],
    grammarPoints: [GrammarPointId(300)],
    sentenceRank: 1,
  })

  // AC1 — Les 4 sous-types de LinguisticElement sont modélisés avec union discriminée
  describe("union discriminée — 4 sous-types", () => {
    it("KanaElement se construit avec kind 'kana'", () => {
      expect(kanaA.kind).toBe("kana")
      expect(kanaA.character).toBe("あ")
      expect(kanaA.kanaType).toBe("hiragana")
      expect(kanaA.sortOrder).toBe(1)
    })

    it("KanaElement katakana se construit correctement", () => {
      const kataA = KanaElement.make({
        id: KanaId(50),
        character: "ア",
        kanaType: "katakana",
        sortOrder: 1,
      })
      expect(kataA.kind).toBe("kana")
      expect(kataA.kanaType).toBe("katakana")
    })

    it("KanjiElement se construit avec kind 'kanji'", () => {
      expect(kanjiGaku.kind).toBe("kanji")
      expect(kanjiGaku.character).toBe("学")
      expect(kanjiGaku.meanings).toEqual(["study", "learning"])
      expect(kanjiGaku.components).toEqual([KanjiId(100)])
      expect(kanjiGaku.frequency).toBe(150)
      expect(kanjiGaku.strokeCount).toBe(8)
    })

    it("WordElement se construit avec kind 'word'", () => {
      expect(wordTaberu.kind).toBe("word")
      expect(wordTaberu.written).toBe("食べる")
      expect(wordTaberu.meaning).toBe("to eat")
      expect(wordTaberu.components).toEqual([KanjiId(102), KanaId(10), KanaId(11)])
      expect(wordTaberu.frequency).toBe(50)
    })

    it("SentenceElement se construit avec kind 'sentence'", () => {
      expect(sentence.kind).toBe("sentence")
      expect(sentence.text).toBe("猫が好きです")
      expect(sentence.meaning).toBe("I like cats")
      expect(sentence.components).toHaveLength(3)
      expect(sentence.grammarPoints).toHaveLength(1)
    })
  })

  // US7 BIS AC1/AC2 — sentenceRank typé Int entre 1 et 10
  describe("SentenceElement.sentenceRank", () => {
    it("accepte un sentenceRank de 1, 5, 10", () => {
      const makeSentence = (rank: number) =>
        SentenceElement.make({
          id: SentenceId(400),
          text: "テスト",
          meaning: "test",
          components: [WordId(200)],
          grammarPoints: [GrammarPointId(300)],
          sentenceRank: rank,
        })

      expect(makeSentence(1).sentenceRank).toBe(1)
      expect(makeSentence(5).sentenceRank).toBe(5)
      expect(makeSentence(10).sentenceRank).toBe(10)
    })

    it("rejette un sentenceRank de 0, 11, ou 1.5", () => {
      const decode = Schema.decodeUnknownSync(SentenceElement)

      const base = {
        id: 400,
        kind: "sentence",
        text: "テスト",
        meaning: "test",
        components: [200],
        grammarPoints: [300],
      }

      expect(() => decode({ ...base, sentenceRank: 0 })).toThrow()
      expect(() => decode({ ...base, sentenceRank: 11 })).toThrow()
      expect(() => decode({ ...base, sentenceRank: 1.5 })).toThrow()
    })
  })

  // AC2 — Le graphe de composants des KanjiElements est un DAG valide
  describe("graphe de composants kanji", () => {
    it("un kanji de base a un tableau de composants vide", () => {
      expect(kanjiKo.components).toEqual([])
    })

    it("un kanji composé référence ses composants", () => {
      expect(kanjiGaku.components).toEqual([KanjiId(100)])
    })

    it("validateComponentGraph détecte les cycles", () => {
      expect(validateComponentGraph([kanjiKo, kanjiGaku])).toBe(true)

      const cycleA = KanjiElement.make({
        id: KanjiId(900),
        character: "X",
        meanings: ["x"],
        components: [KanjiId(901)],
        frequency: 1,
        strokeCount: 1,
      })
      const cycleB = KanjiElement.make({
        id: KanjiId(901),
        character: "Y",
        meanings: ["y"],
        components: [KanjiId(900)],
        frequency: 1,
        strokeCount: 1,
      })
      expect(validateComponentGraph([cycleA, cycleB])).toBe(false)
    })
  })

  // AC3 — Les composants d'un WordElement sont des KanaElements/KanjiElements
  describe("composants des WordElements", () => {
    it("un mot composé de kanji + kana a les bons composants", () => {
      expect(wordTaberu.components).toEqual([KanjiId(102), KanaId(10), KanaId(11)])
    })

    it("un mot tout en kana a des composants kana uniquement", () => {
      expect(wordSugoi.components).toEqual([KanaId(12), KanaId(13), KanaId(14)])
    })
  })

  // US8 AC4 — SentenceElement.components n'accepte que des WordId
  describe("composants des SentenceElements", () => {
    it("components contient uniquement des WordId", () => {
      expect(sentence.components).toEqual([WordId(202), WordId(203), WordId(204)])
    })
  })

  // US8 AC5 — SentenceElement.grammarPoints accepte un tableau de GrammarPointId
  describe("SentenceElement.grammarPoints", () => {
    it("accepte des GrammarPointId", () => {
      expect(sentence.grammarPoints).toEqual([GrammarPointId(300)])
    })

    // US8 AC6 — grammarPoints peut être vide
    it("accepte un grammarPoints vide", () => {
      const noGrammar = SentenceElement.make({
        id: SentenceId(401),
        text: "テスト",
        meaning: "test",
        components: [WordId(200)],
        grammarPoints: [],
        sentenceRank: 1,
      })
      expect(noGrammar.grammarPoints).toEqual([])
    })
  })
})
