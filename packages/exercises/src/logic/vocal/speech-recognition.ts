import { Context, Effect } from "effect"

export type SpeechResult =
  | { readonly kind: "match"; readonly transcript: string }
  | { readonly kind: "mismatch"; readonly transcript: string }
  | { readonly kind: "skip" }
  | { readonly kind: "noise" }

export class SpeechRecognitionApi extends Context.Tag("SpeechRecognitionApi")<
  SpeechRecognitionApi,
  {
    readonly recognize: (blob: Blob, expected: string) => Effect.Effect<SpeechResult>
  }
>() {}
