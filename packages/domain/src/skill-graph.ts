import { Array, HashMap, Option, pipe } from "effect"
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
): ReadonlyArray<SkillTypeId> =>
  pipe(
    HashMap.get(graph, id),
    Option.getOrElse(() => Array.empty<SkillTypeId>()),
  )

export const getTransitivePrerequisites = (
  graph: SkillGraphData,
  id: SkillTypeId,
): ReadonlyArray<SkillTypeId> => {
  const visited = new Set<SkillTypeId>()
  const stack = [...getPrerequisites(graph, id)]

  let current = stack.pop()
  while (current !== undefined) {
    if (!visited.has(current)) {
      visited.add(current)
      stack.push(...getPrerequisites(graph, current))
    }
    current = stack.pop()
  }

  return Array.fromIterable(visited)
}

export const getEntryPoints = (graph: SkillGraphData): ReadonlyArray<SkillTypeId> =>
  pipe(
    Array.fromIterable(HashMap.toEntries(graph)),
    Array.filter(([, prereqs]) => prereqs.length === 0),
    Array.map(([id]) => id),
  )

export const getDependents = (graph: SkillGraphData, id: SkillTypeId): ReadonlyArray<SkillTypeId> =>
  pipe(
    Array.fromIterable(HashMap.toEntries(graph)),
    Array.filter(([, prereqs]) => prereqs.some((p) => p === id)),
    Array.map(([depId]) => depId),
  )

export const validateGraph = (graph: SkillGraphData): boolean => {
  const visited = new Set<SkillTypeId>()
  const inStack = new Set<SkillTypeId>()

  const hasCycle = (id: SkillTypeId): boolean => {
    if (inStack.has(id)) return true
    if (visited.has(id)) return false

    visited.add(id)
    inStack.add(id)

    for (const prereq of getPrerequisites(graph, id)) {
      if (hasCycle(prereq)) return true
    }

    inStack.delete(id)
    return false
  }

  for (const [id] of HashMap.toEntries(graph)) {
    if (hasCycle(id)) return false
  }

  return true
}
