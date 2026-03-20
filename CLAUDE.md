# Manabu — Guide de développement

## Stack technique

| Catégorie | Choix | Version |
|---|---|---|
| Langage | TypeScript strict | 5.x |
| Framework full-stack | TanStack Start | latest |
| Domaine / runtime | Effect TS | 3.x |
| Design system | Panda CSS + Park UI | latest |
| Base de données | PostgreSQL | 17 |
| ORM / SQL | @effect/sql-pg | latest |
| Authentification | Better Auth | latest |
| Gestionnaire de packages | pnpm (workspaces) | 10.x |
| Linter | oxlint | latest |
| Formatter | oxfmt | latest |
| Tests unitaires / intégration | Vitest + Testcontainers | latest |
| Tests E2E | Playwright | latest |
| Conteneurisation | docker-compose | v2 |

## Architecture monorepo

```
manabu/
  apps/
    web/               # TanStack Start — app full-stack (routes, pages, server functions)
      app/
        routes/        # File-based routing TanStack Start
        components/    # Composants spécifiques à l'app
      app.config.ts
  packages/
    domain/            # Entités, value objects, agrégats — pur Effect, zéro dépendance infra
    db/                # @effect/sql-pg, migrations, repositories
    ui/                # Composants UI partagés, design system Panda/Park
    shared/            # Types partagés, config Effect, utilitaires
  e2e/                 # Tests Playwright
  docker-compose.yml
  pnpm-workspace.yaml
  tsconfig.base.json
```

### Dépendances entre packages

```
apps/web       →  @manabu/domain, @manabu/db, @manabu/ui, @manabu/shared
packages/db     →  @manabu/domain, @manabu/shared
packages/ui     →  @manabu/shared
packages/domain →  @manabu/shared
packages/shared →  (aucune dépendance interne)
```

### Conventions de nommage

- Packages npm : `@manabu/<nom>` (ex: `@manabu/domain`, `@manabu/db`)
- Fichiers : kebab-case (ex: `skill-type.ts`, `user-repository.ts`)
- Types / interfaces : PascalCase (ex: `SkillType`, `UserRepository`)
- Fonctions / variables : camelCase
- Effect services / layers : PascalCase avec suffixe descriptif (ex: `SqlLive`, `UserRepo`)

## Commandes

| Commande | Description |
|---|---|
| `pnpm install` | Installer toutes les dépendances |
| `pnpm dev` | Lancer l'app en mode développement |
| `pnpm build` | Compiler tous les packages et l'app |
| `pnpm test` | Exécuter tous les tests (intégration + E2E) |
| `pnpm lint` | Linter tout le monorepo (oxlint) |
| `pnpm format:check` | Vérifier le formatting (oxfmt) |
| `pnpm format` | Appliquer le formatting (oxfmt) |

## Règles architecturales

### DDD — Séparation domain / infra

- `packages/domain` est **pur** : aucune dépendance vers `db`, le réseau, ou toute infra.
- Le domaine définit des interfaces (Effect services). L'infra (`packages/db`) fournit les implémentations (layers).
- Les entités et value objects vivent dans `domain`. Les repositories concrets vivent dans `db`.

### Effect TS partout

- Utiliser `Effect` comme runtime principal pour la gestion d'erreurs, dépendances, et concurrence.
- Les erreurs métier sont des types tagués Effect (`Data.TaggedError`), jamais des exceptions.
- Les dépendances sont injectées via le système de Layer Effect, jamais par import direct d'implémentation.

### Panda CSS — styled() plutôt que css()

- Privilégier `const Main = styled("main", { base: { ... } })` pour créer des composants stylés.
- Éviter `css()` et les props inline sur `styled.div` — réserver `css()` aux cas où `styled()` n'est pas applicable.

### TypeScript strict

- `tsconfig.base.json` avec `strict: true` et `noUncheckedIndexedAccess: true`.
- Chaque package étend cette config — impossible de relâcher la strictness.

### JLPT non structurant

- Le système de difficulté est propriétaire (3 axes : fréquence BCCWJ, profondeur graphe, complexité intrinsèque).
- Le JLPT est un output dérivé, jamais un input.

## Approche test — ATDD

Chaque critère d'acceptance est validé par un test automatisé ou une commande vérifiable.

- **Tests d'intégration** (Vitest + Testcontainers) : valident les interactions avec PostgreSQL via des containers éphémères.
- **Tests E2E** (Playwright) : valident les parcours utilisateur dans le navigateur.
- **Tests unitaires** (Vitest) : valident la logique domaine pure (Effect).

Règle : un AC sans test automatisé est un AC non validé.
