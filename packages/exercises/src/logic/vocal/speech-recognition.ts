import { Context, Effect } from "effect"

export type SpeechResult =
  | { readonly kind: "match"; readonly transcript: string; readonly audio: Blob }
  | { readonly kind: "mismatch"; readonly transcript: string; readonly audio: Blob }
  | { readonly kind: "skip" }
  | { readonly kind: "noise" }

export class SpeechRecognitionApi extends Context.Tag("SpeechRecognitionApi")<
  SpeechRecognitionApi,
  {
    readonly recognize: (blob: Blob, expected: string) => Effect.Effect<SpeechResult>
  }
>() {}
