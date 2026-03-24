# US11 — SessionSummary

## Résumé

Composant récap de fin de session d'exercice. Affiche les items réussis (contenu complet + 🔊 modèle TTS + 🎙️ enregistrement apprenant + nb essais) et les items tentés non réussis (🔊 modèle uniquement, pas de récompense visuelle). Les items non tentés sont absents. Distinction session complète / abandonnée via le ratio succeeded/total. Si aucun item n'a été tenté, le récap n'est pas affiché (responsabilité de l'appelant).

**Sprint :** Sprint 2 — Exercise Core
**Dépendances :** US10 (DrillQueue + `DrillSummary`)
**Approche :** TDD (Red-Green-Refactor) pour la logique, développement conjoint composant + stories pour l'UI

## Décisions architecturales

| Question | Décision | Justification |
|---|---|---|
| Typage des items du récap | Union discriminée `SessionSummarySucceededItem` / `SessionSummaryAttemptedItem` avec `kind` | Le `recordingBlob` n'existe que sur les succeeded — un type discriminé force la gestion correcte à la compilation. Discriminant `kind` cohérent avec le pattern `LinguisticElement` du projet. |
| Audio modèle (🔊) | `SpeechSynthesis` navigateur via un service Effect injectable | Permet le TDD avec mock de `window.speechSynthesis`. Langue `ja-JP`. La logique vit dans `text-to-speech.ts`, pas dans le composant. Pas de layer test séparé — YAGNI au Sprint 2. |
| Audio apprenant (🎙️) | `Blob` en props, lu via `URL.createObjectURL` + `<audio>` | Le blob vient de l'enregistrement micro (US12). Pour Storybook, on fournit un vrai blob audio (sine wave généré) pour tester auditivement. |
| Cas zéro tenté | Pas de récap — l'appelant ne monte pas le composant | Si `DrillSummary` n'a que des `pending`, le `SessionSummary` n'est pas rendu. Pas de cas à gérer dans le composant. |
| Complète vs abandonnée | Déduit du ratio `succeeded.length / total` | Pas de flag séparé — `pending` vide = complète, `pending` non vide = abandonnée. Le composant affiche "You completed X/Y". |
| Où vit la logique | `packages/exercises/src/logic/` pour la transformation et le service TTS, `packages/exercises/src/components/session-summary/` pour le composant React | Séparation logique pure (testable en TDD) / composant UI (développé avec stories). |
| Stories | Colocalisées dans `packages/exercises/src/components/session-summary/` | Découvertes par le glob Storybook de `packages/storybook`. |
| Fixture audio Storybook | Sine wave `.wav` généré programmatiquement (~0.5s) | Vrai son audible pour vérifier le bouton 🎙️, sans dépendance à un fichier externe. |

## Modèle

### Types du récap

```ts
interface SessionSummarySucceededItem<A> {
  readonly kind: "succeeded"
  readonly item: DrillItem<A>
  readonly attempts: number
  readonly modelText: string
  readonly recordingBlob: Blob
}

interface SessionSummaryAttemptedItem<A> {
  readonly kind: "attempted"
  readonly item: DrillItem<A>
  readonly attempts: number
  readonly modelText: string
}

type SessionSummaryItem<A> =
  | SessionSummarySucceededItem<A>
  | SessionSummaryAttemptedItem<A>
```

**Note scaffolding + attempts :** `DrillSummary.summarize` clé sur `value` — les versions scaffolded et non-scaffolded sont le même item. Un item réussi avec scaffolding puis sans = `attempts: 2`. Le badge ×2 est correct : l'utilisateur a rencontré l'item 2 fois.

### Props du composant

```ts
interface SessionSummaryProps<A> {
  readonly succeeded: ReadonlyArray<SessionSummarySucceededItem<A>>
  readonly attempted: ReadonlyArray<SessionSummaryAttemptedItem<A>>
  readonly total: number
  readonly renderContent: (item: DrillItem<A>) => React.ReactNode
}
```

- `total` = nombre d'items initiaux de la queue (5), pour le message "You completed X/Y"
- `renderContent` = fonction de rendu fournie par le skill pour afficher le contenu spécifique (kana, mot kanji, phrase...)
- `renderContent` n'est appelé que pour les items succeeded (le contenu est la récompense visuelle)

### Service TextToSpeech

```ts
// Service Effect injectable
interface TextToSpeech {
  readonly speak: (text: string, lang: string) => Effect<void, TextToSpeechError>
}
```

## Design

### Écrans

**Session complète (5/5) :**
```
┌─────────────────────────────────────────────┐
│                                             │
│  Session complete                           │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  か              🔊  🎙️             │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │  き              🔊  🎙️         ×2  │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │  く              🔊  🎙️             │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │  け              🔊  🎙️             │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │  こ              🔊  🎙️         ×3  │    │
│  └─────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

**Session abandonnée (3/5) :**
```
┌─────────────────────────────────────────────┐
│                                             │
│  You completed 3/5                          │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  食べる           🔊  🎙️            │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │  飲む             🔊  🎙️        ×2  │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │  行く             🔊  🎙️            │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │  ─ ─ ─           🔊            ×3  │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │  ─ ─ ─           🔊            ×2  │    │
│  └─────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

**Phrase longue (troncature + tooltip) :**
```
┌─────────────────────────────────────────────┐
│  ┌─────────────────────────────────────┐    │
│  │  彼女は毎朝六時に起き...  🔊  🎙️    │    │
│  └─────────────────────────────────────┘    │
│                    ┌───────────────────┐    │
│                    │ 彼女は毎朝六時に  │    │
│                    │ 起きてジョギング  │    │
│                    │ をする            │    │
│                    └───────────────────┘    │
└─────────────────────────────────────────────┘
```

### Layout

- Chaque item est sur **une seule ligne** : contenu + boutons audio + badge
- Le contenu prend l'espace disponible (`flex: 1`, `min-width: 0`)
- Troncature via `text-overflow: ellipsis` + `overflow: hidden` + `white-space: nowrap`
- Tooltip (hover desktop / tap mobile) affiche le texte complet si tronqué
- Pas de barre de progression — le header est un message texte seul
- Pas de scroll — tout est visible (5 items + header = compact)

### Tokens Panda CSS

| Élément | Token | Valeur |
|---|---|---|
| Fond container | `bg.canvas` | Fond de page |
| Fond item card | `bg.subtle` | Légèrement surélevé |
| Border item card | `border.subtle` | Séparation légère |
| Border radius | `l2` | Cohérent design system |
| Texte contenu (japonais) | `fg.default` | Contraste max, lisibilité |
| Texte header "Session complete" | `fg.default` | Message principal |
| Texte header "You completed X/Y" | `fg.muted` | Informatif, pas dominant |
| Placeholder attempted (─ ─ ─) | `fg.disabled` | Absence de récompense |
| Badge ×N | `fg.muted` + `fontSize: "xs"` | Secondaire |
| Spacing entre items | `gap: "2"` | Compact |
| Padding interne item | `p: "3"` | Aéré |
| Spacing container | `gap: "4"` | Séparation header / liste |

### Composants Park UI utilisés

| Composant | Usage | Statut |
|---|---|---|
| `Card` (Root, Body) | Container de chaque item ligne | Disponible |
| `Button` (variant `ghost`, size `sm`) | Boutons 🔊 et 🎙️ | Disponible |
| `Text` | Message header | Disponible |
| `Tooltip` | Texte complet au hover/tap pour les phrases longues | **À installer via CLI** |

### Structure du composant

```
SessionSummary (styled div, flexDirection: "column", gap: "4")
├── Text (header : "Session complete" ou "You completed X/Y")
├── Card (pour chaque succeeded item)
│   └── Card.Body (flexDirection: "row", alignItems: "center", gap: "3", p: "3")
│       ├── Tooltip → renderContent (flex: 1, truncate, fg.default)
│       ├── Button ghost sm 🔊
│       ├── Button ghost sm 🎙️
│       └── Text ×N (fg.muted, fontSize: "xs", si attempts > 1)
└── Card (pour chaque attempted item)
    └── Card.Body (flexDirection: "row", alignItems: "center", gap: "3", p: "3")
        ├── Text "─ ─ ─" (flex: 1, fg.disabled)
        ├── Button ghost sm 🔊
        └── Text ×N (fg.muted, fontSize: "xs", si attempts > 1)
```

## Critères d'acceptance

### Types & transformation

| # | Critère | Type | Étape |
|---|---|---|---|
| AC1 | Les types `SessionSummarySucceededItem` et `SessionSummaryAttemptedItem` sont définis avec le discriminant `kind` | Unit | 1 |
| AC2 | `recordingBlob` est présent uniquement sur `SessionSummarySucceededItem`, absent sur `SessionSummaryAttemptedItem` | Unit | 1 |

### Service TextToSpeech

| # | Critère | Type | Étape |
|---|---|---|---|
| AC3 | Le service `TextToSpeech` expose une fonction `speak(text, lang)` qui retourne un `Effect` | Unit | 2 |
| AC4 | Le layer navigateur (`BrowserTextToSpeechLive`) appelle `SpeechSynthesis` avec la langue spécifiée | Unit | 2 |
| AC5 | `speak` retourne une erreur `TextToSpeechError` si `SpeechSynthesis` n'est pas disponible | Unit | 2 |

### Composant SessionSummary

| # | Critère | Type | Étape |
|---|---|---|---|
| AC6 | Les items succeeded affichent le contenu via `renderContent` + bouton 🔊 + bouton 🎙️ | Story | 3 |
| AC7 | Les items attempted affichent uniquement le bouton 🔊 (pas de contenu, pas de 🎙️) | Story | 3 |
| AC8 | Le badge nombre d'essais (×N) s'affiche uniquement quand `attempts > 1` (inclut les passages scaffolding) | Story | 3 |
| AC9 | Le message "You completed X/Y" affiche le bon ratio (X = succeeded.length, Y = total) | Story | 3 |
| AC10 | Les items succeeded sont affichés avant les items attempted | Story | 3 |
| AC11 | Le bouton 🔊 déclenche `TextToSpeech.speak` avec le `modelText` et la langue `ja-JP` | Story | 3 |
| AC12 | Le bouton 🎙️ joue le `recordingBlob` de l'item | Story | 3 |

### Stories Storybook

| # | Critère | Type | Étape |
|---|---|---|---|
| AC13 | Story `AllSucceededFirstTry` : 5/5, tous en 1 essai, données japonaises réalistes | Story | 3 |
| AC14 | Story `AllSucceededMultipleAttempts` : 5/5, certains en 2-3 essais, badge ×N visible | Story | 3 |
| AC15 | Story `Abandoned` : 3/5 réussis, 2 attempted, message "You completed 3/5" | Story | 3 |
| AC16 | Story `SingleItem` : 1/5 réussi, abandon précoce | Story | 3 |
| AC17 | Story `WithScaffolding` : items réussis après double passage, badge ×2 (scaffolding + sans) | Story | 3 |

### Build

| # | Critère | Type | Étape |
|---|---|---|---|
| AC18 | `pnpm build` compile sans erreur | CI | 4 |
| AC19 | `pnpm lint` passe sans erreur | CI | 4 |

## Étapes d'implémentation

### Étape 1 — Types discriminés & exports

- [x] Créer `packages/exercises/src/logic/session-summary.ts` avec les types `SessionSummarySucceededItem`, `SessionSummaryAttemptedItem`, `SessionSummaryItem`
- [x] Test RED : vérifier que `kind: "succeeded"` a `recordingBlob`, `kind: "attempted"` n'en a pas (test de typage compile-time via `expectTypeOf` de Vitest) → AC1, AC2
- [x] GREEN : implémenter les types

### Étape 2 — Service TextToSpeech (TDD)

- [x] Créer `packages/exercises/src/logic/text-to-speech.ts`
- [x] Test RED : `speak("こんにちは", "ja-JP")` avec mock de `window.speechSynthesis` → `SpeechSynthesisUtterance` créé avec le bon texte et la bonne langue → AC3, AC4
- [x] Test RED : `speak` quand `window.speechSynthesis` absent → retourne `TextToSpeechError` → AC5
- [x] GREEN : implémenter le service Effect et le layer navigateur
- [x] REFACTOR

### Étape 3 — Composant SessionSummary + Stories (développement conjoint)

- [x] Installer le composant Tooltip via `npx @park-ui/cli components add tooltip` dans `packages/ui`
- [x] Créer `packages/exercises/src/components/session-summary/session-summary.tsx`
- [x] Créer la fixture audio : fonction `makeFakeAudioBlob()` qui génère un sine wave WAV de 0.5s
- [x] Story `AllSucceededFirstTry` : 5 items kana (か, き, く, け, こ), tous réussis en 1 essai → AC6, AC8, AC9, AC13
- [x] Implémenter le rendu des items succeeded : `renderContent` + bouton 🔊 + bouton 🎙️ → AC6
- [x] Story `AllSucceededMultipleAttempts` : 5 items, certains avec attempts=2 ou 3 → AC8, AC14
- [x] Implémenter le badge ×N conditionnel → AC8
- [x] Story `Abandoned` : 3 succeeded + 2 attempted, inclure au moins une phrase longue pour vérifier la troncature ellipsis + tooltip → AC7, AC9, AC15
- [x] Implémenter le rendu des items attempted : 🔊 uniquement, pas de `renderContent`, pas de 🎙️ → AC7
- [x] Implémenter le message "You completed X/Y" → AC9
- [x] Vérifier l'ordre d'affichage : succeeded avant attempted → AC10
- [x] Brancher le bouton 🔊 sur `TextToSpeech.speak` (layer navigateur en story, `ja-JP`) → AC11
- [x] Brancher le bouton 🎙️ sur `URL.createObjectURL(recordingBlob)` + `<audio>` → AC12
- [x] Story `SingleItem` : 1 succeeded, abandon → AC16
- [x] Story `WithScaffolding` : items avec double passage, attempts=2 (scaffolding + sans) → AC17
- [x] Exporter le composant depuis `packages/exercises/src/index.ts`

### Étape 4 — Vérifications finales

- [ ] `pnpm build` sans erreur → AC18
- [ ] `pnpm lint` sans erreur → AC19
- [ ] Tests existants passent (non-régression)

## Hors scope

| Élément | Raison | Sprint prévu |
|---|---|---|
| Vrais enregistrements audio | Le `Blob` vient de US12 (VoiceRecorder) | US14+ |
| TTS haute qualité | `SpeechSynthesis` navigateur suffit pour Storybook, fichiers audio pré-générés au Sprint 3 | Sprint 3 |
| Wiring avec DrillQueue réelle | Le composant reçoit des props statiques en Storybook | Sprint 3 |
| Animations de récompense | KanaUnlocked / WordUnlocked sont des US séparées | US20 |
| Persistence des résultats | Enregistrement en DB des scores | Sprint 3 |
| Cas zéro tenté | L'appelant ne monte pas le composant — pas de gestion interne | — |
