import { Array, Option, pipe } from "effect"

export interface VoiceInfo {
  readonly name: string
  readonly lang: string
  readonly localService: boolean
}

function matchesLang(voice: VoiceInfo, lang: string): boolean {
  return voice.lang === lang || voice.lang.startsWith(lang.split("-")[0] ?? "")
}

function isHighQuality(voice: VoiceInfo): boolean {
  return (
    voice.localService &&
    (voice.name.includes("Enhanced") ||
      voice.name.includes("Premium") ||
      voice.name.includes("Kyoko") ||
      voice.name.includes("O-Ren"))
  )
}

export function findBestVoice<V extends VoiceInfo>(
  voices: ReadonlyArray<V>,
  lang: string,
): Option.Option<V> {
  const matching = Array.filter(voices, (v) => {
    return matchesLang(v, lang)
  })
  return pipe(
    Array.findFirst(matching, isHighQuality),
    Option.orElse(() => {
      return Array.findFirst(matching, (v) => {
        return v.localService
      })
    }),
    Option.orElse(() => {
      return Array.head(matching)
    }),
  )
}
