# US1 — Setup projet

## Résumé

Le projet démarre en local avec la stack complète. Un écran minimal s'affiche sur mobile. L'infrastructure de développement (tests, linting, formatting, base de données) est opérationnelle.

**Sprint :** Sprint 1 — Fondations
**Dépendances :** Aucune
**Approche :** ATDD — chaque critère d'acceptance est validé par un test automatisé ou une commande vérifiable.

## Stack technique

| Catégorie | Choix |
|---|---|
| Langage | TypeScript strict |
| Framework full-stack | TanStack Start |
| Domaine / runtime | Effect TS |
| Design system | Panda CSS + Park UI |
| Base de données | PostgreSQL 17 (`@effect/sql-pg`) |
| Authentification | Better Auth (US2) |
| Gestionnaire de packages | pnpm (workspaces) |
| Linter | oxlint |
| Formatter | oxfmt |
| Tests unitaires / intégration | Vitest + Testcontainers |
| Tests E2E | Playwright |
| Conteneurisation | docker-compose |

## Architecture

### Monorepo pnpm

```
manabu/
  apps/
    web/               # TanStack Start — app full-stack (routes, pages, server functions)
      app/
        routes/        # File-based routing TanStack Start
        components/    # Composants spécifiques à l'app
      app.config.ts
      package.json
  packages/
    domain/            # Entités, value objects, agrégats — pur Effect, zéro dépendance infra
    db/                # @effect/sql-pg, migrations, repositories
    ui/                # Composants UI partagés, design system Panda/Park
    shared/            # Types partagés, config Effect, utilitaires
  e2e/                 # Tests Playwright
  docker-compose.yml
  pnpm-workspace.yaml
  tsconfig.base.json   # Config TS stricte, étendue par chaque package
  oxlint.json
  oxfmt.json
  CLAUDE.md
```

### Dépendances entre packages

```
apps/web       →  @manabu/domain, @manabu/db, @manabu/ui, @manabu/shared
packages/db     →  @manabu/domain, @manabu/shared
packages/ui     →  @manabu/shared
packages/domain →  @manabu/shared
packages/shared →  (aucune dépendance interne)
```

Règle DDD : `domain` ne dépend jamais de `db` ni d'aucune infra. Le domaine est pur, l'infra s'adapte à lui.

### TypeScript strict

`tsconfig.base.json` à la racine avec les options strictes. Chaque package l'étend — impossible de relâcher la strictness dans un sous-package.

Options minimales : `strict: true`, `noUncheckedIndexedAccess: true`.

## Critères d'acceptance

| # | Critère | Type de vérification | Étape |
|---|---|---|---|
| AC1 | `pnpm install && pnpm dev` lance l'app sans erreur | CI / manuel | 2 |
| AC2 | La page `/` affiche un composant Park UI | E2E (Playwright) | 3 |
| AC3 | Le layout est responsive sur viewport 375px (pas de scroll horizontal) | E2E (Playwright) | 3 |
| AC4 | PostgreSQL est accessible via `@effect/sql-pg` (`SELECT 1` retourne `1`) | Intégration (Vitest + Testcontainers) | 5 |
| AC5 | `docker compose up` lance PostgreSQL (container up, port exposé) | CI / manuel | 5 |
| AC6 | Le monorepo compile (`pnpm build`) sans erreur | CI / manuel | 1 |
| AC7 | `pnpm test` exécute tous les tests (intégration + E2E) — exit code 0 | CI / manuel | 6 |
| AC8 | `pnpm lint` passe sans erreur sur tous les packages (oxlint) | CI / manuel | 4 |
| AC9 | `pnpm format:check` vérifie le formatting sans diff (oxfmt) | CI / manuel | 4 |

## Étapes d'implémentation

### Étape 0 — CLAUDE.md

- [x] Créer le fichier `CLAUDE.md` à la racine du projet avec :
  - [x] Stack technique et versions
  - [x] Architecture monorepo et conventions de nommage
  - [x] Commandes disponibles (`pnpm dev`, `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm format:check`)
  - [x] Règles architecturales (DDD, séparation domain/infra)
  - [x] Approche test (ATDD)

Le CLAUDE.md est un document vivant, enrichi à chaque étape.

### Étape 1 — Monorepo nu

- [x] Initialiser le workspace pnpm (`pnpm-workspace.yaml`)
- [x] Créer les dossiers `apps/web`, `packages/domain`, `packages/db`, `packages/ui`, `packages/shared`, `e2e/`
- [x] Chaque package a son `package.json` et `tsconfig.json` (étend `tsconfig.base.json`)
- [x] `tsconfig.base.json` à la racine avec `strict: true`, `noUncheckedIndexedAccess: true`
- [x] **Vérification :** `pnpm install` et `pnpm build` passent → AC6

### Étape 2 — TanStack Start + premier écran

- [x] Bootstrap TanStack Start dans `apps/web`
- [x] Créer une route `/` avec un "Hello Manabu" minimal
- [x] Configurer `vite.config.ts` (TanStack Start 1.166+ utilise Vite plugin au lieu de `app.config.ts`)
- [x] **Vérification :** `pnpm dev` → la page s'affiche → AC1

### Étape 3 — Design system

- [x] **Décision préalable :** choisir le theme Park UI (preset de couleurs, couleur d'accent, mode clair/sombre). Cette décision se prend avec Paul avant de coder — elle impacte l'identité visuelle de toute l'app.
- [x] Installer et configurer Panda CSS dans `packages/ui`
- [x] Intégrer le preset Park UI avec le theme choisi
- [x] Créer la page d'accueil minimale dans `apps/web` sur la route `/` :
  - [x] `Heading` — "Manabu"
  - [x] `Text` — "Apprends le japonais, skill par skill"
  - [x] `Button` — "Commencer" (non fonctionnel, sera branché à l'auth en US2)
- [x] Ajouter le viewport meta tag et vérifier le layout responsive
- [x] **Vérification :** les 3 composants Park UI sont visibles, pas de scroll horizontal sur 375px → AC2, AC3

### Étape 4 — Linter & Formatter

- [x] Installer oxlint et oxfmt pour chaque packages
- [x] Configurer `oxlint.json` et `oxfmt.json` à la racine
- [x] Ajouter les scripts `pnpm lint` et `pnpm format:check` / `pnpm format`
- [x] Configurer un pre-commit hook (simple-git-hooks ou lefthook)
- [x] **Vérification :** `pnpm lint` et `pnpm format:check` passent → AC8, AC9

### Étape 5 — PostgreSQL

- [x] Créer `docker-compose.yml` avec PostgreSQL 17
  ```yaml
  services:
    db:
      image: postgres:17
      environment:
        POSTGRES_DB: manabu_dev
        POSTGRES_USER: manabu
        POSTGRES_PASSWORD: manabu
      ports:
        - "5433:5432"
      volumes:
        - pgdata:/var/lib/postgresql/data
  ```
- [x] Implémenter le Layer `@effect/sql-pg` dans `packages/db`
- [x] Valider la connexion au démarrage de l'app
- [x] **Vérification :** `docker compose up` + connexion OK → AC4, AC5

### Étape 6 — Pipeline de test

- [ ] Configurer Vitest pour `packages/db` (tests d'intégration)
- [ ] Test d'intégration : `SELECT 1` via Testcontainers (PostgreSQL éphémère)
- [ ] Configurer Playwright dans `e2e/`
- [ ] Test E2E : naviguer vers `/`, vérifier qu'un composant Park UI est visible, vérifier le responsive 375px
- [ ] Ajouter le script `pnpm test` qui orchestre tous les tests
- [ ] **Vérification :** `pnpm test` passe, exit code 0 → AC7

## Hors scope

| Élément | Raison |
|---|---|
| Authentification | US2 |
| Entités métier | US3, US4 |
| PWA (manifest, service worker) | Sprint 5 |
| CI/CD | Pas nécessaire pour le dev local |
| Tables métier en base | US3+ |

## Risques

| Risque | Impact | Mitigation |
|---|---|---|
| Intégration Effect TS + TanStack Start non triviale | Blocage à l'étape 2 | Valider un hello world Effect dans une server function dès l'étape 2 |
| Panda CSS + Park UI compatibilité avec TanStack Start | Blocage à l'étape 3 | Tester l'intégration PostCSS avant d'aller plus loin |
| Testcontainers setup complexe | Blocage à l'étape 6 | Fallback : utiliser le docker-compose de dev avec une DB de test séparée |
