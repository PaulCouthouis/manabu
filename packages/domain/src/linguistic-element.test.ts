import { describe, expect, it } from "vitest"
import {
  GrammarElement,
  KanaElement,
  KanjiElement,
  LinguisticElementId,
  SentenceElement,
  validateComponentGraph,
  WordElement,
} from "./linguistic-element.js"

describe("LinguisticElement", () => {
  // --- Fixtures ---

  const kanaA = KanaElement.make({
    id: LinguisticElementId(1),
    character: "あ",
    kanaType: "hiragana",
    sortOrder: 1,
  })

  const kanjiKo = KanjiElement.make({
    id: LinguisticElementId(100),
    character: "子",
    meanings: ["child"],
    components: [],
    frequency: 200,
    strokeCount: 3,
  })

  const kanjiGaku = KanjiElement.make({
    id: LinguisticElementId(101),
    character: "学",
    meanings: ["study", "learning"],
    components: [LinguisticElementId(100)],
    frequency: 150,
    strokeCount: 8,
  })

  const wordTaberu = WordElement.make({
    id: LinguisticElementId(200),
    written: "食べる",
    meaning: "to eat",
    components: [LinguisticElementId(102), LinguisticElementId(10), LinguisticElementId(11)],
    frequency: 50,
  })

  const wordSugoi = WordElement.make({
    id: LinguisticElementId(201),
    written: "すごい",
    meaning: "amazing",
    components: [LinguisticElementId(12), LinguisticElementId(13), LinguisticElementId(14)],
    frequency: 120,
  })

  const grammarGa = GrammarElement.make({
    id: LinguisticElementId(300),
    name: "が (subject marker)",
    explanation: "Marks the subject of a sentence",
    frequency: 1,
    formCount: 1,
  })

  const sentence = SentenceElement.make({
    id: LinguisticElementId(400),
    text: "猫が好きです",
    meaning: "I like cats",
    components: [
      LinguisticElementId(202),
      LinguisticElementId(300),
      LinguisticElementId(203),
      LinguisticElementId(204),
    ],
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
        id: LinguisticElementId(50),
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
      expect(kanjiGaku.components).toEqual([LinguisticElementId(100)])
      expect(kanjiGaku.frequency).toBe(150)
      expect(kanjiGaku.strokeCount).toBe(8)
    })

    it("WordElement se construit avec kind 'word'", () => {
      expect(wordTaberu.kind).toBe("word")
      expect(wordTaberu.written).toBe("食べる")
      expect(wordTaberu.meaning).toBe("to eat")
      expect(wordTaberu.components).toEqual([
        LinguisticElementId(102),
        LinguisticElementId(10),
        LinguisticElementId(11),
      ])
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
      expect(kanjiGaku.components).toEqual([LinguisticElementId(100)])
    })

    it("validateComponentGraph détecte les cycles", () => {
      // Graphe valide : 学→子, 子→∅
      expect(validateComponentGraph([kanjiKo, kanjiGaku])).toBe(true)

      // Graphe avec cycle : A→B, B→A
      const cycleA = KanjiElement.make({
        id: LinguisticElementId(900),
        character: "X",
        meanings: ["x"],
        components: [LinguisticElementId(901)],
        frequency: 1,
        strokeCount: 1,
      })
      const cycleB = KanjiElement.make({
        id: LinguisticElementId(901),
        character: "Y",
        meanings: ["y"],
        components: [LinguisticElementId(900)],
        frequency: 1,
        strokeCount: 1,
      })
      expect(validateComponentGraph([cycleA, cycleB])).toBe(false)
    })
  })

  // AC3 — Les composants d'un WordElement sont des KanaElements/KanjiElements
  describe("composants des WordElements", () => {
    it("un mot composé de kanji + kana a les bons composants", () => {
      // 食べる = [食(kanji), べ(kana), る(kana)]
      expect(wordTaberu.components).toEqual([
        LinguisticElementId(102),
        LinguisticElementId(10),
        LinguisticElementId(11),
      ])
    })

    it("un mot tout en kana a des composants kana uniquement", () => {
      expect(wordSugoi.components).toEqual([
        LinguisticElementId(12),
        LinguisticElementId(13),
        LinguisticElementId(14),
      ])
    })
  })

  // AC4 — Les composants d'un SentenceElement sont des WordElements/GrammarElements
  describe("composants des SentenceElements", () => {
    it("une phrase référence ses mots et points de grammaire", () => {
      // 猫が好きです = [猫(word), が(grammar), 好き(word), です(word)]
      expect(sentence.components).toEqual([
        LinguisticElementId(202),
        LinguisticElementId(300),
        LinguisticElementId(203),
        LinguisticElementId(204),
      ])
    })
  })
})
