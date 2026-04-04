import { Array, HashSet, pipe, Struct } from "effect"
import { KanaElement, KanaId } from "./linguistic-element.js"

// --- Sokuon & Chōon (pas de ContentItems — micro-leçon en contexte) ---

const sokuonChoon: ReadonlyArray<KanaElement> = [
  KanaElement.make({ id: KanaId(209), character: "っ", kanaType: "hiragana", sortOrder: 209 }),
  KanaElement.make({ id: KanaId(210), character: "ッ", kanaType: "katakana", sortOrder: 210 }),
  KanaElement.make({ id: KanaId(211), character: "ー", kanaType: "katakana", sortOrder: 211 }),
]

// --- Katakana étendus (ContentItems Skill 1 + Skill 3) ---

const extendedKatakana: ReadonlyArray<KanaElement> = [
  KanaElement.make({ id: KanaId(212), character: "ティ", kanaType: "katakana", sortOrder: 212 }),
  KanaElement.make({ id: KanaId(213), character: "ディ", kanaType: "katakana", sortOrder: 213 }),
  KanaElement.make({ id: KanaId(214), character: "ファ", kanaType: "katakana", sortOrder: 214 }),
  KanaElement.make({ id: KanaId(215), character: "フィ", kanaType: "katakana", sortOrder: 215 }),
  KanaElement.make({ id: KanaId(216), character: "フェ", kanaType: "katakana", sortOrder: 216 }),
  KanaElement.make({ id: KanaId(217), character: "フォ", kanaType: "katakana", sortOrder: 217 }),
  KanaElement.make({ id: KanaId(218), character: "ウィ", kanaType: "katakana", sortOrder: 218 }),
  KanaElement.make({ id: KanaId(219), character: "ウェ", kanaType: "katakana", sortOrder: 219 }),
  KanaElement.make({ id: KanaId(220), character: "ウォ", kanaType: "katakana", sortOrder: 220 }),
  KanaElement.make({ id: KanaId(221), character: "デュ", kanaType: "katakana", sortOrder: 221 }),
  KanaElement.make({ id: KanaId(222), character: "シェ", kanaType: "katakana", sortOrder: 222 }),
  KanaElement.make({ id: KanaId(223), character: "ジェ", kanaType: "katakana", sortOrder: 223 }),
  KanaElement.make({ id: KanaId(224), character: "チェ", kanaType: "katakana", sortOrder: 224 }),
]

export const kanaExtendedData: ReadonlyArray<KanaElement> = [...sokuonChoon, ...extendedKatakana]

export const sokuonChoonIds: HashSet.HashSet<KanaElement["id"]> = pipe(
  sokuonChoon,
  Array.map(Struct.get("id")),
  HashSet.fromIterable,
)
