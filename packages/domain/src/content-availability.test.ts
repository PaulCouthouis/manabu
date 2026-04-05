import { assert, layer } from "@effect/vitest"
import { Array, Effect, Layer, Struct } from "effect"
import { ContentAvailability, ContentItemPort } from "./content-availability.js"
import { ContentItem, ContentItemId } from "./content-item.js"
import { LinguisticElementId } from "./linguistic-element.js"
import { SkillTypeId } from "./skill-type.js"

// --- Fixtures ---

const skill1 = SkillTypeId(1)

const kanaA = ContentItem.make({
  id: ContentItemId(1),
  linguisticElementId: LinguisticElementId(1),
  skillTypeId: skill1,
})

const kanaI = ContentItem.make({
  id: ContentItemId(2),
  linguisticElementId: LinguisticElementId(2),
  skillTypeId: skill1,
})

const kanaU = ContentItem.make({
  id: ContentItemId(3),
  linguisticElementId: LinguisticElementId(3),
  skillTypeId: skill1,
})

// --- Fakes ---

const FakeContentItemPort = Layer.succeed(ContentItemPort, {
  findBySkillType: (skillId) => {
    if (skillId === skill1) {
      return Effect.succeed([kanaA, kanaI, kanaU])
    }
    return Effect.succeed([])
  },
})

// --- Tests ---

const TestLayer = ContentAvailability.Default.pipe(Layer.provide(FakeContentItemPort))

layer(TestLayer)("ContentAvailability — Étape 1 : Entry points", (it) => {
  it.effect("Skill 1 (0 prérequis), 3 items nouveaux → les 3 retournés", () =>
    Effect.gen(function* () {
      const contentAvailability = yield* ContentAvailability
      const items = yield* contentAvailability.getAvailableItems("user1", skill1)

      assert.strictEqual(items.length, 3)
      assert.deepStrictEqual(Array.map(items, Struct.get("id")), [
        ContentItemId(1),
        ContentItemId(2),
        ContentItemId(3),
      ])
    }),
  )
})
