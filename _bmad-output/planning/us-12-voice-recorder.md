# US12 — VoiceRecorder

## Résumé

Composant micro always-on avec waveform animée (Web Audio `AnalyserNode`). Voice Activity Detection (VAD) automatique pour détecter le début et la fin de parole. Trois états visuels : listening (🔴 micro actif), processing (⏳ en attente de traitement), paused (⚫ grisé pendant le feedback). Seuil de confiance configurable pour ignorer le bruit de fond. Le composant produit un `Blob` audio et émet des events VAD — le Speech Recognition (transcription) sera wired dans les composants d'exercice (US14+).

**Sprint :** Sprint 2 — Exercise Core
**Dépendances :** US10 (DrillQueue + packages/exercises)
**Approche :** TDD (Red-Green-Refactor) pour la logique VAD, développement conjoint composant + stories pour l'UI

## Décisions architecturales

| Question | Décision | Justification |
|---|---|---|
| Scope US12 vs US14 | US12 = micro + waveform + VAD + recording blob. Speech Recognition (transcription) = US14+ | Le VoiceRecorder est un composant réutilisable indépendant de la transcription. Les skills vocaux wireront SR par-dessus. |
| Accès micro | `MicrophoneApi` (Context.Tag Effect) wrapant `navigator.mediaDevices.getUserMedia` | Pattern identique à `SpeechSynthesisApi` et `BlobUrlApi`. Permet de faker en test sans popup permission. |
| Waveform | `AudioAnalyserApi` (Context.Tag Effect) wrapant `AudioContext` + `AnalyserNode` | L'`AnalyserNode` fournit les données fréquentielles en temps réel. Service séparé car il crée un `AudioContext` (ressource à fermer proprement). |
| Enregistrement audio | `MediaRecorderApi` (Context.Tag Effect) wrapant `MediaRecorder` | Produit un `Blob` quand la VAD détecte la fin de parole. Le même `MediaStream` alimente l'analyser ET le recorder. |
| VAD | Logique pure dans `detect-speech.ts`, zéro dépendance browser | Entrée = `Uint8Array` (données fréquentielles), sortie = events `speechStart`/`speechEnd`. Testable en TDD pur. |
| Composant contrôlé | L'état (`listening`, `processing`, `paused`) est contrôlé par le parent via props | Le parent (SpeechRepeat, OralProduction...) gère la machine à états de l'exercice. Le VoiceRecorder est un rendu + une source d'events. |
| Indicateur d'état | Icônes Lucide (`Mic`, `LoaderCircle`, `MicOff`) + animation CSS | `lucide-react` déjà installé. Cohérent avec les icônes existantes (Volume2, Mic, Check). |
| Waveform visuelle | Barre horizontale de fréquences (~48px de hauteur) | Standard pour les apps de langue. Plus lisible qu'un cercle pulsant, plus de surface de feedback visuel. |
| Gestion erreurs | `MicrophonePermissionError` et `MicrophoneNotAvailableError` (Data.TaggedError) | Le parent peut réagir à l'erreur (afficher un message, désactiver l'exercice vocal). |
| Stories Storybook | Vrai micro par défaut, fakes uniquement pour les états non contrôlables (permission refusée) | Le test le plus utile est le test live avec vrai micro. Les fakes servent pour les edge cases. |
| Où vit la logique | `packages/exercises/src/logic/vocal/` pour les services et la VAD, `packages/exercises/src/components/voice-recorder/` pour le composant React | Séparation logique pure (testable en TDD) / composant UI (développé avec stories). |

## Modèle

### Browser APIs (Context.Tag)

```ts
// Accès au microphone
export class MicrophoneApi extends Context.Tag("MicrophoneApi")<
  MicrophoneApi,
  {
    readonly acquire: () => Effect<MediaStream, MicrophoneError>
    readonly release: (stream: MediaStream) => Effect<void>
  }
>() {}

export class MicrophoneError extends Data.TaggedError("MicrophoneError")<{
  readonly reason: "permission-denied" | "not-available" | "unknown"
  readonly message: string
}> {}
```

```ts
// Analyseur audio (waveform + données VAD)
export interface AnalyserHandle {
  readonly getFrequencyData: () => Uint8Array
  readonly close: () => void
}

export class AudioAnalyserApi extends Context.Tag("AudioAnalyserApi")<
  AudioAnalyserApi,
  {
    readonly create: (stream: MediaStream) => AnalyserHandle
  }
>() {}
```

```ts
// Enregistrement audio
export interface RecorderHandle {
  readonly stop: () => Effect<Blob>
}

export class MediaRecorderApi extends Context.Tag("MediaRecorderApi")<
  MediaRecorderApi,
  {
    readonly start: (stream: MediaStream) => Effect<RecorderHandle>
  }
>() {}
```

### Logique pure — VAD (detect-speech.ts)

```ts
export interface SpeechDetectorConfig {
  readonly volumeThreshold: number       // 0-255, seuil de volume pour considérer "parole"
  readonly speechMinDurationMs: number   // durée minimum de parole pour déclencher speechStart (~150ms — un kana isolé ≈ 100-200ms)
  readonly silenceMinDurationMs: number  // durée minimum de silence pour déclencher speechEnd (~400ms — évite de couper entre syllabes)
}

export interface SpeechDetectorState {
  readonly isSpeaking: boolean
  readonly speakingStartedAt: Option<number>   // timestamp
  readonly silenceStartedAt: Option<number>    // timestamp
}

export type SpeechEvent =
  | { readonly kind: "speechStart" }
  | { readonly kind: "speechEnd" }
  | { readonly kind: "none" }

// Fonction pure : données fréquentielles + état courant + timestamp → nouvel état + event
export declare const detectSpeech: (
  frequencyData: Uint8Array,
  state: SpeechDetectorState,
  now: number,
  config: SpeechDetectorConfig,
) => { readonly state: SpeechDetectorState; readonly event: SpeechEvent }

export declare const initialState: SpeechDetectorState

export declare const defaultConfig: SpeechDetectorConfig
```

### Props du composant

```ts
export type VoiceRecorderState = "listening" | "processing" | "paused"

export interface VoiceRecorderProps {
  readonly state: VoiceRecorderState
  readonly onSpeechStart: () => void
  readonly onSpeechEnd: (blob: Blob) => void
  readonly onError: (error: MicrophoneError) => void
}
```

- `state` — contrôlé par le parent. `listening` = micro actif + waveform animée. `processing` = waveform figée. `paused` = micro coupé, waveform absente.
- `onSpeechStart` — appelé quand la VAD détecte un début de parole (après `speechMinDurationMs`)
- `onSpeechEnd(blob)` — appelé quand la VAD détecte une fin de parole. Le `Blob` contient l'enregistrement audio.
- `onError` — appelé quand l'accès micro échoue (permission refusée, device absent)

### Flux de données

```
         getUserMedia
              │
              ▼
         MediaStream ──────────────────┐
              │                        │
              ▼                        ▼
      AudioAnalyserApi          MediaRecorderApi
              │                        │
              ▼                        │
    getFrequencyData()                 │
         │        │                    │
         ▼        ▼                    │
     Waveform    VAD                   │
     (rendu)   (logique pure)          │
                  │                    │
                  │ speechEnd ──► stop()
                  │                    │
                  │                    ▼
                  │                  Blob ──► onSpeechEnd(blob)
                  │
                  │ speechStart ──► start() + onSpeechStart()
```

## Design

### Écrans

**État listening (micro actif) :**
```
┌──────────────────────────────────────────┐
│  🎙️  ║▎▌█▌▎▍▎║▌█▌▎▍▎║▎▌▍▎▌║▎▍▎▌█▌▎║   │
└──────────────────────────────────────────┘
```

**État processing (en attente) :**
```
┌──────────────────────────────────────────┐
│  ⏳  ║▎▌█▌▎▍▎║▌█▌▎▍▎║▎▌▍▎▌║▎▍▎▌█▌▎║   │
└──────────────────────────────────────────┘
       (waveform figée sur le dernier frame)
```

**État paused (inactif) :**
```
┌──────────────────────────────────────────┐
│  🚫  ║─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─║   │
└──────────────────────────────────────────┘
       (waveform absente, ligne plate)
```

**État erreur (permission refusée) :**
```
┌──────────────────────────────────────────┐
│  🚫  Microphone access required          │
└──────────────────────────────────────────┘
```

### Layout

- Container : barre horizontale pleine largeur, hauteur fixe `48px`
- Icône d'état à gauche (Lucide `Mic` / `LoaderCircle` / `MicOff`), taille `20px`
- Waveform : remplit l'espace restant (`flex: 1`), dessinée via `<canvas>` ou SVG
- La waveform affiche ~64 barres verticales proportionnelles aux données fréquentielles
- Animation via `requestAnimationFrame` en état `listening`, figée en `processing`, absente en `paused`

### Tokens Panda CSS

| Élément | Token | Valeur |
|---|---|---|
| Fond container | `bg.subtle` | Légèrement surélevé |
| Border | `border.subtle` | Séparation légère |
| Border radius | `l2` | Cohérent design system |
| Height container | `48px` | Compact |
| Padding interne | `px: "3"` | Aéré horizontalement |
| Gap icône/waveform | `gap: "3"` | Espacement standard |
| Waveform barres listening | `colorPalette.solid` | Actif, couleur primaire |
| Waveform barres processing | `fg.muted` | En attente |
| Waveform barres/ligne paused | `fg.disabled` | Inactif |
| Icône listening | `colorPalette.9` | Micro actif, couleur primaire |
| Icône processing | `fg.muted` | ⏳ traitement |
| Icône paused | `fg.disabled` | ⚫ inactif |
| Icône erreur | `fg.disabled` | 🚫 erreur |
| Texte erreur | `fg.muted`, `fontSize: "sm"` | Message discret |
| Animation pulse listening | `@keyframes pulse` | Pulsation douce sur l'icône micro (opacity 0.6 → 1, couleur primaire) |

### Icônes Lucide

| État | Icône | Import |
|---|---|---|
| listening | `Mic` | `import { Mic } from "lucide-react"` |
| processing | `LoaderCircle` | `import { LoaderCircle } from "lucide-react"` |
| paused | `MicOff` | `import { MicOff } from "lucide-react"` |
| error | `MicOff` | Même icône, contexte différent |

### Structure du composant

```
VoiceRecorder (styled div, flexDirection: "row", alignItems: "center", h: "48px")
├── StatusIcon (Mic / LoaderCircle / MicOff, animation pulse si listening)
├── Waveform (canvas flex: 1, h: "100%")
│   └── requestAnimationFrame loop → getFrequencyData → drawBars
└── (si error) Text message d'erreur à la place de la waveform
```

## Critères d'acceptance

### Autorisation micro (Step 1)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC1 | `MicrophoneApi.acquire` appelle `getUserMedia({ audio: true })` et retourne le `MediaStream` | Unit | 1 |
| AC2 | `MicrophoneApi.acquire` retourne `MicrophoneError({ reason: "permission-denied" })` si l'utilisateur refuse | Unit | 1 |
| AC3 | `MicrophoneApi.acquire` retourne `MicrophoneError({ reason: "not-available" })` si le device est absent | Unit | 1 |
| AC4 | `MicrophoneApi.release` arrête toutes les tracks du `MediaStream` | Unit | 1 |

### Écoute audio (Step 2)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC5 | `AudioAnalyserApi.create` branche le `MediaStream` sur un `AnalyserNode` et retourne un `AnalyserHandle` | Unit | 2 |
| AC6 | `AnalyserHandle.getFrequencyData` retourne un `Uint8Array` de données fréquentielles | Unit | 2 |
| AC7 | `AnalyserHandle.close` ferme l'`AudioContext` proprement | Unit | 2 |

### Détection parole/silence (Step 3)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC8 | `detectSpeech` retourne `{ kind: "none" }` quand le volume moyen est sous le seuil | Unit | 3 |
| AC9 | `detectSpeech` retourne `{ kind: "speechStart" }` quand le volume dépasse le seuil pendant `speechMinDurationMs` | Unit | 3 |
| AC10 | `detectSpeech` retourne `{ kind: "speechEnd" }` quand le volume repasse sous le seuil pendant `silenceMinDurationMs` | Unit | 3 |
| AC11 | Un bruit court (< `speechMinDurationMs`) ne déclenche pas `speechStart` (anti-rebond) | Unit | 3 |
| AC12 | Une parole de 150ms (kana isolé) au-dessus du seuil déclenche `speechStart` | Unit | 3 |
| AC13 | `initialState` a `isSpeaking: false` et les timestamps à `Option.none()` | Unit | 3 |
| AC14 | `defaultConfig` a des valeurs sensibles (volumeThreshold ~30, speechMinDurationMs ~150, silenceMinDurationMs ~400) | Unit | 3 |

### Enregistrement audio (Step 4)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC15 | `MediaRecorderApi.start` démarre l'enregistrement sur un `MediaStream` | Unit | 4 |
| AC16 | `RecorderHandle.stop` arrête l'enregistrement et retourne un `Blob` audio | Unit | 4 |

### Orchestrateur VoiceCapture (Step 5)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC17 | Le service boucle sur les `frequencyData` et appelle `detectSpeech` à chaque frame | Unit | 5 |
| AC18 | Sur `speechStart`, le service démarre le `MediaRecorder` | Unit | 5 |
| AC19 | Sur `speechEnd`, le service stoppe le `MediaRecorder` et émet le `Blob` | Unit | 5 |
| AC20 | Le stream émet les `frequencyData` à chaque frame (pour la waveform) | Unit | 5 |
| AC21 | Les ressources (stream, analyser, recorder) sont acquises et libérées proprement | Unit | 5 |

### Composant VoiceRecorder (Step 6)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC22 | En état `listening`, l'icône `Mic` est affichée avec animation pulse et la waveform est animée | Story | 6 |
| AC23 | En état `processing`, l'icône `LoaderCircle` est affichée et la waveform est figée | Story | 6 |
| AC24 | En état `paused`, l'icône `MicOff` est affichée et la waveform est absente (ligne plate) | Story | 6 |
| AC25 | Quand la VAD détecte un début de parole, `onSpeechStart` est appelé | Story | 6 |
| AC26 | Quand la VAD détecte une fin de parole, `onSpeechEnd(blob)` est appelé avec le `Blob` enregistré | Story | 6 |
| AC27 | Quand l'accès micro échoue, `onError` est appelé et un message d'erreur est affiché | Story | 6 |
| AC28 | Le `MediaStream` est acquis au mount et releasé au unmount (pas de fuite) | Story | 6 |

### Stories Storybook (Step 6)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC29 | Story `Default` : vrai micro, waveform temps réel, VAD active, transitions listening → processing → listening observables | Story | 6 |
| AC30 | Story `Paused` : démarre en état paused, bouton pour basculer en listening | Story | 6 |
| AC31 | Story `PermissionDenied` : fake `MicrophoneApi` qui refuse la permission, message d'erreur visible | Story | 6 |
| AC32 | Story `SimulatedWaveform` : fake `AudioAnalyserApi` avec données sinusoïdales, pour review design sans micro | Story | 6 |

### Build (Step 7)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC33 | `pnpm build` compile sans erreur | CI | 7 |
| AC34 | `pnpm lint` passe sans erreur | CI | 7 |

## Étapes d'implémentation

### Étape 1 — Autorisation micro (`MicrophoneApi`)

- [x] Créer `packages/exercises/src/logic/vocal/microphone.ts` avec `MicrophoneApi`, `MicrophoneError`
- [x] Test RED : `acquire` avec fake `getUserMedia` → retourne le `MediaStream` → AC1
- [x] GREEN : implémenter le layer browser (`BrowserMicrophoneApiLive`)
- [x] Test RED : `acquire` avec fake `getUserMedia` qui rejette `NotAllowedError` → `MicrophoneError({ reason: "permission-denied" })` → AC2
- [x] GREEN
- [x] Test RED : `acquire` avec fake `getUserMedia` qui rejette `NotFoundError` → `MicrophoneError({ reason: "not-available" })` → AC3
- [x] GREEN
- [x] Test RED : `release` arrête les tracks du `MediaStream` → AC4
- [x] GREEN
- [x] REFACTOR

### Étape 2 — Écoute audio (`AudioAnalyserApi`)

- [x] Créer `packages/exercises/src/logic/vocal/audio-analyser.ts` avec `AudioAnalyserApi`, `AnalyserHandle`
- [x] Test RED : `create(stream)` retourne un `AnalyserHandle` → AC5
- [x] GREEN : implémenter le layer browser (`BrowserAudioAnalyserApiLive`)
- [x] Test RED : `getFrequencyData()` retourne un `Uint8Array` → AC6
- [x] GREEN
- [x] Test RED : `close()` ferme l'`AudioContext` → AC7
- [x] GREEN
- [x] REFACTOR

### Étape 3 — Détection parole/silence (`detectSpeech`, TDD pur)

- [x] Créer `packages/exercises/src/logic/vocal/detect-speech.ts` avec les types `SpeechDetectorConfig`, `SpeechDetectorState`, `SpeechEvent`
- [x] Test RED : volume sous le seuil → `{ kind: "none" }` → AC8
- [x] GREEN : implémenter le calcul de volume moyen et la comparaison au seuil
- [x] Test RED : volume au-dessus du seuil pendant `speechMinDurationMs` → `{ kind: "speechStart" }` → AC9
- [x] GREEN : implémenter la détection de début de parole avec debounce
- [x] Test RED : volume sous le seuil pendant `silenceMinDurationMs` après parole → `{ kind: "speechEnd" }` → AC10
- [x] GREEN : implémenter la détection de fin de parole
- [x] Test RED : bruit court (< `speechMinDurationMs`) → pas de `speechStart` → AC11
- [x] GREEN : vérifier que le debounce filtre les bruits courts
- [x] Test RED : parole de 150ms (kana isolé) au-dessus du seuil → `speechStart` déclenché → AC12
- [x] GREEN
- [x] Test : `initialState` a les bonnes valeurs par défaut → AC13
- [x] Test : `defaultConfig` a des valeurs sensibles (speechMinDurationMs ~150ms) → AC14
- [x] REFACTOR

### Étape 4 — Enregistrement audio (`MediaRecorderApi`)

- [x] Créer `packages/exercises/src/logic/vocal/media-recorder.ts` avec `MediaRecorderApi`, `RecorderHandle`
- [x] Test RED : `start(stream)` démarre l'enregistrement → AC15
- [x] GREEN : implémenter le layer browser (`BrowserMediaRecorderApiLive`)
- [x] Test RED : `stop()` retourne un `Blob` audio → AC16
- [x] GREEN
- [x] REFACTOR

### Étape 5 — Orchestrateur (`VoiceCaptureService`)

- [x] Créer `packages/exercises/src/logic/vocal/voice-capture.ts` avec `VoiceCaptureService`, `VoiceCaptureEvent`
- [x] Test RED : le service émet des `frequencyData` à chaque frame quand le stream est actif → AC17, AC20
- [x] GREEN : implémenter la boucle `getFrequencyData` → `detectSpeech` → emit
- [x] Test RED : sur `speechStart`, le `MediaRecorder` est démarré → AC18
- [x] GREEN
- [x] Test RED : sur `speechEnd`, le `MediaRecorder` est stoppé et un `Blob` est émis → AC19
- [x] GREEN
- [x] Test RED : les ressources sont libérées quand le stream se termine → AC21
- [x] GREEN
- [x] REFACTOR

### Étape 6 — Composant VoiceRecorder + Stories

- [x] Créer `packages/exercises/src/components/voice-recorder/voice-recorder.tsx`
- [x] Créer `packages/exercises/src/components/voice-recorder/waveform.tsx` (canvas de visualisation)
- [x] Créer `packages/exercises/src/components/voice-recorder/status-icon.tsx` (icône Lucide + animation)
- [x] Story `Default` : vrai micro, layer browser, waveform live → AC22, AC25, AC26, AC29
- [x] Implémenter la consommation du `VoiceCaptureService` : `frequencyData` → waveform, events → callbacks → AC25, AC26
- [x] Implémenter l'acquisition du `MediaStream` au mount et le release au unmount → AC28
- [x] Implémenter l'icône d'état avec animation pulse en listening → AC22
- [x] Story `Paused` : état paused initial, toggle listening → AC23, AC24, AC30
- [x] Implémenter le gel de la waveform en processing et la ligne plate en paused → AC23, AC24
- [x] Story `PermissionDenied` : fake `MicrophoneApi` → erreur → message affiché → AC27, AC31
- [x] Story `SimulatedWaveform` : fake `AudioAnalyserApi` avec sin wave → AC32
- [x] Exporter le composant depuis `packages/exercises/src/index.ts`

### Étape 7 — Vérifications finales

- [ ] `pnpm build` sans erreur → AC33
- [ ] `pnpm lint` sans erreur → AC34
- [ ] Tests existants passent (non-régression)

## Hors scope

| Élément | Raison | Sprint prévu |
|---|---|---|
| Speech Recognition (transcription) | Le VoiceRecorder produit un Blob audio. La transcription sera wired dans US14 (SpeechRepeat) et les autres composants d'exercice | US14+ |
| Seuil de confiance SR | Concerne la transcription, pas l'enregistrement | US14+ |
| Changement de device mid-session | Edge case mineur, gérable au Sprint 3 | Sprint 3 |
| Timeout parole longue | Le parent gère la durée max de l'exercice | US14+ |
| Suppression du bruit de fond | Le seuil VAD filtre le bruit, pas de noise cancellation active | Sprint 4 |
| Wiring avec les composants d'exercice | Le VoiceRecorder est un composant standalone utilisé en Storybook | US14+ |
