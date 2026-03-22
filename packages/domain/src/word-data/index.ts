import type { WordElement } from "../linguistic-element.js"

import { freq01 } from "./freq-01.js"
import { freq02 } from "./freq-02.js"
import { freq03 } from "./freq-03.js"
import { freq04 } from "./freq-04.js"
import { freq05 } from "./freq-05.js"

export const wordData: ReadonlyArray<WordElement> = [
  ...freq01,
  ...freq02,
  ...freq03,
  ...freq04,
  ...freq05,
]
