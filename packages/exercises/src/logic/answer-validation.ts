import { Context, Effect } from "effect"

export type AnswerResult =
  | { readonly kind: "correct"; readonly expected: string }
  | { readonly kind: "incorrect"; readonly userAnswer: string; readonly expected: string }

export class AnswerValidationApi extends Context.Tag("AnswerValidationApi")<
  AnswerValidationApi,
  {
    readonly validate: (answer: string, expected: string) => Effect.Effect<AnswerResult>
  }
>() {}
