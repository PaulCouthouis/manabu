import { Array } from "effect"
import { KanjiElement, KanjiId } from "../linguistic-element.js"

export const k = (
  id: number,
  character: string,
  meanings: readonly string[],
  components: readonly number[],
  frequency: number,
  strokeCount: number,
) => {
  return KanjiElement.make({
    id: KanjiId(id),
    character,
    meanings: [...meanings],
    components: Array.map(components, KanjiId),
    frequency,
    strokeCount,
  })
}
