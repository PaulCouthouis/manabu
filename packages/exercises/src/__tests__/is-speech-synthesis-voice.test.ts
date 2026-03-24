import { describe, expect, it } from "vitest"
import { isSpeechSynthesisVoice } from "../logic/is-speech-synthesis-voice.js"

describe("isSpeechSynthesisVoice", () => {
  it("retourne true si voiceURI est présent", () => {
    const voice = {
      name: "Kyoko",
      lang: "ja-JP",
      localService: true,
      voiceURI: "Kyoko",
      default: false,
    }
    expect(isSpeechSynthesisVoice(voice)).toBe(true)
  })

  it("retourne false pour un VoiceInfo simple", () => {
    const voice = { name: "TestVoice", lang: "ja-JP", localService: true }
    expect(isSpeechSynthesisVoice(voice)).toBe(false)
  })
})
