# US23 — Disponibilité des ContentItems

## Résumé

Déterminer quels ContentItems sont actionnables pour un apprenant : ceux qu'il peut étudier maintenant. Un item est actionnable s'il est nouveau (pas de ReviewCard) ou overdue (ReviewCard expirée), et que toutes ses dépendances dans le SkillGraph sont satisfaites.

**Sprint :** Sprint 3 — Intelligence et wiring
**Dépendances :** aucune (Phase 1, parallélisable avec US22)
**Approche :** TDD pour la logique domaine, tests d'intégration Testcontainers pour les queries

## Décisions architecturales

| Question | Décision | Justification |
|---|---|---|
| Surface publique | Une méthode : `getAvailableItems(userId, skillId)` | La jouabilité (`items.length >= 5`) est dérivée trivialement par l'appelant (US26, US29). |
| Design | Domain orchestre, DB exécute des queries simples | La logique de vérification (short-circuit, composants, règle GP) est du domaine. Les repos fournissent des lookups batch. Pas de logique métier dans le SQL. |
| Items retournés | Nouveaux (pas de ReviewCard) + overdue (nextReviewAt < now) | Les items non expirés (nextReviewAt > now) ne sont pas actionnables — l'apprenant n'a pas besoin de les réviser. L'appelant reçoit exactement ce qu'on peut mettre dans une session. |
| ReviewCard expirée sur prérequis | Dépendance non satisfaite (strict) | Si les fondations ne sont plus maîtrisées, les contenus avancés se verrouillent. La Recommendation Engine (US26) priorise les overdue pour corriger naturellement. |
| Applicabilité élément → skill | Pas de constante domaine — `ContentItem(E, P) EXISTS` en DB | La table `content_item` est déjà la junction `(element_id, skill_type_id)`. La DB est la source de vérité. |
| Tests domaine | Fakes pour les repos, logique testable unitairement | Short-circuit, composants, règle GP. |
| Tests db | Intégration Testcontainers pour les queries batch | Les repos retournent les bonnes données. |

## Modèle

### Flux `getAvailableItems(userId, skillId)`

```
getAvailableItems(userId, skillId):

  1. Récupérer les prérequis directs du skill (SkillGraph, en mémoire)
     ex: Skill 7 → [2, 3, 4]

  2. Récupérer tous les ContentItems du skill (query)

  3. Pour chaque item (element E, skill S), vérifier qu'il est ACTIONNABLE :

     ── L'item lui-même ──
     Pas de ReviewCard → nouveau, OK (candidat)
     ReviewCard avec nextReviewAt < now → overdue, OK (candidat)
     ReviewCard avec nextReviewAt > now → pas besoin de révision → EXCLU

     ── Dépendances SkillGraph ──
     Pour chaque prérequis P :

       • ContentItem(E, P) existe en DB ?
         → oui : ReviewCard(user, E, P) avec nextReviewAt > now ?
                  sinon → item rejeté
         → non : ignorer (E n'est pas étudié dans ce skill)

       • Pour chaque composant C de E :
         ContentItem(C, P) existe en DB ?
         → oui : ReviewCard(user, C, P) avec nextReviewAt > now ?
                  sinon → item rejeté
         → non : ignorer

     ── Grammar Points (skills 11-15 seulement) ──
     Nombre de GP de E :
       • 1 → bootstrap, pas de vérification GP
       • 2+ → chaque GP doit avoir été étudié :
              il existe une ReviewCard non expirée (nextReviewAt > now)
              pour une sentence contenant ce GP, dans un skill grammaire
              sinon → item rejeté

  4. Retourner les items qui passent
```

### Points d'entrée

Kana dans Skill 1 et kanji dans Skill 5 : zéro prérequis dans le SkillGraph → les nouveaux items sont toujours disponibles.

### Graphe de dépendances packages

```
packages/domain  →  port ContentAvailability, logique d'orchestration
packages/db      →  queries batch (ReviewCardRepo, ContentItemRepo)
```

## Critères d'acceptance

### Étape 1 — Entry points (TDD)

| # | Critère | Exemple | Type | Étape |
|---|---|---|---|---|
| AC1 | Skill sans prérequis : tous les ContentItems nouveaux sont retournés | Skill 1, items [(あ/1, Skill 1), (い/2, Skill 1), (う/3, Skill 1)] sans ReviewCard → les 3 retournés | Test unitaire | 1 |

### Étape 2 — Exclure les items non expirés (TDD)

| # | Critère | Exemple | Type | Étape |
|---|---|---|---|---|
| AC2 | Item avec ReviewCard nextReviewAt > now → exclu | (あ/1, Skill 1) ReviewCard nextReviewAt dans 3 jours → exclu | Test unitaire | 2 |
| AC3 | Item avec ReviewCard nextReviewAt < now → retourné | (い/2, Skill 1) ReviewCard nextReviewAt hier → retourné (overdue) | Test unitaire | 2 |

### Étape 3 — Prérequis sur l'élément lui-même (TDD)

| # | Critère | Exemple | Type | Étape |
|---|---|---|---|---|
| AC4 | ContentItem(E, P) existe + ReviewCard valide → dépendance satisfaite | (結局/6000, Skill 8), prérequis Skill 7 : ContentItem(結局, Skill 7) existe, ReviewCard valide → OK | Test unitaire | 3 |
| AC5 | ContentItem(E, P) existe + ReviewCard absente ou expirée → item rejeté | (結局/6000, Skill 8), prérequis Skill 7 : ContentItem(結局, Skill 7) existe, pas de ReviewCard → rejeté | Test unitaire | 3 |
| AC6 | ContentItem(E, P) n'existe pas → pas de dépendance | (結局/6000, Skill 8), prérequis Skill 5 : 結局 est un mot, pas de ContentItem(結局, Skill 5) → ignoré | Test unitaire | 3 |

### Étape 4 — Vérification des composants (TDD)

| # | Critère | Exemple | Type | Étape |
|---|---|---|---|---|
| AC7 | Tous les composants avec ContentItem dans le prérequis ont une ReviewCard valide → OK | (結局/6000, Skill 8), composants kanji [結/1185, 局/1733], prérequis Skill 5 : ReviewCard(結, Skill 5) et ReviewCard(局, Skill 5) valides → OK | Test unitaire | 4 |
| AC8 | Un composant avec ContentItem dans le prérequis mais sans ReviewCard valide → item rejeté | (結局/6000, Skill 8), composant 結/1185 : ContentItem(結, Skill 5) existe, pas de ReviewCard → rejeté | Test unitaire | 4 |
| AC9 | Composant sans ContentItem dans le skill prérequis → ignoré | (結局/6000, Skill 8), composants kanji [結/1185, 局/1733], prérequis Skill 7 : pas de ContentItem(kanji, Skill 7) → ignoré | Test unitaire | 4 |

### Étape 5 — Règle grammar points (TDD)

| # | Critère | Exemple | Type | Étape |
|---|---|---|---|---|
| AC10 | Sentence skill grammaire, 1 GP → bootstrap, pas de vérification GP | (雨が降っている/70021, Skill 11), GP [が/302] seul → pas de check GP | Test unitaire | 5 |
| AC11 | Sentence skill grammaire, 2+ GP, tous étudiés → OK | (今日は休日だ/70006, Skill 11), GP [だ/300, は/301] : il existe une ReviewCard non expirée pour une sentence contenant だ et une pour une sentence contenant は, dans un skill grammaire → OK | Test unitaire | 5 |
| AC12 | Sentence skill grammaire, 2+ GP, un non étudié → item rejeté | (今日は休日だ/70006, Skill 11), GP [だ/300, は/301] : は/301 jamais étudié → rejeté | Test unitaire | 5 |
| AC13 | Skill non-grammaire → pas de vérification GP | (結局/6000, Skill 7) : mot dans un skill core, pas de check GP | Test unitaire | 5 |

### Étape 6 — Queries batch dans `packages/db`

| # | Critère | Exemple | Type | Étape |
|---|---|---|---|---|
| AC14 | `ReviewCardRepo.findByUserAndContentItems` retourne les ReviewCards pour une liste de ContentItemIds | ContentItemIds pour (結/1185, Skill 5) et (局/1733, Skill 5), user a une ReviewCard pour 結 seulement → retourne 1 ReviewCard | Test intégration | 6 |
| AC15 | `ContentItemRepo.findByElementAndSkills` retourne les ContentItems pour des (elementIds, skillIds) | elements [結/1185, 局/1733], skills [5, 7] → retourne les ContentItems existants dans Skill 5 uniquement | Test intégration | 6 |

### Étape 7 — Intégration end-to-end

| # | Critère | Exemple | Type | Étape |
|---|---|---|---|---|
| AC16 | Kana Skill 1, nouveau → retourné | (あ/1, Skill 1) pas de ReviewCard, 0 prérequis → retourné | Test intégration | 7 |
| AC17 | Kana Skill 2, prérequis satisfait → retourné | (あ/1, Skill 2) + ReviewCard(あ, Skill 1) valide → retourné | Test intégration | 7 |
| AC18 | Kana Skill 2, prérequis expiré → non retourné | (あ/1, Skill 2) + ReviewCard(あ, Skill 1) expirée → non retourné | Test intégration | 7 |
| AC19 | Mot Skill 8, tout OK → retourné | (結局/6000, Skill 8) + ReviewCard(結局, Skill 7) valide + ReviewCard(結/1185, Skill 5) et ReviewCard(局/1733, Skill 5) valides → retourné | Test intégration | 7 |
| AC20 | Mot Skill 8, composant manquant → non retourné | (結局/6000, Skill 8) + ReviewCard(結/1185, Skill 5) manquante → non retourné | Test intégration | 7 |
| AC21 | Sentence Skill 11, 1 GP bootstrap → retourné | (雨が降っている/70021, Skill 11), 1 GP [が/302], dépendances Skill 8 OK → retourné | Test intégration | 7 |
| AC22 | Sentence Skill 11, 2 GP, un manquant → non retourné | (今日は休日だ/70006, Skill 11), GP [だ/300, は/301], は jamais étudié → non retourné | Test intégration | 7 |

### Étape 8 — Build

| # | Critère | Exemple | Type | Étape |
|---|---|---|---|---|
| AC23 | `pnpm build` compile sans erreur | — | CI | 8 |
| AC24 | `pnpm lint` passe sans erreur | — | CI | 8 |
| AC25 | Tests existants passent (non-régression) | — | CI | 8 |

## Étapes d'implémentation

### Étape 1 — Entry points (TDD)

- [x] Définir le port `ContentAvailability` dans `packages/domain` : `getAvailableItems(userId, skillId) → Effect<Array<ContentItem>>`
- [x] Définir les ports repos nécessaires pour les lookups
- [x] Test : Skill 1 (0 prérequis), 3 items nouveaux → les 3 retournés → AC1
- [x] Implémenter le cas trivial : récupérer les ContentItems du skill, les retourner tous

### Étape 2 — Exclure les items non expirés (TDD)

- [x] Test : item avec ReviewCard nextReviewAt > now → exclu → AC2
- [x] Test : item avec ReviewCard nextReviewAt < now → retourné → AC3
- [x] Ajouter le filtre : pas de ReviewCard (nouveau) ou ReviewCard overdue

### Étape 3 — Prérequis sur l'élément lui-même (TDD)

- [x] Test : (kana, Skill 2), prérequis [1], ContentItem(kana, Skill 1) existe + ReviewCard valide → retourné → AC4
- [x] Test : ContentItem(kana, Skill 1) existe mais ReviewCard absente → rejeté → AC5
- [x] Test : kana n'a pas de ContentItem dans Skill 1 → pas de dépendance, retourné → AC6
- [x] Ajouter la vérification : pour chaque prérequis P, si ContentItem(E, P) existe, ReviewCard(user, E, P) valide requise

### Étape 4 — Vérification des composants (TDD)

- [x] Test : mot Skill 7, composants kana tous avec ReviewCard valide dans Skill 2 → retourné → AC7
- [x] Test : un composant avec ContentItem dans prérequis mais sans ReviewCard → rejeté → AC8
- [x] Test : composant sans ContentItem dans le skill prérequis → ignoré → AC9
- [x] Ajouter la vérification des composants pour chaque prérequis

### Étape 5 — Règle grammar points (TDD)

- [ ] Test : sentence Skill 11, 1 GP → pas de vérification GP → AC10
- [ ] Test : sentence Skill 11, 2 GP, tous étudiés → OK → AC11
- [ ] Test : sentence Skill 11, 2 GP, un manquant → rejeté → AC12
- [ ] Test : mot Skill 7 (non-grammaire) → pas de vérification GP → AC13
- [ ] Ajouter la règle GP pour les skills 11-15

### Étape 6 — Queries batch dans `packages/db`

- [ ] Implémenter `ReviewCardRepo.findByUserAndContentItems(userId, contentItemIds)` → AC14
- [ ] Implémenter `ContentItemRepo.findByElementAndSkills(elementIds, skillIds)` → AC15
- [ ] Tests intégration pour chaque query

### Étape 7 — Intégration end-to-end

- [ ] Wiring : `ContentAvailability` avec les vrais repos dans `packages/db`
- [ ] Ajouter à `TestRepoLayer`
- [ ] Test intégration : kana Skill 1 nouveau → AC16
- [ ] Test intégration : kana Skill 2 + ReviewCard valide → AC17
- [ ] Test intégration : kana Skill 2 + ReviewCard expirée → AC18
- [ ] Test intégration : mot Skill 7 tout OK → AC19
- [ ] Test intégration : mot Skill 7 composant manquant → AC20
- [ ] Test intégration : sentence Skill 11, 1 GP → AC21
- [ ] Test intégration : sentence Skill 11, 2 GP manquant → AC22

### Étape 8 — Vérifications finales

- [ ] Exporter `ContentAvailability` depuis `packages/db/src/index.ts`
- [ ] `pnpm build` sans erreur → AC23
- [ ] `pnpm lint` sans erreur → AC24
- [ ] Tests existants passent (non-régression) → AC25

## Hors scope

| Élément | Raison | Sprint prévu |
|---|---|---|
| Ordre pédagogique (tri fréquence, sortOrder, rank) | US26 — Recommendation Engine | Sprint 3, Phase 2 |
| Jouabilité skill (`>= 5 items`) | Dérivé par l'appelant | US26, US29 |
| Colonnes FSRS sur ReviewCard (state, stability, difficulty) | US25 — Migrations SQL | Sprint 3, Phase 2 |
| Overdue count par skill | US26 — Recommendation Engine | Sprint 3, Phase 2 |
| Cache / matérialisation de la disponibilité | Optimisation post-MVP | Backlog |

## Références

- Sprint 3 spec — Axe 2 (Graphe de progression et disponibilité)
- `packages/domain/src/skill-graph.ts` — SkillGraph et prérequis
- `packages/domain/src/linguistic-element.ts` — types d'éléments et composants
- `packages/domain/src/content-item.ts` — ContentItem (junction element × skill)
- `packages/domain/src/review-card.ts` — ReviewCard avec `nextReviewAt`
- `_bmad-output/specs/skill-taxonomy.md` — taxonomie des 15 skills
