import { describe, expect, it } from "vitest"
import { ContentItem, ContentItemId } from "./content-item.js"
import { KanjiId } from "./linguistic-element.js"
import { SkillTypeId } from "./skill-type.js"

describe("ContentItem", () => {
  // AC5 — Un ContentItem associe exactement un LinguisticElement et un SkillType (1:1)
  it("un ContentItem lie un élément linguistique et un skill type", () => {
    const item = ContentItem.make({
      id: ContentItemId(1),
      linguisticElementId: KanjiId(100),
      skillTypeId: SkillTypeId(5),
    })

    expect(item.id).toBe(ContentItemId(1))
    expect(item.linguisticElementId).toBe(KanjiId(100))
    expect(item.skillTypeId).toBe(SkillTypeId(5))
  })

  it("deux ContentItems pour le même élément dans des skills différents sont distincts", () => {
    const itemSkill5 = ContentItem.make({
      id: ContentItemId(1),
      linguisticElementId: KanjiId(100),
      skillTypeId: SkillTypeId(5),
    })

    const itemSkill7 = ContentItem.make({
      id: ContentItemId(2),
      linguisticElementId: KanjiId(100),
      skillTypeId: SkillTypeId(7),
    })

    expect(itemSkill5.skillTypeId).not.toBe(itemSkill7.skillTypeId)
    expect(itemSkill5.linguisticElementId).toBe(itemSkill7.linguisticElementId)
    expect(itemSkill5.id).not.toBe(itemSkill7.id)
  })
})
