import { Context, Effect, Layer } from "effect"

export class BlobUrlApi extends Context.Tag("BlobUrlApi")<
  BlobUrlApi,
  {
    readonly create: (blob: Blob) => string
    readonly revoke: (url: string) => void
  }
>() {}

export const BrowserBlobUrlApiLive = Layer.succeed(BlobUrlApi, {
  create: (blob: Blob) => {
    return URL.createObjectURL(blob)
  },
  revoke: (url: string) => {
    URL.revokeObjectURL(url)
  },
})

export function createBlobUrl(blob: Blob) {
  return Effect.gen(function* () {
    const api = yield* BlobUrlApi
    return api.create(blob)
  })
}

export function revokeBlobUrl(url: string) {
  return Effect.gen(function* () {
    const api = yield* BlobUrlApi
    api.revoke(url)
  })
}
