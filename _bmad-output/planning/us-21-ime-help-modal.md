# US21 — IMEHelpModal

## Résumé

Modale d'aide à l'installation et l'utilisation du clavier japonais (IME). Détection automatique du device (iOS / Android / macOS / Windows / ChromeOS) via User Agent. Contenu statique en markdown par plateforme (installation + utilisation). Device `"unknown"` → sélecteur de plateforme avec les 5 options. Auto-affichage au premier lancement Skill 10 (prop `autoOpen`, wiring localStorage au Sprint 3). Bouton ⌨️ Help permanent dans WrittenProduction (même position que le 💡 de FillInTheBlank). Réutilise Dialog Park UI + `react-markdown` (même pattern que MicroLesson US19).

**Sprint :** Sprint 2 — Exercise Core
**Dépendances :** US17 (WrittenProduction — fournit l'emplacement du bouton ⌨️ Help)
**Approche :** TDD sur `detectDevice` d'abord, puis fichiers markdown, puis composant standalone, puis intégration WrittenProduction

## Décisions architecturales

| Question | Décision | Justification |
|---|---|---|
| Détection device | Fonction pure `detectDevice(ua: string) → DeviceType` | Testable en TDD, pas de dépendance browser. |
| Accès User Agent | `UserAgentApi` — Context.Tag Effect dans `logic/user-agent.ts` avec `BrowserUserAgentApiLive` et fake pour tests/stories | Même pattern que `BlobUrlApi`. Les stories simulent chaque device sans toucher au vrai `navigator.userAgent`. |
| Contenu des tutos | Fichiers `.md` statiques importés via `?raw` (Vite) | Contenu stable (procédures OS). Même approche que MicroLesson — du markdown string rendu par `react-markdown`. |
| 5 devices + unknown | ios, android, macos, windows, chromeos + sélecteur pour unknown | Couvre 99%+ des users. ChromeOS inclus car marché éducatif important. Linux → unknown (trop de variantes distro/DE). |
| Device unknown | Sélecteur de plateforme (5 boutons) au lieu d'un message vague | Actionnable. Sert aussi de fallback si la détection UA se trompe. |
| Retour sélecteur | Lien "← Back to platforms" quand un device est sélectionné manuellement | Permet de corriger un mauvais choix. |
| Modale | Dialog Park UI + `react-markdown` (pattern MicroLesson) | Pas réinventer. `scrollBehavior="inside"`, header/footer fixes. |
| Provider Effect | **Oui.** `UserAgentApi` fourni via `AtomRuntime` | Le composant utilise un atom Effect pour lire le UA via `UserAgentApi`, cohérent avec le pattern des autres APIs browser. `detectDevice` reste une fonction pure consommée par l'atom. |
| Terme UI | "Japanese Keyboard Setup" | "IME" est opaque pour un débutant. Explication courte dans le body : "IME = Input Method Editor". |
| Bouton ⌨️ Help | Haut à droite de WrittenProduction | Même position que le 💡 de FillInTheBlank. Ne gêne pas le flux de saisie. |
| Auto-open Sprint 2 | Prop `autoOpen?: boolean` | Le wiring localStorage (`manabu:ime-help-shown`) se fait au Sprint 3. En Storybook, on contrôle via prop. |
| Langue UI | Anglais | "Japanese Keyboard Setup", "Got it", "Back to platforms". |
| Où vit le composant | `packages/exercises/src/components/ime-help-modal/` | Cohérent avec `micro-lesson/`, `speech-repeat/`, etc. |

## Modèle

### DeviceType

```ts
type DeviceType = "ios" | "android" | "macos" | "windows" | "chromeos" | "unknown"
```

### detectDevice

```ts
declare const detectDevice: (userAgent: string) => DeviceType
```

Ordre de détection (important — ChromeOS avant Android car les UA CrOS contiennent parfois "Linux") :

1. `CrOS` → `"chromeos"`
2. `iPhone` ou `iPad` → `"ios"`
3. `Android` → `"android"`
4. `Macintosh` ou `Mac OS` → `"macos"`
5. `Windows` → `"windows"`
6. Sinon → `"unknown"`

### UserAgentApi

```ts
// packages/exercises/src/logic/user-agent.ts
class UserAgentApi extends Context.Tag("UserAgentApi")<
  UserAgentApi,
  { readonly get: () => string }
>() {}

const BrowserUserAgentApiLive = Layer.succeed(UserAgentApi, {
  get: () => globalThis.navigator.userAgent,
})
```

- `BrowserUserAgentApiLive` — layer browser, lit le vrai `navigator.userAgent`
- En test/story — `Layer.succeed(UserAgentApi, { get: () => "Mozilla/5.0 (Macintosh; ..." })` pour simuler un device

### Props IMEHelpModal

```ts
interface IMEHelpModalProps {
  readonly open: boolean
  readonly onClose: () => void
  readonly deviceType: DeviceType   // résolu par l'atom Effect en amont
}
```

- `open` — contrôlé par le parent
- `onClose` — appelé par "Got it", ✕, ou clic hors modale
- `deviceType` — device résolu via `UserAgentApi` + `detectDevice`, passé par le parent (atom Effect)

### Props WrittenProduction (mise à jour)

Le bouton ⌨️ Help et le state `open` de la modale sont internes à WrittenProduction — pas de nouvelle prop exposée.

## Contenu markdown par device

### Structure des fichiers

```
packages/exercises/
  src/
    content/
      ime-help/
        ios.md
        android.md
        macos.md
        windows.md
        chromeos.md
```

### Format de chaque fichier

Deux sections : installation + utilisation. Mini-exemple concret `neko → ねこ → 猫` dans chaque tuto.

#### macos.md

```markdown
## How to install

1. Open **System Settings**
2. Go to **Keyboard** → **Input Sources**
3. Click **Edit…** → **Add…**
4. Search for **Japanese** and select **Romaji**
5. Click **Add**

## How to use

Switch keyboards with **Ctrl + Space** or click the input source icon in the menu bar.

Type in romaji and the IME (Input Method Editor) converts it to Japanese:

1. Type `neko` → ねこ appears
2. Press **Space** to convert → 猫
3. Press **Enter** to confirm

Tip: press **Space** multiple times to cycle through kanji candidates.
```

#### windows.md

```markdown
## How to install

1. Open **Settings**
2. Go to **Time & Language** → **Language & region**
3. Click **Add a language**
4. Search for **日本語 (Japanese)** and select it
5. Click **Next** → **Install**
6. The **Microsoft IME** is added automatically

## How to use

Switch keyboards with **Alt + Shift** or press **Win + Space**.

Type in romaji and the IME (Input Method Editor) converts it to Japanese:

1. Type `neko` → ねこ appears
2. Press **Space** to convert → 猫
3. Press **Enter** to confirm

Tip: press **Space** multiple times to cycle through kanji candidates.
```

#### ios.md

```markdown
## How to install

1. Open **Settings**
2. Go to **General** → **Keyboard** → **Keyboards**
3. Tap **Add New Keyboard…**
4. Select **Japanese** → **Romaji**

## How to use

Tap the 🌐 globe icon on your keyboard to switch to Japanese.

Type in romaji and the keyboard suggests Japanese text:

1. Type `neko` → suggestions appear (ねこ, 猫, ネコ…)
2. Tap the correct suggestion to insert it

Tip: the suggestion bar above the keyboard shows the most common conversions.
```

#### android.md

```markdown
## How to install

1. Open **Settings**
2. Go to **System** → **Languages & input**
3. Tap **On-screen keyboard** → **Gboard** (or your keyboard app)
4. Tap **Languages** → **Add keyboard**
5. Search for **日本語 (Japanese)** and select **Romaji**

## How to use

Tap the 🌐 globe icon or swipe the space bar to switch to Japanese.

Type in romaji and the keyboard suggests Japanese text:

1. Type `neko` → suggestions appear (ねこ, 猫, ネコ…)
2. Tap the correct suggestion to insert it

Tip: the suggestion bar above the keyboard shows the most common conversions.
```

#### chromeos.md

```markdown
## How to install

1. Click the **clock** in the bottom-right corner
2. Click the **⚙️ Settings** gear icon
3. Go to **Languages and inputs** → **Inputs and keyboards**
4. Click **Add input methods**
5. Search for **Japanese** and enable it

## How to use

Click the language indicator in the shelf (bottom-right, near the clock) to switch, or press **Ctrl + Shift + Space**.

Type in romaji and the IME (Input Method Editor) converts it to Japanese:

1. Type `neko` → ねこ appears
2. Press **Space** to convert → 猫
3. Press **Enter** to confirm

Tip: press **Space** multiple times to cycle through kanji candidates.
```

## Design

### IMEHelpModal — device détecté

```
┌────────────────────────────────────┐
│  ⌨️ Japanese Keyboard Setup  [ ✕ ] │  ← header fixe
├────────────────────────────────────┤
│                                    │
│  We detected you're on macOS.     │  ← device badge (JSX, hors markdown)
│                                    │
│  ┌─ markdown rendered ──────────┐ │
│  │ ## How to install            │ │
│  │ 1. Open System Settings...   │ │
│  │ 2. ...                       │ │
│  │                              │ │
│  │ ## How to use                │ │
│  │ Type in romaji...            │ │  ← overflow-y: auto
│  │ Example: neko → ねこ → 猫    │ │
│  └──────────────────────────────┘ │
│                                    │
├────────────────────────────────────┤
│            [ Got it ]              │  ← footer fixe
└────────────────────────────────────┘
```

### IMEHelpModal — unknown (sélecteur)

```
┌────────────────────────────────────┐
│  ⌨️ Japanese Keyboard Setup  [ ✕ ] │
├────────────────────────────────────┤
│                                    │
│  We couldn't detect your device.  │
│  Select your platform:            │
│                                    │
│  [ 🍎 macOS    ]                  │
│  [ 🪟 Windows  ]                  │
│  [ 📱 iOS      ]                  │
│  [ 🤖 Android  ]                  │
│  [ 💻 ChromeOS ]                  │
│                                    │
├────────────────────────────────────┤
│            [ Got it ]              │
└────────────────────────────────────┘
```

### IMEHelpModal — unknown après sélection manuelle

```
┌────────────────────────────────────┐
│  ⌨️ Japanese Keyboard Setup  [ ✕ ] │
├────────────────────────────────────┤
│                                    │
│  ← Back to platforms              │  ← lien retour
│                                    │
│  ┌─ markdown rendered ──────────┐ │
│  │ ## How to install            │ │
│  │ ...                          │ │  ← contenu de la plateforme choisie
│  │ ## How to use                │ │
│  │ ...                          │ │
│  └──────────────────────────────┘ │
│                                    │
├────────────────────────────────────┤
│            [ Got it ]              │
└────────────────────────────────────┘
```

### Bouton ⌨️ Help dans WrittenProduction

```
┌──────────────────────────────────┐
│                            [ ⌨️ ]│  ← bouton permanent, haut droite
│                                  │
│           "to study"             │
│                                  │
│                                  │
├──────────────────────────────────┤
│  [Skip]  [日本語で入力     ] [✓] │
└──────────────────────────────────┘
```

## Critères d'acceptance

### Détection device — TDD (Étape 1)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC1 | `detectDevice(ua)` retourne `"ios"` pour un UA iPhone | Test | 1 |
| AC2 | `detectDevice(ua)` retourne `"ios"` pour un UA iPad | Test | 1 |
| AC3 | `detectDevice(ua)` retourne `"android"` pour un UA Android | Test | 1 |
| AC4 | `detectDevice(ua)` retourne `"macos"` pour un UA macOS | Test | 1 |
| AC5 | `detectDevice(ua)` retourne `"windows"` pour un UA Windows | Test | 1 |
| AC6 | `detectDevice(ua)` retourne `"chromeos"` pour un UA CrOS | Test | 1 |
| AC7 | `detectDevice(ua)` retourne `"unknown"` pour un UA non reconnu (Linux, etc.) | Test | 1 |
| AC8 | ChromeOS est détecté **avant** Android (priorité dans le parser) | Test | 1 |

### Fichiers markdown (Étape 2)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC9 | 5 fichiers markdown créés (ios, android, macos, windows, chromeos) avec sections "How to install" et "How to use" | Contenu | 2 |
| AC10 | Chaque fichier contient l'exemple concret `neko → ねこ → 猫` | Contenu | 2 |

### Composant IMEHelpModal + stories (Étape 3)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC11 | La modale affiche "We detected you're on **X**" pour un device connu | Story | 3 |
| AC12 | Le contenu markdown correspondant au device est rendu via `react-markdown` avec les prose styles | Story | 3 |
| AC13 | Le scroll fonctionne quand le contenu dépasse la hauteur | Story | 3 |
| AC14 | "Got it" et ✕ ferment la modale (`onClose`) | Story | 3 |
| AC15 | Device `"unknown"` affiche le sélecteur de plateforme avec 5 boutons | Story | 3 |
| AC16 | Clic sur une plateforme charge le markdown correspondant | Story | 3 |
| AC17 | Lien "← Back to platforms" ramène au sélecteur | Story | 3 |

### Intégration WrittenProduction (Étape 4)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC18 | Bouton ⌨️ Help visible en haut à droite de WrittenProduction (même position que 💡 de FillInTheBlank) | Story | 4 |
| AC19 | Le bouton ⌨️ ouvre IMEHelpModal | Story | 4 |
| AC20 | Le bouton ⌨️ est accessible pendant la phase `answering` et la phase `feedback` | Story | 4 |
| AC21 | Stories WrittenProduction existantes mises à jour avec le bouton ⌨️ visible | Story | 4 |

### Build (Étape 5)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC22 | `pnpm build` compile sans erreur | CI | 5 |
| AC23 | `pnpm lint` passe sans erreur | CI | 5 |
| AC24 | Tests existants passent (non-régression) | CI | 5 |

## Étapes d'implémentation

### Étape 1 — TDD detectDevice

- [x] Écrire les tests `detectDevice` : iOS iPhone, iOS iPad, Android, macOS, Windows, ChromeOS, unknown, priorité CrOS > Android → AC1, AC2, AC3, AC4, AC5, AC6, AC7, AC8
- [x] Implémenter `detectDevice` dans `packages/exercises/src/components/ime-help-modal/detect-device.ts` → AC1-AC8
- [x] Créer `UserAgentApi` Context.Tag + `BrowserUserAgentApiLive` + helper `getUserAgent()` dans `packages/exercises/src/logic/user-agent.ts`

### Étape 2 — Fichiers markdown par device

- [x] Créer `packages/exercises/src/content/ime-help/macos.md` → AC9, AC10
- [x] Créer `packages/exercises/src/content/ime-help/windows.md` → AC9, AC10
- [x] Créer `packages/exercises/src/content/ime-help/ios.md` → AC9, AC10
- [x] Créer `packages/exercises/src/content/ime-help/android.md` → AC9, AC10
- [x] Créer `packages/exercises/src/content/ime-help/chromeos.md` → AC9, AC10

### Étape 3 — Composant IMEHelpModal + stories

- [ ] Créer `packages/exercises/src/components/ime-help-modal/ime-help-modal.tsx` avec Dialog Park UI + `react-markdown` + prose styles (pattern MicroLesson) → AC11, AC12, AC13, AC14
- [ ] Implémenter le sélecteur de plateforme pour device `"unknown"` (useState interne) → AC15, AC16
- [ ] Implémenter le lien "← Back to platforms" → AC17
- [ ] Story `IMEHelpModal_macOS` : userAgent macOS → AC11, AC12
- [ ] Story `IMEHelpModal_Windows` : userAgent Windows → AC11, AC12
- [ ] Story `IMEHelpModal_iOS` : userAgent iOS → AC11, AC12
- [ ] Story `IMEHelpModal_Android` : userAgent Android → AC11, AC12
- [ ] Story `IMEHelpModal_ChromeOS` : userAgent ChromeOS → AC11, AC12
- [ ] Story `IMEHelpModal_Unknown` : userAgent inconnu → sélecteur affiché → AC15

### Étape 4 — Intégration WrittenProduction

- [ ] Ajouter le bouton ⌨️ Help en haut à droite de WrittenProduction (même pattern que 💡 dans FillInTheBlank) → AC18
- [ ] Wiring : bouton → useState `open` → IMEHelpModal → AC19
- [ ] Vérifier que le bouton est accessible en phase answering et feedback → AC20
- [ ] Mettre à jour les stories WrittenProduction existantes avec le bouton ⌨️ visible → AC21

### Étape 5 — Vérifications finales

- [ ] `pnpm build` sans erreur → AC22
- [ ] `pnpm lint` sans erreur → AC23
- [ ] Tests existants passent (non-régression) → AC24

## Hors scope

| Élément | Raison | Sprint prévu |
|---|---|---|
| Auto-open premier lancement (localStorage) | Wiring session, pas de localStorage en Storybook | Sprint 3 |
| Détection IME installé | Pattern identique au micro (US14). Message explicatif si pas d'IME | Sprint 3 |
| Screenshots dans les tutos | Le markdown texte suffit. Screenshots si feedback user le demande | Backlog |
| Linux dédié | Trop de variantes (distro/DE). Couvert par le sélecteur "unknown" | — |
| Wiring avec DrillQueue / page session | US21 = composants Storybook isolés | Sprint 3 |
