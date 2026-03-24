import { describe, expect, it } from "vitest"
import { isTextTruncated } from "./is-text-truncated.js"

describe("isTextTruncated", () => {
  it("retourne true quand scrollWidth dépasse clientWidth", () => {
    expect(isTextTruncated({ scrollWidth: 200, clientWidth: 100 })).toBe(true)
  })

  it("retourne false quand scrollWidth égale clientWidth", () => {
    expect(isTextTruncated({ scrollWidth: 100, clientWidth: 100 })).toBe(false)
  })

  it("retourne false quand scrollWidth est inférieur à clientWidth", () => {
    expect(isTextTruncated({ scrollWidth: 50, clientWidth: 100 })).toBe(false)
  })
})
