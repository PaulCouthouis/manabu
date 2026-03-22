# US8 — Structures de progression utilisateur

## Résumé

L'entité `ReviewCard` est créée pour supporter le SRS universel sur la paire utilisateur × contenu. En parallèle, `GrammarElement` est extrait de l'union `LinguisticElement` pour devenir `GrammarPoint`, une entité de référence pédagogique isolée. Les `SentenceElement` sont mis à jour : leurs `components` ne contiennent plus que des `WordId`, et un nouveau champ `grammarPoints` référence les `GrammarPointId` associés (nécessaire pour la mécanique de trous dans les exercices grammar au Sprint 2). Les `ContentItem` des sentences sont étendus pour couvrir les skills grammar G1-G5.

**Sprint :** Sprint 1 — Fondations
**Dépendances :** US3 (Skill types & graphe)
**Approche :** ATDD — chaque critère d'acceptance est validé par un test automatisé ou une commande vérifiable.

## Décisions architecturales

| Question | Décision | Justification |
|---|---|---|
| `UserSkillProgress` comme entité ? | Non — vue calculée | Le score de maîtrise par skill est une agrégation des review cards. Pas besoin de matérialiser avant le Sprint 3-4 quand on aura du volume et l'algo de scoring. |
| Champs spécifiques à un algo SRS (FSRS, SM-2) ? | Non — champs minimaux | L'algo SRS sera choisi au Sprint 3. Les champs internes (`stability`, `difficulty`, etc.) seront ajoutés à ce moment. |
| Création des review cards | Lazy (à la première interaction) | Une review card naît quand l'utilisateur interagit avec un content item. Pas de pré-création à l'inscription. La présence d'une review card a une sémantique : "l'utilisateur a rencontré ce contenu". |
| Exercices de grammaire : quelle unité de révision ? | La phrase, pas le grammar point | L'apprenant ne révise pas "la particule は" dans l'abstrait — il révise "私はポールです" sur le skill G1. Les sentences portent les content items grammar. |
| `GrammarElement` dans `LinguisticElement` ? | Non — entité séparée `GrammarPoint` | Un grammar point est un concept organisationnel (explication, fréquence), pas un élément exercable. Les `LinguisticElement` sont des choses qu'on présente directement dans un exercice. |
| Progression grammar : par grammar point ou par phrase ? | Par phrase | La difficulté est portée par le `sentenceRank` et la composition de la phrase. Le moteur de recommandation traite G1-G5 comme C1-C7 — progression uniforme par content items ordonnés par difficulté. |
| Lien sentence → grammar point | `grammarPoints: GrammarPointId[]` sur la sentence | Nécessaire pour la mécanique d'exercice (savoir quoi trouer dans la phrase). Le grammar point lui-même ne pointe vers rien — relation unidirectionnelle. |
| Lien sentence → grammar point en DB | Table `sentence_grammar_point` avec FK | Intégrité référentielle garantie. Requêtable au Sprint 2 pour la génération de trous. |
| Content items grammar | Portés par les sentences, pas les grammar points | Les sentences × G1-G5 = content items exercables. Les grammar points n'ont pas de content items propres. |

## Architecture

### Entité `ReviewCard`

Paire universelle SRS : un utilisateur × un content item. Indépendante de l'algorithme SRS.

```typescript
export class ReviewCard extends Schema.Class<ReviewCard>("ReviewCard")({
  id: ReviewCardIdSchema,
  userId: Schema.String,           // FK → Better Auth user.id
  contentItemId: ContentItemIdSchema, // FK → content_item.id
  createdAt: Schema.DateTimeUtc,   // Première rencontre avec ce contenu
  nextReviewAt: Schema.DateTimeUtc, // Prochaine révision planifiée (output universel de tout algo SRS)
}) {}
```

**Clé d'unicité :** `userId × contentItemId` — un utilisateur ne peut pas avoir deux review cards pour le même content item.

### Entité `GrammarPoint` (ex-`GrammarElement`)

Fiche de référence pédagogique isolée. Aucune FK sortante, aucun content item propre.

```typescript
export class GrammarPoint extends Schema.Class<GrammarPoint>("GrammarPoint")({
  id: GrammarPointIdSchema,
  name: Schema.String,
  explanation: Schema.String,
  frequency: Schema.Number,
  formCount: Schema.Number,
}) {}
```

### Modification de `SentenceElement`

Les `components` ne contiennent plus que des `WordId`. Un nouveau champ `grammarPoints` référence les grammar points illustrés par la phrase.

```typescript
export class SentenceElement extends Schema.Class<SentenceElement>("SentenceElement")({
  id: SentenceIdSchema,
  kind: kindField("sentence"),
  text: Schema.String,
  meaning: Schema.String,
  components: Schema.NonEmptyArray(WordIdSchema),       // Mots uniquement
  grammarPoints: Schema.Array(GrammarPointIdSchema),     // Grammar points illustrés
  sentenceRank: Schema.Int.pipe(Schema.between(1, 10)),
}) {}
```

### Modification de l'union `LinguisticElement`

```typescript
// Avant
export type LinguisticElement =
  | KanaElement | KanjiElement | WordElement | SentenceElement | GrammarElement

// Après
export type LinguisticElement =
  | KanaElement | KanjiElement | WordElement | SentenceElement
```

`GrammarElement` est supprimée de l'union et du fichier. `GrammarPoint` vit dans son propre module.

### Content items des sentences — extension aux skills grammar

Chaque sentence génère des content items pour les skills core **et** les skills grammar qu'elle illustre :

| Type | Skills | Logique |
|---|---|---|
| Skills core | C1-C7 (IDs 4-10) | Toutes les sentences, comme aujourd'hui |
| Skills grammar | G1-G5 (IDs 11-15) | Selon les grammar points de la phrase |

Une phrase dont les `grammarPoints` contiennent des grammar points du skill G1 (particules) aura un content item sur le skill 11. Si elle contient aussi un grammar point du skill G2 (conjugaisons), elle aura aussi un content item sur le skill 12.

### Déverrouillage des phrases (Sprint 3 — hors scope, documenté pour contexte)

Le mécanisme de déverrouillage prévu est :

1. **Phrase débloquée sur skills grammar** quand → tous les mots (`components`) ont été rencontrés par l'apprenant
2. **Phrase jouée sur un skill grammar** → review card créée
3. **Phrase débloquée sur skills core** quand → une review card existe pour cette phrase sur au moins un skill grammar

Ce mécanisme sera implémenté au Sprint 3 (moteur de recommandation). L'US8 pose les structures qui le rendent possible.

### Schéma DB

```
┌─────────────────────┐
│    grammar_point     │
├─────────────────────┤
│ id          INTEGER  │ PK
│ name        TEXT     │
│ explanation TEXT     │
│ frequency   INTEGER  │
│ form_count  INTEGER  │
└─────────────────────┘
        (aucune FK sortante)

┌──────────────────────────────┐
│    sentence_grammar_point    │
├──────────────────────────────┤
│ sentence_id      INTEGER     │ FK → linguistic_element(id)
│ grammar_point_id INTEGER     │ FK → grammar_point(id)
│ PRIMARY KEY (sentence_id, grammar_point_id)
└──────────────────────────────┘

┌──────────────────────────────┐
│         review_card          │
├──────────────────────────────┤
│ id               SERIAL      │ PK
│ user_id          TEXT        │ FK → user(id)
│ content_item_id  INTEGER     │ FK → content_item(id)
│ created_at       TIMESTAMPTZ │
│ next_review_at   TIMESTAMPTZ │
│ UNIQUE (user_id, content_item_id)
└──────────────────────────────┘
```

### Plage d'IDs `GrammarPoint`

Les grammar points conservent les mêmes IDs que les anciens `GrammarElement` (300-558). Ils migrent simplement de la table `linguistic_element` vers la table `grammar_point`.

## Critères d'acceptance

### Domaine — `GrammarPoint`

| # | Critère | Type de vérification | Étape |
|---|---|---|---|
| AC1 | `GrammarPoint` est une `Schema.Class` avec les champs `id`, `name`, `explanation`, `frequency`, `formCount` | Unitaire | 1 |
| AC2 | `GrammarPoint` n'est pas dans l'union `LinguisticElement` | Unitaire | 1 |
| AC3 | `GrammarPointId` est un branded type distinct de `LinguisticElementId` | Unitaire | 1 |

### Domaine — `SentenceElement` modifié

| # | Critère | Type de vérification | Étape |
|---|---|---|---|
| AC4 | `SentenceElement.components` n'accepte que des `WordId` (plus de `GrammarId`) | Unitaire | 2 |
| AC5 | `SentenceElement.grammarPoints` accepte un tableau de `GrammarPointId` | Unitaire | 2 |
| AC6 | `SentenceElement.grammarPoints` peut être vide (phrases sans grammaire spécifique) | Unitaire | 2 |

### Domaine — `ReviewCard`

| # | Critère | Type de vérification | Étape |
|---|---|---|---|
| AC7 | `ReviewCard` est une `Schema.Class` avec `id`, `userId`, `contentItemId`, `createdAt`, `nextReviewAt` | Unitaire | 3 |
| AC8 | `ReviewCardId` est un branded type | Unitaire | 3 |

### Données — Migration des grammar points

| # | Critère | Type de vérification | Étape |
|---|---|---|---|
| AC9 | 259 `GrammarPoint` en table `grammar_point` (même données qu'avant) | Intégration | 4 |
| AC10 | 0 lignes `kind = 'grammar'` dans `linguistic_element` après migration | Intégration | 4 |
| AC11 | Les content items qui pointaient vers des grammar elements sont supprimés | Intégration | 4 |

### Données — Sentences mises à jour

| # | Critère | Type de vérification | Étape |
|---|---|---|---|
| AC12 | `element_component` ne contient plus de liens sentence → grammar element | Intégration | 5 |
| AC13 | `sentence_grammar_point` contient les liens sentence → grammar point (même données que les anciens components grammar) | Intégration | 5 |
| AC14 | Les 2 590 sentences ont des content items sur les skills grammar appropriés (G1-G5) | Intégration | 5 |
| AC15 | Le nombre total de content items sentences inclut les skills grammar | Intégration | 5 |

### DB — Table `review_card`

| # | Critère | Type de vérification | Étape |
|---|---|---|---|
| AC16 | La table `review_card` existe avec les colonnes et FK correctes | Intégration | 3 |
| AC17 | La contrainte UNIQUE `(user_id, content_item_id)` est respectée | Intégration | 3 |

### Données domaine — Cohérence des seeds

| # | Critère | Type de vérification | Étape |
|---|---|---|---|
| AC18 | Les 259 grammar points du domaine (`grammarData`) ont les mêmes données qu'avant le refactoring | Unitaire | 4 |
| AC19 | Les 2 590 sentences du domaine ont des `components` (WordId uniquement) et `grammarPoints` (GrammarPointId) corrects | Unitaire | 5 |
| AC20 | Les tests existants des US précédentes passent toujours (non-régression) | Unitaire + Intégration | 6 |

### Build

| # | Critère | Type de vérification | Étape |
|---|---|---|---|
| AC21 | `pnpm build` compile sans erreur | CI / manuel | 6 |
| AC22 | `pnpm lint` passe sans erreur | CI / manuel | 6 |

## Étapes d'implémentation

### Étape 1 — Entité `GrammarPoint` dans le domaine

- [x] Créer `packages/domain/src/grammar-point.ts`
  - [x] Branded type `GrammarPointId` (distinct de `LinguisticElementId`)
  - [x] `Schema.Class` `GrammarPoint` avec `id`, `name`, `explanation`, `frequency`, `formCount`
- [x] Retirer `GrammarElement`, `GrammarId`, `GrammarIdSchema` de `linguistic-element.ts`
- [x] Retirer `GrammarElement` de l'union `LinguisticElement`
- [x] Mettre à jour `packages/domain/src/index.ts` (exports)
- [x] Écrire les tests unitaires (TDD) :
  - [x] Test : `GrammarPoint.make()` crée une instance valide → AC1
  - [x] Test : `GrammarPointId` est distinct de `LinguisticElementId` → AC3
  - [x] Test : `GrammarElement` n'existe plus dans l'union `LinguisticElement` → AC2

### Étape 2 — Modifier `SentenceElement`

- [x] Modifier `SentenceElement` dans `linguistic-element.ts`
  - [x] `components` → `Schema.Array(WordIdSchema)` (retirer `GrammarIdSchema` de l'union ; `Array` car certaines phrases n'ont que des grammar points)
  - [x] Ajouter `grammarPoints: Schema.Array(GrammarPointIdSchema)`
- [x] Retirer `GrammarId`/`GrammarIdSchema` de `linguistic-element.ts` (plus aucun consommateur)
- [x] Mettre à jour `sentence-data/helpers.ts` — séparer components (WordId) et grammarPoints (GrammarPointId)
- [x] Mettre à jour `sentence-data/sentence-data.test.ts` — `getGrammarIds` lit `grammarPoints`, `getWordIds` lit `components`
- [x] Mettre à jour `packages/db/src/linguistic-element-repo.ts` — séparer components dans `decodeRow`
- [x] Écrire les tests unitaires (TDD) :
  - [x] Test : `SentenceElement.make()` accepte des `components` de type `WordId` uniquement → AC4
  - [x] Test : `SentenceElement.make()` accepte des `grammarPoints` de type `GrammarPointId[]` → AC5
  - [x] Test : `SentenceElement.make()` accepte un `grammarPoints` vide → AC6

### Étape 3 — Entité `ReviewCard` + migration DB

- [ ] Créer `packages/domain/src/review-card.ts`
  - [ ] Branded type `ReviewCardId`
  - [ ] `Schema.Class` `ReviewCard` avec `id`, `userId`, `contentItemId`, `createdAt`, `nextReviewAt`
- [ ] Mettre à jour `packages/domain/src/index.ts` (exports)
- [ ] Créer la migration `packages/db/src/migrations/0011_review_card.ts`
  - [ ] Table `review_card` avec colonnes, FK vers `user(id)` et `content_item(id)`, contrainte UNIQUE
- [ ] Écrire les tests unitaires (TDD) :
  - [ ] Test : `ReviewCard.make()` crée une instance valide → AC7
  - [ ] Test : `ReviewCardId` est un branded type → AC8
- [ ] Écrire les tests d'intégration (Vitest + Testcontainers) :
  - [ ] Test : table `review_card` créée avec les bonnes colonnes et FK → AC16
  - [ ] Test : contrainte UNIQUE `(user_id, content_item_id)` empêche les doublons → AC17

### Étape 4 — Migration des grammar points

- [ ] Créer la migration `packages/db/src/migrations/0012_grammar_point.ts`
  - [ ] Créer la table `grammar_point`
  - [ ] Migrer les 259 lignes `kind = 'grammar'` de `linguistic_element` vers `grammar_point`
  - [ ] Supprimer les content items pointant vers les anciens grammar elements
  - [ ] Supprimer les lignes `kind = 'grammar'` de `linguistic_element`
- [ ] Adapter `packages/domain/src/grammar-data/` pour exporter des `GrammarPoint` au lieu de `GrammarElement`
  - [ ] Modifier le helper et les fichiers skill-11 à skill-15
  - [ ] Vérifier que les 259 grammar points ont les mêmes données
- [ ] Écrire les tests d'intégration :
  - [ ] Test : 259 grammar points dans `grammar_point` → AC9
  - [ ] Test : 0 lignes `kind = 'grammar'` dans `linguistic_element` → AC10
  - [ ] Test : aucun content item orphelin vers un grammar element → AC11
- [ ] Écrire les tests unitaires :
  - [ ] Test : `grammarData` contient les 259 grammar points avec les mêmes données → AC18

### Étape 5 — Migration des sentences et content items grammar

- [ ] Créer la migration `packages/db/src/migrations/0013_sentence_grammar_point.ts`
  - [ ] Créer la table `sentence_grammar_point`
  - [ ] Migrer les liens grammar depuis `element_component` vers `sentence_grammar_point`
  - [ ] Supprimer les anciens liens sentence → grammar dans `element_component`
  - [ ] Créer les content items sentences × skills grammar (G1-G5)
- [ ] Adapter `packages/domain/src/sentence-data/` :
  - [ ] Modifier le helper `s()` pour séparer `components` (WordId[]) et `grammarPoints` (GrammarPointId[])
  - [ ] Mettre à jour tous les fichiers de données (skill-11 à skill-15)
- [ ] Écrire les tests d'intégration :
  - [ ] Test : `element_component` ne contient plus de liens vers des grammar points → AC12
  - [ ] Test : `sentence_grammar_point` contient les bons liens → AC13
  - [ ] Test : les sentences ont des content items sur les skills grammar appropriés → AC14
  - [ ] Test : nombre total de content items correct → AC15
- [ ] Écrire les tests unitaires :
  - [ ] Test : les 2 590 sentences ont des `components` WordId-only et des `grammarPoints` corrects → AC19

### Étape 6 — Vérifications finales et non-régression

- [ ] Vérifier que tous les tests existants passent → AC20
- [ ] `pnpm build` compile sans erreur → AC21
- [ ] `pnpm lint` passe sans erreur → AC22

## Impact sur les US précédentes

| US impactée | Fichiers touchés | Nature du changement |
|---|---|---|
| US7 (Seed grammaire) | `grammar-data/*.ts`, migration 0009 | `GrammarElement` → `GrammarPoint`, données identiques |
| US7 BIS (Seed sentences) | `sentence-data/*.ts`, migration 0010 | `components` splitté en `components` + `grammarPoints`, content items étendus aux skills grammar |

## Hors scope

| Élément | Raison | Sprint prévu |
|---|---|---|
| Algorithme SRS (FSRS, SM-2) | Choix reporté — les champs internes seront ajoutés avec l'algo | Sprint 3 |
| Moteur de recommandation | Logique de sélection d'exercice | Sprint 3 |
| Scoring / montée-descente de maîtrise | Logique de scoring | Sprint 3 |
| `UserSkillProgress` matérialisé | Vue calculée suffisante, matérialisation si besoin de performance | Sprint 3-4 |
| Carte radar | Visualisation | Sprint 4 |
| Sessions d'exercice | Composant d'exercice | Sprint 2 |
| Mécanique de trous dans les exercices grammar | Utilise `grammarPoints` mais c'est de la logique d'affichage | Sprint 2 |
| Déverrouillage des phrases | Logique de recommandation | Sprint 3 |
