import { Array } from "effect"
import {
  SentenceElement,
  SentenceId,
  WORD_ID_MIN,
  WordId as mkWordId,
} from "../linguistic-element.js"
import { GrammarPointId } from "../grammar-point.js"

const isWordId = (id: number): boolean => {
  return id >= WORD_ID_MIN
}

export const s = (
  id: number,
  text: string,
  meaning: string,
  components: readonly number[],
  sentenceRank: number,
) => {
  const words = Array.filter(components, isWordId)
  const grammarPoints = Array.filter(components, (x) => {
    return !isWordId(x)
  })
  return SentenceElement.make({
    id: SentenceId(id),
    text,
    meaning,
    components: Array.map(words, (x) => {
      return mkWordId(x)
    }),
    grammarPoints: Array.map(grammarPoints, (x) => {
      return GrammarPointId(x)
    }),
    sentenceRank,
  })
}
