import { describe, expect, it } from "vitest"
import { kanaData } from "./kana-data.js"
import { Array, Number, pipe, Struct } from "effect"

describe("kana-data", () => {
  const [katakana, hiragana] = Array.partition(kanaData, (k) => k.kanaType === "hiragana")

  // AC1 — 104 hiragana présents
  it("contains 104 hiragana", () => {
    expect(hiragana.length).toBe(104)
  })

  // AC2 — 104 katakana présents
  it("contains 104 katakana", () => {
    expect(katakana.length).toBe(104)
  })

  // AC3 — sortOrder continu 1-208, pas de trou ni doublon
  it("has continuous sortOrder from 1 to 208", () => {
    const sortOrders = Array.map(kanaData, Struct.get("sortOrder"))
    const sorted = Array.sort(sortOrders, Number.Order)
    const expected = Array.range(1, 208)
    expect(sorted).toEqual(expected)
  })

  // AC4 — pas de character en doublon
  it("has no duplicate characters", () => {
    const characters = Array.map(kanaData, Struct.get("character"))
    const unique = new Set(characters)
    expect(unique.size).toBe(kanaData.length)
  })

  it("hiragana sortOrder range is 1-104", () => {
    const orders = pipe(hiragana, Array.map(Struct.get("sortOrder")), Array.sort(Number.Order))
    expect(orders[0]).toBe(1)
    expect(orders[orders.length - 1]).toBe(104)
  })

  it("katakana sortOrder range is 105-208", () => {
    const orders = pipe(katakana, Array.map(Struct.get("sortOrder")), Array.sort(Number.Order))
    expect(orders[0]).toBe(105)
    expect(orders[orders.length - 1]).toBe(208)
  })

  it("each kana has a unique id matching its sortOrder", () => {
    const ids = Array.map(kanaData, Struct.get("id"))
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(kanaData.length)
    for (const k of kanaData) {
      expect(k.id).toBe(k.sortOrder)
    }
  })
})
