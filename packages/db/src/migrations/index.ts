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
})

const migrator = Migrator.make({})

export const runMigrations = migrator({ loader: migrations })
