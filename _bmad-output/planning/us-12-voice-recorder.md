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
| Où vit la logique | `packages/exercises/src/logic/audio/` pour les services et la VAD, `packages/exercises/src/components/voice-recorder/` pour le composant React | Séparation logique pure (testable en TDD) / composant UI (développé avec stories). |

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
  readonly getTimeDomainData: () => Uint8Array
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

### Logique VAD

| # | Critère | Type | Étape |
|---|---|---|---|
| AC1 | `detectSpeech` retourne `{ kind: "none" }` quand le volume moyen est sous le seuil | Unit | 1 |
| AC2 | `detectSpeech` retourne `{ kind: "speechStart" }` quand le volume dépasse le seuil pendant `speechMinDurationMs` | Unit | 1 |
| AC3 | `detectSpeech` retourne `{ kind: "speechEnd" }` quand le volume repasse sous le seuil pendant `silenceMinDurationMs` | Unit | 1 |
| AC4 | Un bruit court (< `speechMinDurationMs`) ne déclenche pas `speechStart` (anti-rebond) | Unit | 1 |
| AC5 | `initialState` a `isSpeaking: false` et les timestamps à `Option.none()` | Unit | 1 |
| AC6 | `defaultConfig` a des valeurs sensibles (volumeThreshold ~30, speechMinDurationMs ~150, silenceMinDurationMs ~400) | Unit | 1 |
| AC6b | Une parole de 150ms (kana isolé) au-dessus du seuil déclenche `speechStart` | Unit | 1 |

### Browser APIs (services Effect)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC7 | `MicrophoneApi.acquire` appelle `getUserMedia({ audio: true })` et retourne le `MediaStream` | Unit | 2 |
| AC8 | `MicrophoneApi.acquire` retourne `MicrophoneError({ reason: "permission-denied" })` si l'utilisateur refuse | Unit | 2 |
| AC9 | `MicrophoneApi.release` arrête toutes les tracks du `MediaStream` | Unit | 2 |
| AC10 | `AudioAnalyserApi.create` retourne un `AnalyserHandle` dont `getFrequencyData` produit un `Uint8Array` | Unit | 2 |
| AC11 | `MediaRecorderApi.start` démarre l'enregistrement, `stop` retourne un `Blob` audio | Unit | 2 |

### Composant VoiceRecorder

| # | Critère | Type | Étape |
|---|---|---|---|
| AC12 | En état `listening`, l'icône `Mic` est affichée avec animation pulse et la waveform est animée | Story | 3 |
| AC13 | En état `processing`, l'icône `LoaderCircle` est affichée et la waveform est figée | Story | 3 |
| AC14 | En état `paused`, l'icône `MicOff` est affichée et la waveform est absente (ligne plate) | Story | 3 |
| AC15 | Quand la VAD détecte un début de parole, `onSpeechStart` est appelé | Story | 3 |
| AC16 | Quand la VAD détecte une fin de parole, `onSpeechEnd(blob)` est appelé avec le `Blob` enregistré | Story | 3 |
| AC17 | Quand l'accès micro échoue, `onError` est appelé et un message d'erreur est affiché | Story | 3 |
| AC18 | Le `MediaStream` est acquis au mount et releasé au unmount (pas de fuite) | Story | 3 |

### Stories Storybook

| # | Critère | Type | Étape |
|---|---|---|---|
| AC19 | Story `Default` : vrai micro, waveform temps réel, VAD active, transitions listening → processing → listening observables | Story | 3 |
| AC20 | Story `Paused` : démarre en état paused, bouton pour basculer en listening | Story | 3 |
| AC21 | Story `PermissionDenied` : fake `MicrophoneApi` qui refuse la permission, message d'erreur visible | Story | 3 |
| AC22 | Story `SimulatedWaveform` : fake `AudioAnalyserApi` avec données sinusoïdales, pour review design sans micro | Story | 3 |

### Build

| # | Critère | Type | Étape |
|---|---|---|---|
| AC23 | `pnpm build` compile sans erreur | CI | 4 |
| AC24 | `pnpm lint` passe sans erreur | CI | 4 |

## Étapes d'implémentation

### Étape 1 — Logique VAD (TDD pur)

- [ ] Créer `packages/exercises/src/logic/audio/detect-speech.ts` avec les types `SpeechDetectorConfig`, `SpeechDetectorState`, `SpeechEvent`
- [ ] Test RED : volume sous le seuil → `{ kind: "none" }` → AC1
- [ ] GREEN : implémenter le calcul de volume moyen et la comparaison au seuil
- [ ] Test RED : volume au-dessus du seuil pendant `speechMinDurationMs` → `{ kind: "speechStart" }` → AC2
- [ ] GREEN : implémenter la détection de début de parole avec debounce
- [ ] Test RED : volume sous le seuil pendant `silenceMinDurationMs` après parole → `{ kind: "speechEnd" }` → AC3
- [ ] GREEN : implémenter la détection de fin de parole
- [ ] Test RED : bruit court (< `speechMinDurationMs`) → pas de `speechStart` → AC4
- [ ] GREEN : vérifier que le debounce filtre les bruits courts
- [ ] Test RED : parole de 150ms (kana isolé) au-dessus du seuil → `speechStart` déclenché → AC6b
- [ ] GREEN : vérifier que le seuil de durée minimum est assez bas pour un kana
- [ ] Test : `initialState` a les bonnes valeurs par défaut → AC5
- [ ] Test : `defaultConfig` a des valeurs sensibles (speechMinDurationMs ~150ms) → AC6
- [ ] REFACTOR

### Étape 2 — Browser APIs (services Effect)

- [ ] Créer `packages/exercises/src/logic/audio/microphone.ts` avec `MicrophoneApi`, `MicrophoneError`, `BrowserMicrophoneApiLive`
- [ ] Test RED : `acquire` avec fake `getUserMedia` → retourne le `MediaStream` → AC7
- [ ] Test RED : `acquire` avec fake `getUserMedia` qui rejette → retourne `MicrophoneError` → AC8
- [ ] GREEN : implémenter le service et le layer navigateur
- [ ] Test RED : `release` arrête les tracks → AC9
- [ ] GREEN
- [ ] Créer `packages/exercises/src/logic/audio/audio-analyser.ts` avec `AudioAnalyserApi`, `AnalyserHandle`, `BrowserAudioAnalyserApiLive`
- [ ] Test RED : `create` retourne un `AnalyserHandle` fonctionnel → AC10
- [ ] GREEN
- [ ] Créer `packages/exercises/src/logic/audio/media-recorder.ts` avec `MediaRecorderApi`, `RecorderHandle`, `BrowserMediaRecorderApiLive`
- [ ] Test RED : `start` + `stop` produit un `Blob` → AC11
- [ ] GREEN
- [ ] REFACTOR

### Étape 3 — Composant VoiceRecorder + Stories (développement conjoint)

- [ ] Créer `packages/exercises/src/components/voice-recorder/voice-recorder.tsx`
- [ ] Créer `packages/exercises/src/components/voice-recorder/waveform.tsx` (canvas de visualisation)
- [ ] Créer `packages/exercises/src/components/voice-recorder/status-icon.tsx` (icône Lucide + animation)
- [ ] Story `Default` : vrai micro, layer browser, waveform live → AC12, AC15, AC16, AC19
- [ ] Implémenter l'acquisition du `MediaStream` au mount et le release au unmount → AC18
- [ ] Implémenter le rendu waveform via `requestAnimationFrame` + `getFrequencyData` → AC12
- [ ] Implémenter la boucle VAD : `requestAnimationFrame` → `detectSpeech` → events → callbacks → AC15, AC16
- [ ] Implémenter le `MediaRecorder` start/stop piloté par la VAD → AC16
- [ ] Implémenter l'icône d'état avec animation pulse en listening → AC12
- [ ] Story `Paused` : état paused initial, toggle listening → AC13, AC14, AC20
- [ ] Implémenter le gel de la waveform en processing et la ligne plate en paused → AC13, AC14
- [ ] Story `PermissionDenied` : fake `MicrophoneApi` → erreur → message affiché → AC17, AC21
- [ ] Story `SimulatedWaveform` : fake `AudioAnalyserApi` avec sin wave → AC22
- [ ] Exporter le composant depuis `packages/exercises/src/index.ts`

### Étape 4 — Vérifications finales

- [ ] `pnpm build` sans erreur → AC23
- [ ] `pnpm lint` sans erreur → AC24
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
