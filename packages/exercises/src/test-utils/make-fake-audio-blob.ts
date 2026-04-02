import { Array } from "effect"

const SAMPLE_RATE = 44100
const DURATION = 0.5
const FREQUENCY = 440
const WAV_HEADER_SIZE = 44

function writeString(view: DataView, offset: number, str: string) {
  Array.forEach(str.split(""), (char, i) => {
    view.setUint8(offset + i, char.charCodeAt(0))
  })
}

function writeWavHeader(view: DataView, dataLength: number) {
  writeString(view, 0, "RIFF")
  view.setUint32(4, 36 + dataLength, true)
  writeString(view, 8, "WAVE")
  writeString(view, 12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, SAMPLE_RATE, true)
  view.setUint32(28, SAMPLE_RATE * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(view, 36, "data")
  view.setUint32(40, dataLength, true)
}

export function makeFakeAudioBlob(): Blob {
  const numSamples = Math.floor(SAMPLE_RATE * DURATION)
  const dataLength = numSamples * 2
  const buffer = new ArrayBuffer(WAV_HEADER_SIZE + dataLength)
  const view = new DataView(buffer)

  writeWavHeader(view, dataLength)

  Array.forEach(Array.range(0, numSamples - 1), (i) => {
    const sample = Math.sin((2 * Math.PI * FREQUENCY * i) / SAMPLE_RATE)
    view.setInt16(WAV_HEADER_SIZE + i * 2, sample * 0x7fff, true)
  })

  return new Blob([buffer], { type: "audio/wav" })
}
