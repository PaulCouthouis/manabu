import { Context, Effect } from "effect"

export class SpeechToTextApi extends Context.Tag("SpeechToTextApi")<
  SpeechToTextApi,
  {
    readonly transcribe: (blob: Blob) => Effect.Effect<string>
  }
>() {}
