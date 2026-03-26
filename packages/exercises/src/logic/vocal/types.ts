export interface AudioStreamTrack {
  readonly stop: () => void
}

export interface AudioStream {
  readonly _tag: "AudioStream"
  readonly getTracks: () => ReadonlyArray<AudioStreamTrack>
  readonly _raw: unknown
}
