# US17 — WrittenProduction

## Résumé

Composant d'exercice sens → taper le japonais au clavier IME (Skill 10). Le stimulus est le sens en anglais ; l'apprenant doit saisir le mot ou la phrase en japonais via un clavier IME. Pas de micro, pas de fallback vocal. Validation exact match, forme kanji exigée. Feedback succès : texte japonais affiché (récompense visuelle). Feedback échec : réponse utilisateur + bonne réponse affichées. Feedback skip : bonne réponse affichée (feedback correctif passif). Extraction d'un composant partagé `TextSubmitInput` depuis `MultimodalInput` — bénéficie aussi à MeaningExercise.

**Sprint :** Sprint 2 — Exercise Core
**Dépendances :** US10 (DrillQueue + packages/exercises), US11 (SessionSummary)
**Approche :** extraction `TextSubmitInput` d'abord (refactoring transversal), puis développement conjoint composant + stories

## Décisions architecturales

| Question | Décision | Justification |
|---|---|---|
| Input composant | Extraction `TextSubmitInput` dans `shared/`, composé par `MultimodalInput` (mode keyboard) et `WrittenProduction` | Évite la duplication du champ texte + submit + skip entre les exercices. MeaningExercise en bénéficie via MultimodalInput. |
| Skip | Bouton texte dans `TextSubmitInput` (prop `onSkip` optionnelle) | Skill 10 = clavier uniquement, pas de skip vocal. |
| Submit | Bouton explicite + Enter au clavier | Les deux pour couvrir desktop (Enter) et mobile (bouton). |
| Submit désactivé | Bouton Submit désactivé si input vide (après trim) | Empêche la soumission accidentelle. |
| Validation Sprint 2 | `AnswerValidationApi.validate(userInput, expected)` → exact match via fake | Même port que MeaningExercise et OralProduction. En Sprint 2, le fake fait du exact match. |
| Validation Sprint 3 | Cascade exact → fuzzy → IA pour les phrases | Hors scope. |
| Ponctuation | Hors scope Sprint 2 | Normalisation à décider au Sprint 3 avec la cascade IA. |
| Micro / VoiceRecorder | Aucun. Skill 10 = clavier uniquement | La production écrite est le cœur de l'exercice. Pas de fallback vocal. |
| IMEHelpModal | US21 séparée | Modale d'aide installation clavier japonais = composant indépendant. |
| Audio / autoplay | Aucun. Feedback purement visuel | L'exercice est écrit, le feedback est la comparaison visuelle entre la saisie et la forme correcte. |
| Texte japonais en feedback | Toujours affiché (succès, accepted, échec, skip) | Contrairement à OralProduction où le texte est masqué en cas d'échec/skip. Ici, la correction visuelle est nécessaire pour apprendre la forme kanji. |
| Footer échec/skip | Bouton Next uniquement | Pas de MismatchActionBar (pas de replay audio/user). Même pattern que MeaningExercise incorrect. |
| Placeholder | `「日本語で入力」` | Indique clairement qu'on attend du japonais. |
| Où vit le composant | `packages/exercises/src/components/written-production/` | Cohérent avec `speech-repeat/`, `meaning-exercise/`, `oral-production/`. |

## Modèle

### Config

```ts
export interface WrittenProductionConfig {
  readonly meaning: string          // sens en anglais (stimulus)
  readonly expected: string         // texte japonais attendu (forme kanji)
}
```

### Type de résultat émis

```ts
export type ExerciseOutcome = "success" | "failure" | "skip"

export interface WrittenProductionResult {
  readonly outcome: ExerciseOutcome
  readonly answerResult: Option.Option<AnswerResult>  // None pour skip
}
```

### Props du composant

```ts
export interface WrittenProductionProps {
  readonly config: WrittenProductionConfig
  readonly onResult: (result: WrittenProductionResult) => void
}
```

### TextSubmitInput (composant partagé)

```ts
export interface TextSubmitInputProps {
  readonly onSubmit: (text: string) => void
  readonly onSkip?: () => void
  readonly placeholder?: string
  readonly disabled?: boolean
}
```

- `onSubmit` — appelé avec le texte trimmé quand l'user appuie Enter ou clique Submit
- `onSkip` — si défini, affiche le bouton Skip à gauche de l'input. Appelé au clic.
- `placeholder` — texte du placeholder (défaut: "Type your answer...")
- `disabled` — grise l'input et les boutons (pendant feedback)

Layout en ligne : `[Skip] [input flex:1] [Submit ✓]`

## Design

### Cycle de vie

```
answering → (user submits) → validation → feedback → advance (auto ou manuel, géré par le parent)
```

Deux phases :
- `answering` — champ de saisie actif, boutons Submit + Skip visibles
- `feedback` — résultat affiché, input désactivé

### Flux de validation

```
User tape du texte
  └→ Submit (Enter ou bouton)
       └→ AnswerValidationApi.validate(userInput.trim(), expected)
            ├→ correct   → outcome: success, answerResult: correct
            ├→ accepted  → outcome: success, answerResult: accepted
            └→ incorrect → outcome: failure, answerResult: incorrect

Skip (bouton)
  └→ outcome: skip, answerResult: None
```

### Écrans

**Answering :**
```
┌──────────────────────────────────┐
│                                  │
│           "to study"             │  ← sens en anglais, centré
│                                  │
│                                  │
│                                  │
├──────────────────────────────────┤
│  [Skip]  [日本語で入力     ] [✓] │  ← Skip + input + Submit en ligne
└──────────────────────────────────┘
```

**Feedback correct (succès) :**
```
┌─────────────────────────┐
│       ╭───────╮         │
│       │       │         │  ← cercle succès (SuccessOverlay)
│      "to study"         │  ← sens persiste
│                         │
│       勉強する           │  ← texte japonais (récompense)
│       ╰───────╯         │
│                         │  ← auto-advance ~2s
├─────────────────────────┤
│                         │  ← footer vide
└─────────────────────────┘
```

**Feedback accepted (succès IA) :**
```
┌─────────────────────────┐
│       ╭───────╮         │
│       │       │         │  ← cercle succès
│      "to study"         │
│                         │
│       勉強する           │  ← texte attendu
│       ╰───────╯         │
│                         │
│    ✓ 勉強します          │  ← transcript user (accent)
├─────────────────────────┤
│                         │  ← footer vide, auto-advance ~2s
└─────────────────────────┘
```

**Feedback incorrect (échec) :**
```
┌─────────────────────────┐
│                         │
│      "to study"         │  ← sens persiste
│                         │
│       勉強する           │  ← bonne réponse
│  You wrote: べんきょう    │  ← réponse user (muted)
│                         │
├─────────────────────────┤
│     [ Next →  ]         │  ← bouton Next uniquement
└─────────────────────────┘
```

**Feedback skip :**
```
┌─────────────────────────┐
│                         │
│      "to study"         │  ← sens persiste
│                         │
│    ⏭️ 勉強する           │  ← bonne réponse (correction passive)
│                         │
│                         │
├─────────────────────────┤
│     [ Next →  ]         │  ← bouton Next
└─────────────────────────┘
```

### Tableau des feedbacks par résultat

| Résultat | Texte japonais affiché | Réponse user affichée | Audio | Advance |
|---|---|---|---|---|
| **correct** | oui (récompense) | non | aucun | auto (~2s) |
| **accepted** | oui (attendu) | oui (accent, "checkmark + texte") | aucun | auto (~2s) |
| **incorrect** | oui (bonne réponse) | oui ("You wrote: ...") | aucun | Next manuel |
| **skip** | oui (bonne réponse) | non | aucun | Next manuel |

## Critères d'acceptance

### Extraction TextSubmitInput (Étape 1)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC1 | `TextSubmitInput` extrait dans `packages/exercises/src/components/shared/text-submit-input.tsx` avec props `onSubmit`, `onSkip?`, `placeholder?`, `disabled?` | Unit | 1 |
| AC2 | Submit via Enter appelle `onSubmit` avec le texte trimmé | Test | 1 |
| AC3 | Submit via bouton appelle `onSubmit` avec le texte trimmé | Test | 1 |
| AC4 | Submit désactivé si input vide (après trim) | Test | 1 |
| AC5 | Bouton Skip affiché uniquement si `onSkip` est défini, appelle `onSkip` au clic | Test | 1 |
| AC6 | Input et boutons grisés quand `disabled=true` | Test | 1 |

### Refactoring MultimodalInput (Étape 2)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC7 | `MultimodalInput` compose `TextSubmitInput` en mode keyboard (remplacement de l'Input brut) | Unit | 2 |
| AC8 | Stories MeaningExercise existantes fonctionnent sans modification (non-régression) | Story | 2 |

### Types WrittenProduction (Étape 3)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC9 | `WrittenProductionConfig` contient `meaning`, `expected` | Unit | 3 |
| AC10 | `WrittenProductionResult` contient `outcome` (ExerciseOutcome) et `answerResult` (Option\<AnswerResult\>) | Unit | 3 |

### Composant WrittenProduction core + stories (Étape 4)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC11 | En phase `answering`, le sens en anglais est affiché et le `TextSubmitInput` est actif avec placeholder `「日本語で入力」` | Story | 4 |
| AC12 | Submit → `AnswerValidationApi.validate(input, expected)` → transition vers feedback | Story | 4 |
| AC13 | Skip → `onResult` appelé avec `outcome: "skip"`, `answerResult: None` | Story | 4 |
| AC14 | `onResult` est appelé avec le bon `ExerciseOutcome` + `AnswerResult` | Story | 4 |

### Feedback variants (Étape 5)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC15 | Feedback correct : cercle succès + texte japonais affiché (récompense), pas de réponse user | Story | 5 |
| AC16 | Feedback accepted : cercle succès + texte attendu + transcript user (accent), auto-advance | Story | 5 |
| AC17 | Feedback incorrect : bonne réponse + réponse user ("You wrote: ..."), bouton Next uniquement | Story | 5 |
| AC18 | Feedback skip : bonne réponse affichée (correction passive), bouton Next | Story | 5 |
| AC19 | Aucun audio joué dans aucun cas de feedback | Story | 5 |

### Build (Étape 6)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC20 | `pnpm build` compile sans erreur | CI | 6 |
| AC21 | `pnpm lint` passe sans erreur | CI | 6 |
| AC22 | Tests existants passent (non-régression) | CI | 6 |

## Étapes d'implémentation

### Étape 1 — Extraction TextSubmitInput (composant partagé)

- [x] Créer `packages/exercises/src/components/shared/text-submit-input.tsx` avec props `onSubmit`, `onSkip?`, `placeholder?`, `disabled?` → AC1
- [x] Implémenter submit via Enter (trim + non-vide) → AC2
- [x] Implémenter submit via bouton (trim + non-vide) → AC3
- [x] Bouton Submit désactivé si input vide → AC4
- [x] Bouton Skip conditionnel (`onSkip` défini) → AC5
- [x] État `disabled` grise input + boutons → AC6
- [x] Écrire les tests `TextSubmitInput` (submit Enter, submit bouton, vide bloqué, skip, disabled) → AC2, AC3, AC4, AC5, AC6

### Étape 2 — Refactoring MultimodalInput

- [x] Remplacer l'`Input` brut dans `MultimodalInput` par `TextSubmitInput` en mode keyboard → AC7
- [x] Adapter les props : `onSubmit` → `onAnswer`, pas de `onSkip` (le skip vocal reste dans le mode voice) → AC7
- [x] Vérifier que les stories MeaningExercise existantes fonctionnent → AC8

### Étape 3 — Types WrittenProduction

- [ ] Créer `packages/exercises/src/logic/written-production-config.ts` avec `WrittenProductionConfig`, `WrittenProductionResult` → AC9, AC10

### Étape 4 — Composant WrittenProduction core + stories

- [ ] Créer `packages/exercises/src/components/written-production/written-production.tsx`
- [ ] Implémenter le layout : sens en anglais en haut, `TextSubmitInput` en footer → AC11
- [ ] Implémenter le flux : answering → validation → feedback → AC12
- [ ] Wiring : submit → `AnswerValidationApi.validate(input, expected)` → AnswerResult → AC12, AC14
- [ ] Implémenter skip → `onResult({ outcome: "skip", answerResult: Option.none() })` → AC13
- [ ] Story `Word_Answering` : sens "cat" affiché, input actif → AC11
- [ ] Story `Sentence_Answering` : sens "I like cats" affiché, input actif → AC11

### Étape 5 — Feedback variants + stories

- [ ] Implémenter feedback correct : cercle succès + texte japonais → AC15
- [ ] Implémenter feedback accepted : cercle succès + texte attendu + transcript user (accent) → AC16
- [ ] Implémenter feedback incorrect : bonne réponse + "You wrote: ..." + bouton Next → AC17
- [ ] Implémenter feedback skip : bonne réponse (correction passive) + bouton Next → AC18
- [ ] Vérifier qu'aucun audio n'est joué → AC19
- [ ] Story `Word_Correct` : fake validation retourne `correct` → feedback succès avec 猫 affiché → AC15
- [ ] Story `Sentence_Accepted` : fake validation retourne `accepted` → feedback avec les deux textes → AC16
- [ ] Story `Word_Incorrect` : fake validation retourne `incorrect` → bonne réponse + "You wrote: ..." + Next → AC17
- [ ] Story `Word_Skip` : skip → bonne réponse affichée + Next → AC18

### Étape 6 — Vérifications finales

- [ ] `pnpm build` sans erreur → AC20
- [ ] `pnpm lint` sans erreur → AC21
- [ ] Tests existants passent (non-régression) → AC22

## Hors scope

| Élément | Raison | Sprint prévu |
|---|---|---|
| IMEHelpModal | US21 séparée | Sprint 2 (US21) |
| Validation cascade fuzzy + IA (phrases) | Sprint 2 = exact match | Sprint 3 |
| Normalisation ponctuation | À décider avec la cascade IA | Sprint 3 |
| Composition IME handling (`compositionstart/end`) | L'input HTML standard gère ça de manière transparente | Sprint 3 si nécessaire |
| Wiring avec DrillQueue en page session | L'US17 est un composant standalone en Storybook | Sprint 3 |
| Audio / autoplay | Exercice purement écrit, feedback visuel uniquement | — |
| Détection IME installé | Pattern identique au micro (US14). Si pas d'IME, message explicatif | Sprint 3 |
| Auto-advance timing (2s succès) | Comportement de session, géré par le parent (DrillQueue orchestrateur) | Sprint 3 |
