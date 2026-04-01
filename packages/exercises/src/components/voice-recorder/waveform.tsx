import { useEffect, useRef } from "react"
import { styled } from "styled-system/jsx"
import { token } from "styled-system/tokens"
import type { VoiceRecorderState } from "~/components/voice-recorder/voice-recorder.js"

const Canvas = styled("canvas", {
  base: {
    flex: 1,
    height: "100%",
  },
})

const BAR_WIDTH = 3
const BAR_GAP = 2
const BAR_RADIUS = 1.5

const LISTENING_COLOR = token("colors.colorPalette.9")
const PROCESSING_COLOR = token("colors.fg.muted")
const DISABLED_COLOR = token("colors.fg.disabled")

const getBarColor = (state: VoiceRecorderState): string => {
  if (state === "listening") {
    return LISTENING_COLOR
  }
  if (state === "processing") {
    return PROCESSING_COLOR
  }
  return DISABLED_COLOR
}

const drawBars = (
  ctx: CanvasRenderingContext2D,
  data: Uint8Array | null,
  width: number,
  height: number,
  color: string,
) => {
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = color

  if (data === null) {
    const y = height / 2
    ctx.fillRect(0, y - 0.5, width, 1)
    return
  }

  const barCount = Math.floor(width / (BAR_WIDTH + BAR_GAP))
  const step = Math.max(1, Math.floor(data.length / barCount))

  Array.from({ length: barCount }, (_, i) => {
    const dataIndex = i * step
    const value = dataIndex < data.length ? (data[dataIndex] ?? 0) : 0
    const barHeight = Math.max(2, (value / 255) * height)
    const x = i * (BAR_WIDTH + BAR_GAP)
    const y = (height - barHeight) / 2

    ctx.beginPath()
    ctx.roundRect(x, y, BAR_WIDTH, barHeight, BAR_RADIUS)
    ctx.fill()
  })
}

export function Waveform(props: {
  readonly state: VoiceRecorderState
  readonly frequencyData: Uint8Array | null
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) {
      return
    }
    const ctx = canvas.getContext("2d")
    if (ctx === null) {
      return
    }

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const data = props.state === "paused" ? null : props.frequencyData
    drawBars(ctx, data, rect.width, rect.height, getBarColor(props.state))
  })

  return <Canvas ref={canvasRef} />
}
