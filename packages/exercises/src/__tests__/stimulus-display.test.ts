import { assert, describe, it } from "@effect/vitest"
import { isSentence } from "~/logic/stimulus-display.js"

describe("isSentence", () => {
  it("un kanji seul → false", () => {
    assert.strictEqual(isSentence("猫"), false)
  })

  it("un mot court → false", () => {
    assert.strictEqual(isSentence("食べる"), false)
  })

  it("une phrase → true", () => {
    assert.strictEqual(isSentence("猫が好きです"), true)
  })
})
