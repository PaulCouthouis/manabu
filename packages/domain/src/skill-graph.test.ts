import { describe, expect, it } from "vitest"
import {
  getDependents,
  getEntryPoints,
  getPrerequisites,
  getTransitivePrerequisites,
  SkillGraph,
  validateGraph,
} from "./skill-graph.js"
import { SkillTypeId, SkillTypes } from "./skill-type.js"

describe("SkillGraph", () => {
  // AC1 — Le graphe de dépendances est un DAG valide (pas de cycle)
  it("le graphe est un DAG valide — pas de cycle", () => {
    const result = validateGraph(SkillGraph)
    expect(result).toBe(true)
  })

  // AC2 — getPrerequisites retourne les prérequis directs
  it("getPrerequisites retourne les prérequis directs d'un skill", () => {
    // Skill 2 (Lecture hiragana) dépend directement de Skill 1
    const prereqs = getPrerequisites(SkillGraph, SkillTypeId(2))
    expect(prereqs).toEqual([SkillTypeId(1)])

    // Skill 7 (Lecture à voix haute) dépend de Skills 2, 3, 4
    const prereqs7 = getPrerequisites(SkillGraph, SkillTypeId(7))
    expect(prereqs7).toEqual(
      expect.arrayContaining([SkillTypeId(2), SkillTypeId(3), SkillTypeId(4)]),
    )
    expect(prereqs7).toHaveLength(3)

    // Skill 1 n'a pas de prérequis
    const prereqs1 = getPrerequisites(SkillGraph, SkillTypeId(1))
    expect(prereqs1).toEqual([])
  })

  // AC3 — getTransitivePrerequisites retourne la fermeture transitive
  it("getTransitivePrerequisites retourne la fermeture transitive des prérequis", () => {
    // Skill 3 (Lecture katakana) → Skill 2 → Skill 1
    const transitive = getTransitivePrerequisites(SkillGraph, SkillTypeId(3))
    expect(transitive).toEqual(expect.arrayContaining([SkillTypeId(1), SkillTypeId(2)]))
    expect(transitive).toHaveLength(2)

    // Skill 8 (Compréhension écrite) → Skills 5, 7 → Skills 2, 3, 4 → Skills 1
    const transitive8 = getTransitivePrerequisites(SkillGraph, SkillTypeId(8))
    expect(transitive8).toEqual(
      expect.arrayContaining([
        SkillTypeId(1),
        SkillTypeId(2),
        SkillTypeId(3),
        SkillTypeId(4),
        SkillTypeId(5),
        SkillTypeId(7),
      ]),
    )
    expect(transitive8).toHaveLength(6)

    // Skill 1 n'a aucun prérequis transitif
    const transitive1 = getTransitivePrerequisites(SkillGraph, SkillTypeId(1))
    expect(transitive1).toEqual([])
  })

  // AC4 — getEntryPoints retourne les skills sans prérequis
  it("getEntryPoints retourne les skills sans prérequis", () => {
    const entryPoints = getEntryPoints(SkillGraph)
    expect(entryPoints).toEqual(expect.arrayContaining([SkillTypeId(1), SkillTypeId(5)]))
    expect(entryPoints).toHaveLength(2)
  })

  // AC5 — Chaque skill type a une entrée dans le graphe
  it("chaque skill type a une entrée dans le graphe", () => {
    for (const skillType of SkillTypes) {
      const prereqs = getPrerequisites(SkillGraph, skillType.id)
      expect(prereqs).toBeDefined()
    }
  })

  // Test supplémentaire — getDependents
  it("getDependents retourne les skills qui dépendent d'un skill", () => {
    // Skill 1 est prérequis de Skills 2 et 4
    const dependents = getDependents(SkillGraph, SkillTypeId(1))
    expect(dependents).toEqual(expect.arrayContaining([SkillTypeId(2), SkillTypeId(4)]))
    expect(dependents).toHaveLength(2)

    // Skill 8 est prérequis de Skills 10, 11, 12, 13, 14, 15
    const dependents8 = getDependents(SkillGraph, SkillTypeId(8))
    expect(dependents8).toEqual(
      expect.arrayContaining([
        SkillTypeId(10),
        SkillTypeId(11),
        SkillTypeId(12),
        SkillTypeId(13),
        SkillTypeId(14),
        SkillTypeId(15),
      ]),
    )
    expect(dependents8).toHaveLength(6)
  })
})
