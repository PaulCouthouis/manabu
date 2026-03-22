import type { GrammarElement } from "../linguistic-element.js"

import { skill11Data } from "./skill-11.js"
import { skill12Data } from "./skill-12.js"
import { skill13Data } from "./skill-13.js"
import { skill14Data } from "./skill-14.js"
import { skill15Data } from "./skill-15.js"

export { skill11Data } from "./skill-11.js"
export { skill12Data } from "./skill-12.js"
export { skill13Data } from "./skill-13.js"
export { skill14Data } from "./skill-14.js"
export { skill15Data } from "./skill-15.js"

export const grammarData: ReadonlyArray<GrammarElement> = [
  ...skill11Data,
  ...skill12Data,
  ...skill13Data,
  ...skill14Data,
  ...skill15Data,
]
