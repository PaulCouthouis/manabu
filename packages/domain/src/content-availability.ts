import { Array, Context, DateTime, Effect, Option, Struct } from "effect"
import type { ContentItem, ContentItemId } from "./content-item.js"
import type { ReviewCard } from "./review-card.js"
import type { SkillTypeId } from "./skill-type.js"

// --- Ports ---

export class ContentItemPort extends Context.Tag("ContentItemPort")<
  ContentItemPort,
  {
    readonly findBySkillType: (skillId: SkillTypeId) => Effect.Effect<Array<ContentItem>>
  }
>() {}

export class ReviewCardPort extends Context.Tag("ReviewCardPort")<
  ReviewCardPort,
  {
    readonly findByUserAndContentItems: (
      userId: string,
      contentItemIds: Array<ContentItemId>,
    ) => Effect.Effect<Array<ReviewCard>>
  }
>() {}

// --- Logique métier ---

const lessThanNow = (dt: DateTime.Utc) => {
  return Effect.map(DateTime.now, (now) => {
    return DateTime.lessThan(dt, now)
  })
}

const isActionable = Effect.fnUntraced(function* (
  item: ContentItem,
  reviewCards: ReadonlyArray<ReviewCard>,
) {
  const card = Array.findFirst(reviewCards, (rc) => {
    return rc.contentItemId === item.id
  })
  if (Option.isNone(card)) {
    return true
  }
  return yield* lessThanNow(card.value.nextReviewAt)
})

// --- Service ---

export class ContentAvailability extends Effect.Service<ContentAvailability>()(
  "ContentAvailability",
  {
    effect: Effect.gen(function* () {
      const contentItemPort = yield* ContentItemPort
      const reviewCardPort = yield* ReviewCardPort

      const getAvailableItems = (userId: string, skillId: SkillTypeId) => {
        return Effect.gen(function* () {
          const items = yield* contentItemPort.findBySkillType(skillId)
          const contentItemIds = Array.map(items, Struct.get("id"))
          const reviewCards = yield* reviewCardPort.findByUserAndContentItems(
            userId,
            contentItemIds,
          )
          return yield* Effect.filter(items, (item) => {
            return isActionable(item, reviewCards)
          })
        })
      }

      return { getAvailableItems }
    }),
  },
) {}
