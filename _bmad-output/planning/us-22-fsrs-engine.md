# US22 — FSRS engine (logique pure)

## Résumé

Moteur FSRS (Free Spaced Repetition Scheduler) — l'algorithme de répétition espacée qui pilote toute la rétention de Manabu. Logique pure, zéro dépendance infra. Vit dans un nouveau package dédié `packages/fsrs` car l'algorithme est générique (aucune connaissance du domaine Manabu). Le service `FsrsScheduler` qui adapte FSRS au domaine (mapping tentatives → rating) reste dans `packages/domain`.

**Sprint :** Sprint 3 — Intelligence et wiring
**Dépendances :** aucune (Phase 1, point d'entrée du Sprint 3)
**Approche :** TDD Red-Green-Refactor, logique pure Effect, `Schema.Class` pour réutilisation frontière SQL (US25)

## Décisions architecturales

| Question | Décision | Justification |
|---|---|---|
| Package | Nouveau `packages/fsrs` (`@manabu/fsrs`) | FSRS est un algorithme générique sans connaissance du domaine Manabu. Séparation DDD : l'algo est un building block, le service est du domaine. Réutilisable dans un autre projet d'apprentissage. |
| Types FSRS | `Schema.Class` (pas `Data.Class`) | Réutilisables à la frontière SQL quand US25 enrichira `review_card` avec les colonnes FSRS. |
| Contraintes numériques | Schema refinements (`Schema.greaterThanOrEqualTo`, `Schema.between`) | Le compilateur enforce les invariants (stability >= 0, difficulty in [0, 10], retrievability in [0, 1]). Pas de tests unitaires pour les contraintes — les tests vérifient le comportement. |
| Ratings | 3 ratings : Again, Hard, Good. Pas de Easy. | Élimine le biais de surconfiance. Le mapping par tentatives est objectif. Validé par Sensei — l'apprenant débutant n'a pas le recul pour juger "facile". |
| Tentatives | `Schema.Int.pipe(Schema.greaterThan(0))` | Tentatives = 0 est impossible (l'apprenant a toujours au moins 1 tentative). Le type refuse les valeurs invalides. |
| Params FSRS | Objet immutable `FsrsParams` avec constantes FSRS publiées (w0-w18) | Magic numbers documentés, source : papier FSRS 2023 (Anki). Overridable dans les tests pour vérifier le comportement avec des params custom. |
| Service `FsrsScheduler` | Dans `packages/domain`, consomme `@manabu/fsrs` | Le service adapte FSRS au domaine (mapping tentatives → rating). Le domaine dépend de l'algo, pas l'inverse. |
| Tests comportementaux | Tester les **relations d'ordre** entre intervalles, pas les valeurs exactes | Les valeurs exactes dépendent des params FSRS. Les invariants : `interval(Good) > interval(Hard) > interval(Again)`, intervalles croissants exponentiellement sur Good successifs. |
| `scheduleReview` | Fonction pure `(state, rating, params?) → { state, nextReviewAt }` | Pas d'Effect nécessaire — c'est du calcul mathématique pur. Effect wrappé au niveau du service. |

## Modèle

### Graphe de dépendances

```
packages/fsrs    →  @manabu/shared (Effect)
packages/domain  →  @manabu/fsrs, @manabu/shared
```

### FsrsRating

```ts
// packages/fsrs/src/fsrs-rating.ts
type FsrsRating = "again" | "hard" | "good"
```

Schema littéral, 3 valeurs. Pas d'enum — un union string suffit.

### FsrsState

```ts
// packages/fsrs/src/fsrs-state.ts
class FsrsState extends Schema.Class<FsrsState>("FsrsState")({
  stability: Schema.Number.pipe(Schema.greaterThanOrEqualTo(0)),   // durée de rétention (jours)
  difficulty: Schema.Number.pipe(Schema.between(0, 10)),           // difficulté intrinsèque
  retrievability: Schema.Number.pipe(Schema.between(0, 1)),        // probabilité de rappel
}) {}
```

- `stability` : temps (en jours) pour que la probabilité de rappel tombe à 90%. Plus c'est haut, plus l'intervalle est long.
- `difficulty` : difficulté intrinsèque de l'item, entre 0 (trivial) et 10 (très difficile). Mise à jour à chaque review.
- `retrievability` : probabilité de rappel au moment de la review. Calculée à partir de `stability` et du temps écoulé.

### FsrsCardState

```ts
type FsrsCardState = "new" | "learning" | "review"
```

- `new` : jamais reviewé, scaffolding double passage
- `learning` : en cours d'apprentissage (premiers intervalles courts)
- `review` : maîtrisé, intervalles longs (SRS actif)

### FsrsParams

```ts
// packages/fsrs/src/fsrs-params.ts
class FsrsParams extends Schema.Class<FsrsParams>("FsrsParams")({
  weights: Schema.Tuple(
    // w0-w18 : 19 poids FSRS
    ...Array.replicate(Schema.Number, 19)
  ),
  requestRetention: Schema.Number.pipe(Schema.between(0, 1)),  // rétention cible (défaut 0.9)
}) {}
```

Params par défaut : constantes FSRS v5 publiées (source : [fsrs-optimizer](https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm)). Exportées comme `defaultFsrsParams`.

### scheduleReview

```ts
// packages/fsrs/src/schedule-review.ts
declare const scheduleReview: (
  state: FsrsState,
  cardState: FsrsCardState,
  rating: FsrsRating,
  now: Date,
  params?: FsrsParams,
) => {
  readonly state: FsrsState
  readonly cardState: FsrsCardState
  readonly nextReviewAt: Date
}
```

Fonction pure. Pas d'Effect — c'est du calcul mathématique. `params` optionnel, défaut = `defaultFsrsParams`.

Comportement attendu :
- **Good** sur nouvelle carte → stabilité initiale nominale, `nextReviewAt` ~1 jour, `cardState` → `learning`
- **Hard** → stabilité réduite, intervalle plus court que Good
- **Again** → stabilité quasi-reset, `cardState` → `learning`, intervalle très court (même jour)
- **Good successifs** → intervalles croissants **exponentiellement**
- **Again après plusieurs Good** → contraction forte mais pas reset total (la stabilité accumulée n'est pas perdue à 100%)

### mapAttemptsToRating

```ts
// packages/fsrs/src/map-attempts-to-rating.ts
declare const mapAttemptsToRating: (
  attempts: number & Brand<"PositiveInt">,
) => FsrsRating
```

| Tentatives | Rating |
|---|---|
| 1 | Good |
| 2 | Hard |
| 3+ | Again |

### FsrsScheduler (service domaine)

```ts
// packages/domain/src/fsrs-scheduler.ts
class FsrsScheduler extends Effect.Service<FsrsScheduler>()("FsrsScheduler", {
  effect: Effect.gen(function* () {
    return {
      schedule: (
        state: FsrsState,
        cardState: FsrsCardState,
        rating: FsrsRating,
        now: Date,
      ) => { return scheduleReview(state, cardState, rating, now) },
      ratingFromAttempts: (attempts: PositiveInt) => {
        return mapAttemptsToRating(attempts)
      },
    }
  }),
}) {}
```

Service Effect dans `packages/domain`. Consomme les fonctions pures de `@manabu/fsrs`. Injectable via `FsrsScheduler.Default` en prod, `Layer.succeed(FsrsScheduler, { ... })` en test.

## Critères d'acceptance

### Types FSRS — TDD (Étape 1)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC1 | `FsrsState.make()` accepte des valeurs valides (stability >= 0, difficulty in [0, 10], retrievability in [0, 1]) | Test | 1 |
| AC2 | `FsrsState.make()` rejette stability < 0 | Test | 1 |
| AC3 | `FsrsState.make()` rejette difficulty hors [0, 10] | Test | 1 |
| AC4 | `FsrsState.make()` rejette retrievability hors [0, 1] | Test | 1 |
| AC5 | `FsrsRating` accepte uniquement "again", "hard", "good" | Test | 1 |
| AC6 | `FsrsCardState` accepte uniquement "new", "learning", "review" | Test | 1 |
| AC7 | `FsrsParams` contient 19 weights + requestRetention in [0, 1] | Test | 1 |
| AC8 | `defaultFsrsParams` est exporté avec les valeurs FSRS v5 publiées | Test | 1 |

### scheduleReview — TDD (Étape 2)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC9 | Good sur nouvelle carte (state new) → stabilité initiale nominale, `nextReviewAt` ~1 jour | Test | 2 |
| AC10 | Hard sur nouvelle carte → stabilité réduite, intervalle plus court que Good | Test | 2 |
| AC11 | Again sur nouvelle carte → quasi-reset, intervalle très court (même jour) | Test | 2 |
| AC12 | Relation d'ordre : `interval(Good) > interval(Hard) > interval(Again)` | Test | 2 |
| AC13 | Good successifs (5x) → intervalles croissants exponentiellement (chaque intervalle > précédent) | Test | 2 |
| AC14 | Again après 5 Good → contraction forte mais `stability > 0` (pas de reset total) | Test | 2 |
| AC15 | Again après 5 Good → intervalle contracté mais > intervalle d'une carte neuve avec Again | Test | 2 |
| AC16 | `cardState` transite : new → learning (premier review), learning → review (après Good suffisants) | Test | 2 |
| AC17 | `nextReviewAt` est toujours > `now` | Test | 2 |
| AC18 | `stability >= 0` et `difficulty in [0, 10]` dans tous les cas (invariants de sortie) | Test | 2 |

### mapAttemptsToRating — TDD (Étape 3)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC19 | 1 tentative → Good | Test | 3 |
| AC20 | 2 tentatives → Hard | Test | 3 |
| AC21 | 3 tentatives → Again | Test | 3 |
| AC22 | 10 tentatives → Again | Test | 3 |

### FsrsScheduler service — TDD (Étape 4)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC23 | `FsrsScheduler.Default` fournit un layer fonctionnel | Test | 4 |
| AC24 | `schedule()` délègue à `scheduleReview` et retourne le résultat attendu | Test | 4 |
| AC25 | `ratingFromAttempts()` délègue à `mapAttemptsToRating` | Test | 4 |
| AC26 | Le service est injectable via `Layer.succeed` dans les tests | Test | 4 |

### Build (Étape 5)

| # | Critère | Type | Étape |
|---|---|---|---|
| AC27 | `pnpm build` compile sans erreur | CI | 5 |
| AC28 | `pnpm lint` passe sans erreur | CI | 5 |
| AC29 | Tests existants passent (non-régression) | CI | 5 |

## Étapes d'implémentation

### Étape 0 — Setup package `@manabu/fsrs`

- [x] Créer `packages/fsrs/package.json` (name `@manabu/fsrs`, deps `effect`, `@manabu/shared`)
- [x] Créer `packages/fsrs/tsconfig.json` (extends base, references shared)
- [x] Créer `packages/fsrs/vitest.config.ts`
- [x] Créer `packages/fsrs/src/index.ts` (barrel export vide)
- [x] Ajouter `@manabu/fsrs` comme dépendance de `packages/domain`
- [x] Vérifier `pnpm install` + `pnpm build` passent

### Étape 1 — Types FSRS (TDD)

- [ ] Écrire les tests de validation `FsrsState` : valeurs valides acceptées, stability < 0 rejeté, difficulty hors range rejeté, retrievability hors range rejeté → AC1, AC2, AC3, AC4
- [ ] Implémenter `FsrsState` dans `packages/fsrs/src/fsrs-state.ts` → AC1-AC4
- [ ] Écrire les tests `FsrsRating` et `FsrsCardState` : valeurs valides acceptées, invalides rejetées → AC5, AC6
- [ ] Implémenter `FsrsRating` et `FsrsCardState` dans `packages/fsrs/src/fsrs-rating.ts` → AC5, AC6
- [ ] Écrire les tests `FsrsParams` : 19 weights, requestRetention in [0, 1] → AC7
- [ ] Implémenter `FsrsParams` + `defaultFsrsParams` dans `packages/fsrs/src/fsrs-params.ts` → AC7, AC8
- [ ] Exporter tout depuis `packages/fsrs/src/index.ts`

### Étape 2 — scheduleReview (TDD)

- [ ] Test : Good sur carte new → stabilité initiale, nextReviewAt ~1 jour → AC9
- [ ] Test : Hard sur carte new → stabilité réduite, intervalle < Good → AC10
- [ ] Test : Again sur carte new → quasi-reset, intervalle très court → AC11
- [ ] Test : relation d'ordre `interval(Good) > interval(Hard) > interval(Again)` → AC12
- [ ] Implémenter `scheduleReview` (cas new) dans `packages/fsrs/src/schedule-review.ts` → AC9-AC12
- [ ] Test : 5 Good successifs → intervalles croissants exponentiellement → AC13
- [ ] Test : Again après 5 Good → contraction forte, stability > 0, pas de reset total → AC14, AC15
- [ ] Implémenter `scheduleReview` (cas learning/review) → AC13-AC15
- [ ] Test : transitions cardState (new → learning → review) → AC16
- [ ] Test : nextReviewAt > now dans tous les cas → AC17
- [ ] Test : invariants de sortie (stability >= 0, difficulty in [0, 10]) → AC18
- [ ] Compléter l'implémentation → AC16-AC18

### Étape 3 — mapAttemptsToRating (TDD)

- [ ] Test : 1 tentative → Good → AC19
- [ ] Test : 2 tentatives → Hard → AC20
- [ ] Test : 3 tentatives → Again → AC21
- [ ] Test : 10 tentatives → Again → AC22
- [ ] Implémenter `mapAttemptsToRating` dans `packages/fsrs/src/map-attempts-to-rating.ts` → AC19-AC22

### Étape 4 — FsrsScheduler service (TDD)

- [ ] Test : `FsrsScheduler.Default` fournit un layer fonctionnel → AC23
- [ ] Test : `schedule()` retourne le résultat attendu → AC24
- [ ] Test : `ratingFromAttempts()` retourne le rating attendu → AC25
- [ ] Test : le service est injectable via `Layer.succeed` → AC26
- [ ] Implémenter `FsrsScheduler` dans `packages/domain/src/fsrs-scheduler.ts` → AC23-AC26
- [ ] Exporter `FsrsScheduler` depuis `packages/domain/src/index.ts`

### Étape 5 — Vérifications finales

- [ ] `pnpm build` sans erreur → AC27
- [ ] `pnpm lint` sans erreur → AC28
- [ ] Tests existants passent (non-régression) → AC29

## Hors scope

| Élément | Raison | Sprint prévu |
|---|---|---|
| Persistance ReviewCard enrichie (colonnes FSRS) | US25 — Migrations SQL | Sprint 3, Phase 2 |
| Calibration des params FSRS sur données réelles | Nécessite des données d'usage en production | Post-launch |
| Rating "Easy" | Pas au MVP, 3 ratings suffisent | Backlog |
| Optimisation FSRS (neural network re-fitting) | FSRS v5 params par défaut suffisent au MVP | Backlog |
| `finalizeSession` (appel FSRS post-session) | US27 — Session loop serveur | Sprint 3, Phase 3 |

## Références

- [FSRS Algorithm Wiki](https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm) — formules et params par défaut
- Sprint 3 spec — Axe 1 (Modèle SRS) pour le contexte d'intégration
