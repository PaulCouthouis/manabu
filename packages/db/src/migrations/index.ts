import { Migrator } from "@effect/sql"
import m0001 from "./0001_skill_type.js"

const migrations = Migrator.fromRecord({
  "0001_skill_type": m0001,
})

const migrator = Migrator.make({})

export const runMigrations = migrator({ loader: migrations })
