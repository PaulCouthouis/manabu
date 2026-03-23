# US10 — Setup packages + DrillQueue

## Résumé

Deux nouveaux packages monorepo (`packages/exercises`, `packages/storybook`) sont créés. La logique pure DrillQueue est implémentée en TDD : queue FIFO de 5 items basée sur `Chunk`, recyclage en fin de queue, double passage scaffolding, historique append-only, et projection `summarize` pour le récap de session (y compris sur abandon).

**Sprint :** Sprint 2 — Exercise Core
**Dépendances :** —
**Approche :** TDD (Red-Green-Refactor)

## Décisions architecturales

| Question | Décision | Justification |
|---|---|---|
| Où vit la DrillQueue ? | `packages/exercises/src/logic/` | Mécanique de session UI, pas un concept domaine (pas de persistence, pas de repository). |
| Structure de données | `Chunk` (Effect) | Immutable, performant pour `append`/`drop`, idiomatique Effect. Pas de `Queue` concurrente — on veut du pur synchrone. |
| Distinction fail/skip | Pas dans la DrillQueue | La queue connaît `success` et `recycle`. La sémantique fail/skip est portée par le composant appelant. |
| Historique | Append-only dans la DrillQueue | Chaque réponse (succès ou recycle) push une entrée. Permet de distinguer "tenté" de "non tenté" sur abandon, et de compter le nb d'essais. |
| SessionResult | Projection via `summarize` | Pas une entité séparée — fonction pure qui croise `queue` et `history` pour catégoriser succeeded/attempted/pending. |
| Stories Storybook | Colocalisées avec les composants | `packages/storybook` est un runner (config + glob), les stories restent dans le package du composant. |

## Modèle DrillQueue

```ts
interface DrillItem<A> {
  readonly value: A
  readonly withScaffolding: boolean
}

interface DrillEntry<A> {
  readonly item: DrillItem<A>
  readonly outcome: "success" | "recycle"
}

interface DrillQueue<A> {
  readonly queue: Chunk<DrillItem<A>>
  readonly history: Chunk<DrillEntry<A>>
}

interface DrillSummary<A> {
  readonly succeeded: Chunk<{ item: DrillItem<A>; attempts: number }>
  readonly attempted: Chunk<{ item: DrillItem<A>; attempts: number }>
  readonly pending: Chunk<DrillItem<A>>
}
```

### Opérations

| Opération | Effet sur `queue` | Effet sur `history` |
|---|---|---|
| `current` | Retourne le premier item (FIFO) | — |
| `succeed` | Retire l'item. Si scaffolding → réinsère sans scaffolding en fin | Push `{ item, success }` |
| `recycle` | Déplace l'item en fin de queue (sans régression scaffolding) | Push `{ item, recycle }` |
| `summarize` | — | Croise queue + history pour catégoriser |
| `isEmpty` | `Chunk.isEmpty(queue)` | — |

### Logique `summarize`

- **Succeeded** : items dont le dernier outcome dans `history` est `success` et qui ne sont plus dans `queue`
- **Attempted** : items présents dans `history` (tentés) mais encore dans `queue` (dernier outcome = `recycle`)
- **Pending** : items dans `queue` qui n'apparaissent jamais dans `history`
- **Nb essais** : nombre d'entrées dans `history` pour cet item

## Critères d'acceptance

### Packages

| # | Critère | Type | Étape |
|---|---|---|---|
| AC1 | `packages/exercises` existe avec `package.json`, `tsconfig.json`, et exporte depuis `src/index.ts` | CI | 1 |
| AC2 | `packages/storybook` centralise la config `.storybook/` et découvre les stories de `packages/ui` et `packages/exercises` | CI | 2 |
| AC3 | Les 7 stories existantes de `packages/ui` restent fonctionnelles dans le Storybook centralisé | Manuel | 2 |
| AC4 | `packages/ui` n'a plus de config `.storybook/` ni de scripts/deps Storybook | CI | 2 |

### DrillQueue — FIFO

| # | Critère | Type | Étape |
|---|---|---|---|
| AC5 | Créer une queue à partir d'une liste d'items → taille et ordre FIFO préservés | Unit | 3 |
| AC6 | `current` retourne le premier item de la queue | Unit | 3 |
| AC7 | `succeed` retire l'item de la queue et push dans history | Unit | 3 |
| AC8 | `isEmpty` retourne true quand la queue est vide | Unit | 3 |

### DrillQueue — Recyclage

| # | Critère | Type | Étape |
|---|---|---|---|
| AC9 | `recycle` déplace l'item en fin de queue et push dans history | Unit | 4 |
| AC10 | Un item recyclé est re-présenté après les items restants | Unit | 4 |
| AC11 | Plusieurs recyclages successifs → l'item réapparaît à chaque fois | Unit | 4 |
| AC12 | Queue avec tous les items réussis → `isEmpty` retourne true | Unit | 4 |

### DrillQueue — Scaffolding double passage

| # | Critère | Type | Étape |
|---|---|---|---|
| AC13 | `succeed` sur un item avec scaffolding → réinséré en fin de queue sans scaffolding | Unit | 5 |
| AC14 | `succeed` sur un item sans scaffolding → retiré définitivement | Unit | 5 |
| AC15 | `recycle` sur un item sans scaffolding → recyclé sans scaffolding (pas de régression) | Unit | 5 |

### DrillQueue — Summarize

| # | Critère | Type | Étape |
|---|---|---|---|
| AC16 | `summarize` sur queue fraîche → tout est pending | Unit | 6 |
| AC17 | `summarize` après succès → items dans succeeded avec nb essais | Unit | 6 |
| AC18 | `summarize` après recyclage sans succès → items dans attempted | Unit | 6 |
| AC19 | `summarize` sur abandon (queue non vide) → items jamais présentés dans pending, items recyclés dans attempted | Unit | 6 |
| AC20 | Le nb d'essais correspond au nombre d'entrées dans history pour chaque item | Unit | 6 |

### Build

| # | Critère | Type | Étape |
|---|---|---|---|
| AC21 | `pnpm build` compile sans erreur | CI | 7 |
| AC22 | `pnpm lint` passe sans erreur | CI | 7 |

## Étapes d'implémentation

### Étape 1 — Setup `packages/exercises`

- [x] Créer `packages/exercises/package.json` (`@manabu/exercises`, dépendances : `effect`, `@manabu/shared`)
- [x] Créer `packages/exercises/tsconfig.json` (extends `tsconfig.base.json`)
- [x] Créer `packages/exercises/src/index.ts` (export vide)
- [x] Créer `packages/exercises/src/logic/` (dossier pour la logique pure)
- [x] `pnpm install` — vérifier la résolution des dépendances → AC1

### Étape 2 — Setup `packages/storybook` (migration)

- [x] Créer `packages/storybook/package.json` avec scripts `storybook` et `build-storybook`
- [x] Migrer les devDependencies Storybook de `packages/ui` vers `packages/storybook`
- [x] Migrer `.storybook/main.ts` et `.storybook/preview.ts` de `packages/ui` vers `packages/storybook`
- [x] Configurer le stories glob dans `main.ts` pour découvrir `packages/ui` et `packages/exercises`
- [x] Supprimer la config `.storybook/`, les scripts et devDeps Storybook de `packages/ui` → AC4
- [x] Vérifier que les 7 stories existantes s'affichent dans le Storybook centralisé → AC2, AC3

### Étape 3 — DrillQueue : création, FIFO, succès

- [x] Test RED : créer une queue → taille et ordre vérifiés
- [x] Test RED : `current` → retourne le premier item
- [x] Test RED : `succeed` → item retiré + history incrémenté
- [x] Test RED : `isEmpty` sur queue vide → true
- [x] GREEN : implémenter `DrillQueue.make`, `current`, `succeed`, `isEmpty`
- [x] REFACTOR : simplifier si nécessaire → AC5, AC6, AC7, AC8

### Étape 4 — DrillQueue : recyclage, queue vide

- [x] Test RED : `recycle` → item en fin de queue + history incrémenté
- [x] Test RED : item recyclé re-présenté après les autres
- [x] Test RED : recyclages multiples → item réapparaît
- [x] Test RED : tous les items réussis → queue vide
- [x] GREEN : implémenter `recycle`
- [x] REFACTOR → AC9, AC10, AC11, AC12

### Étape 5 — DrillQueue : double passage scaffolding

- [x] Test RED : `succeed` avec scaffolding → réinséré sans scaffolding
- [x] Test RED : `succeed` sans scaffolding → retiré
- [x] Test RED : `recycle` sans scaffolding → recyclé sans (pas de régression)
- [x] GREEN : adapter `succeed` et `recycle` pour le flag scaffolding
- [x] REFACTOR → AC13, AC14, AC15

### Étape 6 — DrillQueue : summarize

- [x] Test RED : `summarize` queue fraîche → tout pending
- [x] Test RED : `summarize` après succès → succeeded avec nb essais
- [x] Test RED : `summarize` après recyclage → attempted
- [x] Test RED : `summarize` sur abandon → pending + attempted mélangés
- [x] Test RED : nb essais = nombre d'entrées history par item
- [x] GREEN : implémenter `summarize`
- [x] REFACTOR → AC16, AC17, AC18, AC19, AC20

### Étape 7 — Vérifications finales

- [ ] `pnpm build` sans erreur → AC21
- [ ] `pnpm lint` sans erreur → AC22
- [ ] Tests existants passent (non-régression)

## Hors scope

| Élément | Raison | Sprint prévu |
|---|---|---|
| Composants React | Pas de UI dans cette US | US11-US21 |
| Stories Storybook | Pas de composant = pas de story | US11+ |
| Wiring DB | La DrillQueue est pure, pas de persistence | Sprint 3 |
| Distinction fail/skip | Sémantique portée par le composant appelant | US14-US18 |
| Audio / Speech Recognition | Composants UI | US12, US14 |
