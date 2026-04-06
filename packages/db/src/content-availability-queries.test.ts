import { SqlClient } from "@effect/sql"
import { assert, layer } from "@effect/vitest"
import { LinguisticElementId, SkillTypeId } from "@manabu/domain"
import { Array, Effect, Struct } from "effect"
import { ContentItemRepo } from "./content-item-repo.js"
import { runMigrations } from "./migrations/index.js"
import { ReviewCardRepo } from "./review-card-repo.js"
import { TestRepoLayer } from "./test-utils.js"

const insertTestUser = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient
  yield* sql`
    INSERT INTO "user" (id, name, email) VALUES ('user1', 'Test User', 'test@example.com')
    ON CONFLICT DO NOTHING
  `
})

const insertReviewCard = (userId: string, contentItemId: number, nextReviewAt: string) => {
  return Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    yield* sql`
      INSERT INTO review_card (user_id, content_item_id, next_review_at)
      VALUES (${userId}, ${contentItemId}, ${nextReviewAt}::timestamptz)
    `
  })
}

layer(TestRepoLayer, { timeout: 120_000 })("ContentAvailability queries — PostgreSQL", (it) => {
  it.effect("findByUserAndContentItems returns matching ReviewCards (AC14)", () =>
    Effect.gen(function* () {
      yield* runMigrations
      yield* insertTestUser

      const contentItemRepo = yield* ContentItemRepo
      const items = yield* contentItemRepo.findBySkillType(SkillTypeId(1))
      const firstTwo = Array.take(items, 2)
      const firstTwoIds = Array.map(firstTwo, Struct.get("id"))

      yield* insertReviewCard(
        "user1",
        Number(Array.unsafeGet(firstTwoIds, 0)),
        "2099-01-01T00:00:00Z",
      )
      yield* insertReviewCard(
        "user1",
        Number(Array.unsafeGet(firstTwoIds, 1)),
        "2099-01-01T00:00:00Z",
      )

      const reviewCardRepo = yield* ReviewCardRepo
      const cards = yield* reviewCardRepo.findByUserAndContentItems("user1", firstTwoIds)

      assert.strictEqual(cards.length, 2)
    }),
  )

  it.effect("findByElementAndSkills returns matching ContentItems (AC15)", () =>
    Effect.gen(function* () {
      yield* runMigrations

      const kanaElementIds = [LinguisticElementId(1), LinguisticElementId(2)]
      const contentItemRepo = yield* ContentItemRepo
      const items = yield* contentItemRepo.findByElementAndSkills(kanaElementIds, [
        SkillTypeId(1),
        SkillTypeId(2),
      ])

      assert.ok(items.length > 0)
      items.forEach((ci) => {
        assert.ok(Array.contains(kanaElementIds, ci.linguisticElementId))
      })
    }),
  )

  it.effect("findComponentIds returns element components", () =>
    Effect.gen(function* () {
      yield* runMigrations

      const contentItemRepo = yield* ContentItemRepo
      const wordItems = yield* contentItemRepo.findBySkillType(SkillTypeId(4))
      const firstWord = Array.unsafeGet(wordItems, 0)
      const components = yield* contentItemRepo.findComponentIds([firstWord.linguisticElementId])

      assert.ok(components.length > 0)
      components.forEach((c) => {
        assert.strictEqual(c.elementId, firstWord.linguisticElementId)
      })
    }),
  )

  it.effect("findGrammarPointIds returns sentence grammar points", () =>
    Effect.gen(function* () {
      yield* runMigrations

      const contentItemRepo = yield* ContentItemRepo
      const skill11Items = yield* contentItemRepo.findBySkillType(SkillTypeId(11))
      const firstSentence = Array.unsafeGet(skill11Items, 0)
      const gpPairs = yield* contentItemRepo.findGrammarPointIds([
        firstSentence.linguisticElementId,
      ])

      assert.ok(gpPairs.length > 0)
      gpPairs.forEach((p) => {
        assert.strictEqual(p.elementId, firstSentence.linguisticElementId)
      })
    }),
  )

  it.effect("findContentItemsByGrammarPoints returns ContentItems for GP in grammar skills", () =>
    Effect.gen(function* () {
      yield* runMigrations

      const contentItemRepo = yield* ContentItemRepo
      const skill11Items = yield* contentItemRepo.findBySkillType(SkillTypeId(11))
      const firstSentence = Array.unsafeGet(skill11Items, 0)
      const gpPairs = yield* contentItemRepo.findGrammarPointIds([
        firstSentence.linguisticElementId,
      ])
      const gpIds = Array.map(gpPairs, Struct.get("grammarPointId"))

      const grammarSkillIds = Array.map([11, 12, 13, 14, 15], SkillTypeId)
      const gpContentItems = yield* contentItemRepo.findContentItemsByGrammarPoints(
        gpIds,
        grammarSkillIds,
      )

      assert.ok(gpContentItems.length > 0)
      gpContentItems.forEach((gci) => {
        assert.ok(Array.contains(gpIds, gci.grammarPointId))
      })
    }),
  )
})
