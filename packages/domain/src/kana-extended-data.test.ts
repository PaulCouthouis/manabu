import { describe, expect, it } from "vitest"
import { kanaExtendedData, sokuonChoonIds } from "./kana-extended-data.js"
import { Array, HashSet, Number, Option, Struct } from "effect"

describe("kana-extended-data", () => {
  // AC-K1 — 16 kana supplémentaires présents
  it("contains 16 extended kana", () => {
    expect(kanaExtendedData.length).toBe(16)
  })

  it("contains 3 sokuon/chōon", () => {
    const sokuonChoon = Array.filter(kanaExtendedData, (k) => HashSet.has(sokuonChoonIds, k.id))
    expect(sokuonChoon.length).toBe(3)
  })

  it("contains 13 extended katakana", () => {
    const extended = Array.filter(kanaExtendedData, (k) => !HashSet.has(sokuonChoonIds, k.id))
    expect(extended.length).toBe(13)
  })

  // AC-K2 — IDs continus 209-224
  it("has continuous IDs from 209 to 224", () => {
    const ids = Array.map(kanaExtendedData, Struct.get("sortOrder"))
    const sorted = Array.sort(ids, Number.Order)
    const expected = Array.range(209, 224)
    expect(sorted).toEqual(expected)
  })

  it("has no duplicate characters", () => {
    const characters = Array.map(kanaExtendedData, Struct.get("character"))
    const unique = new Set(characters)
    expect(unique.size).toBe(kanaExtendedData.length)
  })

  it("sokuon っ is hiragana", () => {
    const sokuonH = Array.findFirst(kanaExtendedData, (k) => k.character === "っ")
    expect(Option.isSome(sokuonH)).toBe(true)
    if (Option.isSome(sokuonH)) {
      expect(sokuonH.value.kanaType).toBe("hiragana")
    }
  })

  it("sokuon ッ and chōon ー are katakana", () => {
    const sokuonK = Array.findFirst(kanaExtendedData, (k) => k.character === "ッ")
    const choon = Array.findFirst(kanaExtendedData, (k) => k.character === "ー")
    expect(Option.isSome(sokuonK)).toBe(true)
    expect(Option.isSome(choon)).toBe(true)
    if (Option.isSome(sokuonK)) expect(sokuonK.value.kanaType).toBe("katakana")
    if (Option.isSome(choon)) expect(choon.value.kanaType).toBe("katakana")
  })

  it("all extended katakana are katakana type", () => {
    const extended = Array.filter(kanaExtendedData, (k) => !HashSet.has(sokuonChoonIds, k.id))
    for (const k of extended) {
      expect(k.kanaType).toBe("katakana")
    }
  })
})
