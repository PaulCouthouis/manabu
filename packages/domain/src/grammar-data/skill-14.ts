import type { GrammarElement } from "../linguistic-element.js"
import { g } from "./helpers.js"

// Skill 14 — Donner/recevoir (14 éléments)
// IDs 501-514, frequency = rang intra-skill

export const skill14Data: ReadonlyArray<GrammarElement> = [
  g(501, "あげる", "To give outward (speaker/in-group gives to others)", 1, 1),
  g(502, "もらう", "To receive (speaker/in-group receives from others)", 2, 1),
  g(503, "くれる", "To give inward (others give to speaker/in-group)", 3, 1),
  g(504, "てあげる", "To do something for someone as a favor (outward)", 4, 1),
  g(505, "てもらう", "To have someone do something for you (receiving favor)", 5, 1),
  g(506, "てくれる", "Someone does something for the speaker as a favor (inward)", 6, 1),
  g(507, "やる", "To give downward or to animals/plants (casual, sometimes rough)", 7, 1),
  g(508, "差し上げる (giving)", "Humble form of あげる for giving to superiors", 8, 1),
  g(509, "いただく (receiving)", "Humble form of もらう for receiving from superiors", 9, 1),
  g(
    510,
    "くださる (giving to me)",
    "Respectful form of くれる when superiors give to speaker",
    10,
    1,
  ),
  g(511, "て差し上げる", "Humble form of てあげる for doing favors for superiors", 11, 1),
  g(512, "ていただく", "Humble form of てもらう for having superiors do something", 12, 1),
  g(513, "てくださる", "Respectful form of てくれる when superiors do favors", 13, 1),
  g(514, "てやる", "Casual/downward form of てあげる for doing favors", 14, 1),
]
