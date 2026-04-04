import { describe, expect, it } from "vitest"
import {
  grammarData,
  skill11Data,
  skill12Data,
  skill13Data,
  skill14Data,
  skill15Data,
} from "./index.js"
import { Array, Number as N, Struct } from "effect"

const n = (x: number): number => {
  return x
}

describe("grammar-data", () => {
  // AC1 — 259 GrammarElements présents
  it("contains 259 grammar elements", () => {
    expect(grammarData.length).toBe(259)
  })

  // AC2 — pas de name en doublon
  it("has no duplicate names", () => {
    const names = Array.map(grammarData, Struct.get("name"))
    const unique = new Set(names)
    expect(unique.size).toBe(grammarData.length)
  })

  // AC3 — IDs continus 300-558
  it("has continuous IDs from 300 to 558", () => {
    const ids = Array.map(grammarData, (g) => n(g.id))
    const sorted = Array.sort(ids, N.Order)
    const expected = Array.range(300, 558)
    expect(sorted).toEqual(expected)
  })

  // AC4 — name et explanation non vides
  it("has non-empty name and explanation for every element", () => {
    for (const g of grammarData) {
      expect(g.name.length, `GrammarElement ${n(g.id)} has empty name`).toBeGreaterThan(0)
      expect(
        g.explanation.length,
        `GrammarElement ${n(g.id)} (${g.name}) has empty explanation`,
      ).toBeGreaterThan(0)
    }
  })

  // AC5 — frequency > 0
  it("has positive frequency for every element", () => {
    for (const g of grammarData) {
      expect(g.frequency, `GrammarElement ${g.name} has non-positive frequency`).toBeGreaterThan(0)
    }
  })

  // AC6 — formCount > 0
  it("has positive formCount for every element", () => {
    for (const g of grammarData) {
      expect(g.formCount, `GrammarElement ${g.name} has non-positive formCount`).toBeGreaterThan(0)
    }
  })

  // AC7 — répartition par skill correcte
  it("has correct distribution: 80 + 93 + 28 + 14 + 44", () => {
    expect(skill11Data.length).toBe(80)
    expect(skill12Data.length).toBe(93)
    expect(skill13Data.length).toBe(28)
    expect(skill14Data.length).toBe(14)
    expect(skill15Data.length).toBe(44)
  })
})
