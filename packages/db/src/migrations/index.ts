import { Migrator } from "@effect/sql"
import m0001 from "./0001_skill_type.js"
import m0002 from "./0002_linguistic_element.js"
import m0003 from "./0003_content_item.js"
import m0004 from "./0004_seed_kana.js"
import m0005 from "./0005_seed_kanji.js"
import m0006 from "./0006_seed_kana_extended.js"
import m0007 from "./0007_seed_words.js"
import m0008 from "./0008_seed_counter_words.js"
import m0009 from "./0009_seed_grammar.js"
import m0010 from "./0010_seed_sentences.js"
import m0011 from "./0011_review_card.js"
import m0012 from "./0012_grammar_point.js"
import m0013 from "./0013_sentence_grammar_point.js"

const migrations = Migrator.fromRecord({
  "0001_skill_type": m0001,
  "0002_linguistic_element": m0002,
  "0003_content_item": m0003,
  "0004_seed_kana": m0004,
  "0005_seed_kanji": m0005,
  "0006_seed_kana_extended": m0006,
  "0007_seed_words": m0007,
  "0008_seed_counter_words": m0008,
  "0009_seed_grammar": m0009,
  "0010_seed_sentences": m0010,
  "0011_review_card": m0011,
  "0012_grammar_point": m0012,
  "0013_sentence_grammar_point": m0013,
})

const migrator = Migrator.make({})

export const runMigrations = migrator({ loader: migrations })
