import { Array, Effect, Option, pipe } from "effect"
import { UserAgentApi } from "~/logic/user-agent"

export type DeviceType = "ios" | "android" | "macos" | "windows" | "chromeos" | "unknown"

const rules: ReadonlyArray<readonly [RegExp, DeviceType]> = [
  [/CrOS/, "chromeos"],
  [/iPhone|iPad/, "ios"],
  [/Android/, "android"],
  [/Macintosh|Mac OS/, "macos"],
  [/Windows/, "windows"],
]

export const parseDevice = (userAgent: string): DeviceType => {
  return pipe(
    rules,
    Array.findFirst(([pattern]) => {
      return pattern.test(userAgent)
    }),
    Option.map(([, device]) => {
      return device
    }),
    Option.getOrElse(() => {
      return "unknown" as const
    }),
  )
}

export const detectDevice = Effect.gen(function* () {
  const api = yield* UserAgentApi
  return parseDevice(api.get())
})
