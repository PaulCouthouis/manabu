import { KanjiElement, KanjiId } from "../linguistic-element.js"

export const k = (
  id: number,
  character: string,
  meanings: readonly string[],
  components: readonly number[],
  frequency: number,
  strokeCount: number,
) =>
  KanjiElement.make({
    id: KanjiId(id),
    character,
    meanings: [...meanings],
    components: components.map(KanjiId),
    frequency,
    strokeCount,
  })
