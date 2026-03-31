# US16 — OralProduction

## Résumé

Composant d'exercice sens → produire le japonais à voix haute (Skill 9). Le stimulus est le sens en anglais ; l'apprenant doit prononcer le mot ou la phrase en japonais via Speech Recognition. Micro obligatoire, pas de fallback clavier. Feedback succès : autoplay modèle + texte japonais affiché (récompense visuelle). Feedback échec : autoplay modèle + transcript ("You said: ..."), pas de texte japonais. Skip : autoplay modèle + 🔊 replay, Next manuel (pas d'auto-advance — sommet de la pyramide orale). Enrichissement de `AnswerResult` avec un cas `accepted` (validation IA) : quand le transcript ne matche pas exactement mais est sémantiquement valide (phrases), le feedback affiche le texte attendu ET le transcript, marqué comme succès.

**Sprint :** Sprint 2 — Exercise Core
**Dépendances :** US10 (DrillQueue + packages/exercises), US11 (SessionSummary), US12 (VoiceRecorder)
**Approche :** développement conjoint composant + stories pour l'UI, pas de logique pure à tester en TDD (le composant orchestre des ports existants)

## Décisions architecturales

| Question | Décision | Justification |
|---|---|---|
| Ports réutilisés | `SpeechRecognitionApi` (US14), `TextToSpeech` (US14), `VoiceRecorder` (US12) | OralProduction = SpeechRepeat inversé (sens → japonais au lieu de japonais → japonais). Mêmes mécanismes. |
| Nouveau port ? | Non. On enrichit `AnswerValidationApi` (US15) avec le cas `accepted`. Pas de nouveau port. | La cascade phonétique → IA utilise SpeechRecognitionApi pour le premier niveau + AnswerValidationApi pour le deuxième (phrases). |
| Enrichissement AnswerResult | Ajout du cas `accepted` dans `AnswerResult` (answer-validation.ts). MeaningExercise en bénéficiera aussi au Sprint 3 (Skill 6, phrases input libre). | Un seul type de résultat de validation pour tout le système. Paul confirme que c'est un oubli de l'US15. |
| Cascade de validation | 1. `SpeechRecognitionApi.recognize(blob, expected)` → `match` ? succès exact. 2. `mismatch` ? → `AnswerValidationApi.validate(transcript, expected)` → `accepted` (IA OK) ou `incorrect`. | Le port phonétique (SR) gère le premier niveau. Le port sémantique (AnswerValidation) gère le fallback IA. En Sprint 2, le fake AnswerValidation fait du exact match → les mismatches sont toujours `incorrect`. |
| Micro obligatoire | Pas de fallback clavier. Si micro indisponible, message explicatif (même pattern que Skill 1 dans SpeechRepeat). | Le Skill 9 est le sommet de la pyramide orale — la production vocale est le cœur de l'exercice. |
| Auto-advance | Succès (exact match et accepted) → auto-advance (~2s). Échec et skip → Next manuel. | Sommet de la pyramide, l'apprenant a besoin de temps pour digérer l'échec/skip. Mais le succès peut auto-advance car l'apprenant a réussi. |
| Texte japonais = récompense | Affiché uniquement en cas de succès (exact ou accepted). Jamais en cas d'échec ou skip. | Le texte japonais écrit est la carotte — ne pas le montrer en cas d'échec motive à réessayer. Pédagogiquement, l'apprenant doit d'abord réussir pour "débloquer" la forme écrite. |
| Mots vs phrases | Mots = exact match phonétique uniquement. Phrases = cascade exact → fuzzy → IA (Sprint 3). En Sprint 2, tout est exact match (fake). | Pour les mots, il n'y a pas d'ambiguïté. La validation IA ne concerne que les phrases. |
| Stimulus | Toujours `visual` : sens en anglais. Pas de mode audio, pas de variantes. | Le Skill 9 a un seul mode de stimulus (inverser la direction : montrer le sens, produire le japonais). |
| Où vit le composant | `packages/exercises/src/components/oral-production/` | Cohérent avec `speech-repeat/` et `meaning-exercise/`. |
| Footer échec | Extraction de `MismatchActionBar` (actuellement dans `speech-repeat.tsx`) vers un composant partagé. 3 éléments : 🔊 replay modèle (gauche), bouton Next (centre), 🎙️ replay enregistrement user (droite). | Même footer que SpeechRepeat — l'apprenant compare son audio avec le modèle. Évite la duplication. |

## Modèle

### Config

```ts
export interface OralProductionConfig {
  readonly meaning: string          // sens en anglais (stimulus)
  readonly expected: string         // texte japonais attendu (réponse + TTS via TextToSpeech.speak)
}
```

### AnswerResult enrichi (refactoring answer-validation.ts)

```ts
export type AnswerResult =
  | { readonly kind: "correct"; readonly expected: string }
  | { readonly kind: "accepted"; readonly userAnswer: string; readonly expected: string }
  | { readonly kind: "incorrect"; readonly userAnswer: string; readonly expected: string }
```

- `correct` — exact match phonétique ou textuel. Affiche `expected` uniquement.
- `accepted` — 🆕 transcript ≠ expected mais sémantiquement valide (IA). Affiche les deux.
- `incorrect` — ni exact ni IA-validé. Affiche les deux.

### Type de résultat émis

```ts
export type ExerciseOutcome = "success" | "failure" | "skip"

export interface OralProductionResult {
  readonly outcome: ExerciseOutcome
  readonly answerResult: Option.Option<AnswerResult>  // None pour skip
}
```

### Props du composant

```ts
export interface OralProductionProps {
  readonly config: OralProductionConfig
  readonly onResult: (result: OralProductionResult) => void
}
```

- `config` — configuration de l'exercice (sens, réponse attendue). Le TTS utilise `expected` directement via `TextToSpeech.speak`.
- `onResult` — appelé quand le verdict est rendu. Le parent (DrillQueue) gère l'advance.

## Design

### Cycle de vie

```
listening → (user speaks) → processing → validation → feedback → advance (auto ou manuel, géré par le parent)
```

Trois phases :
- `listening` — micro chaud (VoiceRecorder en état `listening`), sens en anglais affiché
- `processing` — reconnaissance en cours (VoiceRecorder en état `processing`)
- `feedback` — résultat affiché, autoplay modèle

### Flux de validation

```
Blob audio
  └→ SpeechRecognitionApi.recognize(blob, expected)
       ├→ match     → outcome: success, answerResult: correct
       ├→ mismatch  → AnswerValidationApi.validate(transcript, expected)
       │                ├→ accepted  → outcome: success, answerResult: accepted
       │                └→ incorrect → outcome: failure, answerResult: incorrect
       ├→ skip      → outcome: skip, answerResult: None
       └→ noise     → ignoré (micro reste chaud)
```

### Écrans

**Listening :**
```
┌─────────────────────────┐
│                         │
│      "to study"         │  ← sens en anglais, centré
│                         │
│   ┌─────────────────┐   │
│   │  🔴 waveform     │   │  ← VoiceRecorder, micro chaud
│   └─────────────────┘   │
│                         │
└─────────────────────────┘
```

**Feedback exact match (succès) :**
```
┌─────────────────────────┐
│                         │
│      "to study"         │  ← sens persiste
│                         │
│  ┌─────────────────┐    │
│  │ ✅  勉強する       │    │  ← texte japonais = récompense
│  └─────────────────┘    │
│                         │  ← auto-advance ~2s
└─────────────────────────┘
```

**Feedback accepted (IA validé, succès) :**
```
┌─────────────────────────┐
│                         │
│      "to study"         │  ← sens persiste
│                         │
│  ┌─────────────────┐    │
│  │ ✅  勉強する       │    │  ← texte attendu
│  │ 🎙️ "べんきょうを   │    │  ← transcript user
│  │     します"        │    │
│  └─────────────────┘    │
│                         │  ← auto-advance ~2s
└─────────────────────────┘
```

**Feedback incorrect (échec) :**
```
┌─────────────────────────┐
│                         │
│      "to study"         │  ← sens persiste
│                         │
│  ┌─────────────────┐    │
│  │ ❌ You said:      │    │
│  │ 🎙️ "たべる"       │    │  ← transcript, PAS de texte japonais
│  └─────────────────┘    │
│  🔊    [ Next → ]   🎙️  │  ← MismatchActionBar (replay modèle / Next / replay user)
└─────────────────────────┘
```

**Feedback skip :**
```
┌─────────────────────────┐
│                         │
│      "to study"         │  ← sens persiste
│                         │
│  ┌─────────────────┐    │
│  │ ⏭️ Skipped        │    │  ← pas de texte japonais
│  └─────────────────┘    │
│  🔊    [ Next → ]       │  ← modèle replay + Next (pas de replay user)
└─────────────────────────┘
```

### Tableau des feedbacks par résultat

| Résultat | Texte japonais affiché | Transcript affiché | Autoplay modèle | Advance |
|---|---|---|---|---|
| **exact match** | ✅ oui (récompense) | non | ✅ oui | auto (~2s) |
| **accepted (IA)** | ✅ oui (attendu) | ✅ oui ("You said: ...") | ✅ oui | auto (~2s) |
| **incorrect** | ❌ non | ✅ oui ("You said: ...") | ✅ oui | Next manuel |
| **skip** | ❌ non | non | ✅ oui + 🔊 replay | Next manuel |

## Critères d'acceptance

### Enrichissement AnswerResult (Étape 1)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC1 | `AnswerResult` supporte 3 variantes : `correct`, `accepted` (🆕), `incorrect` | Unit | 1 |
| AC2 | MeaningExercise compile et fonctionne avec le nouveau type (non-régression) | Story | 1 |
| AC3 | Stories MeaningExercise existantes passent sans modification | Story | 1 |

### Types et config OralProduction (Étape 2)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC4 | `OralProductionConfig` contient `meaning`, `expected`, `modelAudioSrc` | Unit | 2 |
| AC5 | `OralProductionResult` contient `outcome` (ExerciseOutcome) et `answerResult` (Option\<AnswerResult\>) | Unit | 2 |

### Composant OralProduction core + stories (Étape 3)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC6 | En phase `listening`, le sens en anglais est affiché et le VoiceRecorder est en état `listening` (micro chaud) | Story | 3 |
| AC7 | L'apprenant parle → blob envoyé à `SpeechRecognitionApi.recognize(blob, expected)` → transition vers `processing` puis `feedback` | Story | 3 |
| AC8 | `onResult` est appelé avec le bon `ExerciseOutcome` + `AnswerResult` | Story | 3 |

### Extraction MismatchActionBar (Étape 4)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC9 | `MismatchActionBar` extrait de `speech-repeat.tsx` vers un composant partagé (`packages/exercises/src/components/shared/`) | Unit | 4 |
| AC10 | SpeechRepeat importe `MismatchActionBar` depuis le nouvel emplacement — non-régression | Story | 4 |

### Feedback variants + autoplay (Étape 5)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC11 | Feedback succès (exact match) : texte japonais affiché (récompense), autoplay modèle | Story | 5 |
| AC12 | Feedback succès (accepted IA) : texte japonais attendu + transcript user affichés, autoplay modèle | Story | 5 |
| AC13 | Feedback échec : transcript affiché ("You said: ..."), PAS de texte japonais, autoplay modèle, `MismatchActionBar` (🔊 modèle / Next / 🎙️ user) | Story | 5 |
| AC14 | Feedback skip : pas de texte japonais, autoplay modèle, 🔊 replay modèle, bouton Next | Story | 5 |
| AC15 | Bruit de fond (SpeechResult `noise`) → ignoré, micro reste chaud, pas de transition vers feedback | Story | 5 |

### Build (Étape 6)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC16 | `pnpm build` compile sans erreur | CI | 6 |
| AC17 | `pnpm lint` passe sans erreur | CI | 6 |
| AC18 | Tests existants passent (non-régression) | CI | 6 |

## Étapes d'implémentation

### Étape 1 — Enrichissement AnswerResult (refactoring transversal)

- [x] Ajouter le cas `accepted` dans `AnswerResult` (`packages/exercises/src/logic/answer-validation.ts`) → AC1
- [x] Mettre à jour le fake `fakeAnswerValidation` pour supporter le cas `accepted` (pas de changement de comportement, le fake continue à faire du exact match) → AC1
- [x] Vérifier que MeaningExercise compile avec le nouveau type → AC2
- [x] Vérifier que les stories MeaningExercise existantes fonctionnent → AC3

### Étape 2 — Types et config OralProduction

- [x] Créer `packages/exercises/src/logic/oral-production-config.ts` avec `OralProductionConfig`, `OralProductionResult` → AC4, AC5
- [x] Exporter depuis `packages/exercises/src/index.ts`

### Étape 3 — Composant OralProduction core + stories

- [x] Créer `packages/exercises/src/components/oral-production/oral-production.tsx`
- [x] Implémenter le layout : sens en anglais en haut, VoiceRecorder en bas → AC6
- [x] Implémenter le flux : listening → processing → feedback → AC7
- [x] Wiring : blob → `SpeechRecognitionApi.recognize` → SpeechResult → mapping vers AnswerResult → AC7, AC8
- [x] Cascade de validation : si `mismatch` → `AnswerValidationApi.validate(transcript, expected)` → AC8
- [x] Appel `onResult` avec le résultat → AC8
- [x] Story `Word_Listening` : sens "cat" affiché, micro chaud → AC6
- [x] Story `Sentence_Listening` : sens "I like cats" affiché, micro chaud → AC6

### Étape 4 — Extraction MismatchActionBar

- [ ] Extraire `MismatchActionBar` de `speech-repeat.tsx` vers `packages/exercises/src/components/shared/mismatch-action-bar.tsx` → AC9
- [ ] Mettre à jour l'import dans `speech-repeat.tsx` → AC10
- [ ] Vérifier que les stories SpeechRepeat existantes fonctionnent (non-régression) → AC10

### Étape 5 — Feedback variants + stories

- [ ] Implémenter feedback exact match : texte japonais (récompense) + autoplay modèle → AC11
- [ ] Implémenter feedback accepted : texte attendu + transcript + autoplay modèle → AC12
- [ ] Implémenter feedback incorrect : transcript seul, PAS de texte japonais + autoplay + `MismatchActionBar` (🔊 modèle / Next / 🎙️ user) → AC13
- [ ] Implémenter feedback skip : pas de texte japonais + autoplay + 🔊 replay modèle + Next → AC14
- [ ] Réutiliser `useAutoplayFeedback` pour le déclenchement unique
- [ ] Gérer SpeechResult `noise` → ignoré, micro reste chaud → AC15
- [ ] Story `Word_ExactMatch` : fake SR retourne `match` → feedback succès avec 猫 affiché → AC11
- [ ] Story `Sentence_Accepted` : fake SR retourne `mismatch`, fake validation retourne `accepted` → feedback avec les deux textes → AC12
- [ ] Story `Word_Incorrect` : fake SR retourne `mismatch`, fake validation retourne `incorrect` → feedback sans texte japonais + MismatchActionBar → AC13
- [ ] Story `Word_Skip` : fake SR retourne `skip` → feedback skip avec replay → AC14
- [ ] Story `Word_Noise` : fake SR retourne `noise` → micro reste chaud, pas de transition → AC15

### Étape 6 — Vérifications finales

- [ ] `pnpm build` sans erreur → AC16
- [ ] `pnpm lint` sans erreur → AC17
- [ ] Tests existants passent (non-régression) → AC18

## Hors scope

| Élément | Raison | Sprint prévu |
|---|---|---|
| Implémentation réelle SpeechRecognition (Web Speech API) | Sprint 2 = composants Storybook isolés. Le port + fake suffisent. | Sprint 3 |
| Implémentation réelle AnswerValidation cascade (fuzzy + IA) | Sprint 2 = exact match. La cascade pour les phrases est Sprint 3. | Sprint 3 |
| Wiring avec DrillQueue en page session | L'US16 est un composant standalone en Storybook | Sprint 3 |
| Audio réel des mots / phrases | Le composant utilise `modelAudioSrc`. Vrais assets audio = Sprint 3 | Sprint 3 |
| Gestion micro indisponible (message explicatif) | Pattern identique au Skill 1 (US14). Si pas déjà factorisé, à faire au wiring Sprint 3. | Sprint 3 |
| Auto-advance timing (2s succès) | Comportement de session, géré par le parent (DrillQueue orchestrateur) | Sprint 3 |
