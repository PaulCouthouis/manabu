import { describe, expect, it } from "vitest"
import type { AudioPlayer } from "./audio-playback.js"
import { playAudio } from "./audio-playback.js"

describe("playAudio", () => {
  it("set src et appelle play sur le player", () => {
    let playedCount = 0
    const player: AudioPlayer = {
      src: "",
      play() {
        playedCount++
      },
    }

    playAudio(player, "blob:fake-url")

    expect(player.src).toBe("blob:fake-url")
    expect(playedCount).toBe(1)
  })
})
