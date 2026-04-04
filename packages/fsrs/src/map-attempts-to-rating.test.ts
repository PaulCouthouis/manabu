import { describe, expect, it } from "vitest"
import { mapAttemptsToRating } from "./map-attempts-to-rating.js"

describe("mapAttemptsToRating", () => {
  // AC19
  it("1 attempt → good", () => {
    expect(mapAttemptsToRating(1)).toBe("good")
  })

  // AC20
  it("2 attempts → hard", () => {
    expect(mapAttemptsToRating(2)).toBe("hard")
  })

  // AC21
  it("3 attempts → again", () => {
    expect(mapAttemptsToRating(3)).toBe("again")
  })

  // AC22
  it("10 attempts → again", () => {
    expect(mapAttemptsToRating(10)).toBe("again")
  })
})
