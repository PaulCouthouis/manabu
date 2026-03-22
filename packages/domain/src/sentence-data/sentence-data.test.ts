import { Array, Number as N } from "effect"
import { describe, expect, it } from "vitest"
import { counterWordData } from "../counter-word-data.js"
import { grammarData } from "../grammar-data/index.js"
import { wordData } from "../word-data/index.js"
import { sentenceData } from "./index.js"

const n = (x: number): number => x

const wordIds = new Set([...wordData.map((w) => n(w.id)), ...counterWordData.map((w) => n(w.id))])
const grammarIds = new Set(grammarData.map((g) => n(g.id)))

const grammarToSkill = (id: number): number => {
  if (id >= 300 && id <= 379) return 11
  if (id >= 380 && id <= 472) return 12
  if (id >= 473 && id <= 500) return 13
  if (id >= 501 && id <= 514) return 14
  if (id >= 515 && id <= 558) return 15
  throw new Error(`Unknown grammar ID: ${id}`)
}

const getGrammarIds = (sentence: (typeof sentenceData)[number]): ReadonlyArray<number> =>
  sentence.components.filter((c) => n(c) >= 300 && n(c) <= 558).map((c) => n(c))

const getWordIds = (sentence: (typeof sentenceData)[number]): ReadonlyArray<number> =>
  sentence.components.filter((c) => n(c) >= 5000).map((c) => n(c))

const maxWordIdForRank = (rank: number): number => {
  switch (rank) {
    case 1:
    case 6:
      return 5999
    case 2:
      return 6999
    case 3:
    case 7:
    case 9:
      return 7999
    case 4:
      return 8999
    case 5:
    case 8:
    case 10:
      return 9999
    default:
      return 9999
  }
}

describe("sentence-data", () => {
  // AC3 — 2590 SentenceElements au total
  it("contains 2590 sentence elements", () => {
    expect(sentenceData.length).toBe(2590)
  })

  // AC4 — IDs continus 70001-72590
  it("has continuous IDs from 70001 to 72590", () => {
    const ids = Array.map(sentenceData, (s) => n(s.id))
    const sorted = Array.sort(ids, N.Order)
    const expected = Array.range(70001, 72590)
    expect(sorted).toEqual(expected)
  })

  // AC5 — chaque grammar point a exactement 10 sentences
  it("has exactly 10 sentences per grammar point", () => {
    const grammarCounts = new Map<number, number>()
    for (const s of sentenceData) {
      const primaryGrammarId = n(s.id)
      const grammarIndex = Math.floor((primaryGrammarId - 70001) / 10)
      const expectedGrammarId = 300 + grammarIndex
      grammarCounts.set(expectedGrammarId, (grammarCounts.get(expectedGrammarId) ?? 0) + 1)
    }
    for (let gid = 300; gid <= 558; gid++) {
      expect(grammarCounts.get(gid), `Grammar ${gid} should have 10 sentences`).toBe(10)
    }
  })

  // AC6 — les 10 ranks sont couverts pour chaque grammar point
  it("covers all 10 ranks for each grammar point", () => {
    for (let gid = 300; gid <= 558; gid++) {
      const baseSentenceId = 70001 + (gid - 300) * 10
      for (let rank = 1; rank <= 10; rank++) {
        const sentenceId = baseSentenceId + (rank - 1)
        const sentence = sentenceData.find((s) => n(s.id) === sentenceId)
        expect(
          sentence,
          `Missing sentence ${sentenceId} (grammar ${gid}, rank ${rank})`,
        ).toBeDefined()
        expect(sentence!.sentenceRank, `Sentence ${sentenceId} should have rank ${rank}`).toBe(rank)
      }
    }
  })

  // AC7 — text et meaning non vides
  it("has non-empty text and meaning for every sentence", () => {
    for (const s of sentenceData) {
      expect(s.text.length, `Sentence ${n(s.id)} has empty text`).toBeGreaterThan(0)
      expect(s.meaning.length, `Sentence ${n(s.id)} has empty meaning`).toBeGreaterThan(0)
    }
  })

  // AC8 — tous les WordId dans components existent
  it("references only existing WordIds in components", () => {
    for (const s of sentenceData) {
      for (const wid of getWordIds(s)) {
        expect(wordIds.has(wid), `Sentence ${n(s.id)} references non-existent WordId ${wid}`).toBe(
          true,
        )
      }
    }
  })

  // AC9 — tous les GrammarId dans components existent
  it("references only existing GrammarIds in components", () => {
    for (const s of sentenceData) {
      for (const gid of getGrammarIds(s)) {
        expect(
          grammarIds.has(gid),
          `Sentence ${n(s.id)} references non-existent GrammarId ${gid}`,
        ).toBe(true)
      }
    }
  })

  // AC10-AC14 — contraintes de bande de fréquence
  describe("frequency band constraints", () => {
    it("respects word frequency band for each rank", () => {
      for (const s of sentenceData) {
        const maxId = maxWordIdForRank(s.sentenceRank)
        for (const wid of getWordIds(s)) {
          const isCounterWord = wid >= 10000 && wid <= 10051
          if (!isCounterWord) {
            expect(
              wid <= maxId,
              `Sentence ${n(s.id)} (rank ${s.sentenceRank}): WordId ${wid} exceeds max ${maxId}`,
            ).toBe(true)
            expect(wid >= 5000, `Sentence ${n(s.id)}: WordId ${wid} below 5000`).toBe(true)
          }
        }
      }
    })
  })

  // AC15-AC19 — contraintes grammaticales
  describe("grammar constraints", () => {
    // AC15 — ranks 1-5: exactement 1 GrammarId
    it("ranks 1-5 have exactly 1 grammar point", () => {
      for (const s of sentenceData) {
        if (s.sentenceRank >= 1 && s.sentenceRank <= 5) {
          const gIds = getGrammarIds(s)
          expect(
            gIds.length,
            `Sentence ${n(s.id)} (rank ${s.sentenceRank}) should have 1 grammar point, has ${gIds.length}`,
          ).toBe(1)
        }
      }
    })

    // AC16 — ranks 6-7: exactement 2 GrammarIds, même skill
    it("ranks 6-7 have exactly 2 grammar points from the same skill", () => {
      for (const s of sentenceData) {
        if (s.sentenceRank === 6 || s.sentenceRank === 7) {
          const gIds = getGrammarIds(s)
          expect(
            gIds.length,
            `Sentence ${n(s.id)} (rank ${s.sentenceRank}) should have 2 grammar points, has ${gIds.length}`,
          ).toBe(2)
          const skills = new Set(gIds.map(grammarToSkill))
          expect(
            skills.size,
            `Sentence ${n(s.id)} (rank ${s.sentenceRank}): grammar points should be from same skill`,
          ).toBe(1)
        }
      }
    })

    // AC17 — rank 8: exactement 2 GrammarIds, skills différents
    it("rank 8 has exactly 2 grammar points from different skills", () => {
      for (const s of sentenceData) {
        if (s.sentenceRank === 8) {
          const gIds = getGrammarIds(s)
          expect(
            gIds.length,
            `Sentence ${n(s.id)} (rank 8) should have 2 grammar points, has ${gIds.length}`,
          ).toBe(2)
          const skills = new Set(gIds.map(grammarToSkill))
          expect(
            skills.size,
            `Sentence ${n(s.id)} (rank 8): grammar points should be from different skills`,
          ).toBe(2)
        }
      }
    })

    // AC18 — rank 9: exactement 3 GrammarIds — courant + 1 même skill + 1 autre
    it("rank 9 has exactly 3 grammar points with mixed skills", () => {
      for (const s of sentenceData) {
        if (s.sentenceRank === 9) {
          const gIds = getGrammarIds(s)
          expect(
            gIds.length,
            `Sentence ${n(s.id)} (rank 9) should have 3 grammar points, has ${gIds.length}`,
          ).toBe(3)
          const skills = gIds.map(grammarToSkill)
          const uniqueSkills = new Set(skills)
          expect(
            uniqueSkills.size,
            `Sentence ${n(s.id)} (rank 9): should have exactly 2 different skills, has ${uniqueSkills.size}`,
          ).toBe(2)
        }
      }
    })

    // AC19 — rank 10: exactement 3 GrammarIds, chacun d'un skill différent
    it("rank 10 has exactly 3 grammar points each from a different skill", () => {
      for (const s of sentenceData) {
        if (s.sentenceRank === 10) {
          const gIds = getGrammarIds(s)
          expect(
            gIds.length,
            `Sentence ${n(s.id)} (rank 10) should have 3 grammar points, has ${gIds.length}`,
          ).toBe(3)
          const skills = new Set(gIds.map(grammarToSkill))
          expect(
            skills.size,
            `Sentence ${n(s.id)} (rank 10): should have 3 different skills, has ${skills.size}`,
          ).toBe(3)
        }
      }
    })
  })
})
