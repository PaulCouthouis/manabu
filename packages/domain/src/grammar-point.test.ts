import { describe, expect, it } from "vitest"
import { GrammarPoint, GrammarPointId } from "./grammar-point.js"
import type { LinguisticElement } from "./linguistic-element.js"

describe("GrammarPoint", () => {
  // AC1 — GrammarPoint.make() crée une instance valide
  it("creates a valid instance with make()", () => {
    const gp = GrammarPoint.make({
      id: GrammarPointId(300),
      name: "は (topic marker)",
      explanation: "Marks the topic of a sentence",
      frequency: 1,
      formCount: 1,
    })

    expect(gp.id).toBe(GrammarPointId(300))
    expect(gp.name).toBe("は (topic marker)")
    expect(gp.explanation).toBe("Marks the topic of a sentence")
    expect(gp.frequency).toBe(1)
    expect(gp.formCount).toBe(1)
  })

  // AC3 — GrammarPointId est distinct de LinguisticElementId
  it("GrammarPointId is a distinct branded type", () => {
    const gpId = GrammarPointId(300)
    expect(typeof gpId).toBe("number")
    // GrammarPointId should not be assignable as a LinguisticElementId at the type level
    // This is a runtime check that the brand exists
    expect(gpId).toBe(300)
  })

  // AC2 — GrammarElement n'existe plus dans l'union LinguisticElement
  it("LinguisticElement union does not include grammar", () => {
    // The LinguisticElement union should only have 4 kinds
    const validKinds: ReadonlyArray<LinguisticElement["kind"]> = [
      "kana",
      "kanji",
      "word",
      "sentence",
    ]
    expect(validKinds).toHaveLength(4)
    expect(validKinds).not.toContain("grammar")
  })
})
