# US13 — MultimodalInput

## Résumé

Composant composite d'input multimodal permettant de basculer entre mode voix (VoiceRecorder, US12) et mode clavier (Input Park UI). Un `IconButton` Park UI toggle entre les deux modes. La préférence est persistée en localStorage via `Atom.kvs` + `BrowserKeyValueStore.layerLocalStorage`. Le composant expose un callback `onAnswer` unifié qui retourne un `string` (mode clavier) ou un `Blob` audio (mode voix).

**Sprint :** Sprint 2 — Exercise Core
**Dépendances :** US10 (packages/exercises), US12 (VoiceRecorder)
**Approche :** Développement conjoint composant + stories (pas de TDD — logique minimale)

## Décisions architecturales

| Question | Décision | Justification |
|---|---|---|
| Nature du composant | Composant composite : VoiceRecorder OU Input + bouton toggle | L'US13 encapsule les deux modes d'input et le switch. Le parent (MeaningExercise) reçoit un résultat unifié. |
| Persistance mode | `Atom.kvs` avec `BrowserKeyValueStore.layerLocalStorage` | Fourni nativement par `@effect-atom/atom-react`. Pas besoin d'un service custom. Schema-safe, fallback automatique sur la `defaultValue` si valeur corrompue. |
| Défaut | `"voice"` | L'app est orientée oral — le mode voix est l'expérience principale. L'utilisateur switch vers clavier si besoin. |
| Toggle | `IconButton` Park UI (installé via CLI), `variant="ghost"`, `size="sm"` | Un seul bouton qui bascule. Pas de SegmentGroup — plus simple, moins d'encombrement visuel. |
| Icônes toggle | `AudioLines` (→ voix) / `Keyboard` (→ clavier) | Affiche le mode **cible**, pas le mode actuel. `AudioLines` évite la collision avec l'icône `Mic` du VoiceRecorder. |
| Callback | `onAnswer: (result: AnswerResult) => void` avec type discriminé | Le parent sait si c'est du texte ou de l'audio sans logique conditionnelle. |
| Input clavier | `Input` Park UI, validation au `Enter`, `enterKeyHint="send"`, hauteur `48px` (= VoiceRecorder) | Même dimension que le VoiceRecorder pour éviter un saut visuel au switch. `enterKeyHint="send"` affiche un bouton "Envoyer" sur le clavier mobile. Réponses courtes — pas besoin de `Textarea`. |
| Micro indisponible | Géré par VoiceRecorder (US12) — affiche son état erreur | L'utilisateur voit que le micro n'est pas dispo et switch de lui-même via le toggle. Pas de logique supplémentaire dans l'US13. |
| Layout | Flex row, input/recorder `flex: 1`, toggle calé à droite | Input et bouton sur la même ligne. |
| Où vit le composant | `packages/exercises/src/components/multimodal-input/` | Cohérent avec la structure `packages/exercises/src/components/`. |

## Modèle

### Type de résultat

```ts
export type InputMode = "voice" | "keyboard"

export type AnswerResult =
  | { readonly mode: "keyboard"; readonly text: string }
  | { readonly mode: "voice"; readonly audio: Blob }
```

### Atom persisté

```ts
import { Atom } from "@effect-atom/atom-react"
import { BrowserKeyValueStore } from "@effect/platform-browser"
import { Schema } from "effect"

const InputMode = Schema.Literal("voice", "keyboard")

const runtime = Atom.runtime(BrowserKeyValueStore.layerLocalStorage)

export const inputModeAtom = Atom.kvs({
  runtime,
  key: "manabu:input-mode",
  schema: InputMode,
  defaultValue: () => "voice" as const,
})
```

### Props du composant

```ts
export interface MultimodalInputProps {
  readonly onAnswer: (result: AnswerResult) => void
  readonly placeholder?: string
  readonly voiceRecorderState: VoiceRecorderState
  readonly onSpeechStart: () => void
  readonly onError: (error: MicrophoneError) => void
}
```

- `onAnswer` — appelé quand l'utilisateur soumet une réponse (Enter en clavier, fin de parole en voix)
- `placeholder` — texte placeholder pour l'input clavier (défaut : `"Type your answer..."`)
- `voiceRecorderState` — état du VoiceRecorder, contrôlé par le parent
- `onSpeechStart` — proxy vers le VoiceRecorder
- `onError` — proxy vers le VoiceRecorder

## Design

### Écrans

**Mode voix :**

```
┌──────────────────────────────────────┐
│  🔴 ▁▃▅▇▅▃▁▃▅▇▅▃▁           ┌────┐ │
│     (VoiceRecorder)           │ ⌨  │ │
│                               └────┘ │
└──────────────────────────────────────┘
```

**Mode clavier :**

```
┌──────────────────────────────────────┐
│  ┌───────────────────────────┐┌────┐ │
│  │ Type your answer...       ││ ≋  │ │
│  └───────────────────────────┘└────┘ │
└──────────────────────────────────────┘
```

### Layout

- Container : `styled("div")`, `display: "flex"`, `flexDirection: "row"`, `alignItems: "center"`, `gap: "2"`
- VoiceRecorder / Input : `flex: 1`
- `IconButton` : calé à droite, taille fixe

### Icônes Lucide

| Mode actuel | Icône affichée | Import |
|---|---|---|
| keyboard | `AudioLines` (= "passer en voix") | `import { AudioLines } from "lucide-react"` |
| voice | `Keyboard` (= "passer en clavier") | `import { Keyboard } from "lucide-react"` |

## Critères d'acceptance

### Atom persisté (Step 1)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC1 | `inputModeAtom` retourne `"voice"` par défaut quand rien en localStorage | Unit | 1 |
| AC2 | `inputModeAtom` persiste `"voice"` en localStorage après un set | Unit | 1 |

### Composant MultimodalInput (Step 2)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC3 | En mode clavier, un `Input` Park UI est affiché avec le placeholder | Story | 2 |
| AC4 | En mode voix, le `VoiceRecorder` (US12) est affiché à la place de l'input | Story | 2 |
| AC5 | Le bouton toggle affiche `AudioLines` en mode clavier et `Keyboard` en mode voix | Story | 2 |
| AC6 | Click sur le toggle bascule entre les deux modes | Story | 2 |
| AC7 | L'`aria-label` du toggle est dynamique : "Passer en mode voix" / "Passer en mode clavier" | Story | 2 |
| AC8 | En mode clavier, `Enter` appelle `onAnswer({ mode: "keyboard", text })` | Story | 2 |
| AC9 | En mode voix, fin de parole appelle `onAnswer({ mode: "voice", audio: blob })` | Story | 2 |
| AC10 | Le layout est en flex row avec l'input/recorder en `flex: 1` et le toggle calé à droite | Story | 2 |

### Stories Storybook (Step 2)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC11 | Story `KeyboardMode` : Input affiché + bouton AudioLines visible | Story | 2 |
| AC12 | Story `VoiceMode` : VoiceRecorder affiché + bouton Keyboard visible | Story | 2 |

### Build (Step 3)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC13 | `pnpm build` compile sans erreur | CI | 3 |
| AC14 | `pnpm lint` passe sans erreur | CI | 3 |

## Étapes d'implémentation

### Étape 1 — Installation composants Park UI manquants

- [x] Installer `IconButton` via `npx @park-ui/cli component add icon-button` dans `packages/ui`
- [x] Story `IconButton` : afficher les variants (`solid`, `outline`, `subtle`, `ghost`) avec une icône Lucide
- [x] Story `Input` : afficher les tailles et états (default, placeholder, disabled) — composant déjà installé, story manquante
- [x] Exporter `IconButton` et `Input` depuis `packages/ui/src/index.ts` si pas déjà fait

### Étape 2 — Atom persisté (`inputModeAtom`)

- [x] Créer `packages/exercises/src/logic/input-mode.ts` avec `InputMode`, `AnswerResult`, `inputModeAtom`
- [x] ~Test : `inputModeAtom` retourne `"voice"` par défaut~ → AC1 — pas de test unitaire, c'est du wiring `Atom.kvs` (on testerait la lib). Couvert par les stories (étape 3).
- [x] ~Test : set `"keyboard"`, relire → `"keyboard"`~ → AC2 — idem, couvert par les stories.

### Étape 3 — Composant MultimodalInput + Stories

- [x] Créer `packages/exercises/src/components/multimodal-input/multimodal-input.tsx`
- [x] Implémenter le layout flex row avec VoiceRecorder ou Input selon le mode → AC3, AC4, AC10
- [x] Implémenter le toggle IconButton (`variant="ghost"`, `size="sm"`) avec `AudioLines` / `Keyboard` → AC5, AC6, AC7
- [x] Implémenter le callback `onAnswer` pour le mode clavier (Enter) → AC8
- [x] Implémenter le callback `onAnswer` pour le mode voix (onSpeechEnd → blob) → AC9
- [x] Story `VoiceMode` : vrai micro, toggle entre voix et clavier → AC11, AC12
- [x] Exporter le composant depuis `packages/exercises/src/index.ts`

### Étape 4 — Vérifications finales

- [x] `pnpm build` sans erreur → AC13
- [x] `pnpm lint` sans erreur → AC14
- [x] Tests existants passent (non-régression)

## Hors scope

| Élément | Raison | Sprint prévu |
|---|---|---|
| Progression QCM 2 → QCM 4 → input libre | Logique de MeaningExercise (US15), pas du MultimodalInput | US15 |
| Logique de disponibilité micro | Gérée par VoiceRecorder (US12) — son état erreur suffit | US12 |
| Validation des réponses clavier | Le parent (MeaningExercise) valide le texte reçu via `onAnswer` | US15 |
| Speech Recognition | Transcription wired dans les composants d'exercice (US14+) | US14+ |
| Wiring avec MeaningExercise | L'US13 est un composant standalone en Storybook | US15 |
