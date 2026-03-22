import { GrammarElement, GrammarId } from "../linguistic-element.js"

export const g = (
  id: number,
  name: string,
  explanation: string,
  frequency: number,
  formCount: number,
) =>
  GrammarElement.make({
    id: GrammarId(id),
    name,
    explanation,
    frequency,
    formCount,
  })
