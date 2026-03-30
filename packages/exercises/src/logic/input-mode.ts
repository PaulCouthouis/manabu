import { Atom } from "@effect-atom/atom-react"
import * as KeyValueStore from "@effect/platform/KeyValueStore"
import { Schema } from "effect"

export const InputMode = Schema.Literal("voice", "keyboard")
export type InputMode = typeof InputMode.Type

export const INPUT_MODE_KEY = "manabu:input-mode"

const InputModeRuntime = Atom.runtime(
  KeyValueStore.layerStorage(() => {
    return localStorage
  }),
)

export const inputModeAtom = Atom.kvs({
  runtime: InputModeRuntime,
  key: INPUT_MODE_KEY,
  schema: InputMode,
  defaultValue: () => {
    return "voice" as const
  },
})
