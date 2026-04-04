import { Array, HashMap, Option, pipe } from "effect"
import { validateDag } from "./dag.js"
import { SkillTypeId } from "./skill-type.js"

// --- Types ---

export type SkillGraphData = HashMap.HashMap<SkillTypeId, ReadonlyArray<SkillTypeId>>

// --- Graphe de dépendances ---

export const SkillGraph: SkillGraphData = HashMap.fromIterable([
  // Fondations
  [SkillTypeId(1), Array.empty<SkillTypeId>()],
  [SkillTypeId(2), [SkillTypeId(1)]],
  [SkillTypeId(3), [SkillTypeId(2)]],

  // Core
  [SkillTypeId(4), [SkillTypeId(1)]],
  [SkillTypeId(5), Array.empty<SkillTypeId>()],
  [SkillTypeId(6), [SkillTypeId(4)]],
  [SkillTypeId(7), [SkillTypeId(2), SkillTypeId(3), SkillTypeId(4)]],
  [SkillTypeId(8), [SkillTypeId(5), SkillTypeId(7)]],
  [SkillTypeId(9), [SkillTypeId(6), SkillTypeId(7)]],
  [SkillTypeId(10), [SkillTypeId(8)]],

  // Grammaire
  [SkillTypeId(11), [SkillTypeId(8)]],
  [SkillTypeId(12), [SkillTypeId(8)]],
  [SkillTypeId(13), [SkillTypeId(8)]],
  [SkillTypeId(14), [SkillTypeId(8)]],
  [SkillTypeId(15), [SkillTypeId(8)]],
])

// --- Fonctions de query ---

export const getPrerequisites = (
  graph: SkillGraphData,
  id: SkillTypeId,
): ReadonlyArray<SkillTypeId> => {
  return pipe(
    HashMap.get(graph, id),
    Option.getOrElse(() => {
      return Array.empty<SkillTypeId>()
    }),
  )
}

export const getTransitivePrerequisites = (
  graph: SkillGraphData,
  id: SkillTypeId,
): ReadonlyArray<SkillTypeId> => {
  const collect = (
    stack: ReadonlyArray<SkillTypeId>,
    visited: ReadonlySet<SkillTypeId>,
  ): ReadonlySet<SkillTypeId> => {
    return pipe(
      Array.head(stack),
      Option.match({
        onNone: () => {
          return visited
        },
        onSome: (current) => {
          const rest = Array.drop(stack, 1)
          if (visited.has(current)) {
            return collect(rest, visited)
          }
          const newVisited = new Set([...visited, current])
          const neighbors = getPrerequisites(graph, current)
          return collect([...rest, ...neighbors], newVisited)
        },
      }),
    )
  }

  return Array.fromIterable(collect(getPrerequisites(graph, id), new Set()))
}

export const getEntryPoints = (graph: SkillGraphData): ReadonlyArray<SkillTypeId> => {
  return pipe(
    Array.fromIterable(HashMap.toEntries(graph)),
    Array.filter(([, prereqs]) => {
      return prereqs.length === 0
    }),
    Array.map(([id]) => {
      return id
    }),
  )
}

export const getDependents = (
  graph: SkillGraphData,
  id: SkillTypeId,
): ReadonlyArray<SkillTypeId> => {
  return pipe(
    Array.fromIterable(HashMap.toEntries(graph)),
    Array.filter(([, prereqs]) => {
      return Array.some(prereqs, (p) => {
        return p === id
      })
    }),
    Array.map(([depId]) => {
      return depId
    }),
  )
}

export const validateGraph = (graph: SkillGraphData): boolean => {
  return validateDag(HashMap.keys(graph), (id) => {
    return getPrerequisites(graph, id)
  })
}
