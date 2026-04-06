import { ContentItemRepo, ReviewCardRepo } from "@manabu/db"
import { ContentAvailability, ContentItemPort, ReviewCardPort } from "@manabu/domain"
import { Effect, Layer } from "effect"

const ContentItemPortLive = Layer.effect(
  ContentItemPort,
  Effect.gen(function* () {
    const repo = yield* ContentItemRepo
    return {
      findBySkillType: (skillId) => {
        return Effect.orDie(repo.findBySkillType(skillId))
      },
      findByElementAndSkills: (elementIds, skillIds) => {
        return Effect.orDie(repo.findByElementAndSkills(elementIds, skillIds))
      },
      findComponentIds: (elementIds) => {
        return Effect.orDie(repo.findComponentIds(elementIds))
      },
      findGrammarPointIds: (elementIds) => {
        return Effect.orDie(repo.findGrammarPointIds(elementIds))
      },
      findContentItemsByGrammarPoints: (gpIds, skillIds) => {
        return Effect.orDie(repo.findContentItemsByGrammarPoints(gpIds, skillIds))
      },
    }
  }),
)

const ReviewCardPortLive = Layer.effect(
  ReviewCardPort,
  Effect.gen(function* () {
    const repo = yield* ReviewCardRepo
    return {
      findByUserAndContentItems: (userId, contentItemIds) => {
        return Effect.orDie(repo.findByUserAndContentItems(userId, contentItemIds))
      },
    }
  }),
)

export const ContentAvailabilityLive = ContentAvailability.Default.pipe(
  Layer.provide(ContentItemPortLive),
  Layer.provide(ReviewCardPortLive),
  Layer.provide(ContentItemRepo.Default),
  Layer.provide(ReviewCardRepo.Default),
)
