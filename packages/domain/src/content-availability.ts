import { Array, Boolean, Context, DateTime, Effect, Function, Option, pipe, Struct } from "effect"
import type { ContentItem, ContentItemId } from "./content-item.js"
import type { GrammarPointId } from "./grammar-point.js"
import type { LinguisticElementId } from "./linguistic-element.js"
import type { ReviewCard } from "./review-card.js"
import { getPrerequisites, SkillGraph } from "./skill-graph.js"
import { SkillTypeId } from "./skill-type.js"

// --- Types ---

export type ElementComponent = {
  readonly elementId: LinguisticElementId
  readonly componentId: LinguisticElementId
}

export type ElementGrammarPoint = {
  readonly elementId: LinguisticElementId
  readonly grammarPointId: GrammarPointId
}

export type GrammarPointContentItem = {
  readonly grammarPointId: GrammarPointId
  readonly contentItemId: ContentItemId
}

// --- Constants ---

const GRAMMAR_SKILL_IDS = Array.map([11, 12, 13, 14, 15], SkillTypeId)

const isGrammarSkill = (skillId: SkillTypeId) => Array.contains(GRAMMAR_SKILL_IDS, skillId)

// --- Ports ---

export class ContentItemPort extends Context.Tag("ContentItemPort")<
  ContentItemPort,
  {
    readonly findBySkillType: (skillId: SkillTypeId) => Effect.Effect<ReadonlyArray<ContentItem>>
    readonly findByElementAndSkills: (
      elementIds: ReadonlyArray<LinguisticElementId>,
      skillIds: ReadonlyArray<SkillTypeId>,
    ) => Effect.Effect<ReadonlyArray<ContentItem>>
    readonly findComponentIds: (
      elementIds: ReadonlyArray<LinguisticElementId>,
    ) => Effect.Effect<ReadonlyArray<ElementComponent>>
    readonly findGrammarPointIds: (
      elementIds: ReadonlyArray<LinguisticElementId>,
    ) => Effect.Effect<ReadonlyArray<ElementGrammarPoint>>
    readonly findContentItemsByGrammarPoints: (
      grammarPointIds: ReadonlyArray<GrammarPointId>,
      skillIds: ReadonlyArray<SkillTypeId>,
    ) => Effect.Effect<ReadonlyArray<GrammarPointContentItem>>
  }
>() {}

export class ReviewCardPort extends Context.Tag("ReviewCardPort")<
  ReviewCardPort,
  {
    readonly findByUserAndContentItems: (
      userId: string,
      contentItemIds: ReadonlyArray<ContentItemId>,
    ) => Effect.Effect<ReadonlyArray<ReviewCard>>
  }
>() {}

// --- Logique métier ---

const isExpired = (dt: DateTime.Utc) => pipe(DateTime.now, Effect.map(DateTime.greaterThan(dt)))

const isRetained = (dt: DateTime.Utc) => pipe(isExpired(dt), Effect.map(Boolean.not))

const isActionable = Effect.fnUntraced(function* (
  item: ContentItem,
  reviewCards: ReadonlyArray<ReviewCard>,
) {
  const card = Array.findFirst(reviewCards, (rc) => rc.contentItemId === item.id)
  if (Option.isNone(card)) {
    return true
  }
  return yield* isExpired(card.value.nextReviewAt)
})

const hasPrereqSatisfied = Effect.fnUntraced(function* (
  elementId: LinguisticElementId,
  prereqSkillId: SkillTypeId,
  prereqContentItems: ReadonlyArray<ContentItem>,
  prereqReviewCards: ReadonlyArray<ReviewCard>,
) {
  const prereqContentItem = Array.findFirst(
    prereqContentItems,
    (ci) => ci.linguisticElementId === elementId && ci.skillTypeId === prereqSkillId,
  )
  if (Option.isNone(prereqContentItem)) {
    return true
  }
  const reviewCard = Array.findFirst(
    prereqReviewCards,
    (r) => r.contentItemId === prereqContentItem.value.id,
  )
  if (Option.isNone(reviewCard)) {
    return false
  }
  return yield* isRetained(reviewCard.value.nextReviewAt)
})

const isGpStudied = Effect.fnUntraced(function* (
  gpId: GrammarPointId,
  gpContentItems: ReadonlyArray<GrammarPointContentItem>,
  gpReviewCards: ReadonlyArray<ReviewCard>,
) {
  const contentItemIds = pipe(
    gpContentItems,
    Array.filter((gci) => gci.grammarPointId === gpId),
    Array.map(Struct.get("contentItemId")),
  )
  const results = yield* Effect.forEach(contentItemIds, (ciId) =>
    pipe(
      Array.findFirst(gpReviewCards, (r) => r.contentItemId === ciId),
      Option.match({
        onNone: () => Effect.succeed(false),
        onSome: (rc) => isRetained(rc.nextReviewAt),
      }),
    ),
  )
  return Array.some(results, Function.identity)
})

const getGpIdsForElement = (
  gpPairs: ReadonlyArray<ElementGrammarPoint>,
  elementId: LinguisticElementId,
) => {
  return pipe(
    gpPairs,
    Array.filter((p) => p.elementId === elementId),
    Array.map(Struct.get("grammarPointId")),
  )
}

const getComponentIdsForElement = (
  componentPairs: ReadonlyArray<ElementComponent>,
  elementId: LinguisticElementId,
) => {
  return pipe(
    componentPairs,
    Array.filter((p) => p.elementId === elementId),
    Array.map(Struct.get("componentId")),
  )
}

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
          return yield* Effect.filter(items, (item) => isActionable(item, reviewCards))
        })
      }

      const fetchPrereqData = (
        userId: string,
        items: ReadonlyArray<ContentItem>,
        prereqSkillIds: ReadonlyArray<SkillTypeId>,
      ) => {
        return Effect.gen(function* () {
          const elementIds = Array.map(items, Struct.get("linguisticElementId"))
          const componentPairs = yield* contentItemPort.findComponentIds(elementIds)
          const allElementIds = pipe(
            Array.map(componentPairs, Struct.get("componentId")),
            Array.appendAll(elementIds),
            Array.dedupe,
          )

          const prereqContentItems = yield* contentItemPort.findByElementAndSkills(
            allElementIds,
            prereqSkillIds,
          )
          const prereqContentItemIds = Array.map(prereqContentItems, Struct.get("id"))
          const prereqReviewCards = yield* reviewCardPort.findByUserAndContentItems(
            userId,
            prereqContentItemIds,
          )

          return { componentPairs, prereqContentItems, prereqReviewCards }
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

          const { componentPairs, prereqContentItems, prereqReviewCards } = yield* fetchPrereqData(
            userId,
            items,
            prereqSkillIds,
          )

          const hasAllPrereqsSatisfied = (item: ContentItem) => {
            const idsToCheck = pipe(
              getComponentIdsForElement(componentPairs, item.linguisticElementId),
              Array.prepend(item.linguisticElementId),
            )

            return Effect.gen(function* () {
              const results = yield* Effect.forEach(idsToCheck, (elementId) =>
                Effect.forEach(prereqSkillIds, (prereqSkillId) =>
                  hasPrereqSatisfied(
                    elementId,
                    prereqSkillId,
                    prereqContentItems,
                    prereqReviewCards,
                  ),
                ),
              )
              return pipe(results, Array.flatten, Array.every(Function.identity))
            })
          }

          return yield* Effect.filter(items, hasAllPrereqsSatisfied)
        })
      }

      const fetchGpData = (userId: string, items: ReadonlyArray<ContentItem>) => {
        return Effect.gen(function* () {
          const elementIds = Array.map(items, Struct.get("linguisticElementId"))
          const gpPairs = yield* contentItemPort.findGrammarPointIds(elementIds)
          const allGpIds = pipe(gpPairs, Array.map(Struct.get("grammarPointId")), Array.dedupe)
          const gpContentItems = yield* contentItemPort.findContentItemsByGrammarPoints(
            allGpIds,
            GRAMMAR_SKILL_IDS,
          )
          const gpContentItemIds = pipe(
            gpContentItems,
            Array.map(Struct.get("contentItemId")),
            Array.dedupe,
          )
          const gpReviewCards = yield* reviewCardPort.findByUserAndContentItems(
            userId,
            gpContentItemIds,
          )

          return { gpPairs, allGpIds, gpContentItems, gpReviewCards }
        })
      }

      const computeStudiedGpIds = (
        allGpIds: ReadonlyArray<GrammarPointId>,
        gpContentItems: ReadonlyArray<GrammarPointContentItem>,
        gpReviewCards: ReadonlyArray<ReviewCard>,
      ) => {
        return Effect.filter(allGpIds, (gpId) => isGpStudied(gpId, gpContentItems, gpReviewCards))
      }

      const filterByGrammarPoints = (
        userId: string,
        skillId: SkillTypeId,
        items: ReadonlyArray<ContentItem>,
      ) => {
        return Effect.gen(function* () {
          if (!isGrammarSkill(skillId)) {
            return items
          }

          const { gpPairs, allGpIds, gpContentItems, gpReviewCards } = yield* fetchGpData(
            userId,
            items,
          )
          const studiedGpIds = yield* computeStudiedGpIds(allGpIds, gpContentItems, gpReviewCards)

          return Array.filter(items, (item) => {
            const itemGpIds = getGpIdsForElement(gpPairs, item.linguisticElementId)
            if (itemGpIds.length <= 1) {
              return true
            }
            return Array.every(itemGpIds, (gpId) => Array.contains(studiedGpIds, gpId))
          })
        })
      }

      const getAvailableItems = (userId: string, skillId: SkillTypeId) => {
        return Effect.gen(function* () {
          const items = yield* contentItemPort.findBySkillType(skillId)
          const actionableItems = yield* filterActionable(userId, items)
          const prereqItems = yield* filterByPrerequisites(userId, skillId, actionableItems)
          return yield* filterByGrammarPoints(userId, skillId, prereqItems)
        })
      }

      return { getAvailableItems }
    }),
  },
) {}
