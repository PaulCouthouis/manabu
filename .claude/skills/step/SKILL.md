---
name: step
description: |
  Implémente une étape d'une User Story, vérifie lint/types/tests, puis simplifie le code.
  Exemples d'utilisation :
  - "/step Créer le service UserRepo avec Effect"
  - "/step Ajouter la route /api/skills"
  - "/step 3" (étape numéro 3 du plan en cours)
argument-hints: [description-de-l-étape]
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
  - Bash(pnpm tsc*)
  - Bash(npx tsc*)
  - Bash(pnpm exec tsc*)
  # Git (pour voir l'état des changements)
  - Bash(git diff*)
  - Bash(git status*)
  # Subagents
  - Agent
  # Simplification
  - Skill(simplify)
  # Tasks (pour cocher les étapes du plan)
  - TaskCreate
  - TaskUpdate
  - TaskGet
  - TaskList
  # Interaction utilisateur
  - AskUserQuestion
---

# /step — Implémenter une étape d'une User Story

Implémente une étape précise d'une US, vérifie la qualité du code, et simplifie le résultat.

## Langue

Toujours répondre dans la langue de l'utilisateur. Détecter la langue à partir de ses messages précédents.

## Workflow

### Step 1 : Comprendre l'étape

Analyser l'argument fourni par l'utilisateur :

- **Description textuelle** (ex: "Créer le service UserRepo") : comprendre ce qui est demandé
- **Numéro d'étape** (ex: "3") : identifier l'étape correspondante dans le fichier US
- **Sans argument** : lire le fichier US en cours et identifier la prochaine étape dont les checkboxes ne sont pas toutes cochées

**Localisation du fichier US :**
1. Lister les fichiers dans `_bmad-output/planning/` avec `Glob("_bmad-output/planning/us-*.md")`
2. Si un seul fichier US est en cours de travail (checkboxes non cochées), l'utiliser
3. Si plusieurs US sont possibles, demander à l'utilisateur laquelle avec `AskUserQuestion`
4. Lire le fichier US pour comprendre le contexte complet (stack, architecture, AC)

Si l'étape n'est pas claire, demander des précisions avec `AskUserQuestion`.

### Step 2 : Explorer le code existant

Avant d'écrire quoi que ce soit :

1. Identifier les fichiers pertinents avec `Glob` et `Grep`
2. Lire les fichiers existants qui seront modifiés ou qui servent de référence
3. Comprendre les patterns en place (conventions de nommage, structure, imports)

### Step 3 : Implémenter

- Suivre les conventions du projet (voir CLAUDE.md)
- Respecter les patterns existants identifiés au Step 2
- Créer ou modifier les fichiers nécessaires
- Écrire les tests si l'étape implique de la logique testable

### Step 4 : Vérification — Lint

```bash
pnpm lint
```

Si des erreurs sont détectées :
1. Corriger les erreurs
2. Relancer `pnpm lint`
3. Répéter jusqu'à ce que tout passe

### Step 5 : Vérification — Types

```bash
pnpm build
```

Si des erreurs de types sont détectées :
1. Corriger les erreurs
2. Relancer la vérification
3. Répéter jusqu'à ce que tout passe

### Step 6 : Vérification — Tests

```bash
pnpm test
```

Si des tests échouent :
1. Analyser les erreurs
2. Corriger le code (pas les tests, sauf si les tests étaient incorrects)
3. Relancer `pnpm test`
4. Répéter jusqu'à ce que tout passe

### Step 7 : Mise à jour du fichier US

Le fichier US source se trouve dans `_bmad-output/planning/` (ex: `us-1-setup-projet.md`).
Les étapes d'implémentation y sont décrites avec des checkboxes markdown (`- [ ]` / `- [x]`).

Après l'implémentation réussie :
1. Identifier le fichier US correspondant dans `_bmad-output/planning/`
2. Lire le fichier pour trouver les checkboxes de l'étape implémentée
3. Cocher (`- [x]`) chaque sous-tâche complétée dans l'étape
4. Cocher aussi la ligne de vérification si les AC associés sont validés

Exemple — avant :
```markdown
- [ ] Bootstrap TanStack Start dans `apps/web`
- [ ] Créer une route `/` avec un "Hello Manabu" minimal
- [ ] **Vérification :** `pnpm dev` → la page s'affiche → AC1
```

Après :
```markdown
- [x] Bootstrap TanStack Start dans `apps/web`
- [x] Créer une route `/` avec un "Hello Manabu" minimal
- [x] **Vérification :** `pnpm dev` → la page s'affiche → AC1
```

### Step 8 : Simplification

Exécuter le skill `/simplify` pour revoir le code modifié :
- Vérifier la réutilisation, la qualité et l'efficacité
- Corriger les problèmes trouvés

### Step 9 : Résumé

Afficher un résumé concis :

```
=== /step terminé ===

Étape : <description>

Fichiers modifiés :
  • <path> — <ce qui a changé>
  • <path> — <ce qui a changé>

Vérifications :
  ✅ Lint
  ✅ Types
  ✅ Tests
  ✅ Simplifié

Prochaine étape suggérée : <description de la suite logique, si applicable>
```

## Notes importantes

- Ne jamais commiter automatiquement — l'utilisateur décidera quand commiter
- Si une vérification échoue plus de 3 fois, demander de l'aide à l'utilisateur via `AskUserQuestion`
- Toujours lire le code avant de le modifier
- Préférer modifier les fichiers existants plutôt qu'en créer de nouveaux
