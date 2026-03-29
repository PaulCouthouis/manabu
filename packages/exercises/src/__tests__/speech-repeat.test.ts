import { assert, describe, it } from "@effect/vitest"
import type { SpeechResult } from "~/logic/vocal/speech-recognition.js"
import { isAudioFirst, outcomeFromSpeechResult } from "~/logic/speech-repeat.js"

describe("outcomeFromSpeechResult", () => {
  it("match → success", () => {
    const result: SpeechResult = { kind: "match", transcript: "か" }
    assert.strictEqual(outcomeFromSpeechResult(result), "success")
  })

  it("mismatch → failure", () => {
    const result: SpeechResult = { kind: "mismatch", transcript: "が" }
    assert.strictEqual(outcomeFromSpeechResult(result), "failure")
  })

  it("skip → skip", () => {
    const result: SpeechResult = { kind: "skip" }
    assert.strictEqual(outcomeFromSpeechResult(result), "skip")
  })

  it("noise → failure", () => {
    const result: SpeechResult = { kind: "noise" }
    assert.strictEqual(outcomeFromSpeechResult(result), "failure")
  })
})

describe("isAudioFirst", () => {
  it("audio → true", () => {
    assert.strictEqual(isAudioFirst({ mode: "audio" }), true)
  })

  it("visual-kana → false", () => {
    assert.strictEqual(isAudioFirst({ mode: "visual-kana", kana: "き" }), false)
  })

  it("visual-text → false", () => {
    assert.strictEqual(isAudioFirst({ mode: "visual-text", text: "猫" }), false)
  })
})
