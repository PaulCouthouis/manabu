import { describe, expect, it } from "vitest"
import { kanjiData } from "./kanji-data/index.js"
import { Array, Order } from "effect"
import { validateComponentGraph } from "./linguistic-element.js"

describe("kanji-data", () => {
  // AC1 — 2136 kanji jōyō présents
  it("contains 2136 kanji", () => {
    expect(kanjiData.length).toBe(2136)
  })

  // AC2 — pas de character en doublon
  it("has no duplicate characters", () => {
    const characters = Array.map(kanjiData, (k) => k.character)
    const unique = new Set(characters)
    expect(unique.size).toBe(kanjiData.length)
  })

  // AC3 — IDs continus 1000-3135
  it("has continuous IDs from 1000 to 3135", () => {
    const ids = Array.map(kanjiData, (k) => Number(k.id))
    const sorted = Array.sort(ids, Order.number)
    const expected = Array.range(1000, 3135)
    expect(sorted).toEqual(expected)
  })

  // AC4 — graphe de composants est un DAG valide
  it("has a valid DAG for components", () => {
    const elements = Array.map(kanjiData, (k) => ({
      id: k.id,
      components: k.components,
    }))
    expect(validateComponentGraph(elements)).toBe(true)
  })

  // AC5 — tous les composants référencés existent dans le dataset
  it("all referenced components exist in the dataset", () => {
    const allIds = new Set(Array.map(kanjiData, (k) => Number(k.id)))
    for (const kanji of kanjiData) {
      for (const comp of kanji.components) {
        expect(allIds.has(Number(comp)), `component ${comp} of ${kanji.character} not found`).toBe(
          true,
        )
      }
    }
  })

  // AC6 — meanings non vide pour chaque kanji
  it("every kanji has at least one meaning", () => {
    for (const kanji of kanjiData) {
      expect(kanji.meanings.length, `${kanji.character} has no meanings`).toBeGreaterThanOrEqual(1)
    }
  })

  // AC7 — strokeCount > 0
  it("every kanji has strokeCount > 0", () => {
    for (const kanji of kanjiData) {
      expect(kanji.strokeCount, `${kanji.character} has strokeCount 0`).toBeGreaterThan(0)
    }
  })

  // AC8 — frequency > 0
  it("every kanji has frequency > 0", () => {
    for (const kanji of kanjiData) {
      expect(kanji.frequency, `${kanji.character} has frequency 0`).toBeGreaterThan(0)
    }
  })
})
