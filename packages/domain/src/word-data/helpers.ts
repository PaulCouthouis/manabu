import type { KanaId, KanjiId } from "../linguistic-element.js"
import {
  KanaId as mkKanaId,
  KanjiId as mkKanjiId,
  WordElement,
  WordId,
} from "../linguistic-element.js"

const toComponentId = (id: number): KanaId | KanjiId => (id >= 1000 ? mkKanjiId(id) : mkKanaId(id))

export const w = (
  id: number,
  written: string,
  meaning: string,
  components: readonly number[],
  frequency: number,
) =>
  WordElement.make({
    id: WordId(id),
    written,
    meaning,
    components: components.map(toComponentId) as [KanaId | KanjiId, ...(KanaId | KanjiId)[]],
    frequency,
  })
