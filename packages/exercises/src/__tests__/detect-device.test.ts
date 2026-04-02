import { assert, layer } from "@effect/vitest"
import { Effect, Layer } from "effect"
import { detectDevice, parseDevice } from "~/components/ime-help-modal/detect-device"
import { UserAgentApi } from "~/logic/user-agent"
import { describe, expect, it } from "vitest"

describe("parseDevice", () => {
  it("returns 'ios' for iPhone UA", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
    expect(parseDevice(ua)).toBe("ios")
  })

  it("returns 'ios' for iPad UA", () => {
    const ua =
      "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
    expect(parseDevice(ua)).toBe("ios")
  })

  it("returns 'android' for Android UA", () => {
    const ua =
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
    expect(parseDevice(ua)).toBe("android")
  })

  it("returns 'macos' for macOS UA", () => {
    const ua =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    expect(parseDevice(ua)).toBe("macos")
  })

  it("returns 'windows' for Windows UA", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    expect(parseDevice(ua)).toBe("windows")
  })

  it("returns 'chromeos' for CrOS UA", () => {
    const ua =
      "Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    expect(parseDevice(ua)).toBe("chromeos")
  })

  it("returns 'unknown' for Linux UA", () => {
    const ua =
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    expect(parseDevice(ua)).toBe("unknown")
  })

  it("returns 'unknown' for empty string", () => {
    expect(parseDevice("")).toBe("unknown")
  })

  it("detects ChromeOS before Android (CrOS UA contains Linux)", () => {
    const ua =
      "Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    expect(parseDevice(ua)).toBe("chromeos")
  })
})

const makeTestLayer = (userAgent: string) => {
  return Layer.succeed(UserAgentApi, {
    get: () => {
      return userAgent
    },
  })
}

layer(
  makeTestLayer(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  ),
)("detectDevice — reads UserAgentApi", (it) => {
  it.effect("returns device type from UserAgentApi", () => {
    return Effect.gen(function* () {
      const device = yield* detectDevice
      assert.strictEqual(device, "macos")
    })
  })
})

layer(makeTestLayer(""))("detectDevice — unknown UA", (it) => {
  it.effect("returns unknown for empty UA", () => {
    return Effect.gen(function* () {
      const device = yield* detectDevice
      assert.strictEqual(device, "unknown")
    })
  })
})
