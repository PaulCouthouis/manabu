import { Option } from "effect"
import { describe, expect, it } from "vitest"
import type { VoiceInfo } from "~/logic/audio/voice-selection.js"
import { findBestVoice } from "~/logic/audio/voice-selection.js"

const kyoko: VoiceInfo = { name: "Kyoko", lang: "ja-JP", localService: true }
const oRen: VoiceInfo = { name: "O-Ren (Enhanced)", lang: "ja-JP", localService: true }
const googleJa: VoiceInfo = { name: "Google 日本語", lang: "ja-JP", localService: false }
const localJa: VoiceInfo = { name: "Japanese", lang: "ja-JP", localService: true }
const englishVoice: VoiceInfo = { name: "Samantha", lang: "en-US", localService: true }
const genericJa: VoiceInfo = { name: "ja voice", lang: "ja", localService: false }

describe("findBestVoice", () => {
  it("préfère la voix haute qualité", () => {
    const result = findBestVoice([googleJa, localJa, kyoko, englishVoice], "ja-JP")
    expect(Option.getOrThrow(result)).toBe(kyoko)
  })

  it("retourne une voix haute qualité parmi plusieurs", () => {
    const result = findBestVoice([kyoko, oRen], "ja-JP")
    expect(Option.isSome(result)).toBe(true)
  })

  it("fallback sur voix locale si pas de premium", () => {
    const result = findBestVoice([googleJa, localJa, englishVoice], "ja-JP")
    expect(Option.getOrThrow(result)).toBe(localJa)
  })

  it("fallback sur voix distante si pas de locale", () => {
    const result = findBestVoice([googleJa, englishVoice], "ja-JP")
    expect(Option.getOrThrow(result)).toBe(googleJa)
  })

  it("matche les voix avec préfixe de langue", () => {
    const result = findBestVoice([englishVoice, genericJa], "ja-JP")
    expect(Option.getOrThrow(result)).toBe(genericJa)
  })

  it("retourne None si aucune voix ne matche", () => {
    const result = findBestVoice([englishVoice], "ja-JP")
    expect(Option.isNone(result)).toBe(true)
  })

  it("retourne None sur liste vide", () => {
    const result = findBestVoice([], "ja-JP")
    expect(Option.isNone(result)).toBe(true)
  })
})
