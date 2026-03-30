# US15 — MeaningExercise

## Résumé

Composant d'exercice voir/entendre → trouver le sens. Gère 3 skills : Skill 5 (kanji isolé → identifier le sens, QCM évolutif → input libre), Skill 6 (audio mot/phrase → identifier le sens, replay illimité), Skill 8 (texte japonais mot/phrase → identifier le sens). Le mode d'interaction (`InteractionMode`) est passé en config : `qcm` (2 ou 4 choix) ou `free-input` (clavier ou voix). La progression QCM 2 → QCM 4 → input libre est décidée par le moteur de recommandation (Sprint 3) — le composant est stateless par rapport à la progression. Toute réponse (QCM, clavier, voix) produit un string envoyé à un port `AnswerValidationApi`. En mode free-input, le composant délègue à `MultimodalInput` (US13) qui est refactoré dans cette US pour retourner un `string` (au lieu d'un `Blob` en mode voix) en internalisant le STT via un port `SpeechToTextApi`.

**Sprint :** Sprint 2 — Exercise Core
**Dépendances :** US10 (DrillQueue + packages/exercises), US11 (SessionSummary), US13 (MultimodalInput)
**Approche :** TDD pour la logique pure (extraction `isSentence`), développement conjoint composant + stories pour l'UI

## Décisions architecturales

| Question | Décision | Justification |
|---|---|---|
| Composant unique vs multiple | Un seul composant `MeaningExercise` paramétré par une config discriminée par skill et par mode | Les 3 skills partagent le même cycle stimulus → réponse → feedback. Les variantes sont des props. |
| InteractionMode | Discriminated union `qcm` / `free-input`. Pas de `choiceCount` (inféré de `choices.length`), pas de `inputMode` (géré par `MultimodalInput` en interne) | Le nombre de choix et le mode d'input sont des données internes, pas des configs du parent. |
| Canal de sortie | Unifié : tout mode d'interaction → string → `AnswerValidationApi.validate(answer, expected)` | QCM = string du bouton tapé. Clavier = string saisi. Voix = string issu du STT. Un seul pipeline de validation. |
| Port validation | `AnswerValidationApi` — `Context.Tag` Effect, méthode `validate(answer, expected) → Effect<AnswerResult>` | Le composant ne connaît pas la stratégie de validation (exact match, fuzzy, IA). En Sprint 2, le fake fait du exact match. |
| Port STT | `SpeechToTextApi` — `Context.Tag` Effect, méthode `transcribe(blob) → Effect<string>`. Séparé de `SpeechRecognitionApi` (US14). Vit dans `MultimodalInput`, pas dans MeaningExercise. | `SpeechRecognitionApi` fait STT + comparaison phonétique (adapté à SpeechRepeat). Ici on a besoin de STT pur. `MultimodalInput` internalise le STT et retourne un `string` — MeaningExercise ne voit jamais de `Blob`. |
| Refactoring MultimodalInput | `MultimodalInput` (US13) est refactoré pour retourner un `string` au lieu d'un `AnswerResult` discriminé. Le STT est internalisé via `SpeechToTextApi`. | Le parent veut toujours un texte de réponse. Le Blob audio est un détail d'implémentation du mode voix. |
| Refactoring SpeechRecognitionApi | Non — reste tel quel dans l'US 14 | Pas de refactoring spéculatif. Au Sprint 3, on verra si on factorise. |
| Progression QCM → input libre | Décidée par le parent (moteur Sprint 3), pas par le composant | Le composant reçoit le mode en config, il est stateless par rapport à la progression. |
| Stimulus display | Extraire `isSentence` de `speech-repeat.ts` vers un utilitaire partagé | Réutilisé par MeaningExercise pour le sizing adaptatif du texte. |
| Bouton play (Skill 6) | Statique, identique à l'US 14. Replay illimité | Améliorations visuelles éventuelles différées. |
| Feedback succès | Affiche la bonne réponse (fond vert) + auto-advance | Confirmation post-rappel = meilleure rétention (retrieval + confirmation). |
| Feedback échec | Affiche réponse utilisateur + bonne réponse (fond rouge) + Next manuel | Comparaison visuelle aide l'encodage. |
| MultimodalInput | Visible uniquement en mode `free-input`. Retourne un `string` (après refactoring). | Invisible en mode QCM. MeaningExercise envoie le string directement à `AnswerValidationApi`. |
| Skip vocal en free-input | "skip" en anglais, détecté dans le transcript STT | Cohérent avec l'US 14. |
| Distracteurs (choix QCM) | Hors scope Sprint 2 — passés en props, mockés dans les stories | La logique de génération (visuels vs sémantiques) sera décidée au Sprint 3. |
| Où vit le composant | `packages/exercises/src/components/meaning-exercise/` | Cohérent avec `packages/exercises/src/components/speech-repeat/`. |
| Où vivent les ports | `packages/exercises/src/logic/answer-validation.ts` (AnswerValidationApi) et `packages/exercises/src/logic/vocal/speech-to-text.ts` (SpeechToTextApi, consommé par MultimodalInput) | Proche des autres services logiques. |

## Modèle

### Stimulus

```ts
export type MeaningStimulusKind =
  | { readonly mode: "visual"; readonly text: string }
  | { readonly mode: "audio"; readonly modelAudioSrc: string }
```

- `visual` : Skills 5 et 8 — texte japonais (kanji isolé, mot ou phrase), taille adaptative via `isSentence`. Un kanji isolé (`"学"`) est naturellement affiché en grand (1 caractère ≤ 4).
- `audio` : Skill 6 — bouton play statique, replay illimité

### Interaction

```ts
export interface Choice {
  readonly value: string
  readonly label: string
}

export type InteractionMode =
  | { readonly mode: "qcm"; readonly choices: ReadonlyArray<Choice> }
  | { readonly mode: "free-input" }
```

- `qcm` : 2 ou 4 choix (inféré de `choices.length`). Tap sur un bouton → string envoyé à la validation
- `free-input` : le mode d'input (clavier ou voix) est géré en interne par `MultimodalInput` (US13, préférence persistée en localStorage). Le composant monte l'input texte ou le VoiceRecorder selon le state du toggle.

### Port Answer Validation

```ts
export type AnswerResult =
  | { readonly kind: "correct"; readonly expected: string }
  | { readonly kind: "incorrect"; readonly userAnswer: string; readonly expected: string }

export class AnswerValidationApi extends Context.Tag("AnswerValidationApi")<
  AnswerValidationApi,
  {
    readonly validate: (
      answer: string,
      expected: string
    ) => Effect.Effect<AnswerResult>
  }
>() {}
```

- `correct` porte `expected` pour l'affichage du feedback de confirmation
- `incorrect` porte `userAnswer` + `expected` pour la comparaison visuelle

### Fake pour Storybook / tests

```ts
export const fakeAnswerValidation = Layer.succeed(AnswerValidationApi, {
  validate: (answer, expected) => {
    return Effect.succeed(
      answer === expected
        ? { kind: "correct" as const, expected }
        : { kind: "incorrect" as const, userAnswer: answer, expected }
    )
  },
})
```

### Port Speech-to-Text

```ts
export class SpeechToTextApi extends Context.Tag("SpeechToTextApi")<
  SpeechToTextApi,
  {
    readonly transcribe: (blob: Blob) => Effect.Effect<string>
  }
>() {}
```

### Config

```ts
export interface MeaningExerciseConfig {
  readonly stimulus: MeaningStimulusKind
  readonly interaction: InteractionMode
  readonly expected: string
  readonly modelAudioSrc: string
}
```

### Type de résultat émis

```ts
export type ExerciseOutcome = "success" | "failure" | "skip"

export interface MeaningExerciseResult {
  readonly outcome: ExerciseOutcome
  readonly answerResult: AnswerResult
}
```

### Props du composant

```ts
export interface MeaningExerciseProps {
  readonly config: MeaningExerciseConfig
  readonly onResult: (result: MeaningExerciseResult) => void
}
```

- `config` — configuration de l'exercice (stimulus, interaction, réponse attendue, audio modèle)
- `onResult` — appelé quand le verdict est rendu. Le parent (page session / DrillQueue) gère l'advance.

## Design

### Cycle de vie

```
idle → réponse (QCM tap / saisie clavier / transcription vocale) → validation → feedback → advance (auto ou manuel, géré par le parent)
```

Le composant a deux phases : `answering` (l'utilisateur interagit) et `feedback` (résultat affiché).

### Deux modes de stimulus

| Mode | Skills | Stimulus |
|---|---|---|
| **visual** | 5, 8 | Texte japonais (kanji isolé, mot ou phrase), taille adaptative via `isSentence` |
| **audio** | 6 | Bouton 🔊 play statique, replay illimité |

### Trois modes d'interaction

| Mode | Affichage |
|---|---|
| **QCM 2** | 2 boutons larges empilés |
| **QCM 4** | Grille 2×2 |
| **Free-input clavier** | Input texte + bouton Submit + MultimodalInput |
| **Free-input voix** | VoiceRecorder + MultimodalInput |

### Écrans — Skill 5 (Kanji Meaning)

**Answering (QCM 4) :**
```
┌─────────────────────────┐
│                         │
│          学              │  ← kanji très grand, centré
│                         │
│  ┌──────┐  ┌──────┐    │
│  │study │  │ dog  │    │  ← grille 2×2
│  ├──────┤  ├──────┤    │
│  │ cat  │  │ tree │    │
│  └──────┘  └──────┘    │
└─────────────────────────┘
```

**Answering (free-input clavier) :**
```
┌─────────────────────────┐
│                         │
│          学              │
│                         │
│  ┌──────────────────┐   │
│  │ Type your answer │   │  ← input texte
│  └──────────────────┘   │
│  [Submit]    [🎙️/⌨️]    │  ← bouton + toggle
└─────────────────────────┘
```

**Answering (free-input voix) :**
```
┌─────────────────────────┐
│                         │
│          学              │
│                         │
│   ┌─────────────────┐   │
│   │  🔴 waveform     │   │  ← VoiceRecorder
│   └─────────────────┘   │
│               [🎙️/⌨️]   │  ← toggle
└─────────────────────────┘
```

### Écrans — Skill 6 (Listening Comprehension)

**Answering (QCM 4) :**
```
┌─────────────────────────┐
│                         │
│      🔊 (play btn)      │  ← bouton statique, replay illimité
│                         │
│  ┌──────┐  ┌──────┐    │
│  │ dog  │  │ cat  │    │
│  ├──────┤  ├──────┤    │
│  │study │  │ tree │    │
│  └──────┘  └──────┘    │
└─────────────────────────┘
```

### Écrans — Skill 8 (Reading Comprehension)

**Answering (QCM 4, mot) :**
```
┌─────────────────────────┐
│                         │
│          猫              │  ← mot grand
│                         │
│  ┌──────┐  ┌──────┐    │
│  │ cat  │  │ dog  │    │
│  ├──────┤  ├──────┤    │
│  │fish  │  │bird  │    │
│  └──────┘  └──────┘    │
└─────────────────────────┘
```

**Answering (QCM 4, phrase) :**
```
┌─────────────────────────┐
│                         │
│    猫が好きです           │  ← phrase, taille réduite
│                         │
│  ┌──────┐  ┌──────┐    │
│  │I like│  │I hate│    │
│  │ cats │  │ cats │    │
│  ├──────┤  ├──────┤    │
│  │I have│  │I see │    │
│  │a cat │  │a cat │    │
│  └──────┘  └──────┘    │
└─────────────────────────┘
```

### Écrans — Feedback (commun à tous les skills)

**Feedback correct :**
```
┌─────────────────────────┐
│                         │
│    [stimulus persiste]   │
│                         │
│  ┌─────────────────┐    │
│  │ ✅ "study"       │    │  ← bonne réponse, fond vert subtil
│  └─────────────────┘    │
│                         │  ← auto-advance ~2s
└─────────────────────────┘
```

**Feedback incorrect :**
```
┌─────────────────────────┐
│                         │
│    [stimulus persiste]   │
│                         │
│  ┌─────────────────┐    │
│  │ ❌ You: "dog"    │    │  ← réponse utilisateur, fond rouge
│  │ ✅ Expected:     │    │
│  │    "study"       │    │  ← bonne réponse
│  └─────────────────┘    │
│       [ Next → ]        │  ← bouton manuel
└─────────────────────────┘
```

### Tableau des feedbacks par résultat

| Résultat | Bonne réponse affichée | Réponse user affichée | Advance |
|---|---|---|---|
| **correct** | ✅ oui | non | auto (~2s) |
| **incorrect** | ✅ oui | ✅ oui | Next manuel |
| **skip** | ✅ oui | non | Next manuel |

## Critères d'acceptance

### Types et ports (Étape 1)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC1 | `MeaningStimulusKind` supporte 2 variantes : `visual` (texte japonais, taille adaptative) et `audio` (bouton play, replay illimité) | Unit | 1 |
| AC2 | `InteractionMode` supporte `qcm` (avec `choices`) et `free-input` (sans paramètre — le mode d'input est géré par `MultimodalInput`) | Unit | 1 |
| AC3 | `AnswerValidationApi` est un `Context.Tag` Effect avec méthode `validate(answer, expected) → Effect<AnswerResult>` | Unit | 1 |
| AC4 | `isSentence` est extrait dans un utilitaire partagé et SpeechRepeat l'importe depuis le nouvel emplacement | Unit | 1 |

### Composant MeaningExercise core + mode QCM (Étape 2)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC5 | En phase `answering` mode QCM, les boutons de choix sont affichés | Story | 2 |
| AC6 | Tap sur un bouton → `AnswerValidationApi.validate(selected, expected)` → feedback | Story | 2 |
| AC7 | Feedback correct : bonne réponse affichée, fond vert | Story | 2 |
| AC8 | Feedback incorrect : réponse user + bonne réponse affichées, bouton Next | Story | 2 |
| AC9 | `onResult` est appelé avec le bon `ExerciseOutcome` + `AnswerResult` | Story | 2 |

### Variantes stimulus par skill (Étape 3)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC10 | Stimulus `visual` : texte court (kanji isolé, mot) affiché en grand via `isSentence` | Story | 3 |
| AC11 | Stimulus `visual` : texte long (phrase) affiché en taille réduite via `isSentence` | Story | 3 |
| AC12 | Stimulus `audio` : bouton 🔊 play statique, replay illimité, reste actif pendant la réponse | Story | 3 |

### Refactoring MultimodalInput (Étape 4)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC13 | `MultimodalInput` retourne un `string` via `onAnswer` (au lieu d'un `AnswerResult` discriminé) | Unit | 4 |
| AC14 | En mode voix, `MultimodalInput` internalise le STT : blob → `SpeechToTextApi.transcribe` → string | Unit | 4 |
| AC15 | Skip vocal : "skip" détecté dans le transcript → `onSkip` callback | Unit | 4 |

### Mode free-input + MultimodalInput (Étape 5)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC16 | Mode free-input : `MultimodalInput` monté, `onAnswer(string)` → `AnswerValidationApi.validate` → feedback | Story | 5 |
| AC17 | `MultimodalInput` visible uniquement en mode `free-input`, invisible en mode QCM | Story | 5 |

### Build (Étape 6)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC18 | `pnpm build` compile sans erreur | CI | 6 |
| AC19 | `pnpm lint` passe sans erreur | CI | 6 |
| AC20 | Tests existants passent (non-régression) | CI | 6 |

## Étapes d'implémentation

### Étape 1 — Types, port AnswerValidationApi, extraction utilitaire

- [x] Extraire `isSentence` et `WORD_MAX_LENGTH` de `packages/exercises/src/logic/speech-repeat.ts` vers `packages/exercises/src/logic/stimulus-display.ts` → AC4
- [x] Mettre à jour l'import dans `speech-repeat.ts` pour utiliser le nouvel emplacement
- [x] Test : `isSentence` conserve le même comportement (migration du test existant) → AC4
- [x] Créer `packages/exercises/src/logic/meaning-exercise-config.ts` avec `MeaningStimulusKind`, `InteractionMode`, `Choice`, `MeaningExerciseConfig`, `MeaningExerciseResult` → AC1, AC2
- [x] Créer `packages/exercises/src/logic/answer-validation.ts` avec `AnswerResult`, `AnswerValidationApi` → AC3

### Étape 2 — Composant MeaningExercise core + mode QCM + stories

- [x] Créer `packages/exercises/src/components/meaning-exercise/meaning-exercise.tsx`
- [x] Implémenter le layout : stimulus en haut (persistant), interaction en bas → AC5
- [x] Implémenter le cycle answering → feedback → AC6
- [x] Implémenter le mode QCM : grille de boutons, tap → `AnswerValidationApi.validate` → feedback → AC6
- [x] Implémenter le feedback correct : bonne réponse affichée, fond vert → AC7
- [x] Implémenter le feedback incorrect : réponse user + bonne réponse, Next manuel → AC8
- [x] Implémenter l'appel `onResult` → AC9
- [x] Story `QCM2` : 2 choix, interactif (tap = correct ou incorrect selon le bouton) → AC5, AC6, AC7, AC8
- [x] Story `QCM4` : 4 choix, interactif → AC5, AC6, AC7, AC8

### Étape 3 — Variantes stimulus par skill + stories

- [ ] Implémenter le rendu `visual` : taille adaptative via `isSentence` → AC10, AC11
- [ ] Implémenter le rendu `audio` : bouton 🔊 play statique, replay illimité, actif pendant la réponse → AC12
- [ ] Story `Skill5_KanjiQCM2` : kanji 学 + QCM 2 choix → AC10
- [ ] Story `Skill5_KanjiQCM4` : kanji 犬 + QCM 4 choix → AC10
- [ ] Story `Skill6_AudioQCM4` : bouton play + QCM 4 choix → AC12
- [ ] Story `Skill8_WordQCM4` : mot 猫 + QCM 4 choix → AC10
- [ ] Story `Skill8_SentenceQCM4` : phrase 猫が好きです + QCM 4 choix → AC11

### Étape 4 — Refactoring MultimodalInput (retourne string, internalise STT)

- [ ] Créer `packages/exercises/src/logic/vocal/speech-to-text.ts` avec `SpeechToTextApi` → AC14
- [ ] Refactorer `MultimodalInput` : `onAnswer` retourne un `string` (plus de `AnswerResult` discriminé) → AC13
- [ ] En mode voix : blob → `SpeechToTextApi.transcribe` → string, internalisé dans `MultimodalInput` → AC14
- [ ] Implémenter le skip vocal : "skip" détecté dans le transcript → `onSkip` callback → AC15
- [ ] Mettre à jour les stories existantes de MultimodalInput
- [ ] Test : `MultimodalInput` retourne un string en mode clavier et en mode voix (via fake STT)

### Étape 5 — Mode free-input dans MeaningExercise + stories

- [ ] Intégrer `MultimodalInput` dans MeaningExercise : visible en `free-input`, invisible en `qcm` → AC16, AC17
- [ ] Wiring : `MultimodalInput.onAnswer(string)` → `AnswerValidationApi.validate` → feedback → AC16
- [ ] Story `Skill5_FreeInputKeyboard` : kanji + saisie clavier → AC16, AC17
- [ ] Story `Skill5_FreeInputVoice` : kanji + micro → AC16, AC17
- [ ] Story `Skill6_FreeInputKeyboard` : audio + saisie clavier → AC16
- [ ] Story `Skill8_FreeInputKeyboard` : texte + saisie clavier → AC16

### Étape 6 — Vérifications finales

- [ ] `pnpm build` sans erreur → AC18
- [ ] `pnpm lint` sans erreur → AC19
- [ ] Tests existants passent (non-régression) → AC20

## Hors scope

| Élément | Raison | Sprint prévu |
|---|---|---|
| Implémentation réelle STT (Web Speech API / Whisper) | Sprint 2 = composants Storybook isolés. Le port + fake suffisent. | Sprint 3 |
| Implémentation réelle AnswerValidation (fuzzy, IA) | Sprint 2 = exact match. La cascade exact → fuzzy → IA est Sprint 3. | Sprint 3 |
| Logique de génération des distracteurs (visuels vs sémantiques) | Passés en props mockés. La stratégie de génération est hors scope. | Sprint 3 |
| Progression QCM 2 → QCM 4 → input libre | Le moteur de recommandation décide du mode. Le composant reçoit la config. | Sprint 3 |
| Auto-advance timing (2s succès) | Comportement de session, géré par le parent (page session / DrillQueue orchestrateur) | Sprint 3 |
| Wiring avec DrillQueue en page session | L'US15 est un composant standalone en Storybook | Sprint 3 |
| Audio des mots / phrases (fichiers TTS ou enregistrements) | Le composant utilise `modelAudioSrc`. Vrais assets audio = Sprint 3 | Sprint 3 |
