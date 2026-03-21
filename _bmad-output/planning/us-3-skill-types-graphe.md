# US3 — Skill types & graphe de dépendances

## Résumé

Les skill types de l'apprentissage du japonais sont définis avec leurs familles et leur graphe de dépendances complet. Le graphe est un DAG (Directed Acyclic Graph) validé, avec des fonctions de query pour naviguer les prérequis et identifier les points d'entrée.

**Sprint :** Sprint 1 — Fondations
**Dépendances :** US1 (Setup projet)
**Approche :** ATDD — chaque critère d'acceptance est validé par un test automatisé ou une commande vérifiable.

## Architecture

### Modèle domaine (`packages/domain`)

Les skill types sont des constantes définies dans le domaine pur Effect :

- **`SkillFamily`** — union taguée des familles (ex: Fundamentals, Core, Grammar)
- **`SkillTypeId`** — branded type pour les identifiants (ex: `F1`, `C3`)
- **`SkillType`** — entité avec id, famille, code, nom, description
- **`SkillGraph`** — graphe de dépendances : chaque skill type → ses prérequis directs

Le graphe est **statique** — c'est une constante dans le domaine, pas en base. Il ne change pas dynamiquement au MVP.

### Persistance (`packages/db`)

Les skill types sont persistés en base pour préparer les jointures avec le contenu linguistique (US4+). Le graphe de dépendances reste dans le domaine — pas de table de relations en base pour le graphe.

```
packages/
  domain/
    src/
      skill-type.ts         # SkillFamily, SkillTypeId, SkillType, constantes
      skill-graph.ts         # Graphe de dépendances, fonctions de query
  db/
    src/
      migrations/
        XXXX_skill_type.ts   # Table skill_type
      repositories/
        skill-type-repo.ts   # SkillTypeRepo Effect Service
```

### Fonctions de query sur le graphe

| Fonction | Description |
|---|---|
| `getPrerequisites(id)` | Retourne les prérequis directs d'un skill type |
| `getTransitivePrerequisites(id)` | Retourne tous les prérequis (directs + transitifs) |
| `getEntryPoints()` | Retourne les skill types sans prérequis (points d'entrée) |
| `getDependents(id)` | Retourne les skill types qui dépendent directement de ce skill |
| `validateGraph()` | Vérifie que le graphe est un DAG valide (pas de cycle) |

## Critères d'acceptance

| # | Critère | Type de vérification | Étape |
|---|---|---|---|
| AC1 | Le graphe de dépendances est un DAG valide (pas de cycle) | Unitaire (Vitest) | 2 |
| AC2 | `getPrerequisites(id)` retourne les prérequis directs d'un skill type | Unitaire (Vitest) | 2 |
| AC3 | `getTransitivePrerequisites(id)` retourne la fermeture transitive des prérequis | Unitaire (Vitest) | 2 |
| AC4 | Les points d'entrée du graphe (skills sans prérequis) sont correctement identifiés | Unitaire (Vitest) | 2 |
| AC5 | Chaque skill type défini a une entrée dans le graphe (même si ses prérequis sont vides) | Unitaire (Vitest) | 2 |
| AC6 | Les skill types sont persistés en base et queryables par famille | Intégration (Vitest + Testcontainers) | 3 |
| AC7 | `pnpm build` compile sans erreur | CI / manuel | 4 |

## Étapes d'implémentation

### Étape 1 — Finalisation de la taxonomie des skill types

La liste exacte des skill types n'est pas figée. Le PRD propose 17 skills répartis en 3 familles, mais des questions ouvertes subsistent :

- **F3 (Kanji de base)** : skill type distinct ou début de C3 ?
- **C7 (Écriture)** : modélisé au MVP même sans composant d'exercice d'écriture ?
- **Grammaire (G1-G7)** : vrais skill types avec leur progression, ou modificateurs de difficulté des skills core ? (le PRD dit "modificateurs" mais liste 7 skill types dédiés — tension à résoudre)

**Livrables :**
- [x] Revue de chaque skill type proposé avec justification linguistique
- [x] Décision sur le statut de la grammaire (skill types vs modificateurs)
- [x] Liste définitive des skill types avec famille, code, nom, description
- [x] Graphe de dépendances préliminaire entre les skill types retenus

**Résultat :** 15 skill types (3 fondations + 7 core + 5 grammaire). Voir `_bmad-output/specs/skill-taxonomy.md`.

**Pas de code à cette étape** — c'est une décision produit/domaine.

### Étape 2 — Modèle domaine & graphe de dépendances

- [x] Définir `SkillFamily`, `SkillTypeId`, `SkillType` dans `packages/domain/src/skill-type.ts`
- [x] Définir les constantes des skill types (liste issue de l'étape 1)
- [x] Modéliser le graphe de dépendances dans `packages/domain/src/skill-graph.ts`
- [x] Implémenter les fonctions de query : `getPrerequisites`, `getTransitivePrerequisites`, `getEntryPoints`, `getDependents`
- [x] Implémenter `validateGraph` (détection de cycles)
- [x] Écrire les tests unitaires (TDD sur les fonctions de query, pas sur les constantes) :
  - [x] Test : le graphe est un DAG valide → AC1
  - [x] Test : `getPrerequisites` retourne les prérequis directs → AC2
  - [x] Test : `getTransitivePrerequisites` retourne la fermeture transitive → AC3
  - [x] Test : `getEntryPoints` retourne les skills sans prérequis → AC4
  - [x] Test : chaque skill type a une entrée dans le graphe → AC5

### Étape 3 — Persistance SQL

- [x] Créer la migration pour la table `skill_type` (id, family, code, name, description)
- [x] Implémenter `SkillTypeRepo` comme Effect Service dans `packages/db`
- [x] Seed les skill types en base
- [x] Écrire les tests d'intégration (Vitest + Testcontainers) :
  - [x] Test : les skill types sont persistés et queryables par famille → AC6

### Étape 4 — Vérifications finales

- [x] `pnpm build` compile sans erreur → AC7
- [x] Mise à jour du CLAUDE.md si nécessaire

## Hors scope

| Élément | Raison | US prévue |
|---|---|---|
| Instances de contenu linguistique | Modèle séparé | US4 |
| Scores de difficulté (3 axes) | Liés au contenu | US4 |
| Associations contenu ↔ skill type | Liées au contenu | US4 |
| Structures de progression utilisateur | Dépend des skill types mais US distincte | US8 |
| Logique de déverrouillage (seuils) | Sprint 3 (Intelligence) | US8 / Sprint 3 |

## Risques

| Risque | Impact | Mitigation |
|---|---|---|
| La taxonomie n'est pas finalisée à l'étape 1 | Blocage des étapes suivantes | L'étape 1 est une discussion dédiée. On tranche avant de coder. |
| Le statut de la grammaire change après l'US3 | Refonte du modèle | Le modèle est simple (constantes + graphe). Ajouter/retirer des skill types est peu coûteux. |
| Le graphe de dépendances est mal calibré | Déverrouillage incohérent au Sprint 3 | Le graphe sera affiné itérativement. La structure permet des ajustements sans refonte. |
