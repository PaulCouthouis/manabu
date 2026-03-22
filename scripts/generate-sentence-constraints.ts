/**
 * Generate sentence constraints for each grammar point × rank (1-10).
 * Output: scripts/sentence-constraints.json
 *
 * Usage: pnpm tsx scripts/generate-sentence-constraints.ts
 */

import { writeFileSync } from "node:fs"
import {
  counterWordData,
  grammarData,
  skill11Data,
  skill12Data,
  skill13Data,
  skill14Data,
  skill15Data,
  wordData,
} from "@manabu/domain"
import type { GrammarElement, WordElement } from "@manabu/domain"

// --- Types ---

interface WordInfo {
  readonly id: number
  readonly written: string
  readonly meaning: string
}

interface GrammarInfo {
  readonly id: number
  readonly name: string
  readonly explanation: string
  readonly skillId: number
}

type FrequencyBand = "top1000" | "top2000" | "top3000" | "top4000" | "top5000"
type GrammarConstraint = "current_only" | "2_same_skill" | "2_different_skills" | "3_mixed" | "3_different_skills"

interface SentenceConstraint {
  readonly sentenceId: number
  readonly rank: number
  readonly primaryGrammar: GrammarInfo
  readonly grammarConstraint: GrammarConstraint
  readonly frequencyBand: FrequencyBand
}

interface RankConfig {
  readonly frequencyBand: FrequencyBand
  readonly grammarConstraint: GrammarConstraint
}

interface ConstraintOutput {
  readonly wordPools: Record<FrequencyBand, ReadonlyArray<WordInfo>>
  readonly grammarBySkill: Record<number, ReadonlyArray<GrammarInfo>>
  readonly sentences: ReadonlyArray<SentenceConstraint>
}

// --- Constants ---

const SENTENCE_ID_BASE = 70001
const GRAMMAR_ID_BASE = 300

const skillDataMap: ReadonlyArray<{ readonly skillId: number; readonly data: ReadonlyArray<GrammarElement> }> = [
  { skillId: 11, data: skill11Data },
  { skillId: 12, data: skill12Data },
  { skillId: 13, data: skill13Data },
  { skillId: 14, data: skill14Data },
  { skillId: 15, data: skill15Data },
]

const rankConfigs: Record<number, RankConfig> = {
  1: { frequencyBand: "top1000", grammarConstraint: "current_only" },
  2: { frequencyBand: "top2000", grammarConstraint: "current_only" },
  3: { frequencyBand: "top3000", grammarConstraint: "current_only" },
  4: { frequencyBand: "top4000", grammarConstraint: "current_only" },
  5: { frequencyBand: "top5000", grammarConstraint: "current_only" },
  6: { frequencyBand: "top1000", grammarConstraint: "2_same_skill" },
  7: { frequencyBand: "top3000", grammarConstraint: "2_same_skill" },
  8: { frequencyBand: "top5000", grammarConstraint: "2_different_skills" },
  9: { frequencyBand: "top3000", grammarConstraint: "3_mixed" },
  10: { frequencyBand: "top5000", grammarConstraint: "3_different_skills" },
}

// --- Build grammar by skill (record, no intermediate Map) ---

const toGrammarInfo = (g: GrammarElement, skillId: number): GrammarInfo => ({
  id: g.id,
  name: g.name,
  explanation: g.explanation,
  skillId,
})

const grammarBySkill: Record<number, ReadonlyArray<GrammarInfo>> = Object.fromEntries(
  skillDataMap.map(({ skillId, data }) => [skillId, data.map((g) => toGrammarInfo(g, skillId))]),
)

// --- Build word pools incrementally ---

const toWordInfo = (w: WordElement): WordInfo => ({
  id: w.id,
  written: w.written,
  meaning: w.meaning,
})

const counterWordsInfo = counterWordData.map(toWordInfo)

const buckets = [5000, 6000, 7000, 8000, 9000].map((base) =>
  wordData.filter((w) => w.id >= base && w.id <= base + 999).map(toWordInfo),
)

const bandKeys: ReadonlyArray<FrequencyBand> = ["top1000", "top2000", "top3000", "top4000", "top5000"]

const wordPools = bandKeys.reduce(
  (acc, band, i) => {
    const previous = i === 0 ? counterWordsInfo : acc[bandKeys[i - 1]!]!
    acc[band] = [...previous, ...buckets[i]!]
    return acc
  },
  {} as Record<FrequencyBand, ReadonlyArray<WordInfo>>,
)

// --- Generate all constraints ---

const constraints: ReadonlyArray<SentenceConstraint> = skillDataMap.flatMap(({ skillId, data }) =>
  data.flatMap((grammar) => {
    const primaryGrammar = toGrammarInfo(grammar, skillId)

    return ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const).map((rank) => {
      const config = rankConfigs[rank]!
      const sentenceId = SENTENCE_ID_BASE + (grammar.id - GRAMMAR_ID_BASE) * 10 + (rank - 1)

      return {
        sentenceId,
        rank,
        primaryGrammar,
        grammarConstraint: config.grammarConstraint,
        frequencyBand: config.frequencyBand,
      }
    })
  }),
)

// --- Build and write output ---

const output: ConstraintOutput = {
  wordPools,
  grammarBySkill,
  sentences: constraints,
}

const outputPath = new URL("sentence-constraints.json", import.meta.url).pathname

writeFileSync(outputPath, JSON.stringify(output, null, 2))

console.log(`Generated ${constraints.length} sentence constraints`)
console.log(`Output: ${outputPath}`)
console.log(`Grammar points: ${grammarData.length}`)
console.log(`Ranks per grammar point: 10`)
console.log(`Word counts by band:`)
for (const [band, words] of Object.entries(wordPools)) {
  console.log(`  ${band}: ${words.length} words`)
}
