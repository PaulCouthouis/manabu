import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* sql`
    CREATE TABLE IF NOT EXISTS linguistic_element (
      id INTEGER PRIMARY KEY,
      kind TEXT NOT NULL,

      -- KanaElement
      character TEXT,
      kana_type TEXT,
      sort_order INTEGER,

      -- KanjiElement
      -- character (shared with kana)
      meanings JSONB,
      frequency INTEGER,
      stroke_count INTEGER,

      -- WordElement
      written TEXT,
      meaning TEXT,
      -- frequency (shared with kanji)

      -- SentenceElement
      text TEXT,
      -- meaning (shared with word)

      -- GrammarElement
      name TEXT,
      explanation TEXT,
      -- frequency (shared with kanji/word)
      form_count INTEGER,

      CONSTRAINT chk_kind CHECK (kind IN ('kana', 'kanji', 'word', 'sentence', 'grammar'))
    )
  `

  yield* sql`
    CREATE TABLE IF NOT EXISTS element_component (
      parent_id INTEGER NOT NULL REFERENCES linguistic_element(id),
      component_id INTEGER NOT NULL REFERENCES linguistic_element(id),
      position INTEGER NOT NULL,
      PRIMARY KEY (parent_id, component_id)
    )
  `
})
