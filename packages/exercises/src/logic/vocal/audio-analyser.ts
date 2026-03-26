import { Context, Effect, Layer } from "effect"
import type { AudioStream } from "~/logic/vocal/types.js"

export interface AnalyserHandle {
  readonly getFrequencyData: () => Uint8Array
  readonly close: () => void
}

export interface AudioAnalyserNode {
  readonly frequencyBinCount: number
  readonly getByteFrequencyData: (array: Uint8Array<ArrayBuffer>) => void
}

export interface AudioContextHandle {
  readonly createFromStream: (stream: AudioStream) => {
    readonly analyser: AudioAnalyserNode
    readonly disconnect: () => void
  }
  readonly close: () => void
}

export class WebAudioContextApi extends Context.Tag("WebAudioContextApi")<
  WebAudioContextApi,
  {
    readonly createContext: () => AudioContextHandle
  }
>() {}

export class AudioAnalyserApi extends Effect.Service<AudioAnalyserApi>()("AudioAnalyserApi", {
  effect: Effect.gen(function* () {
    const webAudio = yield* WebAudioContextApi
    return {
      create: (stream: AudioStream): AnalyserHandle => {
        const ctx = webAudio.createContext()
        const { analyser, disconnect } = ctx.createFromStream(stream)
        const bufferLength = analyser.frequencyBinCount
        const frequencyBuffer = new Uint8Array(bufferLength)
        return {
          getFrequencyData: () => {
            analyser.getByteFrequencyData(frequencyBuffer)
            return frequencyBuffer
          },
          close: () => {
            disconnect()
            ctx.close()
          },
        }
      },
    }
  }),
}) {}

export const BrowserWebAudioContextApiLive = Layer.succeed(WebAudioContextApi, {
  createContext: (): AudioContextHandle => {
    const ctx = new AudioContext()
    return {
      createFromStream: (stream: AudioStream) => {
        const source = ctx.createMediaStreamSource(stream as unknown as MediaStream)
        const analyserNode = ctx.createAnalyser()
        source.connect(analyserNode)
        return {
          analyser: {
            frequencyBinCount: analyserNode.frequencyBinCount,
            getByteFrequencyData: (array: Uint8Array<ArrayBuffer>) => {
              analyserNode.getByteFrequencyData(array)
            },
          },
          disconnect: () => {
            source.disconnect()
          },
        }
      },
      close: () => {
        ctx.close()
      },
    }
  },
})
