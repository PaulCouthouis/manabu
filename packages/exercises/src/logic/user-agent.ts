import { Context, Effect, Layer } from "effect"

export class UserAgentApi extends Context.Tag("UserAgentApi")<
  UserAgentApi,
  {
    readonly get: () => string
  }
>() {}

export const BrowserUserAgentApiLive = Layer.succeed(UserAgentApi, {
  get: () => {
    return globalThis.navigator.userAgent
  },
})

export function getUserAgent() {
  return Effect.gen(function* () {
    const api = yield* UserAgentApi
    return api.get()
  })
}
