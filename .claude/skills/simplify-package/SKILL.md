---
name: simplify-package
description: |
  Simplifie tout le code d'un package du monorepo (clarté, cohérence, maintenabilité).
  Exemples d'utilisation :
  - "/simplify-package domain"
  - "/simplify-package exercises"
  - "/simplify-package ui"
argument-hints: [nom-du-package]
allowed-tools:
  # Lecture et recherche de code
  - Read
  - Grep
  - Glob
  # Modification de code
  - Edit
  - Write
  # Vérifications
  - Bash(pnpm lint*)
  - Bash(pnpm build*)
  - Bash(pnpm test*)
  # Git (pour voir l'état des changements)
  - Bash(git diff*)
  - Bash(git status*)
  # Subagents (pour paralléliser l'analyse de fichiers)
  - Agent
  # Tasks
  - TaskCreate
  - TaskUpdate
  - TaskGet
  - TaskList
  # Interaction utilisateur
  - AskUserQuestion
---

# /simplify-package — Simplifier tout le code d'un package

Analyse et simplifie l'intégralité du code source d'un package du monorepo Manabu, en appliquant les standards du projet (CLAUDE.md) tout en préservant la fonctionnalité.

## Langue

Toujours répondre dans la langue de l'utilisateur. Détecter la langue à partir de ses messages précédents.

## Workflow

### Step 1 : Identifier le package cible

Analyser l'argument fourni par l'utilisateur :

- **Nom court** (ex: "domain", "exercises", "ui") : résoudre vers `packages/<nom>/src/`
- **Nom complet** (ex: "@manabu/domain") : résoudre vers `packages/<nom-sans-prefix>/src/`
- **"web"** : résoudre vers `apps/web/app/`
- **Sans argument** : demander à l'utilisateur quel package cibler avec `AskUserQuestion`

Vérifier que le dossier existe. Si non, lister les packages disponibles et demander confirmation.

### Step 2 : Inventorier les fichiers

1. Lister tous les fichiers `.ts` et `.tsx` du package avec `Glob`
2. Exclure les fichiers générés (`styled-system/`, `dist/`, `node_modules/`)
3. Compter le nombre de fichiers à analyser
4. Créer une task par lot de fichiers pour suivre la progression

### Step 3 : Analyser et simplifier fichier par fichier

Pour chaque fichier, appliquer les principes de simplification suivants :

#### Préserver la fonctionnalité
- Ne jamais changer le comportement du code
- Toutes les features, outputs et comportements doivent rester intacts

#### Appliquer les standards du projet (CLAUDE.md)
- `Schema.Class` avec `Class.make()` (pas `new Class()`)
- `Effect` partout : `Array.map/filter` au lieu de `.map()/.filter()`, `Option` au lieu de `null`, `Duration` au lieu de nombres bruts
- Imports intra-package via `~/` (pas de `./` ou `../`)
- Fonctions avec accolades obligatoires (pas d'arrow inline sans accolades)
- Fonctions nommées plutôt que commentaires
- `styled()` plutôt que `css()` pour Panda CSS
- Pas de `for` — préférer le déclaratif
- Tests : `@effect/vitest` avec `layer()`, `Layer.succeed` pour les fakes — jamais `vi.fn/vi.mock/vi.stubGlobal`

#### Améliorer la clarté
- Réduire la complexité et le nesting inutile
- Éliminer le code redondant et les abstractions superflues
- Améliorer la lisibilité via des noms clairs de variables et fonctions
- Consolider la logique liée
- Supprimer les commentaires décrivant du code évident
- Pas de ternaires imbriquées — préférer switch/if-else

#### Maintenir l'équilibre
- Ne pas sur-simplifier au point de réduire la lisibilité
- Ne pas créer de solutions trop "clever" difficiles à comprendre
- Ne pas combiner trop de concerns dans une seule fonction
- Ne pas supprimer des abstractions utiles à l'organisation du code
- Préférer la clarté à la brièveté

### Step 4 : Vérifications

Après toutes les modifications :

1. **Lint** : `pnpm lint` — corriger les erreurs, relancer jusqu'à ce que tout passe
2. **Types** : `pnpm build` — corriger les erreurs de types, relancer jusqu'à ce que tout passe
3. **Tests** : `pnpm test` — corriger le code (pas les tests sauf s'ils étaient incorrects), relancer jusqu'à ce que tout passe

Si une vérification échoue plus de 3 fois, demander de l'aide à l'utilisateur via `AskUserQuestion`.

### Step 5 : Résumé

Afficher un résumé concis :

```
=== /simplify-package terminé ===

Package : <nom>
Fichiers analysés : <N>
Fichiers modifiés : <N>

Modifications :
  • <path> — <ce qui a changé>
  • <path> — <ce qui a changé>
  ...

Vérifications :
  ✅ Lint
  ✅ Types
  ✅ Tests
```

## Notes importantes

- Ne jamais commiter automatiquement — l'utilisateur décidera quand commiter
- Toujours lire un fichier avant de le modifier
- Si un fichier est déjà propre et conforme aux standards, le laisser tel quel
- En cas de doute sur une simplification (risque de casser le comportement), ne pas la faire
- Utiliser des subagents (`Agent`) pour paralléliser l'analyse de fichiers quand le package est grand
