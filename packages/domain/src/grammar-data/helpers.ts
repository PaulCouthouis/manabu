import { GrammarPoint, GrammarPointId } from "../grammar-point.js"

export const g = (
  id: number,
  name: string,
  explanation: string,
  frequency: number,
  formCount: number,
) =>
  GrammarPoint.make({
    id: GrammarPointId(id),
    name,
    explanation,
    frequency,
    formCount,
  })
