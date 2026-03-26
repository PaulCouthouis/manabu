import { Atom, Result, useAtom, useAtomSet } from "@effect-atom/atom-react"
import { Array, Cause, Effect, Exit, Layer, Option, Struct, pipe } from "effect"
import { useEffect, useState } from "react"
import { styled } from "styled-system/jsx"
import { AudioAnalyserApi, BrowserWebAudioContextApiLive } from "~/logic/vocal/audio-analyser.js"
import { BrowserMediaRecorderApiLive, MediaRecorderApi } from "~/logic/vocal/media-recorder.js"
import {
  BrowserGetUserMediaApiLive,
  MicrophoneApi,
  type MicrophoneError,
} from "~/logic/vocal/microphone.js"
import {
  type VoiceCaptureEvent,
  type VoiceCaptureSession,
  VoiceCaptureService,
} from "~/logic/vocal/voice-capture.js"
import { StatusIcon } from "~/components/voice-recorder/status-icon.js"
import { Waveform } from "~/components/voice-recorder/waveform.js"

// --- Types ---

export type VoiceRecorderState = "listening" | "processing" | "paused"

export interface VoiceRecorderProps {
  readonly state: VoiceRecorderState
  readonly onSpeechStart: () => void
  readonly onSpeechEnd: (blob: Blob) => void
  readonly onError: (error: Cause.Cause<MicrophoneError>) => void
}

// --- Runtime + Atoms ---

const VoiceRecorderRuntime = Atom.runtime(
  Layer.mergeAll(
    Layer.provide(
      VoiceCaptureService.Default,
      Layer.mergeAll(
        Layer.provide(MicrophoneApi.Default, BrowserGetUserMediaApiLive),
        Layer.provide(AudioAnalyserApi.Default, BrowserWebAudioContextApiLive),
        Layer.provide(MediaRecorderApi.Default, BrowserMediaRecorderApiLive),
      ),
    ),
  ),
)

const startSessionAtom = VoiceRecorderRuntime.fn(
  Effect.fnUntraced(function* () {
    const service = yield* VoiceCaptureService
    return yield* service.start()
  }),
)

const processFrameAtom = VoiceRecorderRuntime.fn(
  Effect.fnUntraced(function* (args: { session: VoiceCaptureSession; now: number }) {
    return yield* args.session.processFrame(args.now)
  }),
)

const closeSessionAtom = VoiceRecorderRuntime.fn(
  Effect.fnUntraced(function* (session: VoiceCaptureSession) {
    yield* session.close()
  }),
)

// --- Styles ---

const Container = styled("div", {
  base: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    height: "48px",
    borderRadius: "l2",
    bg: "bg.subtle",
    borderWidth: "1px",
    borderColor: "border.subtle",
    px: "3",
    gap: "3",
    colorPalette: "accent",
  },
})

const ErrorText = styled("span", {
  base: {
    color: "fg.muted",
    fontSize: "sm",
    flex: 1,
  },
})

// --- Pure helpers ---

const dispatchEvents = (
  events: ReadonlyArray<VoiceCaptureEvent>,
  onSpeechStart: () => void,
  onSpeechEnd: (blob: Blob) => void,
) => {
  Array.forEach(events, (event) => {
    if (event.kind === "speechStart") {
      onSpeechStart()
    }
    if (event.kind === "speechEnd") {
      onSpeechEnd(event.blob)
    }
  })
}

const isFrequencyDataEvent = (
  e: VoiceCaptureEvent,
): e is Extract<VoiceCaptureEvent, { kind: "frequencyData" }> => {
  return e.kind === "frequencyData"
}

const extractFrequencyData = (
  events: ReadonlyArray<VoiceCaptureEvent>,
): Option.Option<Uint8Array> => {
  return pipe(events, Array.findFirst(isFrequencyDataEvent), Option.map(Struct.get("data")))
}

// --- Hooks ---

function useSession(state: VoiceRecorderState) {
  const [sessionResult, startSession] = useAtom(startSessionAtom)
  const closeSession = useAtomSet(closeSessionAtom)

  useEffect(() => {
    if (state !== "listening") {
      return
    }
    startSession()
    return () => {
      if (Result.isSuccess(sessionResult)) {
        closeSession(sessionResult.value)
      }
    }
  }, [state])

  return sessionResult
}

function useFrameLoop(
  state: VoiceRecorderState,
  sessionResult: Result.Result<VoiceCaptureSession, unknown>,
  onSpeechStart: () => void,
  onSpeechEnd: (blob: Blob) => void,
) {
  const [frequencyData, setFrequencyData] = useState<Option.Option<Uint8Array>>(Option.none())
  const processFrame = useAtomSet(processFrameAtom, { mode: "promiseExit" })

  useEffect(() => {
    if (state !== "listening" || !Result.isSuccess(sessionResult)) {
      return
    }

    const session = sessionResult.value
    let running = true

    const loop = async () => {
      if (!running) {
        return
      }
      const frameExit = await processFrame({ session, now: performance.now() })
      if (!Exit.isSuccess(frameExit) || !running) {
        return
      }
      const events = frameExit.value
      const data = extractFrequencyData(events)
      if (Option.isSome(data)) {
        setFrequencyData(data)
      }
      dispatchEvents(events, onSpeechStart, onSpeechEnd)
      requestAnimationFrame(loop)
    }

    requestAnimationFrame(loop)

    return () => {
      running = false
      setFrequencyData(Option.none())
    }
  }, [state, sessionResult])

  return frequencyData
}

function useErrorReporting(
  sessionResult: Result.Result<VoiceCaptureSession, MicrophoneError>,
  onError: (error: Cause.Cause<MicrophoneError>) => void,
) {
  useEffect(() => {
    if (Result.isFailure(sessionResult)) {
      onError(sessionResult.cause)
    }
  }, [sessionResult])
}

// --- Component ---

export function VoiceRecorder(props: VoiceRecorderProps) {
  const sessionResult = useSession(props.state)
  const frequencyData = useFrameLoop(
    props.state,
    sessionResult,
    props.onSpeechStart,
    props.onSpeechEnd,
  )
  useErrorReporting(sessionResult, props.onError)

  if (Result.isFailure(sessionResult)) {
    return (
      <Container>
        <StatusIcon state="error" />
        <ErrorText>Microphone access required</ErrorText>
      </Container>
    )
  }

  return (
    <Container>
      <StatusIcon state={props.state} />
      <Waveform state={props.state} frequencyData={Option.getOrNull(frequencyData)} />
    </Container>
  )
}
