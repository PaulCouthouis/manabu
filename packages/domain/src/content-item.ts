import { Brand, Schema } from "effect"
import { LinguisticElementIdSchema } from "./linguistic-element.js"
import { SkillTypeIdSchema } from "./skill-type.js"

// --- Id ---

export type ContentItemId = number & Brand.Brand<"ContentItemId">
export const ContentItemId = Brand.nominal<ContentItemId>()
export const ContentItemIdSchema = Schema.Number.pipe(Schema.fromBrand(ContentItemId))

// --- Content Item ---

export class ContentItem extends Schema.Class<ContentItem>("ContentItem")({
  id: ContentItemIdSchema,
  linguisticElementId: LinguisticElementIdSchema,
  skillTypeId: SkillTypeIdSchema,
}) {}
