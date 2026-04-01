import { Atom, useAtomSet } from "@effect-atom/atom-react"
import { Effect, Layer, Option } from "effect"
import React, { useContext, useMemo, useState } from "react"
import { styled } from "styled-system/jsx"
import type { AnswerResult } from "~/logic/answer-validation.js"
import { AnswerValidationApi } from "~/logic/answer-validation.js"
import type {
  WrittenProductionConfig,
  WrittenProductionResult,
} from "~/logic/written-production-config.js"
import { TextSubmitInput } from "~/components/shared/text-submit-input.js"

export type WrittenProductionPhase =
  | { readonly kind: "answering" }
  | {
      readonly kind: "feedback"
      readonly answerResult: Option.Option<AnswerResult>
    }

export type WrittenProductionLayer = Layer.Layer<AnswerValidationApi>

export interface WrittenProductionProps {
  readonly config: WrittenProductionConfig
  readonly onResult: (result: WrittenProductionResult) => void
  readonly initialPhase?: WrittenProductionPhase
}

function makeRuntime(layer: WrittenProductionLayer) {
  const runtime = Atom.runtime(layer)

  const validateAtom = runtime.fn(
    Effect.fnUntraced(function* (args: { answer: string; expected: string }) {
      const api = yield* AnswerValidationApi
      return yield* api.validate(args.answer, args.expected)
    }),
  )

  return { validateAtom }
}

type WrittenProductionAtoms = ReturnType<typeof makeRuntime>

const WrittenProductionAtomsContext = React.createContext<WrittenProductionAtoms | null>(null)

export function WrittenProductionProvider(props: {
  readonly layer: WrittenProductionLayer
  readonly children: React.ReactNode
}) {
  const atoms = useMemo(() => {
    return makeRuntime(props.layer)
  }, [props.layer])

  return (
    <WrittenProductionAtomsContext.Provider value={atoms}>
      {props.children}
    </WrittenProductionAtomsContext.Provider>
  )
}

function useAtoms(): WrittenProductionAtoms {
  const atoms = useContext(WrittenProductionAtomsContext)
  if (atoms === null) {
    throw new Error("WrittenProduction must be wrapped in WrittenProductionProvider")
  }
  return atoms
}

const Container = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    height: "100dvh",
    overflow: "hidden",
  },
})

const ExerciseZone = styled("div", {
  base: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    width: "100%",
  },
})

const MeaningText = styled("span", {
  base: {
    fontSize: "3xl",
    fontWeight: "semibold",
    textAlign: "center",
    lineHeight: "relaxed",
    px: "4",
  },
})

const FOOTER_HEIGHT = "80px"

const Footer = styled("div", {
  base: {
    width: "100%",
    height: FOOTER_HEIGHT,
    borderTopWidth: "1px",
    borderColor: "border.subtle",
    bg: "bg.subtle",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    px: "4",
  },
})

function outcomeFromAnswerResult(answerResult: Option.Option<AnswerResult>) {
  if (Option.isNone(answerResult)) {
    return "skip"
  }
  if (answerResult.value.kind === "correct" || answerResult.value.kind === "accepted") {
    return "success"
  }
  return "failure"
}

export function WrittenProduction(props: WrittenProductionProps) {
  const { config, onResult, initialPhase } = props
  const [phase, setPhase] = useState<WrittenProductionPhase>(initialPhase ?? { kind: "answering" })

  const { validateAtom } = useAtoms()
  const validate = useAtomSet(validateAtom, { mode: "promiseExit" })

  const emitFeedback = (answerResult: Option.Option<AnswerResult>) => {
    setPhase({ kind: "feedback", answerResult })
    onResult({ outcome: outcomeFromAnswerResult(answerResult), answerResult })
  }

  const handleSubmit = async (answer: string) => {
    const exit = await validate({ answer, expected: config.expected })
    if (exit._tag !== "Success") {
      return
    }
    emitFeedback(Option.some(exit.value))
  }

  const handleSkip = () => {
    emitFeedback(Option.none())
  }

  return (
    <Container>
      <ExerciseZone>
        <MeaningText>{config.meaning}</MeaningText>
      </ExerciseZone>

      <Footer>
        {phase.kind === "answering" && (
          <TextSubmitInput
            onSubmit={handleSubmit}
            onSkip={handleSkip}
            placeholder="「日本語で入力」"
          />
        )}
      </Footer>
    </Container>
  )
}
