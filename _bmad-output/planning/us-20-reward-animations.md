# US20 — Animations de récompense

## Résumé

Composant unique `RewardDisplay` affiché dans le slot `renderReward` de SpeechRepeat après une bonne réponse. Status `new` : animation fade-in + scale + glow + label (「Kana unlocked」ou「Word unlocked」). Status `reviewed` : affichage simple du kana/mot, rien d'autre. Union discriminante sur `status` — pas de label en reviewed. CSS pur (keyframes Panda CSS). Stories Storybook + mise à jour des stories SpeechRepeat existantes.

**Sprint :** Sprint 2 — Exercise Core
**Dépendances :** US14 (SpeechRepeat — fournit le slot `renderReward`)
**Approche :** composants standalone d'abord avec stories dédiées, puis mise à jour des stories SpeechRepeat Skill 1 / Skill 4

## Décisions architecturales

| Question | Décision | Justification |
|---|---|---|
| Technologie animation | CSS pur — keyframes Panda CSS | Pas de lib JS d'animation. Les keyframes CSS sont performantes et suffisantes pour fade-in + scale + glow. |
| Distinction new / reviewed | Prop `status: "new" \| "reviewed"` | `new` = animation complète + texte "unlocked". `reviewed` = affichage simple du kana/mot, rien d'autre (le feedback succès de SpeechRepeat suffit). |
| Badge ✅ en reviewed | **Non.** Pas de badge | Le cercle de bonne réponse de SpeechRepeat indique déjà le succès. Pas besoin de doubler l'information. |
| Composant unique ou séparés | **Unique** : `RewardDisplay` | La seule différence entre kana et word est le label ("Kana unlocked" vs "Word unlocked") — une string, pas une raison d'avoir deux composants. |
| Provider Effect | **Non.** Pas de service, pas de Layer | Composants React purs de présentation. Zéro side effect. |
| `prefers-reduced-motion` | Respecté — pas d'animation si activé | Accessibilité. Le kana/mot apparaît directement sans transition. |
| Où vit le composant | `packages/exercises/src/components/reward-animation/reward-display.tsx` | Cohérent avec la structure `packages/exercises/src/components/`. |
| Langue UI | Anglais | "Kana unlocked", "Word unlocked" — cohérent avec le reste de l'UI. |

## Modèle

### Props RewardDisplay

```ts
type RewardDisplayProps =
  | { readonly text: string; readonly status: "new"; readonly label: string }
  | { readonly text: string; readonly status: "reviewed" }
```

- `text` — le kana ou mot à afficher (か, キ, 猫, 食べる, etc.)
- `status: "new"` — première fois, animation complète + label
- `status: "reviewed"` — déjà vu, affichage simple
- `label` — texte secondaire affiché uniquement en `new` ("Kana unlocked", "Word unlocked")

### Comportement par status

| Status | Kana/mot | Animation | Texte "unlocked" | Glow |
|---|---|---|---|---|
| `new` | Affiché en grand, centré | fade-in + scale (~1.5s) | Oui — 「Kana unlocked」ou 「Word unlocked」 | Oui — pulse gold/amber |
| `reviewed` | Affiché en grand, centré | Non — instantané | Non | Non |

## Design

### RewardDisplay — new

```
┌──────────────────────┐
│                      │
│     ✨ か ✨          │  ← text en grand, glow gold
│                      │
│   Kana unlocked      │  ← label secondaire, fg.muted
│                      │
└──────────────────────┘
```

### RewardDisplay — reviewed

```
┌──────────────────────┐
│                      │
│        か             │  ← text en grand, affiché calmement
│                      │
│                      │
└──────────────────────┘
```

### Animation new (~1.5s)

```
0ms         300ms        500ms        1500ms
 |            |            |             |
 opacity:0    opacity:1    settle        glow pulse
 scale(0.5)   scale(1.05)  scale(1)     box-shadow fade
```

- `0ms → 300ms` : fade-in + scale overshoot
- `300ms → 500ms` : settle à scale(1)
- `500ms → 1500ms` : glow pulse (box-shadow gold qui apparaît puis s'atténue)

### prefers-reduced-motion

Si `prefers-reduced-motion: reduce` est actif, le kana/mot apparaît directement sans animation ni glow — même comportement que `reviewed`.

## Critères d'acceptance

### Composant RewardDisplay + stories (Étape 1)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC1 | `RewardDisplay` avec `status: "new"` affiche le texte avec animation fade-in + scale + glow + label | Story | 1 |
| AC2 | `RewardDisplay` avec `status: "reviewed"` affiche le texte sans animation ni label | Story | 1 |
| AC3 | `prefers-reduced-motion: reduce` désactive les animations (comportement = reviewed) | Story | 1 |

### Mise à jour stories SpeechRepeat (Étape 2)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC4 | Story `AudioFirstMatch` (Skill 1) utilise `RewardDisplay` au lieu du placeholder `styled.div` | Story | 2 |
| AC5 | Story `FeedbackMatchAudioFirst` (Skill 1 feedback static) utilise `RewardDisplay` | Story | 2 |
| AC6 | Story `Skill4AudioWord` (Skill 4) utilise `RewardDisplay` au lieu du placeholder `styled.div` | Story | 2 |

### Build (Étape 3)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC7 | `pnpm build` compile sans erreur | CI | 3 |
| AC8 | `pnpm lint` passe sans erreur | CI | 3 |
| AC9 | Tests existants passent (non-régression) | CI | 3 |

## Étapes d'implémentation

### Étape 1 — Composant RewardDisplay + stories

- [ ] Créer `packages/exercises/src/components/reward-animation/reward-display.tsx` avec keyframes Panda CSS → AC1, AC2
- [ ] Gérer `prefers-reduced-motion` dans les keyframes → AC3
- [ ] Story `RewardDisplay_KanaNew` : text か, status new, label "Kana unlocked" → AC1
- [ ] Story `RewardDisplay_KanaReviewed` : text か, status reviewed → AC2
- [ ] Story `RewardDisplay_WordNew` : text 猫, status new, label "Word unlocked" → AC1
- [ ] Story `RewardDisplay_WordReviewed` : text 猫, status reviewed → AC2

### Étape 2 — Mise à jour stories SpeechRepeat

- [ ] Remplacer le placeholder `styled.div` dans `AudioFirstMatch` par `<RewardDisplay text="か" status="new" label="Kana unlocked" />` → AC4
- [ ] Remplacer le placeholder `styled.div` dans `FeedbackMatchAudioFirst` par `<RewardDisplay text="か" status="new" label="Kana unlocked" />` → AC5
- [ ] Remplacer le placeholder `styled.div` dans `Skill4AudioWord` par `<RewardDisplay text="猫" status="new" label="Word unlocked" />` → AC6

### Étape 3 — Vérifications finales

- [ ] `pnpm build` sans erreur → AC7
- [ ] `pnpm lint` sans erreur → AC8
- [ ] Tests existants passent (non-régression) → AC9

## Hors scope

| Élément | Raison | Sprint prévu |
|---|---|---|
| Wiring avec DrillQueue / page session | US20 = composants Storybook isolés | Sprint 3 |
| Détection "nouveau vs révisé" (logique SRS) | Le `status` est passé en props. La logique de détection vient du moteur SRS | Sprint 3 |
| Son de récompense (sfx) | Audio uniquement via TTS existant. Pas de sfx dédié pour l'instant | Sprint 4 |
| Animation de déblocage de skill entier | Hors périmètre MVP | Backlog |
