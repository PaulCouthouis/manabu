# US14 — SpeechRepeat

## Résumé

Composant d'exercice écouter/voir → prononcer via Speech Recognition. Gère 5 skills : Skill 1 (audio syllabe → répéter, kana unlocked), Skill 2 (voir hiragana → prononcer), Skill 3 (voir katakana → prononcer, scaffolding し→シ + double passage via DrillQueue), Skill 4 (audio mot → répéter, word unlocked), Skill 7 (texte japonais → lire à voix haute, furigana conditionnel word/sentence). Micro always-on via VoiceRecorder (US12), autoplay modèle via TextToSpeech existant. Le composant consomme un port `SpeechRecognitionApi` (Effect service) qui retourne un verdict (match/mismatch/skip/noise) — l'implémentation réelle STT sera livrée au Sprint 3, un fake est fourni pour Storybook et tests.

**Sprint :** Sprint 2 — Exercise Core
**Dépendances :** US10 (DrillQueue + packages/exercises), US11 (SessionSummary), US12 (VoiceRecorder)
**Approche :** TDD pour la logique pure (types, port, fake), développement conjoint composant + stories pour l'UI

## Décisions architecturales

| Question | Décision | Justification |
|---|---|---|
| Composant unique vs multiple | Un seul composant `SpeechRepeat` paramétré par une config discriminée par skill | Les 5 skills partagent le même cycle listening → verdict → feedback. Les variantes sont des props. |
| Port Speech Recognition | `SpeechRecognitionApi` — `Context.Tag` Effect, méthode `recognize(blob, expected) → SpeechResult` | Le composant ne connaît pas l'implémentation STT. Le service reçoit le blob + la réponse attendue et retourne un verdict déjà tranché. |
| Verdict vs transcript+confidence | Le port retourne un verdict (`match/mismatch/skip/noise`), pas un transcript brut + score de confiance | La confiance et la normalisation sont des préoccupations du service STT (Sprint 3), pas du composant d'exercice. |
| Skip vocal | "skip" en anglais, détecté par le service STT | 「スキップ」est un mot de vocabulaire potentiel — collision. "skip" en anglais ne sera jamais confondu avec du japonais. |
| Normalisation transcript | Dans le service STT (Sprint 3), pas dans le composant | は/わ, おう/おお, っ/つ — c'est de la linguistique computationnelle, pas de l'UI. |
| Double passage scaffolding | Géré par DrillQueue (US10) — le composant lit `withScaffolding` du `DrillItem` | `DrillQueue.makeWithScaffolding` + `succeedQueue` gèrent déjà le recyclage sans scaffolding. |
| VoiceRecorder pendant feedback | **Caché** (démonté), pas grisé | Le micro est inutile pendant le feedback. Le démonter coupe proprement le micro et libère de l'espace vertical. |
| Stimulus visual-first pendant feedback | Reste affiché | Le stimulus visuel (kana, texte) est l'ancre de l'exercice — l'apprenant le regarde pendant le feedback. |
| Auto-advance | Comportement de session — le composant émet `onResult`, le parent gère le timing | Le composant ne connaît pas la notion de "prochain item". |
| Récompenses (KanaUnlocked, WordUnlocked) | Slots (children/render props) — implémentation réelle = US20 | L'US14 prévoit l'emplacement, l'US20 fournit les animations. |
| Replay audio apprenant sur skip | **Non disponible** | Sur un skip, l'apprenant n'a rien dit de correct — pas d'enregistrement pertinent à réécouter. |
| Où vit le composant | `packages/exercises/src/components/speech-repeat/` | Cohérent avec la structure `packages/exercises/src/components/`. |
| Où vit le port STT | `packages/exercises/src/logic/vocal/speech-recognition.ts` | Proche des autres services vocaux (microphone, voice-capture, detect-speech). |

## Modèle

### Port Speech Recognition

```ts
export type SpeechResult =
  | { readonly kind: "match"; readonly transcript: string; readonly audio: Blob }
  | { readonly kind: "mismatch"; readonly transcript: string; readonly audio: Blob }
  | { readonly kind: "skip" }
  | { readonly kind: "noise" }

export class SpeechRecognitionApi extends Context.Tag("SpeechRecognitionApi")<
  SpeechRecognitionApi,
  {
    readonly recognize: (
      blob: Blob,
      expected: string
    ) => Effect.Effect<SpeechResult>
  }
>() {}
```

- `match` et `mismatch` portent le transcript (pour affichage "You said: ...") et le Blob audio (pour le replay 🎙️ apprenant)
- `skip` et `noise` ne portent rien — pas de transcript, pas d'audio apprenant

### Fake pour Storybook / tests

```ts
export const fakeSpeechRecognition = (result: SpeechResult) => {
  return Layer.succeed(SpeechRecognitionApi, {
    recognize: (_blob: Blob, _expected: string) => {
      return Effect.succeed(result)
    },
  })
}
```

### Config par skill

```ts
export type StimulusKind =
  | { readonly mode: "audio" }
  | { readonly mode: "visual-kana"; readonly kana: string }
  | { readonly mode: "visual-kana-scaffolding"; readonly hint: string; readonly kana: string }
  | { readonly mode: "visual-text"; readonly text: string }
  | { readonly mode: "visual-text-furigana"; readonly text: string; readonly reading: string }

export type RewardKind = "kana-unlocked" | "word-unlocked" | "none"

export interface SpeechRepeatConfig {
  readonly stimulus: StimulusKind
  readonly expected: string
  readonly reward: RewardKind
  readonly modelAudioSrc: string
}
```

### Type de résultat émis

```ts
export type ExerciseOutcome = "success" | "failure" | "skip"

export interface ExerciseResult {
  readonly outcome: ExerciseOutcome
  readonly speechResult: SpeechResult
}
```

### Props du composant

```ts
export interface SpeechRepeatProps {
  readonly config: SpeechRepeatConfig
  readonly onResult: (result: ExerciseResult) => void
  readonly renderReward?: () => React.ReactNode
}
```

- `config` — configuration de l'exercice (stimulus, réponse attendue, type de récompense, audio modèle)
- `onResult` — appelé quand le verdict est rendu. Le parent (page session / DrillQueue) gère l'advance.
- `renderReward` — slot optionnel pour l'animation de récompense (US20). Si absent, affiche un simple ✅.

## Design

### Cycle de vie

```
listening → verdict reçu → feedback (VoiceRecorder caché) → advance (auto ou manuel, géré par le parent)
```

Le composant a deux phases : `listening` (VoiceRecorder monté) et `feedback` (VoiceRecorder démonté).

### Deux modes de stimulus

| Mode | Skills | Stimulus |
|---|---|---|
| **Audio-first** | 1, 4 | Bouton 🔊 replay, pas de visuel initial |
| **Visual-first** | 2, 3, 7 | Élément visuel centré, reste affiché pendant le feedback |

### Écrans — Audio-first (Skills 1, 4)

**Listening :**
```
┌─────────────────────────┐
│                         │
│      🔊 (play btn)      │  ← autoplay au chargement, replay au tap
│                         │
│                         │
│   ┌─────────────────┐   │
│   │  🔴 waveform     │   │  ← VoiceRecorder always-on
│   └─────────────────┘   │
└─────────────────────────┘
```

**Match (succès) :**
```
┌─────────────────────────┐
│                         │
│      🔊 (replay)        │
│                         │
│    ┌───────────────┐    │
│    │  か / 猫       │    │  ← slot récompense (US20)
│    └───────────────┘    │
│                         │
└─────────────────────────┘
```

**Mismatch (échec) :**
```
┌─────────────────────────┐
│                         │
│   🔊 modèle  🎙️ tien    │  ← 2 boutons replay distincts
│                         │
│   "You said: が"         │  ← transcript
│                         │
│         [ Next → ]      │
└─────────────────────────┘
```

**Skip :**
```
┌─────────────────────────┐
│                         │
│      🔊 modèle          │  ← autoplay modèle, pas de 🎙️
│                         │
└─────────────────────────┘
```

### Écrans — Visual-first (Skills 2, 3, 7)

**Skill 2 — Listening :**
```
┌─────────────────────────┐
│                         │
│         き               │  ← hiragana grand, centré
│                         │
│   ┌─────────────────┐   │
│   │  🔴 waveform     │   │
│   └─────────────────┘   │
└─────────────────────────┘
```

**Skill 3 — Listening (avec scaffolding) :**
```
┌─────────────────────────┐
│                         │
│      し → シ             │  ← hint + cible = un seul bloc centré
│                         │
│   ┌─────────────────┐   │
│   │  🔴 waveform     │   │
│   └─────────────────┘   │
└─────────────────────────┘
```

**Skill 3 — Listening (sans scaffolding, 2e passage) :**
```
┌─────────────────────────┐
│                         │
│         シ               │  ← katakana seul
│                         │
│   ┌─────────────────┐   │
│   │  🔴 waveform     │   │
│   └─────────────────┘   │
└─────────────────────────┘
```

**Skill 7 — Listening (word + furigana scaffolding) :**
```
┌─────────────────────────┐
│                         │
│       ねこ               │
│       猫                │  ← ruby furigana au-dessus
│                         │
│   ┌─────────────────┐   │
│   │  🔴 waveform     │   │
│   └─────────────────┘   │
└─────────────────────────┘
```

**Skill 7 — Listening (sentence, jamais de furigana) :**
```
┌─────────────────────────┐
│                         │
│  猫が好きです            │  ← phrase kanji, taille adaptée
│                         │
│   ┌─────────────────┐   │
│   │  🔴 waveform     │   │
│   └─────────────────┘   │
└─────────────────────────┘
```

**Visual-first — Mismatch (échec, ex. Skill 2) :**
```
┌─────────────────────────┐
│                         │
│         き               │  ← stimulus reste visible
│                         │
│   🔊 modèle  🎙️ tien    │
│   "You said: ぎ"         │
│                         │
│         [ Next → ]      │
└─────────────────────────┘
```

**Visual-first — Skip (ex. Skill 3 scaffolding) :**
```
┌─────────────────────────┐
│                         │
│      し → シ             │  ← stimulus reste visible
│                         │
│      🔊 modèle          │  ← pas de 🎙️
│                         │
└─────────────────────────┘
```

### Tableau des feedbacks par verdict

| Verdict | 🔊 Modèle | 🎙️ Apprenant | Transcript | Récompense | Stimulus visuel | Advance |
|---|---|---|---|---|---|---|
| **match** | autoplay + replay | replay | — | oui (Skill 1, 4) | reste (visual-first) | auto (~2s) |
| **mismatch** | autoplay + replay | replay | "You said: ..." | non | reste (visual-first) | Next manuel |
| **skip** | autoplay + replay | **non** | **non** | non | reste (visual-first) | auto |
| **noise** | — | — | — | — | — | ignoré |

## Critères d'acceptance

### Port et types (Étape 1)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC1 | `SpeechResult` est un type discriminé avec 4 variantes : `match`, `mismatch`, `skip`, `noise` | Unit | 1 |
| AC2 | `SpeechRecognitionApi` est un `Context.Tag` Effect avec méthode `recognize(blob, expected) → Effect<SpeechResult>` | Unit | 1 |
| AC3 | `fakeSpeechRecognition` retourne un Layer qui produit le `SpeechResult` passé en paramètre | Unit | 1 |
| AC4 | `SpeechRepeatConfig` supporte les 5 variantes de stimulus (audio, visual-kana, visual-kana-scaffolding, visual-text, visual-text-furigana) | Unit | 1 |

### Composant SpeechRepeat (Étape 2)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC5 | En phase `listening`, le VoiceRecorder est monté et actif | Story | 2 |
| AC6 | En phase `feedback`, le VoiceRecorder est **démonté** (pas grisé) | Story | 2 |
| AC7 | Audio-first (Skills 1, 4) : le stimulus est un bouton 🔊, autoplay au chargement | Story | 2 |
| AC8 | Visual-first (Skills 2, 3, 7) : le stimulus visuel est centré et reste affiché pendant le feedback | Story | 2 |
| AC9 | Sur `match` : autoplay modèle (~0.5s délai), slot récompense affiché (Skills 1, 4) ou ✅ (Skills 2, 3, 7) | Story | 2 |
| AC10 | Sur `mismatch` : autoplay modèle, 🔊 modèle + 🎙️ tien (2 boutons replay), transcript "You said: ..." affiché, bouton Next | Story | 2 |
| AC11 | Sur `skip` : autoplay modèle, 🔊 modèle uniquement (pas de 🎙️, pas de transcript) | Story | 2 |
| AC12 | Sur `noise` : ignoré, reste en phase `listening` | Story | 2 |
| AC13 | `onResult` est appelé avec le bon `ExerciseOutcome` + `SpeechResult` sur match/mismatch/skip | Story | 2 |

### Variantes par skill (Étape 3)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC14 | Skill 1 : stimulus audio, récompense `kana-unlocked` | Story | 3 |
| AC15 | Skill 2 : stimulus hiragana grand centré | Story | 3 |
| AC16 | Skill 3 avec scaffolding : stimulus `し → シ` (hint + cible = un seul bloc centré) | Story | 3 |
| AC17 | Skill 3 sans scaffolding : stimulus katakana seul | Story | 3 |
| AC18 | Skill 4 : stimulus audio, récompense `word-unlocked` | Story | 3 |
| AC19 | Skill 7 word + scaffolding : stimulus kanji avec furigana `<ruby>` | Story | 3 |
| AC20 | Skill 7 word sans scaffolding : stimulus kanji seul | Story | 3 |
| AC21 | Skill 7 sentence : stimulus phrase en kanji, pas de furigana | Story | 3 |

### Feedback et autoplay (Étape 4)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC22 | Autoplay modèle déclenché via TextToSpeech existant après chaque verdict (sauf noise) | Story | 4 |
| AC23 | Bouton 🔊 replay modèle fonctionne en phase feedback | Story | 4 |
| AC24 | Bouton 🎙️ replay apprenant fonctionne sur mismatch (joue le Blob audio du SpeechResult) | Story | 4 |
| AC25 | Transcript affiché sur mismatch : "You said: {transcript}" | Story | 4 |

### Build (Étape 5)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC26 | `pnpm build` compile sans erreur | CI | 5 |
| AC27 | `pnpm lint` passe sans erreur | CI | 5 |
| AC28 | Tests existants passent (non-régression) | CI | 5 |

## Étapes d'implémentation

### Étape 1 — Types, port SpeechRecognitionApi, fake

- [x] Créer `packages/exercises/src/logic/vocal/speech-recognition.ts` avec `SpeechResult`, `SpeechRecognitionApi`
- [x] ~Test : `fakeSpeechRecognition` retourne le verdict passé en paramètre~ → AC3 — pas de fake exporté, le Layer.succeed sera créé inline dans les stories. Pas de test (on testerait Layer.succeed d'Effect).
- [x] Créer `packages/exercises/src/logic/speech-repeat-config.ts` avec `StimulusKind`, `RewardKind`, `SpeechRepeatConfig`, `ExerciseOutcome`, `ExerciseResult`
- [x] ~Test : les types couvrent les 5 variantes de stimulus~ → AC4 — pas de test, ce sont des types purs (on testerait des constantes). Couvert par la compilation TypeScript.
- [x] ~Exporter depuis `packages/exercises/src/index.ts`~ — pas d'export pour l'instant, aucun consommateur externe. On exportera au Sprint 3 quand apps/web en aura besoin.

### Étape 2 — Composant SpeechRepeat core + stories de base

- [x] Créer `packages/exercises/src/components/speech-repeat/speech-repeat.tsx`
- [x] Implémenter le cycle listening → feedback avec montage/démontage VoiceRecorder → AC5, AC6
- [x] Implémenter le wiring VoiceCapture → SpeechRecognitionApi → ExerciseResult → AC13
- [x] Implémenter le rendu stimulus audio-first (bouton 🔊, autoplay au chargement) → AC7
- [x] Implémenter le rendu stimulus visual-first (élément centré, persiste en feedback) → AC8
- [x] Implémenter le feedback match (autoplay + récompense/✅) → AC9
- [x] Implémenter le feedback mismatch (autoplay + 🔊🎙️ + transcript + Next) → AC10
- [x] Implémenter le feedback skip (autoplay + 🔊 modèle seul, pas de 🎙️) → AC11
- [x] Implémenter le comportement noise (ignoré, reste en listening) → AC12
- [x] Story `AudioFirstMatch` : Skill 1 config, fake match → AC7, AC9
- [x] Story `AudioFirstMismatch` : Skill 1 config, fake mismatch → AC10
- [x] Story `VisualFirstMatch` : Skill 2 config, fake match → AC8, AC9
- [x] Story `VisualFirstMismatch` : Skill 2 config, fake mismatch → AC10

### Étape 3 — Variantes stimulus par skill + stories

- [x] Implémenter le rendu `visual-kana` (hiragana grand centré) → AC15
- [x] Implémenter le rendu `visual-kana-scaffolding` (hint し → シ, un seul bloc centré) → AC16
- [x] Implémenter le rendu `visual-text` (kanji/phrase centré) → AC21
- [x] Implémenter le rendu `visual-text-furigana` (ruby `<ruby>` au-dessus du kanji) → AC19
- [x] Story `Skill1_AudioSyllable` : stimulus audio, récompense kana-unlocked → AC14
- [x] Story `Skill2_Hiragana` : stimulus hiragana き → AC15
- [x] Story `Skill3_KatakanaScaffolding` : stimulus し → シ → AC16
- [x] Story `Skill3_KatakanaNoScaffolding` : stimulus シ seul → AC17
- [x] Story `Skill4_AudioWord` : stimulus audio, récompense word-unlocked → AC18
- [x] Story `Skill7_WordFurigana` : stimulus 猫 avec furigana ねこ → AC19
- [x] Story `Skill7_WordNoFurigana` : stimulus 猫 seul → AC20
- [x] Story `Skill7_Sentence` : stimulus 猫が好きです → AC21

### Étape 4 — Feedback autoplay et replays

- [ ] Implémenter l'autoplay modèle via TextToSpeech existant (~0.5s délai) → AC22
- [ ] Implémenter le bouton 🔊 replay modèle → AC23
- [ ] Implémenter le bouton 🎙️ replay apprenant (joue le Blob via BlobUrlApi) → AC24
- [ ] Implémenter l'affichage transcript "You said: {transcript}" → AC25
- [ ] Story `FeedbackAutoplay` : vérifier l'autoplay modèle sur match/mismatch/skip
- [ ] Story `FeedbackReplay` : vérifier les boutons replay modèle et apprenant
- [ ] Story `FeedbackSkipNoUserAudio` : vérifier l'absence de 🎙️ et transcript sur skip

### Étape 5 — Vérifications finales

- [ ] `pnpm build` sans erreur → AC26
- [ ] `pnpm lint` sans erreur → AC27
- [ ] Tests existants passent (non-régression) → AC28

## Hors scope

| Élément | Raison | Sprint prévu |
|---|---|---|
| Implémentation réelle STT (Web Speech API / Whisper) | Sprint 2 = composants Storybook isolés. Le port + fake suffisent. | Sprint 3 |
| Normalisation transcript japonais (は/わ, おう/おお, っ/つ) | Responsabilité du service STT, pas du composant | Sprint 3 |
| Seuil de confiance SR | Responsabilité du service STT, pas du composant | Sprint 3 |
| Animations KanaUnlocked / WordUnlocked | Slots prévus, implémentation réelle = US20 | US20 |
| Auto-advance timing (2s succès, auto skip) | Comportement de session, géré par le parent (page session / DrillQueue orchestrateur) | Wiring Sprint 3 |
| Audio des syllabes / mots (fichiers TTS ou enregistrements) | Le composant utilise TextToSpeech existant. Vrais assets audio = Sprint 3 | Sprint 3 |
| Wiring avec DrillQueue en page session | L'US14 est un composant standalone en Storybook | Sprint 3 |
