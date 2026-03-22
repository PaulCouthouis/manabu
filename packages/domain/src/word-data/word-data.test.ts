import { describe, expect, it } from "vitest"
import { wordData } from "./index.js"
import { kanaData } from "../kana-data.js"
import { kanaExtendedData } from "../kana-extended-data.js"
import { kanjiData } from "../kanji-data/index.js"
import { Array, Number } from "effect"

const PARTICLES = new Set([
  "は",
  "が",
  "を",
  "に",
  "で",
  "へ",
  "と",
  "も",
  "の",
  "か",
  "よ",
  "ね",
  "な",
  "わ",
  "や",
  "から",
  "まで",
  "より",
  "だけ",
  "しか",
  "ばかり",
  "ほど",
  "くらい",
  "など",
  "って",
])

const n = (x: number): number => x

const allKanaIds = new Set([
  ...Array.map(kanaData, (k) => n(k.id)),
  ...Array.map(kanaExtendedData, (k) => n(k.id)),
])

const allKanjiIds = new Set(Array.map(kanjiData, (k) => n(k.id)))

describe("word-data", () => {
  // AC1 — 5000 mots présents
  it("contains 5000 words", () => {
    expect(wordData.length).toBe(5000)
  })

  // AC2 — pas de written en doublon
  it("has no duplicate written forms", () => {
    const writtens = Array.map(wordData, (w) => w.written)
    const unique = new Set(writtens)
    expect(unique.size).toBe(wordData.length)
  })

  // AC3 — IDs continus 5000-9999
  it("has continuous IDs from 5000 to 9999", () => {
    const ids = Array.map(wordData, (w) => n(w.id))
    const sorted = Array.sort(ids, Number.Order)
    const expected = Array.range(5000, 9999)
    expect(sorted).toEqual(expected)
  })

  // AC4 — meaning non vide
  it("has non-empty meaning for every word", () => {
    for (const w of wordData) {
      expect(w.meaning.length, `Word ${w.written} has empty meaning`).toBeGreaterThan(0)
    }
  })

  // AC5 — frequency > 0
  it("has positive frequency for every word", () => {
    for (const w of wordData) {
      expect(w.frequency, `Word ${w.written} has non-positive frequency`).toBeGreaterThan(0)
    }
  })

  // AC6 — components non vide
  it("has non-empty components for every word", () => {
    for (const w of wordData) {
      expect(w.components.length, `Word ${w.written} has empty components`).toBeGreaterThan(0)
    }
  })

  // AC7 — tous les KanjiId référencés existent dans les jōyō
  it("all KanjiId components exist in kanji dataset", () => {
    for (const w of wordData) {
      for (const cid of w.components) {
        const id = n(cid)
        if (id >= 1000) {
          expect(allKanjiIds.has(id), `Word ${w.written} references unknown KanjiId ${id}`).toBe(
            true,
          )
        }
      }
    }
  })

  // AC8 — tous les KanaId référencés existent dans les 224 kana
  it("all KanaId components exist in kana dataset", () => {
    for (const w of wordData) {
      for (const cid of w.components) {
        const id = n(cid)
        if (id < 1000) {
          expect(allKanaIds.has(id), `Word ${w.written} references unknown KanaId ${id}`).toBe(true)
        }
      }
    }
  })

  // AC9 — cohérence written ↔ components
  it("written form matches components characters in order", () => {
    const kanaById = new Map([
      ...Array.map(kanaData, (k) => [n(k.id), k.character] as const),
      ...Array.map(kanaExtendedData, (k) => [n(k.id), k.character] as const),
    ])
    const kanjiById = new Map(Array.map(kanjiData, (k) => [n(k.id), k.character] as const))

    for (const w of wordData) {
      const reconstructed = w.components
        .map((cid) => {
          const id = n(cid)
          return id >= 1000 ? kanjiById.get(id) : kanaById.get(id)
        })
        .join("")
      expect(
        reconstructed,
        `Word ${w.written}: reconstructed "${reconstructed}" from components`,
      ).toBe(w.written)
    }
  })

  // AC10 — aucun mot n'est une particule
  it("no word is a particle", () => {
    for (const w of wordData) {
      expect(PARTICLES.has(w.written), `Word ${w.written} is a particle`).toBe(false)
    }
  })
})
