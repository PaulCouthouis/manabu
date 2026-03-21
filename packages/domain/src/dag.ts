/**
 * Validates that a directed graph has no cycles (is a DAG).
 *
 * @param nodes - All node IDs in the graph
 * @param getEdges - Function returning the direct edges (prerequisites/components) for a node
 * @returns true if the graph is a valid DAG, false if a cycle is detected
 */
export const validateDag = <Id>(
  nodes: Iterable<Id>,
  getEdges: (id: Id) => Iterable<Id>,
): boolean => {
  const visited = new Set<Id>()
  const inStack = new Set<Id>()

  const hasCycle = (id: Id): boolean => {
    if (inStack.has(id)) return true
    if (visited.has(id)) return false

    inStack.add(id)

    for (const edge of getEdges(id)) {
      if (hasCycle(edge)) return true
    }

    inStack.delete(id)
    visited.add(id)
    return false
  }

  for (const id of nodes) {
    if (hasCycle(id)) return false
  }

  return true
}
