# US7 BIS — Seed data sentences

## Résumé

2 590 phrases d'exemple japonaises (10 par point de grammaire × 259 grammar points) sont générées et chargées en base. Chaque phrase suit une matrice de difficulté à deux axes : bande de fréquence lexicale (top 1000 à 5000) et densité grammaticale (1 à 3 grammar points). La génération est semi-automatique par IA avec validation automatique des contraintes. Chaque `SentenceElement` est associé aux skill types core pertinents via des `ContentItem`.

**Sprint :** Sprint 1 — Fondations
**Dépendances :** US7 (Seed grammaire), US6 (Seed vocabulaire)
**Approche :** ATDD — chaque critère d'acceptance est validé par un test automatisé ou une commande vérifiable.

## Architecture

### Matrice de difficulté — 10 phrases par grammar point

Chaque grammar point (ID 300-558) génère exactement 10 phrases d'exemple, classées par difficulté croissante selon deux axes orthogonaux :

| Rank | Bande de fréquence mots | Nb grammar points | Contrainte grammar |
|---|---|---|---|
| 1 | Top 1000 | 1 | Courant seul |
| 2 | Top 2000 | 1 | Courant seul |
| 3 | Top 3000 | 1 | Courant seul |
| 4 | Top 4000 | 1 | Courant seul |
| 5 | Top 5000 | 1 | Courant seul |
| 6 | Top 1000 | 2 | Les 2 du même skill |
| 7 | Top 3000 | 2 | Les 2 du même skill |
| 8 | Top 5000 | 2 | Skills différents |
| 9 | Top 3000 | 3 | Courant + 1 même skill + 1 skill différent |
| 10 | Top 5000 | 3 | Chacun d'un skill différent |

**Axes de progression :**
- **Ranks 1-5** : vocabulaire croissant, grammaire isolée → l'apprenant se concentre sur le pattern grammatical
- **Ranks 6-7** : combinaison intra-skill → grammaire thématiquement liée
- **Rank 8** : première combinaison inter-skills → pont vers le transfert
- **Ranks 9-10** : combinaisons complexes inter-skills → usage réel de la langue

**Volume total :** 259 grammar points × 10 phrases = **2 590 sentences**

### Bandes de fréquence et IDs des mots

| Bande | Fichier source | IDs | Signification "Top N" |
|---|---|---|---|
| Top 1000 | `word-data/freq-01.ts` | 5000-5999 | Mots de freq-01 uniquement |
| Top 2000 | `word-data/freq-01.ts` + `freq-02.ts` | 5000-6999 | Mots de freq-01 + freq-02 |
| Top 3000 | `freq-01.ts` à `freq-03.ts` | 5000-7999 | Mots de freq-01 à freq-03 |
| Top 4000 | `freq-01.ts` à `freq-04.ts` | 5000-8999 | Mots de freq-01 à freq-04 |
| Top 5000 | `freq-01.ts` à `freq-05.ts` | 5000-9999 | Mots de freq-01 à freq-05 |

Les counter words (IDs 10000-10051) sont également disponibles pour toutes les bandes.

### Plage d'IDs sentences

| Plage | Usage |
|---|---|
| 70001-72590 | SentenceElements (259 × 10) |

Convention : pour le grammar point d'ID `G` (300-558), les 10 sentences ont les IDs `70001 + (G - 300) * 10` à `70001 + (G - 300) * 10 + 9`.

### Modification du domaine — `sentenceRank`

Le `SentenceElement` est enrichi d'un champ `sentenceRank` :

```typescript
export class SentenceElement extends Schema.Class<SentenceElement>("SentenceElement")({
  id: SentenceIdSchema,
  kind: kindField("sentence"),
  text: Schema.String,
  meaning: Schema.String, // en anglais

  components: Schema.NonEmptyArray(Schema.Union(WordIdSchema, GrammarIdSchema)),
  sentenceRank: Schema.Int.pipe(Schema.between(1, 10)),
}) {}
```

### Sémantique de `components`

Les `components` d'une `SentenceElement` représentent le **graphe de dépendances pédagogiques**, pas une tokenisation morphologique exhaustive de la phrase.

**Inclus dans `components` :**
- Les `WordId` des mots de contenu (forme dictionnaire) utilisés dans la phrase et présents dans les seeds
- Les `GrammarId` des points de grammaire illustrés par la phrase

**Exclus de `components` (présents dans la phrase mais non référencés) :**
- Particules grammaticales (は, が, を, に, で...)
- Formes conjuguées — la phrase contient 食べています mais le component référence le `WordId` de 食べる (forme dictionnaire)
- Copules (です, だ...)
- Mots contextuels libres pour le **skill 15 uniquement** (le nom qu'on compte dans une phrase de compteur, ex: 犬 dans 犬を3匹飼っています, si 犬 n'est pas dans la bande de fréquence requise)

### Exception skill 15 — mots libres pour les compteurs

Pour les grammar points du skill 15 (compteurs & temps, IDs 515-558), les phrases peuvent contenir des mots de contenu **non seedés** si :
- Le mot sert de **support contextuel au compteur** (le nom qu'on compte)
- Le focus pédagogique est sur le pattern nombre+compteur, pas sur le nom

Ces mots libres ne sont **pas** référencés dans `components` et ne sont **pas** soumis à la contrainte de bande de fréquence.

**Pour tous les autres skills (11-14)**, la contrainte est stricte : chaque mot de contenu de la phrase doit correspondre à un `WordId` seedé dans la bande de fréquence autorisée par le rank.

### Associations skill types (ContentItems)

Chaque sentence génère des `ContentItem` pour les skills core où elle est exercable :

| Skill core | Description | Applicable si |
|---|---|---|
| 4 | Lecture → prononciation | Toujours |
| 5 | Lecture → sens | Toujours |
| 6 | Rappel productif | Toujours |
| 7 | Perception audio | Toujours |
| 8 | Compréhension orale | Toujours |

**Total ContentItems :** 2 590 × 5 = **12 950**

## Processus de génération semi-automatique

### Pipeline de génération

```
Étape 1: Script de contraintes
    → Pour chaque grammar point × rank, produit un JSON avec :
       - Grammar point principal (ID, name, pattern)
       - Grammar points secondaires éligibles (même skill / autre skill selon rank)
       - Liste exhaustive des WordIds éligibles (par bande de fréquence)
       - Mots avec leur forme écrite et meaning

Étape 2: Génération IA
    → Prompt structuré envoyé au LLM avec les contraintes
    → Le LLM produit pour chaque phrase :
       {
         "text": "犬が好きです",
         "meaning": "I like dogs",
         "words": [
           { "surface": "犬", "dictionaryForm": "犬", "wordId": 10042 },
           { "surface": "好き", "dictionaryForm": "好き", "wordId": 10187 }
         ],
         "grammarPoints": [50012],
         "freeParticles": ["が", "です"]
       }

Étape 3: Validation automatique
    → Vérifie pour chaque phrase :
       ✓ Chaque wordId existe dans les seeds
       ✓ Chaque wordId est dans la bonne bande de fréquence pour le rank
       ✓ Chaque grammarId existe dans les seeds
       ✓ Les grammar points respectent la contrainte de skill (même/différent)
       ✓ words + freeParticles couvrent toute la phrase (pas de mot orphelin)
       ✓ Exception skill 15 : mots libres autorisés pour les noms comptés
       ✓ La phrase est non vide et le meaning est non vide

Étape 4: Écriture des fichiers TypeScript
    → Fichiers sentence-data/skill-{11-15}.ts
    → Helper s() similaire au g() de la grammaire
```

### Contraintes pour le prompt IA

Le prompt doit exiger :
- **Naturalité** : la phrase doit être quelque chose qu'un Japonais dirait réellement, pas une construction artificielle de manuel
- **Contexte réaliste** : situations quotidiennes (conversation, travail, école, achats, voyages...)
- **Meaning en anglais** : le champ `meaning` est toujours en anglais (cohérent avec les `WordElement` et `GrammarElement` existants)
- **Déclaration explicite** : chaque mot de contenu est déclaré avec son `WordId` et sa forme dictionnaire
- **Couverture vérifiable** : l'union de `words` + `freeParticles` doit reconstituer la phrase complète
- **Aucun mot de contenu hors catalogue** : si un nom, verbe, adjectif ou adverbe n'est pas dans les seeds de la bande autorisée, il ne peut pas être utilisé (sauf exception skill 15)

## Critères d'acceptance

### Domaine — SentenceElement

| # | Critère | Type de vérification | Étape |
|---|---|---|---|
| AC1 | `SentenceElement` a un champ `sentenceRank` typé `Int` entre 1 et 10 | Unitaire | 0 |
| AC2 | Le schéma rejette un `sentenceRank` de 0, 11, ou 1.5 | Unitaire | 0 |

### Données sentences

| # | Critère | Type de vérification | Étape |
|---|---|---|---|
| AC3 | 2 590 SentenceElements au total (259 × 10) | Unitaire | 3 |
| AC4 | IDs continus 70001-72590, pas de trou ni doublon | Unitaire | 3 |
| AC5 | Chaque grammar point (300-558) a exactement 10 sentences | Unitaire | 3 |
| AC6 | Pour chaque sentence, `sentenceRank` va de 1 à 10 (les 10 ranks couverts par grammar point) | Unitaire | 3 |
| AC7 | `text` et `meaning` non vides pour chaque sentence | Unitaire | 3 |
| AC8 | Tous les `WordId` dans `components` existent dans les seeds (word-data ou counter-word-data) | Unitaire | 3 |
| AC9 | Tous les `GrammarId` dans `components` existent dans les seeds (grammar-data) | Unitaire | 3 |

### Contraintes de bande de fréquence

| # | Critère | Type de vérification | Étape |
|---|---|---|---|
| AC10 | Ranks 1, 6 : tous les WordId dans components sont dans freq-01 (5000-5999) ou counter words | Unitaire | 3 |
| AC11 | Rank 2 : tous les WordId dans components sont dans freq-01 à freq-02 (5000-6999) ou counter words | Unitaire | 3 |
| AC12 | Ranks 3, 7, 9 : tous les WordId dans components sont dans freq-01 à freq-03 (5000-7999) ou counter words | Unitaire | 3 |
| AC13 | Rank 4 : tous les WordId dans components sont dans freq-01 à freq-04 (5000-8999) ou counter words | Unitaire | 3 |
| AC14 | Ranks 5, 8, 10 : tous les WordId dans components sont dans freq-01 à freq-05 (5000-9999) ou counter words | Unitaire | 3 |

### Contraintes grammaticales

| # | Critère | Type de vérification | Étape |
|---|---|---|---|
| AC15 | Ranks 1-5 : exactement 1 GrammarId dans components (le grammar point courant) | Unitaire | 3 |
| AC16 | Ranks 6-7 : exactement 2 GrammarIds, les 2 du même skill | Unitaire | 3 |
| AC17 | Rank 8 : exactement 2 GrammarIds, de skills différents | Unitaire | 3 |
| AC18 | Rank 9 : exactement 3 GrammarIds — le courant + 1 du même skill + 1 d'un skill différent | Unitaire | 3 |
| AC19 | Rank 10 : exactement 3 GrammarIds, chacun d'un skill différent | Unitaire | 3 |

### Migration

| # | Critère | Type de vérification | Étape |
|---|---|---|---|
| AC20 | Chaque SentenceElement a exactement 5 ContentItems (skills 4, 5, 6, 7, 8) | Intégration | 4 |
| AC21 | 12 950 ContentItems sentences au total (2 590 × 5) | Intégration | 4 |
| AC22 | Aucun ContentItem en doublon (contrainte UNIQUE respectée) | Intégration | 4 |
| AC23 | Round-trip : seed → lecture via SQL → données correctes | Intégration | 4 |

### Build

| # | Critère | Type de vérification | Étape |
|---|---|---|---|
| AC24 | `pnpm build` compile sans erreur | CI / manuel | 5 |

## Étapes d'implémentation

### Étape 0 — Modifier le domaine (sentenceRank)

- [x] Ajouter `sentenceRank: Schema.Int.pipe(Schema.between(1, 10))` au `SentenceElement` dans `packages/domain/src/linguistic-element.ts`
- [x] Écrire les tests unitaires (TDD) :
  - [x] Test : `SentenceElement.make()` accepte un `sentenceRank` de 1, 5, 10 → AC1
  - [x] Test : `SentenceElement.make()` rejette un `sentenceRank` de 0, 11, ou 1.5 → AC2

### Étape 1 — Script de génération des contraintes

- [x] Créer `scripts/generate-sentence-constraints.ts`
  - [x] Pour chaque grammar point (300-558) × rank (1-10), produire un objet JSON :
    - Grammar point principal (ID, name, explanation)
    - Grammar points secondaires éligibles (filtrés par contrainte de skill selon le rank)
    - Liste exhaustive des WordIds éligibles (filtrés par bande de fréquence selon le rank)
    - Chaque mot avec sa forme `written` et son `meaning`
  - [x] Exporter le résultat en fichier JSON pour consommation par le prompt IA

### Étape 2 — Génération IA des phrases

- [ ] Créer le prompt structuré pour la génération IA
  - [ ] Inclure les contraintes de naturalité et de contexte réaliste
  - [ ] Exiger la déclaration explicite de chaque mot avec son `WordId`
  - [ ] Exiger la couverture complète (words + freeParticles = phrase entière)
  - [ ] Documenter l'exception skill 15 (mots libres pour les compteurs)
- [ ] Exécuter la génération par batchs (par skill, par rank)
- [ ] Collecter les résultats en fichiers JSON intermédiaires

### Étape 3 — Validation et fichiers de données

- [ ] Créer `scripts/validate-sentences.ts`
  - [ ] Vérifier l'intégrité référentielle de chaque WordId et GrammarId → AC8, AC9
  - [ ] Vérifier les contraintes de bande de fréquence → AC10-AC14
  - [ ] Vérifier les contraintes grammaticales (nombre et skill des grammar points) → AC15-AC19
  - [ ] Vérifier la couverture phrase (words + freeParticles)
  - [ ] Exception skill 15 : tolérer les mots libres pour les noms comptés
- [ ] Exécuter la validation et corriger les phrases non conformes
- [ ] Créer les fichiers de données `packages/domain/src/sentence-data/`
  - [ ] `skill-11.ts` — 800 sentences (80 grammar points × 10)
  - [ ] `skill-12.ts` — 930 sentences (93 grammar points × 10)
  - [ ] `skill-13.ts` — 280 sentences (28 grammar points × 10)
  - [ ] `skill-14.ts` — 140 sentences (14 grammar points × 10)
  - [ ] `skill-15.ts` — 440 sentences (44 grammar points × 10)
  - [ ] `index.ts` — agrège tous les fichiers → `export const sentenceData`
  - [ ] Helper `s()` pour construire les `SentenceElement.make()` de manière concise
- [ ] Écrire les tests unitaires (TDD) sur le dataset agrégé :
  - [ ] Test : 2 590 SentenceElements au total → AC3
  - [ ] Test : IDs continus 70001-72590 → AC4
  - [ ] Test : chaque grammar point a exactement 10 sentences → AC5
  - [ ] Test : les 10 ranks sont couverts pour chaque grammar point → AC6
  - [ ] Test : `text` et `meaning` non vides → AC7
  - [ ] Test : tous les WordId dans components existent → AC8
  - [ ] Test : tous les GrammarId dans components existent → AC9
  - [ ] Test : contraintes de bande de fréquence respectées → AC10-AC14
  - [ ] Test : contraintes grammaticales respectées → AC15-AC19

### Étape 4 — Migration seed sentences

- [ ] Créer la migration `0010_seed_sentences.ts`
  - [ ] Insérer les 2 590 SentenceElements via SQL (batchs de 500)
  - [ ] Insérer les composants dans `element_component`
  - [ ] Créer les 12 950 ContentItems (2 590 × 5 skills core)
- [ ] Écrire les tests d'intégration (Vitest + Testcontainers) :
  - [ ] Test : chaque SentenceElement a exactement 5 ContentItems → AC20
  - [ ] Test : 12 950 ContentItems au total → AC21
  - [ ] Test : aucun ContentItem en doublon → AC22
  - [ ] Test : round-trip seed → lecture → données correctes → AC23

### Étape 5 — Vérifications finales

- [ ] `pnpm build` compile sans erreur → AC24
- [ ] Vérifier que les tests US7 existants passent toujours

## Sources de données

| Source | Usage | Licence |
|---|---|---|
| **Seeds existants** (word-data, grammar-data) | Contraintes de vocabulaire et grammaire | Interne |
| **Génération IA** (LLM) | Production des phrases japonaises | N/A |
| **JMdict** (EDRDG) | Vérification de naturalité | CC-BY-SA 4.0 |

## Hors scope

| Élément | Raison | US/Sprint prévu |
|---|---|---|
| Génération dynamique de phrases au runtime | Le seed est statique, suffisant pour le MVP | Post-MVP |
| Audio des phrases | Pas de TTS pour l'instant | Sprint 4-5 |
| Analyse morphologique automatique | Le mapping mot→WordId est déclaratif dans les données | Post-MVP |
| Phrases pour les skills fondamentaux (kana, kanji) | Les kana/kanji n'ont pas de contexte phrastique | N/A |

## Décisions architecturales prises

| Question | Décision | Justification |
|---|---|---|
| Volume de phrases par grammar point | 10 phrases, matrice fixe | Progression sur 2 axes (lexique, densité grammaticale), variété suffisante pour le SRS |
| Génération manuelle vs IA | Semi-automatique (IA + validation) | 2 590 phrases trop volumineux pour du full-manuel, mais les contraintes sont suffisamment formalisées pour être vérifiables |
| `sentenceRank` explicite vs implicite | Champ explicite `between(1, 10)` | Requêtes directes par difficulté au Sprint 2, pas besoin de dériver |
| `components` = tokenisation complète | Non — `components` = dépendances pédagogiques | Particules, conjugaisons, copules ne sont pas des prérequis d'apprentissage trackés |
| Mots hors catalogue | Interdits sauf skill 15 (compteurs) | La bande de fréquence contrôle la difficulté lexicale, sauf pour les noms comptés qui sont du contexte |
| Plage d'IDs | 70001-72590 | Cohérent avec les conventions (kana 1000+, kanji 3000+, words 5000+, grammar 300+) |
| Skills core associés | 5 skills (4, 5, 6, 7, 8) | Les phrases sont exercables en lecture, compréhension, rappel et audio |
