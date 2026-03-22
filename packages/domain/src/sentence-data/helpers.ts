import {
  SentenceElement,
  SentenceId,
  WORD_ID_MIN,
  WordId as mkWordId,
} from "../linguistic-element.js"
import { GrammarPointId } from "../grammar-point.js"

const isWordId = (id: number): boolean => id >= WORD_ID_MIN

export const s = (
  id: number,
  text: string,
  meaning: string,
  components: readonly number[],
  sentenceRank: number,
) => {
  const words = components.filter(isWordId)
  const grammarPoints = components.filter((x) => !isWordId(x))
  return SentenceElement.make({
    id: SentenceId(id),
    text,
    meaning,
    components: words.map((x) => mkWordId(x)),
    grammarPoints: grammarPoints.map((x) => GrammarPointId(x)),
    sentenceRank,
  })
}
