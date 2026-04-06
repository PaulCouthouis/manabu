import { Array, Context, DateTime, Effect, Function, Option, Struct } from "effect"
import type { ContentItem, ContentItemId } from "./content-item.js"
import type { LinguisticElementId } from "./linguistic-element.js"
import type { ReviewCard } from "./review-card.js"
import { getPrerequisites, SkillGraph } from "./skill-graph.js"
import type { SkillTypeId } from "./skill-type.js"

// --- Ports ---

export type ElementComponent = {
  readonly elementId: LinguisticElementId
  readonly componentId: LinguisticElementId
}

export class ContentItemPort extends Context.Tag("ContentItemPort")<
  ContentItemPort,
  {
    readonly findBySkillType: (skillId: SkillTypeId) => Effect.Effect<Array<ContentItem>>
    readonly findByElementAndSkills: (
      elementIds: ReadonlyArray<LinguisticElementId>,
      skillIds: ReadonlyArray<SkillTypeId>,
    ) => Effect.Effect<Array<ContentItem>>
    readonly findComponentIds: (
      elementIds: ReadonlyArray<LinguisticElementId>,
    ) => Effect.Effect<Array<ElementComponent>>
  }
>() {}

export class ReviewCardPort extends Context.Tag("ReviewCardPort")<
  ReviewCardPort,
  {
    readonly findByUserAndContentItems: (
      userId: string,
      contentItemIds: ReadonlyArray<ContentItemId>,
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

const hasPrereqSatisfied = Effect.fnUntraced(function* (
  elementId: LinguisticElementId,
  prereqSkillId: SkillTypeId,
  prereqContentItems: ReadonlyArray<ContentItem>,
  prereqReviewCards: ReadonlyArray<ReviewCard>,
) {
  const prereqContentItem = Array.findFirst(prereqContentItems, (ci) => {
    return ci.linguisticElementId === elementId && ci.skillTypeId === prereqSkillId
  })
  if (Option.isNone(prereqContentItem)) {
    return true
  }
  const reviewCard = Array.findFirst(prereqReviewCards, (r) => {
    return r.contentItemId === prereqContentItem.value.id
  })
  if (Option.isNone(reviewCard)) {
    return false
  }
  const expired = yield* lessThanNow(reviewCard.value.nextReviewAt)
  return !expired
})

// --- Service ---

export class ContentAvailability extends Effect.Service<ContentAvailability>()(
  "ContentAvailability",
  {
    effect: Effect.gen(function* () {
      const contentItemPort = yield* ContentItemPort
      const reviewCardPort = yield* ReviewCardPort

      const filterActionable = (userId: string, items: ReadonlyArray<ContentItem>) => {
        return Effect.gen(function* () {
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

      const filterByPrerequisites = (
        userId: string,
        skillId: SkillTypeId,
        items: ReadonlyArray<ContentItem>,
      ) => {
        return Effect.gen(function* () {
          const prereqSkillIds = getPrerequisites(SkillGraph, skillId)
          if (Array.isEmptyReadonlyArray(prereqSkillIds)) {
            return items
          }

          const elementIds = Array.map(items, Struct.get("linguisticElementId"))
          const componentPairs = yield* contentItemPort.findComponentIds(elementIds)
          const componentIds = Array.map(componentPairs, Struct.get("componentId"))
          const allElementIds = Array.dedupe([...elementIds, ...componentIds])

          const prereqContentItems = yield* contentItemPort.findByElementAndSkills(
            allElementIds,
            prereqSkillIds,
          )
          const prereqContentItemIds = Array.map(prereqContentItems, Struct.get("id"))
          const prereqReviewCards = yield* reviewCardPort.findByUserAndContentItems(
            userId,
            prereqContentItemIds,
          )

          const hasAllPrereqsSatisfied = (item: ContentItem) => {
            const itemComponentIds = Array.filterMap(componentPairs, (p) => {
              if (p.elementId === item.linguisticElementId) {
                return Option.some(p.componentId)
              }
              return Option.none()
            })
            const idsToCheck = [item.linguisticElementId, ...itemComponentIds]

            return Effect.gen(function* () {
              const results = yield* Effect.forEach(idsToCheck, (elementId) => {
                return Effect.forEach(prereqSkillIds, (prereqSkillId) => {
                  return hasPrereqSatisfied(
                    elementId,
                    prereqSkillId,
                    prereqContentItems,
                    prereqReviewCards,
                  )
                })
              })
              return Array.every(Array.flatten(results), Function.identity)
            })
          }

          return yield* Effect.filter(items, hasAllPrereqsSatisfied)
        })
      }

      const getAvailableItems = (userId: string, skillId: SkillTypeId) => {
        return Effect.gen(function* () {
          const items = yield* contentItemPort.findBySkillType(skillId)
          const actionableItems = yield* filterActionable(userId, items)
          return yield* filterByPrerequisites(userId, skillId, actionableItems)
        })
      }

      return { getAvailableItems }
    }),
  },
) {}
