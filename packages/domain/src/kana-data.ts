import type { KanaType } from "./linguistic-element.js"
import { KanaElement, KanaId } from "./linguistic-element.js"
import { Array } from "effect"

// --- Caractères par bloc ---

// Gojūon (46)
const gojuon =
  "あ い う え お か き く け こ さ し す せ そ た ち つ て と な に ぬ ね の は ひ ふ へ ほ ま み む め も や ゆ よ ら り る れ ろ わ を ん"
// Dakuten (20)
const dakuten = "が ぎ ぐ げ ご ざ じ ず ぜ ぞ だ ぢ づ で ど ば び ぶ べ ぼ"
// Handakuten (5)
const handakuten = "ぱ ぴ ぷ ぺ ぽ"
// Yōon (33)
const yoon =
  "きゃ きゅ きょ しゃ しゅ しょ ちゃ ちゅ ちょ にゃ にゅ にょ ひゃ ひゅ ひょ みゃ みゅ みょ りゃ りゅ りょ ぎゃ ぎゅ ぎょ じゃ じゅ じょ びゃ びゅ びょ ぴゃ ぴゅ ぴょ"

const hiraganaToKatakanaChar = (ch: string) => {
  return String.fromCharCode(ch.charCodeAt(0) + 0x60)
}

const toKatakana = (s: string) => {
  return s.replace(/[\u3041-\u3096]/g, hiraganaToKatakanaChar)
}

const hiraganaChars = Array.flatMap([gojuon, dakuten, handakuten, yoon], (s) => {
  return s.split(" ")
})
const katakanaChars = Array.map(hiraganaChars, toKatakana)

const toEntries = (chars: ReadonlyArray<string>, kanaType: KanaType) => {
  return Array.map(chars, (character) => {
    return { character, kanaType }
  })
}

const allChars = [...toEntries(hiraganaChars, "hiragana"), ...toEntries(katakanaChars, "katakana")]

export const kanaData: ReadonlyArray<KanaElement> = Array.map(allChars, (entry, i) => {
  const sortOrder = i + 1
  return KanaElement.make({ id: KanaId(sortOrder), ...entry, sortOrder })
})
