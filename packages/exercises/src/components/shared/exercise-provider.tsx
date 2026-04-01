import type { Layer } from "effect"
import React, { useContext, useMemo } from "react"

export function createExerciseProvider<L, A>(
  name: string,
  makeAtoms: (layer: Layer.Layer<L>) => A,
) {
  const AtomsContext = React.createContext<A | null>(null)

  function Provider(props: { readonly layer: Layer.Layer<L>; readonly children: React.ReactNode }) {
    const atoms = useMemo(() => {
      return makeAtoms(props.layer)
    }, [props.layer])

    return <AtomsContext.Provider value={atoms}>{props.children}</AtomsContext.Provider>
  }

  Provider.displayName = `${name}Provider`

  function useAtoms(): A {
    const atoms = useContext(AtomsContext)
    if (atoms === null) {
      throw new Error(`${name} must be wrapped in ${name}Provider`)
    }
    return atoms
  }

  return { Provider, useAtoms }
}
