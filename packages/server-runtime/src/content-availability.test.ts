import { SqlClient } from "@effect/sql"
import { assert, layer } from "@effect/vitest"
import { runMigrations } from "@manabu/db"
import { TestRepoLayer } from "@manabu/db/test-utils"
import { ContentAvailability, SkillTypeId } from "@manabu/domain"
import { Array, DateTime, Effect, Layer, Struct, TestClock } from "effect"
import { ContentAvailabilityLive } from "./content-availability-live.js"

// --- Clock ---

const now = DateTime.unsafeMake("2026-04-05T12:00:00Z")
const future = DateTime.add(now, { days: 30 })
const past = DateTime.subtract(now, { days: 1 })

// --- Skills ---

const skill1 = SkillTypeId(1)
const skill2 = SkillTypeId(2)
const skill4 = SkillTypeId(4)
const skill7 = SkillTypeId(7)
const skill11 = SkillTypeId(11)

// --- DSL ---

const setup = Effect.gen(function* () {
  yield* runMigrations
  yield* TestClock.setTime(DateTime.toEpochMillis(now))
  const sql = yield* SqlClient.SqlClient
  yield* sql`
    INSERT INTO "user" (id, name, email) VALUES
      ('user1', 'Test User 1', 'test1@example.com'),
      ('user2', 'Test User 2', 'test2@example.com')
    ON CONFLICT DO NOTHING
  `
})

const findElementId = (name: string) => {
  return Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const rows = yield* sql<{ id: number }>`
      SELECT id FROM linguistic_element
      WHERE character = ${name} OR written = ${name} OR text = ${name}
      LIMIT 1
    `
    return Array.unsafeGet(rows, 0).id
  })
}

const retain = (
  userId: string,
  elementName: string,
  skillId: SkillTypeId,
  nextReviewAt = future,
) => {
  return Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const elementId = yield* findElementId(elementName)
    const rows = yield* sql<{ id: number }>`
      SELECT id FROM content_item
      WHERE element_id = ${elementId} AND skill_type_id = ${Number(skillId)}
    `
    const contentItemId = Array.unsafeGet(rows, 0).id
    yield* sql`
      INSERT INTO review_card (user_id, content_item_id, next_review_at)
      VALUES (${userId}, ${contentItemId}, ${DateTime.toDateUtc(nextReviewAt)}::timestamptz)
      ON CONFLICT (user_id, content_item_id)
      DO UPDATE SET next_review_at = ${DateTime.toDateUtc(nextReviewAt)}::timestamptz
    `
  })
}

const retainWithComponents = (
  userId: string,
  elementName: string,
  skillId: SkillTypeId,
  componentSkillIds: ReadonlyArray<SkillTypeId>,
) => {
  return Effect.gen(function* () {
    yield* retain(userId, elementName, skillId)

    const sql = yield* SqlClient.SqlClient
    const elementId = yield* findElementId(elementName)
    const componentRows = yield* sql<{ component_id: number }>`
      SELECT component_id FROM element_component WHERE parent_id = ${elementId}
    `
    yield* Effect.forEach(componentRows, (comp) =>
      Effect.forEach(componentSkillIds, (compSkillId) =>
        Effect.gen(function* () {
          const ciRows = yield* sql<{ id: number }>`
            SELECT id FROM content_item
            WHERE element_id = ${comp.component_id} AND skill_type_id = ${Number(compSkillId)}
          `
          if (ciRows.length > 0) {
            yield* sql`
              INSERT INTO review_card (user_id, content_item_id, next_review_at)
              VALUES (${userId}, ${Array.unsafeGet(ciRows, 0).id}, ${DateTime.toDateUtc(future)}::timestamptz)
              ON CONFLICT (user_id, content_item_id) DO NOTHING
            `
          }
        }),
      ),
    )
  })
}

const retainSentencePrereqs = (
  userId: string,
  sentenceText: string,
  prereqSkillId: SkillTypeId,
) => {
  return Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const elementId = yield* findElementId(sentenceText)
    const prereqRows = yield* sql<{ id: number }>`
      SELECT ci.id FROM content_item ci
      WHERE ci.skill_type_id = ${Number(prereqSkillId)}
        AND (ci.element_id = ${elementId}
          OR ci.element_id IN (SELECT component_id FROM element_component WHERE parent_id = ${elementId}))
    `
    yield* Effect.forEach(
      prereqRows,
      (r) =>
        sql`
        INSERT INTO review_card (user_id, content_item_id, next_review_at)
        VALUES (${userId}, ${r.id}, ${DateTime.toDateUtc(future)}::timestamptz)
        ON CONFLICT (user_id, content_item_id) DO NOTHING
      `,
    )
  })
}

const getAvailable = (userId: string, skillId: SkillTypeId) => {
  return Effect.gen(function* () {
    const contentAvailability = yield* ContentAvailability
    return yield* contentAvailability.getAvailableItems(userId, skillId)
  })
}

const elementNames = (items: ReadonlyArray<{ readonly linguisticElementId: number }>) => {
  return Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const ids = Array.map(items, Struct.get("linguisticElementId"))
    if (ids.length === 0) {
      return [] as Array<string>
    }
    const rows = yield* sql<{ id: number; name: string }>`
      SELECT id, COALESCE(character, written, text) AS name
      FROM linguistic_element
      WHERE id IN ${sql.in(ids)}
    `
    return Array.map(rows, Struct.get("name"))
  })
}

const assertAvailable = (
  userId: string,
  skillId: SkillTypeId,
  expectedNames: ReadonlyArray<string>,
) => {
  return Effect.gen(function* () {
    const items = yield* getAvailable(userId, skillId)
    const names = yield* elementNames(items)
    for (const name of expectedNames) {
      assert.ok(Array.contains(names, name), `expected "${name}" to be available`)
    }
  })
}

const assertNotAvailable = (
  userId: string,
  skillId: SkillTypeId,
  excludedNames: ReadonlyArray<string>,
) => {
  return Effect.gen(function* () {
    const items = yield* getAvailable(userId, skillId)
    const names = yield* elementNames(items)
    for (const name of excludedNames) {
      assert.ok(!Array.contains(names, name), `expected "${name}" to NOT be available`)
    }
  })
}

const findSentenceWith1Gp = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  const rows = yield* sql<{ text: string }>`
    SELECT le.text
    FROM content_item ci
    JOIN linguistic_element le ON le.id = ci.element_id
    JOIN sentence_grammar_point sgp ON sgp.sentence_id = ci.element_id
    WHERE ci.skill_type_id = 11
    GROUP BY ci.element_id, le.text
    HAVING COUNT(DISTINCT sgp.grammar_point_id) = 1
    LIMIT 1
  `
  return Array.unsafeGet(rows, 0).text
})

const findSentenceWith2PlusGp = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  const rows = yield* sql<{ text: string }>`
    SELECT le.text
    FROM content_item ci
    JOIN linguistic_element le ON le.id = ci.element_id
    JOIN sentence_grammar_point sgp ON sgp.sentence_id = ci.element_id
    WHERE ci.skill_type_id = 11
    GROUP BY ci.element_id, le.text
    HAVING COUNT(DISTINCT sgp.grammar_point_id) >= 2
    LIMIT 1
  `
  return Array.unsafeGet(rows, 0).text
})

// --- Tests ---

const TestLayer = ContentAvailabilityLive.pipe(Layer.provideMerge(TestRepoLayer))

layer(TestLayer, { timeout: 120_000 })("ContentAvailability — Intégration end-to-end", (it) => {
  it.effect("kana Skill 1, nouveau → retourné (AC16)", () =>
    Effect.gen(function* () {
      yield* setup
      const items = yield* getAvailable("user1", skill1)
      assert.ok(items.length > 0)
    }),
  )

  it.effect("kana Skill 2, prérequis retenu → retourné (AC17)", () =>
    Effect.gen(function* () {
      yield* setup
      yield* retain("user1", "あ", skill1)

      yield* assertAvailable("user1", skill2, ["あ"])
    }),
  )

  it.effect("kana Skill 2, prérequis expiré → non retourné (AC18)", () =>
    Effect.gen(function* () {
      yield* setup
      yield* retain("user1", "あ", skill1, past)

      yield* assertNotAvailable("user1", skill2, ["あ"])
    }),
  )

  it.effect("mot Skill 7, tous composants OK → retourné (AC19)", () =>
    Effect.gen(function* () {
      yield* setup
      yield* retainWithComponents("user1", "する", skill4, [skill2])

      yield* assertAvailable("user1", skill7, ["する"])
    }),
  )

  it.effect("mot Skill 7, composant manquant → non retourné (AC20)", () =>
    Effect.gen(function* () {
      yield* setup
      yield* retain("user2", "する", skill4)

      yield* assertNotAvailable("user2", skill7, ["する"])
    }),
  )

  it.effect("sentence Skill 11, 1 GP bootstrap → retourné (AC21)", () =>
    Effect.gen(function* () {
      yield* setup
      const sentenceText = yield* findSentenceWith1Gp
      yield* retainSentencePrereqs("user1", sentenceText, SkillTypeId(8))

      yield* assertAvailable("user1", skill11, [sentenceText])
    }),
  )

  it.effect("sentence Skill 11, 2+ GP non étudiés → non retourné (AC22)", () =>
    Effect.gen(function* () {
      yield* setup
      const sentenceText = yield* findSentenceWith2PlusGp
      yield* retainSentencePrereqs("user1", sentenceText, SkillTypeId(8))

      yield* assertNotAvailable("user1", skill11, [sentenceText])
    }),
  )
})
