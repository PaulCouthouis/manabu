import { describe, expect, it } from "vitest"
import {
  type SpeechDetectorState,
  detectSpeech,
  initialState,
} from "~/logic/vocal/detect-speech.js"
import { Option } from "effect"

// --- Helpers ---

const makeFrequencyData = (avgVolume: number, size = 4): Uint8Array => {
  const data = new Uint8Array(size)
  data.fill(avgVolume)
  return data
}

const silence = () => {
  return makeFrequencyData(5)
}

const speech = () => {
  return makeFrequencyData(100)
}

// --- Tests ---

describe("detectSpeech", () => {
  it("retourne none quand le volume est sous le seuil → AC8", () => {
    const result = detectSpeech(silence(), initialState, 0)
    expect(result.event.kind).toBe("none")
    expect(result.state.isSpeaking).toBe(false)
  })

  it("retourne speechStart après speechMinDurationMs au-dessus du seuil → AC9", () => {
    // Frame 1 : début du son
    const r1 = detectSpeech(speech(), initialState, 0)
    expect(r1.event.kind).toBe("none")

    // Frame 2 : son continue mais pas assez longtemps
    const r2 = detectSpeech(speech(), r1.state, 100)
    expect(r2.event.kind).toBe("none")

    // Frame 3 : seuil de durée atteint (150ms)
    const r3 = detectSpeech(speech(), r2.state, 150)
    expect(r3.event.kind).toBe("speechStart")
    expect(r3.state.isSpeaking).toBe(true)
  })

  it("retourne speechEnd après silenceMinDurationMs sous le seuil → AC10", () => {
    // Simuler un état "en train de parler"
    const speakingState: SpeechDetectorState = {
      isSpeaking: true,
      speakingStartedAt: Option.some(0),
      silenceStartedAt: Option.none(),
    }

    // Frame 1 : début du silence
    const r1 = detectSpeech(silence(), speakingState, 200)
    expect(r1.event.kind).toBe("none")

    // Frame 2 : silence continue mais pas assez longtemps
    const r2 = detectSpeech(silence(), r1.state, 400)
    expect(r2.event.kind).toBe("none")

    // Frame 3 : seuil de silence atteint (400ms)
    const r3 = detectSpeech(silence(), r2.state, 600)
    expect(r3.event.kind).toBe("speechEnd")
    expect(r3.state.isSpeaking).toBe(false)
  })

  it("un bruit court ne déclenche pas speechStart → AC11", () => {
    // Bruit pendant 100ms (< 150ms)
    const r1 = detectSpeech(speech(), initialState, 0)
    const r2 = detectSpeech(speech(), r1.state, 100)

    // Puis silence
    const r3 = detectSpeech(silence(), r2.state, 110)
    expect(r3.event.kind).toBe("none")
    expect(r3.state.isSpeaking).toBe(false)
  })

  it("une parole de 150ms déclenche speechStart → AC12", () => {
    const r1 = detectSpeech(speech(), initialState, 0)
    const r2 = detectSpeech(speech(), r1.state, 75)
    const r3 = detectSpeech(speech(), r2.state, 150)
    expect(r3.event.kind).toBe("speechStart")
  })
})
