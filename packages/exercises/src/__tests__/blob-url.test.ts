import { assert, layer } from "@effect/vitest"
import { Effect, Layer } from "effect"
import { BlobUrlApi, createBlobUrl, revokeBlobUrl } from "../logic/blob-url.js"

const created: Array<string> = []
const revoked: Array<string> = []
let counter = 0

const TestBlobUrlApi = Layer.succeed(BlobUrlApi, {
  create: () => {
    const url = `blob:test-${counter++}`
    created.push(url)
    return url
  },
  revoke: (url: string) => {
    revoked.push(url)
  },
})

layer(TestBlobUrlApi)("BlobUrl", (it) => {
  it.effect("createBlobUrl appelle l'API et retourne l'URL", () =>
    Effect.gen(function* () {
      created.length = 0
      counter = 0
      const url = yield* createBlobUrl(new Blob())
      assert.strictEqual(url, "blob:test-0")
      assert.deepStrictEqual(created, ["blob:test-0"])
    }),
  )

  it.effect("revokeBlobUrl appelle revoke sur l'API", () =>
    Effect.gen(function* () {
      revoked.length = 0
      yield* revokeBlobUrl("blob:test-42")
      assert.deepStrictEqual(revoked, ["blob:test-42"])
    }),
  )
})
