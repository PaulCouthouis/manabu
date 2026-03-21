import { Migrator } from "@effect/sql"
import m0001 from "./0001_skill_type.js"
import m0002 from "./0002_linguistic_element.js"
import m0003 from "./0003_content_item.js"

const migrations = Migrator.fromRecord({
  "0001_skill_type": m0001,
  "0002_linguistic_element": m0002,
  "0003_content_item": m0003,
})

const migrator = Migrator.make({})

export const runMigrations = migrator({ loader: migrations })
