export interface AudioPlayer {
  src: string
  play(): void
}

export function playAudio(player: AudioPlayer, url: string) {
  player.src = url
  player.play()
}
