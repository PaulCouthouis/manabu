# US18 — FillInTheBlank

## Résumé

Composant d'exercice phrase à trou pour les 5 skills de grammaire (11-15). Le stimulus est une phrase japonaise avec 1-3 trous ; l'apprenant choisit les réponses en tapant sur les choix proposés. Skill 11 (particules) : grille de 8-12 particules, 1-3 trous, bouton Undo. Skills 12-15 : 4-6 choix contextuels, 1 trou. Validation automatique quand tous les trous sont remplis (pas de bouton Submit). Feedback : phrase complète affichée + TTS autoplay (succès et échec). Pas de skip — l'apprenant doit répondre. Pas de sens en anglais.

**Sprint :** Sprint 2 — Exercise Core
**Dépendances :** US10 (DrillQueue + packages/exercises), US11 (SessionSummary)
**Approche :** types d'abord, puis composant single-blank (Skills 12-15), puis multi-blank + Undo (Skill 11), puis feedback + TTS

## Décisions architecturales

| Question | Décision | Justification |
|---|---|---|
| Sens en anglais | Pas affiché | Le contexte grammatical se déduit de la phrase japonaise seule. Pas de béquille traduction. |
| Audio feedback | Via `TextToSpeech` (service Effect `SpeechSynthesisApi`) | Pas de fichiers audio. TTS partout dans l'app. Le composant joue `speak(fullSentence)` en feedback. |
| Skip | Aucun. Pas de bouton skip | Exercice à choix fermé (tap), pas de barrière d'entrée. L'apprenant répond au hasard s'il ne sait pas. |
| Validation | Automatique quand tous les trous sont remplis | Pas de bouton Submit. Le dernier tap déclenche la validation. |
| Flux de remplissage | Séquentiel gauche → droite | Le trou actif est toujours le prochain non rempli. Pas de clic direct sur un trou rempli pour le modifier — utiliser Undo. |
| Undo | Bouton visible uniquement si `blanks.length > 1`. Disabled si aucun trou rempli | Single-blank (Skills 12-15) : pas de bouton Undo, un tap = validation immédiate. Multi-blank (Skill 11) : Undo retire le dernier choix placé. |
| Particules réutilisables | Les choix ne sont pas retirés de la grille après usage | Skill 11 : une même particule peut apparaître dans plusieurs trous (ex: 東京**に**友達**に**会う). |
| Validation par trou | Feedback vert/rouge par trou individuel | En cas d'échec, l'apprenant voit exactement quels trous sont corrects et lesquels non. |
| Format phrase | Tableau de `SentenceSegment` (texte + blank) | Rendu trivial via `Array.map`, pas de parsing de template string. |
| Provider / Layer | `FillInTheBlankProvider` avec `AtomRuntime` injectant `TextToSpeech` | Même pattern que SpeechRepeat et OralProduction. |
| Où vit le composant | `packages/exercises/src/components/fill-in-the-blank/` | Cohérent avec les autres composants d'exercice. |

## Modèle

### Config

```ts
type SentenceSegment =
  | { readonly kind: "text"; readonly value: string }
  | { readonly kind: "blank"; readonly index: number }

interface BlankDefinition {
  readonly index: number
  readonly correctAnswer: string
}

interface FillInTheBlankConfig {
  readonly segments: ReadonlyArray<SentenceSegment>
  readonly blanks: ReadonlyArray<BlankDefinition>
  readonly choices: ReadonlyArray<string>
  readonly fullSentence: string  // phrase complète pour TTS
}
```

- `segments` — la phrase découpée en morceaux texte et trous, ordonnés
- `blanks` — définition des trous avec la réponse correcte, ordonnés par index
- `choices` — les choix affichés (grille particules ou boutons conjugaisons)
- `fullSentence` — phrase complète en japonais pour le TTS feedback

### Résultat

```ts
interface BlankResult {
  readonly index: number
  readonly userChoice: string
  readonly correctAnswer: string
  readonly isCorrect: boolean
}

interface FillInTheBlankResult {
  readonly outcome: "success" | "failure"
  readonly blankResults: ReadonlyArray<BlankResult>
}
```

- `outcome` = `"success"` si tous les `BlankResult.isCorrect` sont `true`, `"failure"` sinon
- Pas d'`Option` sur `blankResults` — pas de skip, on a toujours un résultat complet

### Props

```ts
interface FillInTheBlankProps {
  readonly config: FillInTheBlankConfig
  readonly onResult: (result: FillInTheBlankResult) => void
  readonly initialPhase?: FillInTheBlankPhase  // pour les stories statiques
}
```

### Phase machine

```ts
type FillInTheBlankPhase =
  | { readonly kind: "filling"; readonly filledBlanks: ReadonlyArray<string> }
  | { readonly kind: "feedback"; readonly result: FillInTheBlankResult }
```

- `filling` — l'apprenant remplit les trous. Le trou actif est à l'index `filledBlanks.length`.
- `feedback` — résultat affiché, TTS autoplay.
- Transition auto : quand `filledBlanks.length === blanks.length` → validation → feedback.

## Design

### Cycle de vie

```
filling → (dernier trou rempli) → validation auto → feedback → advance (auto ou manuel, géré par parent)
```

### Flux d'interaction

```
User tape un choix
  └→ choix placé dans le trou actif (filledBlanks.push)
       ├→ trous restants → focus passe au trou suivant
       └→ tous les trous remplis → validation auto
            ├→ tous corrects → outcome: success
            └→ au moins un incorrect → outcome: failure

Undo (multi-blank uniquement)
  └→ retire le dernier choix placé (filledBlanks.init)
       └→ focus revient au trou précédent
```

### Écrans

**Answering single-blank (Skills 12-15) :**
```
┌──────────────────────────────────┐
│                                  │
│   彼女は 毎日 ＿＿＿ います。     │  ← phrase avec trou surligné (accent)
│                                  │
│                                  │
│                                  │
├──────────────────────────────────┤
│  [走って] [食べて] [飲んで]       │  ← boutons choix (4-6)
│  [読んで] [書いて]               │
└──────────────────────────────────┘
```

**Answering multi-blank (Skill 11, grille particules) :**
```
┌──────────────────────────────────┐
│                                  │
│   私 [＿] 東京 [＿] 行きます。    │  ← trou actif surligné, remplis en badge
│                                  │
│                                  │
├──────────────────────────────────┤
│  [は] [が] [を] [に]             │  ← grille particules (8-12)
│  [で] [へ] [と] [も]             │
│  [の] [か] [よ] [ね]             │
├──────────────────────────────────┤
│  [⟲ Undo]                        │  ← Undo (disabled si aucun trou rempli)
└──────────────────────────────────┘
```

**Feedback correct (succès) :**
```
┌──────────────────────────────────┐
│       ╭───────╮                  │
│       │       │                  │  ← cercle succès (SuccessOverlay)
│   私は東京に行きます。             │  ← phrase complète, trous en vert
│                                  │
│   🔊 (TTS autoplay)             │  ← TextToSpeech phrase complète
│       ╰───────╯                  │
│                                  │  ← auto-advance
├──────────────────────────────────┤
│                                  │  ← footer vide
└──────────────────────────────────┘
```

**Feedback incorrect (échec) :**
```
┌──────────────────────────────────┐
│                                  │
│   私は東京に行きます。             │  ← phrase, bonnes réponses surlignées
│                                  │
│   ✗ で → ✓ に                    │  ← trous incorrects seulement
│                                  │
│   🔊 (TTS autoplay)             │  ← TextToSpeech phrase complète
├──────────────────────────────────┤
│     [ Next → ]                   │  ← Next manuel
└──────────────────────────────────┘
```

### Tableau des feedbacks par résultat

| Résultat | Phrase complète | Trous | Correction affichée | TTS | Advance |
|---|---|---|---|---|---|
| **success** | oui, trous en vert | tous corrects | non | autoplay phrase complète | auto |
| **failure** | oui, bonnes réponses surlignées | corrects vert, incorrects rouge | oui (✗ choix → ✓ correct) pour les trous incorrects | autoplay phrase complète | Next manuel |

## Critères d'acceptance

### Types FillInTheBlank (Étape 1)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC1 | `SentenceSegment` discrimine `text` et `blank` | Unit | 1 |
| AC2 | `FillInTheBlankConfig` contient `segments`, `blanks`, `choices`, `fullSentence` | Unit | 1 |
| AC3 | `BlankResult` contient `index`, `userChoice`, `correctAnswer`, `isCorrect` | Unit | 1 |
| AC4 | `FillInTheBlankResult` contient `outcome` (`"success" | "failure"`) et `blankResults` (`ReadonlyArray<BlankResult>`) | Unit | 1 |

### Logique de validation (Étape 2)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC5 | `validateBlanks(filledBlanks, config.blanks)` retourne `ReadonlyArray<BlankResult>` avec `isCorrect` par trou | Test | 2 |
| AC6 | `outcome` = `"success"` si tous les `BlankResult.isCorrect` sont `true` | Test | 2 |
| AC7 | `outcome` = `"failure"` si au moins un `BlankResult.isCorrect` est `false` | Test | 2 |

### Composant single-blank + stories (Étape 3)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC8 | Les segments de la phrase sont rendus : texte en `<span>`, trous en composant `<Blank>` stylé | Story | 3 |
| AC9 | Le trou actif est visuellement distinct (bordure accent) | Story | 3 |
| AC10 | Tap sur un choix → remplit le trou actif → validation auto (single-blank) | Story | 3 |
| AC11 | `onResult` appelé avec le bon `FillInTheBlankResult` après validation | Story | 3 |
| AC12 | Pas de bouton Skip dans le layout | Story | 3 |
| AC13 | Pas de bouton Undo pour single-blank (`blanks.length === 1`) | Story | 3 |

### Multi-blank + Undo + stories (Étape 4)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC14 | Multi-blank : tap sur un choix remplit le trou actif et avance le focus au trou suivant | Story | 4 |
| AC15 | Multi-blank : validation auto déclenchée quand tous les trous sont remplis | Story | 4 |
| AC16 | Bouton Undo visible quand `blanks.length > 1`, disabled si aucun trou rempli | Story | 4 |
| AC17 | Undo retire le dernier choix placé et recule le focus au trou précédent | Story | 4 |
| AC18 | Les choix sont réutilisables — taper une même particule dans plusieurs trous fonctionne | Story | 4 |

### Feedback variants + TTS + stories (Étape 5)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC19 | Feedback succès : cercle succès + phrase complète avec trous en vert | Story | 5 |
| AC20 | Feedback succès : TTS autoplay de `fullSentence` | Story | 5 |
| AC21 | Feedback échec : phrase complète avec trous corrects en vert, incorrects en rouge | Story | 5 |
| AC22 | Feedback échec : correction affichée pour chaque trou incorrect (✗ choix → ✓ correct) | Story | 5 |
| AC23 | Feedback échec : TTS autoplay de `fullSentence` | Story | 5 |
| AC24 | Feedback échec : bouton Next uniquement (pas de skip, pas d'auto-advance) | Story | 5 |

### Build (Étape 6)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC25 | `pnpm build` compile sans erreur | CI | 6 |
| AC26 | `pnpm lint` passe sans erreur | CI | 6 |
| AC27 | Tests existants passent (non-régression) | CI | 6 |

## Étapes d'implémentation

### Étape 1 — Types FillInTheBlank

- [x] Créer `packages/exercises/src/logic/fill-in-the-blank-config.ts` avec `SentenceSegment`, `BlankDefinition`, `FillInTheBlankConfig` → AC1, AC2
- [x] Créer `BlankResult`, `FillInTheBlankResult` dans le même fichier → AC3, AC4

### Étape 2 — Logique de validation (TDD)

- [x] Écrire les tests `validateBlanks` : tous corrects → success, un incorrect → failure, multi-trou mixte → failure avec détail par trou → AC5, AC6, AC7
- [x] Implémenter `validateBlanks(filledBlanks, blanks)` → `ReadonlyArray<BlankResult>` → AC5
- [x] Implémenter `buildResult(blankResults)` → `FillInTheBlankResult` avec dérivation de l'outcome → AC6, AC7

### Étape 3 — Composant single-blank + stories (Skills 12-15)

- [x] Créer `packages/exercises/src/components/fill-in-the-blank/fill-in-the-blank.tsx`
- [x] Implémenter le rendu des segments : `<span>` pour texte, `<Blank>` stylé pour les trous → AC8
- [x] Style du trou actif (bordure accent) vs trou rempli (badge choix) → AC9
- [x] Implémenter tap choix → remplissage → validation auto (single-blank) → AC10, AC11
- [x] Vérifier : pas de bouton Skip, pas de bouton Undo en single-blank → AC12, AC13
- [x] Story `Skill12_Conjugation_Answering` : phrase à trou + 4-6 boutons → AC8, AC9
- [x] Story `Skill13_Keigo_Answering` : idem avec formes keigo → AC8
- [x] Story `Skill15_Counter_Answering` : idem avec compteurs → AC8

### Étape 4 — Multi-blank + Undo + stories (Skill 11)

- [ ] Implémenter le flux multi-trou : focus auto-advance au trou suivant → AC14
- [ ] Implémenter validation auto quand `filledBlanks.length === blanks.length` → AC15
- [ ] Implémenter bouton Undo (visible si multi-blank, disabled si vide) → AC16
- [ ] Implémenter Undo : retire le dernier, recule le focus → AC17
- [ ] Vérifier que les choix sont réutilisables (même particule dans plusieurs trous) → AC18
- [ ] Story `Skill11_Particles_SingleBlank` : 1 trou, grille 12 particules → AC8
- [ ] Story `Skill11_Particles_MultiBlank` : 2 trous, grille 12 particules, Undo visible → AC14, AC16
- [ ] Story `Skill11_Particles_ThreeBlanks` : 3 trous, grille 12 particules → AC14

### Étape 5 — Feedback variants + TTS + stories

- [ ] Créer `FillInTheBlankProvider` avec `AtomRuntime` injectant `TextToSpeech` layer
- [ ] Implémenter feedback succès : SuccessOverlay + phrase complète trous en vert → AC19
- [ ] Implémenter TTS autoplay `speak(fullSentence)` en feedback (succès et échec) → AC20, AC23
- [ ] Implémenter feedback échec : trous corrects vert, incorrects rouge + correction → AC21, AC22
- [ ] Implémenter bouton Next en feedback échec → AC24
- [ ] Écrire les tests du composant FillInTheBlank (tap → validation → result correct/incorrect) → AC10, AC11
- [ ] Story `Skill11_Correct` : feedback succès, phrase complète, trous verts → AC19, AC20
- [ ] Story `Skill11_Incorrect` : feedback échec, correction par trou → AC21, AC22, AC24
- [ ] Story `Skill12_Correct` : feedback succès single-blank → AC19
- [ ] Story `Skill12_Incorrect` : feedback échec single-blank → AC21

### Étape 6 — Vérifications finales

- [ ] `pnpm build` sans erreur → AC25
- [ ] `pnpm lint` sans erreur → AC26
- [ ] Tests existants passent (non-régression) → AC27

## Hors scope

| Élément | Raison | Sprint prévu |
|---|---|---|
| MicroLesson | US19 séparée | Sprint 2 (US19) |
| Bouton 💡 micro-leçon permanent | Dépend de US19 | Sprint 2 (US19) |
| Contenu des micro-leçons | Rédaction des explications de grammaire | Sprint 3 |
| Wiring avec DrillQueue en page session | US18 est un composant standalone en Storybook | Sprint 3 |
| Auto-advance timing (succès) | Comportement de session, géré par le parent | Sprint 3 |
| Détection points de grammaire nouveaux vs déjà vus | Logique de recommandation | Sprint 3 |
| Audio phrases pré-enregistrées | On utilise TTS | — |
| Skip | Exercice à choix fermé, pas de skip | — |
| Sens en anglais | Le contexte se déduit de la phrase japonaise seule | — |
