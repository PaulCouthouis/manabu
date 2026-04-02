# US19 — MicroLesson

## Résumé

Modale affichant du contenu de grammaire en markdown rendu en HTML. Le contenu est passé en props (string markdown brut) — le wiring avec les fichiers markdown et la détection "nouveau vs déjà vu" c'est Sprint 3. Bouton 💡 permanent intégré dans FillInTheBlank pour ouvrir la modale à tout moment (filling et feedback). Scroll interne quand le contenu dépasse la hauteur de la modale.

**Sprint :** Sprint 2 — Exercise Core
**Dépendances :** US18 (FillInTheBlank)
**Approche :** install Dialog Park UI d'abord, puis composant MicroLesson standalone, puis intégration dans FillInTheBlank

## Décisions architecturales

| Question | Décision | Justification |
|---|---|---|
| Contenu | `string` markdown brut, rendu via `react-markdown` | Le contenu sera rédigé dans des fichiers markdown. Pas de type structuré `GrammarPoint` — le composant rend du markdown, point. |
| Modale | Dialog Park UI (installé via CLI) | Pas réinventer la modale. Le Dialog gère le trap focus et l'accessibilité. |
| Lib markdown | `react-markdown` | Pas de `dangerouslySetInnerHTML`. Arbre React natif, stylable avec Panda CSS. |
| Provider Effect | **Non.** Pas de service, pas de Layer | Pas de side effect — composant React pur. |
| Prop `lessonContent` | **Obligatoire** dans FillInTheBlank | Les skills de grammaire (11-15) ont toujours du contenu grammatical. Pas de cas sans contenu. |
| Bouton 💡 | Toujours visible, toutes les phases | Pas de conditionnel. L'apprenant consulte la leçon quand il veut. |
| Langue UI | Anglais | Header "Grammar Points", bouton "Got it". |
| Où vit le composant | `packages/exercises/src/components/micro-lesson/` | Cohérent avec les autres composants d'exercice. |

## Modèle

### Props MicroLesson

```ts
interface MicroLessonProps {
  readonly content: string      // markdown brut
  readonly open: boolean
  readonly onClose: () => void
}
```

- `content` — markdown brut, rendu en HTML via `react-markdown`
- `open` — contrôlé par le parent (état ouvert/fermé)
- `onClose` — appelé par le bouton "Got it" ou le bouton ✕

### Props FillInTheBlank (mise à jour)

```ts
interface FillInTheBlankProps {
  readonly config: FillInTheBlankConfig
  readonly onResult: (result: FillInTheBlankResult) => void
  readonly lessonContent: string   // ← nouveau, obligatoire
  readonly initialPhase?: FillInTheBlankPhase
}
```

## Design

### MicroLesson (modale)

```
┌──────────────────────────────────────┐
│  💡 Grammar Points             [ ✕ ] │  ← header fixe
├──────────────────────────────────────┤
│                                      │
│  ┌─ markdown rendered ─────────────┐ │
│  │                                 │ │  ← overflow-y: auto
│  │  (contenu markdown rendu)       │ │
│  │                                 │ │
│  └─────────────────────────────────┘ │
│                                      │
├──────────────────────────────────────┤
│            [ Got it ]                │  ← footer fixe
└──────────────────────────────────────┘
```

### Bouton 💡 dans FillInTheBlank

```
┌──────────────────────────────────┐
│                            [ 💡 ]│  ← bouton permanent, haut droite
│                                  │
│   私 [＿] 東京 [＿] 行きます。    │
│                                  │
├──────────────────────────────────┤
│  [は] [が] [を] [に]             │
│  [で] [へ] [と] [も]             │
├──────────────────────────────────┤
│  [⟲ Undo]                        │
└──────────────────────────────────┘
```

## Critères d'acceptance

### Setup Dialog Park UI (Étape 1)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC1 | Le composant Dialog Park UI est installé dans `packages/ui` via le CLI | Setup | 1 |
| AC2 | Une story Dialog basique s'affiche correctement dans Storybook | Story | 1 |

### Composant MicroLesson + stories (Étape 2)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC3 | Le contenu markdown est rendu en HTML dans la modale via `react-markdown` | Story | 2 |
| AC4 | Le scroll interne fonctionne quand le contenu dépasse la hauteur de la modale | Story | 2 |
| AC5 | Le bouton "Got it" ferme la modale (appelle `onClose`) | Story | 2 |
| AC6 | Le bouton ✕ ferme la modale (appelle `onClose`) | Story | 2 |

### Intégration dans FillInTheBlank (Étape 3)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC7 | `FillInTheBlankProps` a une prop `lessonContent: string` obligatoire | Type | 3 |
| AC8 | Le bouton 💡 est visible en haut à droite de la zone d'exercice | Story | 3 |
| AC9 | Le bouton 💡 ouvre la modale MicroLesson avec le `lessonContent` | Story | 3 |
| AC10 | Le bouton 💡 est accessible pendant la phase `filling` et la phase `feedback` | Story | 3 |
| AC11 | Toutes les stories FillInTheBlank existantes sont mises à jour avec un `lessonContent` fictif | Story | 3 |

### Build (Étape 4)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC12 | `pnpm build` compile sans erreur | CI | 4 |
| AC13 | `pnpm lint` passe sans erreur | CI | 4 |
| AC14 | Tests existants passent (non-régression) | CI | 4 |

## Étapes d'implémentation

### Étape 1 — Setup Dialog Park UI

- [x] Installer le composant Dialog via `npx @park-ui/cli component add dialog` → AC1
- [x] Créer une story basique Dialog dans Storybook pour vérifier le bon fonctionnement → AC2

### Étape 2 — Composant MicroLesson + stories

- [ ] Installer `react-markdown` dans `packages/exercises` → AC3
- [ ] Créer `packages/exercises/src/components/micro-lesson/micro-lesson.tsx` avec Dialog Park UI + `react-markdown` → AC3, AC5, AC6
- [ ] Styler la zone de contenu avec overflow-y scroll → AC4
- [ ] Story `MicroLesson_Short` : contenu court, pas de scroll → AC3
- [ ] Story `MicroLesson_Long` : contenu long avec scroll visible → AC4

### Étape 3 — Intégration dans FillInTheBlank

- [ ] Ajouter prop `lessonContent: string` (obligatoire) à `FillInTheBlankProps` → AC7
- [ ] Ajouter le bouton 💡 en haut à droite, `useState` pour ouvert/fermé → AC8, AC9
- [ ] Vérifier que le bouton 💡 est accessible en phase filling et feedback → AC10
- [ ] Mettre à jour toutes les stories FillInTheBlank existantes avec un `lessonContent` fictif → AC11

### Étape 4 — Vérifications finales

- [ ] `pnpm build` sans erreur → AC12
- [ ] `pnpm lint` sans erreur → AC13
- [ ] Tests existants passent (non-régression) → AC14

## Hors scope

| Élément | Raison | Sprint prévu |
|---|---|---|
| Fichiers markdown de grammaire | Rédaction du contenu réel | Sprint 3 |
| Détection "nouveau vs déjà vu" | Logique de recommandation | Sprint 3 |
| Chargement des fichiers markdown | Wiring avec le filesystem/bundler | Sprint 3 |
| Modale auto-ouverte au premier lancement | Dépend de la détection "nouveau" | Sprint 3 |
| Styling prose avancé (ruby, furigana) | À affiner quand le contenu réel sera prêt | Sprint 3 |
