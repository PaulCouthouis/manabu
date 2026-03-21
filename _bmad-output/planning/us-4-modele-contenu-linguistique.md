# US4 — Modèle de contenu linguistique

## Résumé

Le contenu linguistique est modélisé à deux niveaux : les **éléments linguistiques** (données brutes de la langue japonaise) et les **content items** (instances d'exercice associant un élément à un skill type). Les éléments linguistiques sont une union discriminée à 5 sous-types (Kana, Kanji, Word, Sentence, Grammar), chacun avec ses données spécifiques et son système de difficulté adapté. Les content items sont des paires 1:1 élément×skill qui servent de base au SRS et au scoring.

**Sprint :** Sprint 1 — Fondations
**Dépendances :** US3 (Skill types & graphe de dépendances)
**Approche :** ATDD — chaque critère d'acceptance est validé par un test automatisé ou une commande vérifiable.

## Architecture

### Modèle à deux niveaux

Le contenu est séparé en deux entités distinctes :

- **LinguisticElement** — la donnée linguistique brute (un kanji, un mot, etc.). C'est une vérité linguistique indépendante des skills.
- **ContentItem** — une paire (élément, skill type) qui représente une instance d'exercice concrète. Chaque ContentItem a son propre état SRS futur.

Un même élément linguistique (ex: 猫) peut générer plusieurs ContentItems (猫 × skill 5, 猫 × skill 7, etc.), mais chaque ContentItem est lié à **exactement un** élément et **exactement un** skill type. Pas de many-to-many.

### Pourquoi pas de many-to-many

Le SRS (Sprint 3) traquera la maîtrise de chaque paire exercice/réponse. Connaître 猫 en écoute (skill 6) ne signifie pas le connaître en lecture kanji (skill 5) — ce sont des compétences cognitives distinctes (Nation 2001). Chaque ContentItem doit pouvoir avoir son propre historique de révisions indépendant.

### Union discriminée — LinguisticElement

Les 5 sous-types ont des données et des invariants fondamentalement différents :

```
LinguisticElement (kind discriminant)
  ├── KanaElement       — syllabaire, scope fini
  ├── KanjiElement      — idéogramme, graphe de composants récursif
  ├── WordElement       — mot, composé de kana + kanji
  ├── SentenceElement   — phrase, composée de mots + grammaire
  └── GrammarElement    — point de grammaire, noeud terminal
```

### Graphe de composants

Chaque type (sauf Grammar) référence ses composants, formant un DAG multi-niveaux :

```
Niveau 0 : KanaElement (あ, い, べ, る...)
    ↓ composent
Niveau 1 : KanjiElement (食, 学, 子...) — eux-mêmes composés de kanji plus simples
    ↓ composent (avec des kana)
Niveau 2 : WordElement (食べる = [食, べ, る])
    ↓ composent (avec des grammar)
Niveau 3 : SentenceElement (猫が好きです = [猫, 好き, です, が])
```

Ce graphe sert à l'**ordonnancement** : l'app présente un élément quand l'apprenant connaît ses composants. La **difficulté** sert au **scoring** (impact sur la progression après réponse), pas à l'ordonnancement.

### Difficulté par type

Chaque type a son propre système de difficulté adapté à sa nature linguistique :

| Type | Axe 1 | Axe 2 | Notes |
|---|---|---|---|
| Kana | `sortOrder` (ordre gojūon) | — | Pas de score séparé, la difficulté EST l'ordre |
| Kanji | `frequency` (rang BCCWJ caractère) | `strokeCount` (nombre de traits) | `componentCount` calculé depuis `components`, pas stocké |
| Word | `frequency` (rang BCCWJ lemme) | — | Mora count calculable à la volée depuis `written` |
| Sentence | — | — | 100% dérivé des composants (mots + grammaire) |
| Grammar | `frequency` (rang fréquence manuels) | `formCount` (nombre de formes/exceptions) | |

### Structure des fichiers

```
packages/
  domain/
    src/
      linguistic-element.ts    # LinguisticElementId, union discriminée, 5 sous-types
      content-item.ts          # ContentItem, ContentItemId
  db/
    src/
      migrations/
        XXXX_linguistic_element.ts   # Table linguistic_element
        XXXX_content_item.ts         # Table content_item
      repositories/
        linguistic-element-repo.ts   # LinguisticElementRepo Effect Service
        content-item-repo.ts         # ContentItemRepo Effect Service
```

## Modèle domaine détaillé

### KanaElement

| Champ | Type | Description | Exemple |
|---|---|---|---|
| `character` | string | Le caractère kana | "あ" |
| `kanaType` | `"hiragana" \| "katakana"` | Système d'écriture | "hiragana" |
| `sortOrder` | number | Ordre gojūon = rang de difficulté | 1 |

### KanjiElement

| Champ | Type | Description | Exemple (学) |
|---|---|---|---|
| `character` | string | Le kanji | "学" |
| `meanings` | string[] | Sens (en anglais) | ["study", "learning"] |
| `components` | KanjiId[] | Kanji-composants (FK récursive) | [id de 子] |
| `frequency` | number | Rang BCCWJ caractère | 150 |
| `strokeCount` | number | Nombre de traits | 8 |

Les `components` créent un **mini-graphe de dépendances à l'intérieur du skill 5** : l'app présente 学 quand l'apprenant a déjà vu 子. Les kanji de base (木, 日, 人...) ont `components: []`.

### WordElement

| Champ | Type | Description | Exemple (食べる) |
|---|---|---|---|
| `written` | string | Forme écrite naturelle | "食べる" |
| `meaning` | string | Sens pour le QCM | "to eat" |
| `components` | LinguisticElementId[] | Kana + kanji composants | [id(食), id(べ), id(る)] |
| `frequency` | number | Rang BCCWJ lemme | 50 |

Les `components` mélangent KanjiElements et KanaElements. Un mot tout en kana (すごい) n'a que des KanaElements. Un mot katakana (ラーメン) n'a que des KanaElements katakana — le système déduit automatiquement le type de mot par ses composants.

### SentenceElement

| Champ | Type | Description | Exemple |
|---|---|---|---|
| `text` | string | La phrase complète | "猫が好きです" |
| `meaning` | string | Traduction | "I like cats" |
| `components` | LinguisticElementId[] | WordElements + GrammarElements | [id(猫), id(好き), id(です), id(が)] |

Pas de score de difficulté — 100% dérivé des composants. Le nombre de mots et de points de grammaire mobilisés sont calculables.

Note : les SentenceElements pourraient être **générés dynamiquement** au Sprint 2-3 à partir des mots connus de l'apprenant et du point de grammaire ciblé, plutôt que pré-fabriqués en seed data.

### GrammarElement

| Champ | Type | Description | Exemple |
|---|---|---|---|
| `name` | string | Nom du point de grammaire | "が (subject marker)" |
| `explanation` | string | Explication courte | "Marks the subject of a sentence" |
| `frequency` | number | Rang de fréquence (manuels) | 1 |
| `formCount` | number | Nombre de formes/exceptions | 1 |

Le GrammarElement est un **noeud terminal** dans le graphe de composants — il est référencé par les SentenceElements mais ne référence rien. Pas de `components`.

### ContentItem

| Champ | Type | Description | Exemple |
|---|---|---|---|
| `linguisticElementId` | FK | Référence vers le LinguisticElement | id de 猫 (KanjiElement) |
| `skillTypeId` | FK | Référence vers le SkillType | id du skill 5 |

Contrainte UNIQUE(linguisticElementId, skillTypeId) — un même élément ne peut pas avoir deux ContentItems pour le même skill.

Le ContentItem n'a pas de score de difficulté propre — il hérite de la difficulté de son LinguisticElement. Il n'a pas non plus de données d'exercice (stimulus, distracteurs, audio) — celles-ci seront ajoutées au Sprint 2 quand on construira les composants d'exercice.

## Critères d'acceptance

| # | Critère | Type de vérification | Étape |
|---|---|---|---|
| AC1 | Les 5 sous-types de LinguisticElement sont modélisés avec union discriminée | Unitaire (Vitest) | 1 |
| AC2 | Le graphe de composants des KanjiElements est un DAG valide (pas de cycle) | Unitaire (Vitest) | 1 |
| AC3 | Le graphe de composants des WordElements référence correctement des KanaElements et KanjiElements | Unitaire (Vitest) | 1 |
| AC4 | Le graphe de composants des SentenceElements référence correctement des WordElements et GrammarElements | Unitaire (Vitest) | 1 |
| AC5 | Un ContentItem associe exactement un LinguisticElement et un SkillType (1:1) | Unitaire (Vitest) | 1 |
| AC6 | La contrainte UNIQUE(elementId, skillTypeId) empêche les doublons de ContentItem | Intégration (Vitest + Testcontainers) | 2 |
| AC7 | Les LinguisticElements sont persistés en base et queryables par kind | Intégration (Vitest + Testcontainers) | 2 |
| AC8 | Les ContentItems sont persistés en base et queryables par skill type | Intégration (Vitest + Testcontainers) | 2 |
| AC9 | Round-trip SQL : persister un élément de chaque sous-type, le relire avec le bon type et les bons composants | Intégration (Vitest + Testcontainers) | 2 |
| AC10 | `pnpm build` compile sans erreur | CI / manuel | 3 |

## Étapes d'implémentation

### Étape 1 — Modèle domaine

- [x] Définir `LinguisticElementId` (branded type) dans `packages/domain/src/linguistic-element.ts`
- [x] Définir les sous-types `KanaElement`, `KanjiElement`, `WordElement`, `SentenceElement`, `GrammarElement` avec `Schema.Class`
- [x] Définir l'union discriminée `LinguisticElement` avec le champ `kind`
- [x] Définir `ContentItemId` (branded type) et `ContentItem` dans `packages/domain/src/content-item.ts`
- [x] Écrire les tests unitaires (TDD) :
  - [x] Test : chaque sous-type se construit correctement avec ses champs → AC1
  - [x] Test : le graphe de composants kanji est un DAG valide → AC2
  - [x] Test : les composants d'un WordElement sont des KanaElements/KanjiElements → AC3
  - [x] Test : les composants d'un SentenceElement sont des WordElements/GrammarElements → AC4
  - [x] Test : un ContentItem lie un élément et un skill → AC5

### Étape 2 — Persistance SQL

- [ ] Créer la migration pour la table `linguistic_element` (id, kind, + colonnes par sous-type)
- [ ] Créer la table de jointure `kanji_component` (kanji_id FK, component_id FK) pour les composants kanji récursifs
- [ ] Créer la table de jointure `element_component` (element_id FK, component_id FK) pour les composants des mots et phrases
- [ ] Créer la migration pour la table `content_item` (id, element_id FK, skill_type_id FK, UNIQUE)
- [ ] Implémenter `LinguisticElementRepo` comme Effect Service dans `packages/db`
  - [ ] Valider à l'insertion que les composants d'un KanjiElement sont bien des kanji
  - [ ] Valider à l'insertion que les composants d'un WordElement sont bien des kana ou kanji
  - [ ] Valider à l'insertion que les composants d'un SentenceElement sont bien des mots ou grammaire
- [ ] Implémenter `ContentItemRepo` comme Effect Service dans `packages/db`
- [ ] Écrire les tests d'intégration (Vitest + Testcontainers) :
  - [ ] Test : la contrainte UNIQUE empêche les doublons → AC6
  - [ ] Test : les éléments sont queryables par kind → AC7
  - [ ] Test : les content items sont queryables par skill type → AC8
  - [ ] Test : round-trip complet (persist + read) pour chaque sous-type avec composants → AC9
  - [ ] Test : l'insertion d'un KanjiElement avec un composant non-kanji échoue
  - [ ] Test : l'insertion d'un WordElement avec un composant non-kana/kanji échoue
  - [ ] Test : l'insertion d'un SentenceElement avec un composant non-word/grammar échoue

### Étape 3 — Vérifications finales

- [ ] `pnpm build` compile sans erreur → AC10
- [ ] Mise à jour du CLAUDE.md si nécessaire

## Hors scope

| Élément | Raison | US/Sprint prévu |
|---|---|---|
| Seed data kana (~240) | US séparée | US5 |
| Seed data vocabulaire (~200 mots + kanji) | US séparée | US6 |
| Seed data grammaire (~50 points) | US séparée | US7 |
| Données spécifiques à l'exercice (audio, distracteurs) | Sprint 2 | Sprint 2 |
| Union discriminée sur ContentItem par format | Sprint 2 | Sprint 2 |
| Logique SRS / historique de révisions | Sprint 3 | Sprint 3 |
| Moteur de scoring (utilisation de la difficulté) | Sprint 3 | Sprint 3 |
| Génération dynamique de phrases | Sprint 2-3 | Sprint 2-3 |
| Relation grammaire → instances core (déverrouillage) | À déterminer | US7 ou Sprint 3 |

## Décisions architecturales prises

| Question | Décision | Justification |
|---|---|---|
| Modèle unifié ou union discriminée ? | Union discriminée à 5 sous-types | Les types ont des invariants fondamentalement différents (un kana n'a pas de lectures on/kun) |
| Many-to-many content↔skill ou 1:1 ? | 1:1 strict — un ContentItem = une paire élément×skill | Le SRS traque la maîtrise par paire exercice/réponse. Connaître 猫 en écoute ≠ le connaître en lecture. |
| Kanji vs Word | Deux entités distinctes | 猫-kanji (skill 5) et 猫-mot (skills core) sont cognitivement différents. Un kanji peut ne pas être un mot autonome (学). |
| Graphe de composants | Chaque type référence ses composants (sauf Grammar) | L'ordonnancement émerge du graphe. Permet des prérequis intra-skill (ex: 子 avant 学 dans le skill 5). |
| Difficulté : rôle | Scoring (pas ordonnancement) | L'ordonnancement est géré par le graphe de composants. La difficulté pondère l'impact sur la progression de l'apprenant. |
| Difficulté : axes par type | Système adapté par type (pas 3 axes universels) | Les axes n'ont pas le même sens pour tous les types (fréquence BCCWJ n'a pas de sens pour une phrase). |
| Score de difficulté kana | Pas de score séparé — `sortOrder` suffit | Les kana s'apprennent dans l'ordre gojūon, la difficulté est l'ordre lui-même. |
| Score de difficulté sentence | Pas de score stocké — dérivé des composants | La difficulté d'une phrase = f(difficulté mots, nb points grammaire, longueur). Tout est calculable. |
| Données d'exercice sur ContentItem | Reporté au Sprint 2 | YAGNI — le Sprint 1 pose la structure, les données d'exercice viendront avec les composants UI. |
| `componentCount` / `moraCount` | Calculés, pas stockés | Ne pas stocker ce qui est dérivable. Le moteur de recommandation calcule à la volée. |

## Risques

| Risque | Impact | Mitigation |
|---|---|---|
| Le graphe de composants kanji est difficile à construire pour ~200 mots | Seed data lent à l'US6 | Commencer par les kanji les plus fréquents. Les composants sont optionnels (array vide = pas de prérequis intra-skill). |
| Le modèle à deux niveaux ajoute de la complexité | Plus de tables, plus de jointures | La complexité est justifiée : correction d'un sens en un seul endroit, SRS propre par paire. ~800 ContentItems restent gérables. |
| Les SentenceElements générés dynamiquement changent le modèle | Refonte possible au Sprint 2 | Le SentenceElement existe en tant que structure. La question "statique vs dynamique" n'impacte que le seed (US7), pas le modèle domain. |
| Les axes de difficulté doivent évoluer pour le scoring Sprint 3 | Migration pour ajouter/modifier des colonnes | Les axes sont simples (1-2 nombres). Ajouter une colonne est peu coûteux. |
