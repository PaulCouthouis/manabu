import { Context, Effect } from "effect"
import type { ContentItem } from "./content-item.js"
import type { SkillTypeId } from "./skill-type.js"

// --- Ports ---

export class ContentItemPort extends Context.Tag("ContentItemPort")<
  ContentItemPort,
  {
    readonly findBySkillType: (skillId: SkillTypeId) => Effect.Effect<Array<ContentItem>>
  }
>() {}

// --- Service ---

export class ContentAvailability extends Effect.Service<ContentAvailability>()(
  "ContentAvailability",
  {
    effect: Effect.gen(function* () {
      const contentItemPort = yield* ContentItemPort

      const getAvailableItems = (userId: string, skillId: SkillTypeId) => {
        return contentItemPort.findBySkillType(skillId)
      }

      return { getAvailableItems }
    }),
  },
) {}
