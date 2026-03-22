import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  // Better Auth creates the "user" table in prod.
  // Ensure it exists for test environments and fresh databases.
  yield* sql`
    CREATE TABLE IF NOT EXISTS "user" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      "emailVerified" BOOLEAN NOT NULL DEFAULT false,
      image TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  yield* sql`
    CREATE TABLE IF NOT EXISTS review_card (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL REFERENCES "user"(id),
      content_item_id INTEGER NOT NULL REFERENCES content_item(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      next_review_at TIMESTAMPTZ NOT NULL,
      UNIQUE (user_id, content_item_id)
    )
  `
})
