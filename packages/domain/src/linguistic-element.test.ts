import { describe, expect, it } from "vitest"
import {
  GrammarElement,
  GrammarId,
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

  const grammarGa = GrammarElement.make({
    id: GrammarId(300),
    name: "が (subject marker)",
    explanation: "Marks the subject of a sentence",
    frequency: 1,
    formCount: 1,
  })

  const sentence = SentenceElement.make({
    id: SentenceId(400),
    text: "猫が好きです",
    meaning: "I like cats",
    components: [WordId(202), GrammarId(300), WordId(203), WordId(204)],
  })

  // AC1 — Les 5 sous-types de LinguisticElement sont modélisés avec union discriminée
  describe("union discriminée — 5 sous-types", () => {
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
      expect(sentence.components).toHaveLength(4)
    })

    it("GrammarElement se construit avec kind 'grammar'", () => {
      expect(grammarGa.kind).toBe("grammar")
      expect(grammarGa.name).toBe("が (subject marker)")
      expect(grammarGa.explanation).toBe("Marks the subject of a sentence")
      expect(grammarGa.frequency).toBe(1)
      expect(grammarGa.formCount).toBe(1)
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

  // AC4 — Les composants d'un SentenceElement sont des WordElements/GrammarElements
  describe("composants des SentenceElements", () => {
    it("une phrase référence ses mots et points de grammaire", () => {
      expect(sentence.components).toEqual([WordId(202), GrammarId(300), WordId(203), WordId(204)])
    })
  })
})
