import { describe, expect, it } from "vitest"
import { counterWordData } from "./counter-word-data.js"
import { kanjiData } from "./kanji-data/index.js"
import { Array, Number as N, Struct } from "effect"

const n = (x: number): number => {
  return x
}

const allKanjiIds = new Set(Array.map(kanjiData, (k) => n(k.id)))

describe("counter-word-data", () => {
  // AC-W1 — 52 WordElements présents (10 nombres + 42 combinaisons)
  it("contains 52 words", () => {
    expect(counterWordData.length).toBe(52)
  })

  // AC-W2 — IDs continus 10000-10051
  it("has continuous IDs from 10000 to 10051", () => {
    const ids = Array.map(counterWordData, (w) => n(w.id))
    const sorted = Array.sort(ids, N.Order)
    const expected = Array.range(10000, 10051)
    expect(sorted).toEqual(expected)
  })

  // AC-W3 — Les combinaisons utilisent des chiffres arabes dans written
  it("counter combinations use arabic numerals in written form", () => {
    const combinations = Array.filter(counterWordData, (w) => n(w.id) >= 10010)
    for (const w of combinations) {
      expect(
        /\d/.test(w.written),
        `Combination ${w.written} (id ${n(w.id)}) should contain arabic numerals`,
      ).toBe(true)
    }
  })

  // AC-W4 — Les components ne contiennent que des KanjiId valides
  it("all components are valid KanjiIds from kanji dataset", () => {
    for (const w of counterWordData) {
      for (const cid of w.components) {
        const id = n(cid)
        expect(
          id,
          `Word ${w.written}: component ${id} should be >= 1000 (KanjiId)`,
        ).toBeGreaterThanOrEqual(1000)
        expect(
          allKanjiIds.has(id),
          `Word ${w.written}: KanjiId ${id} not found in kanji dataset`,
        ).toBe(true)
      }
    }
  })

  it("has no duplicate written forms", () => {
    const writtens = Array.map(counterWordData, Struct.get("written"))
    const unique = new Set(writtens)
    expect(unique.size).toBe(counterWordData.length)
  })

  it("has non-empty meaning for every word", () => {
    for (const w of counterWordData) {
      expect(w.meaning.length, `Word ${w.written} has empty meaning`).toBeGreaterThan(0)
    }
  })

  it("has positive frequency for every word", () => {
    for (const w of counterWordData) {
      expect(w.frequency, `Word ${w.written} has non-positive frequency`).toBeGreaterThan(0)
    }
  })

  it("has non-empty components for every word", () => {
    for (const w of counterWordData) {
      expect(w.components.length, `Word ${w.written} has empty components`).toBeGreaterThan(0)
    }
  })

  // Numbers (IDs 10000-10009) should use kanji in written form
  it("number words use kanji in written form", () => {
    const numbers = Array.filter(counterWordData, (w) => n(w.id) <= 10009)
    expect(numbers.length).toBe(10)
    for (const w of numbers) {
      expect(/\d/.test(w.written), `Number ${w.written} should NOT contain arabic numerals`).toBe(
        false,
      )
    }
  })
})
