import type { GrammarId, WordId } from "../linguistic-element.js"
import {
  GrammarId as mkGrammarId,
  SentenceElement,
  SentenceId,
  WordId as mkWordId,
} from "../linguistic-element.js"

const toComponentId = (id: number): WordId | GrammarId =>
  id >= 5000 ? mkWordId(id) : mkGrammarId(id)

export const s = (
  id: number,
  text: string,
  meaning: string,
  components: readonly number[],
  sentenceRank: number,
) =>
  SentenceElement.make({
    id: SentenceId(id),
    text,
    meaning,
    components: components.map(toComponentId) as [WordId | GrammarId, ...(WordId | GrammarId)[]],
    sentenceRank,
  })
