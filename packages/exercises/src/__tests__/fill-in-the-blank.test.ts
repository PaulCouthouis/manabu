import { assert, describe, it } from "@effect/vitest"
import type { BlankDefinition } from "~/logic/fill-in-the-blank-config.js"
import { validateBlanks } from "~/logic/fill-in-the-blank.js"

const singleBlank: ReadonlyArray<BlankDefinition> = [{ index: 0, correctAnswer: "に" }]

const multiBlanks: ReadonlyArray<BlankDefinition> = [
  { index: 0, correctAnswer: "は" },
  { index: 1, correctAnswer: "に" },
]

describe("validateBlanks", () => {
  it("single blank correct → success", () => {
    const result = validateBlanks(["に"], singleBlank)
    assert.strictEqual(result.outcome, "success")
    assert.deepStrictEqual(result.blankResults, [
      { index: 0, userChoice: "に", correctAnswer: "に", isCorrect: true },
    ])
  })

  it("single blank incorrect → failure", () => {
    const result = validateBlanks(["で"], singleBlank)
    assert.strictEqual(result.outcome, "failure")
    assert.deepStrictEqual(result.blankResults, [
      { index: 0, userChoice: "で", correctAnswer: "に", isCorrect: false },
    ])
  })

  it("multi-blank all correct → success", () => {
    const result = validateBlanks(["は", "に"], multiBlanks)
    assert.strictEqual(result.outcome, "success")
    assert.deepStrictEqual(result.blankResults, [
      { index: 0, userChoice: "は", correctAnswer: "は", isCorrect: true },
      { index: 1, userChoice: "に", correctAnswer: "に", isCorrect: true },
    ])
  })

  it("multi-blank mixed → failure with detail per blank", () => {
    const result = validateBlanks(["は", "で"], multiBlanks)
    assert.strictEqual(result.outcome, "failure")
    assert.deepStrictEqual(result.blankResults, [
      { index: 0, userChoice: "は", correctAnswer: "は", isCorrect: true },
      { index: 1, userChoice: "で", correctAnswer: "に", isCorrect: false },
    ])
  })

  it("multi-blank all incorrect → failure", () => {
    const result = validateBlanks(["が", "で"], multiBlanks)
    assert.strictEqual(result.outcome, "failure")
  })
})
