import type { GrammarElement } from "../linguistic-element.js"
import { g } from "./helpers.js"

// Skill 13 — Keigo (28 éléments)
// IDs 473-500, frequency = rang intra-skill

export const skill13Data: ReadonlyArray<GrammarElement> = [
  g(473, "お〜になる", "Honorific verb pattern elevating the listener's action", 1, 1),
  g(474, "お〜する/いたす", "Humble verb pattern lowering the speaker's action", 2, 2),
  g(475, "お〜ください", "Respectful request pattern for wago verbs (please do)", 3, 1),
  g(476, "ご〜ください", "Respectful request pattern for kango verbs (please do)", 4, 1),
  g(477, "お/ご + noun", "Honorific prefix: お for native words, ご for Sino-Japanese words", 5, 2),
  g(478, "〜様/〜さま", "Honorific suffix replacing さん in formal contexts", 6, 1),
  g(479, "でございます", "Very polite copula replacing です in formal service contexts", 7, 1),
  g(480, "いらっしゃる", "Respectful replacement for いる, 行く, and 来る", 8, 3),
  g(481, "おっしゃる", "Respectful replacement for 言う (to say)", 9, 1),
  g(482, "ご覧になる", "Respectful replacement for 見る (to see, to look)", 10, 1),
  g(483, "召し上がる", "Respectful replacement for 食べる and 飲む (to eat, to drink)", 11, 1),
  g(484, "くださる", "Respectful replacement for くれる (to give to me)", 12, 1),
  g(485, "なさる", "Respectful replacement for する (to do)", 13, 1),
  g(486, "ご存知", "Respectful replacement for 知っている (to know)", 14, 1),
  g(487, "〜てくださいませんか", "Respectful request form using て-form (could you please)", 15, 1),
  g(488, "参る", "Humble replacement for 行く and 来る (to go, to come)", 16, 2),
  g(489, "申す", "Humble replacement for 言う (to say)", 17, 1),
  g(490, "申し上げる", "Very humble replacement for 言う (to say, to tell)", 18, 1),
  g(491, "いたす", "Humble replacement for する (to do)", 19, 1),
  g(492, "おる", "Humble replacement for いる (to be, to exist)", 20, 1),
  g(493, "拝見する", "Humble replacement for 見る (to see, to look)", 21, 1),
  g(494, "伺う", "Humble replacement for 聞く and 訪ねる (to ask, to visit)", 22, 2),
  g(495, "いただく", "Humble replacement for もらう, 食べる, and 飲む (to receive, to eat)", 23, 2),
  g(496, "差し上げる", "Humble replacement for あげる (to give)", 24, 1),
  g(497, "存じる", "Humble replacement for 知る and 思う (to know, to think)", 25, 2),
  g(498, "〜ていただけませんか", "Humble request form using て-form (could you please)", 26, 1),
  g(499, "させていただく", "Humble pattern requesting permission to act (allow me to)", 27, 1),
  g(500, "かねる", "Polite refusal expressing inability (unable to, regrettably cannot)", 28, 1),
]
