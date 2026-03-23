# Manabu — Guide de développement

## Stack technique

| Catégorie | Choix | Version |
|---|---|---|
| Langage | TypeScript strict | 5.x |
| Framework full-stack | TanStack Start | latest |
| Domaine / runtime | Effect TS | 3.x |
| Effect ↔ React | @effect-atom/atom-react | latest |
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
    auth/              # @manabu/auth — Better Auth config, client atoms, server handlers
    domain/            # Entités, value objects, agrégats — pur Effect, zéro dépendance infra
    db/                # @effect/sql-pg, migrations, repositories
    exercises/         # @manabu/exercises — logique exercices (DrillQueue), composants exercice
    storybook/         # @manabu/storybook — config Storybook centralisée, découvre les stories de ui + exercises
    ui/                # Composants UI partagés, design system Panda/Park
    shared/            # Types partagés, config Effect, utilitaires
  _bmad-output/
    specs/             # Documents de spécification (PRD, taxonomie skills)
    planning/          # User stories, sprints, roadmap
  e2e/                 # Tests Playwright
  docker-compose.yml
  pnpm-workspace.yaml
  tsconfig.base.json
```

### Dépendances entre packages

```
apps/web           →  @manabu/auth, @manabu/domain, @manabu/db, @manabu/ui, @manabu/exercises, @manabu/shared
packages/auth      →  @manabu/shared
packages/db        →  @manabu/domain, @manabu/shared
packages/exercises  →  @manabu/shared
packages/storybook  →  @manabu/ui, @manabu/exercises (devDeps — runner Storybook)
packages/ui         →  @manabu/shared
packages/domain     →  @manabu/shared
packages/shared     →  (aucune dépendance interne)
```

### Conventions de nommage

- Packages npm : `@manabu/<nom>` (ex: `@manabu/domain`, `@manabu/db`)
- Fichiers : kebab-case (ex: `skill-type.ts`, `user-repository.ts`)
- Types / interfaces : PascalCase (ex: `SkillType`, `UserRepository`)
- Fonctions / variables : camelCase
- Effect services / layers : PascalCase avec suffixe descriptif (ex: `SqlLive`, `UserRepo`)
- Instanciation des `Schema.Class` : utiliser `Class.make({...})` plutôt que `new Class({...})`
- Fonctions : toujours utiliser des accolades `{}` pour le corps, même pour une seule expression. Pas de fonctions fléchées inline sans accolades (ex: `const foo = (x) => { return x + 1 }`, pas `const foo = (x) => x + 1`).

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
| `pnpm storybook` | Lancer Storybook (packages/storybook) sur le port 6006 |

## Routes

| Route | Type | Description |
|---|---|---|
| `/` | Publique | Page d'accueil (Get started / Sign out selon état auth) |
| `/auth/sign-up` | Publique | Inscription email + mot de passe |
| `/auth/sign-in` | Publique | Connexion |
| `/home` | Protégée | Home utilisateur (layout `_protected`) |
| `/progress` | Protégée | Progression (layout `_protected`) |
| `/profile` | Protégée | Profil utilisateur (layout `_protected`) |
| `/session` | Protégée | Session d'exercice (layout `_exercise`, plein écran) |
| `/api/auth/*` | API | Endpoints Better Auth (sign-up, sign-in, sign-out, get-session) |

Les routes protégées utilisent deux layouts qui vérifient la session via `getAuthSessionFn` (server function) et redirigent vers `/auth/sign-in` si non authentifié :
- `_protected.tsx` — layout standard (home, progress, profile)
- `_exercise.tsx` — layout plein écran (session d'exercice)

## Règles architecturales

### DDD — Séparation domain / infra

- `packages/domain` est **pur** : aucune dépendance vers `db`, le réseau, ou toute infra.
- Le domaine définit des interfaces (Effect services). L'infra (`packages/db`) fournit les implémentations (layers).
- Les entités et value objects vivent dans `domain`. Les repositories concrets vivent dans `db`.

### Effect TS partout

- Utiliser `Effect` comme runtime principal pour la gestion d'erreurs, dépendances, et concurrence.
- Les erreurs métier sont des types tagués Effect (`Data.TaggedError`), jamais des exceptions.
- Les dépendances sont injectées via le système de Layer Effect, jamais par import direct d'implémentation.
- **Entités domaine** : utiliser `Schema.Class` (pas `Data.Class`) pour que le Schema soit réutilisable à la frontière SQL/API.
- **Services infra** : utiliser `Effect.Service` pour combiner le Tag et le Default layer dans une seule classe. Accès au layer via `MyService.Default`.
- **Frontières SQL** : valider les données avec `Schema.decode` (lecture) et `Schema.encode` (écriture). Utiliser `Schema.decodeUnknown` uniquement quand les types de la source ne sont pas connus (données externes non typées).
- **Manipulation de tableaux** : utiliser `Array` de Effect (`Array.map`, `Array.filter`, `Array.head`, etc.) plutôt que les méthodes natives `.map()`, `.filter()`, etc.
- **Côté React** : utiliser `Atom.fn` (`@effect-atom/atom-react`) pour wrapper les Effects en atoms réactifs. Utiliser `useAtomSet` / `useAtomValue` / `useAtom` pour interagir avec les atoms dans les composants. Ne jamais appeler `Effect.runPromise` manuellement dans un composant.
- **Formulaires** : utiliser `useActionState` (React 19) avec `<form action={...}>` et `FormData`. Combiner avec `useAtom(atom, { mode: "promiseExit" })` pour exécuter les atoms dans les actions.

### Panda CSS — styled() plutôt que css()

- Privilégier `const Main = styled("main", { base: { ... } })` pour créer des composants stylés.
- Éviter `css()` et les props inline sur `styled.div` — réserver `css()` aux cas où `styled()` n'est pas applicable.

### Durées — `Duration` Effect plutôt que des nombres bruts

- Utiliser `Duration.days(30)`, `Duration.minutes(1)`, `Duration.seconds(5)`, etc. pour exprimer les durées.
- Convertir à la frontière avec les APIs externes via `Duration.toMillis(...)`, `Duration.toSeconds(...)`, etc.
- Ne jamais écrire de calculs manuels comme `30 * 24 * 60 * 60` — `Duration` rend l'intention explicite et évite les erreurs d'unité.

### Nullabilité — `Option` Effect plutôt que `null | undefined`

- Utiliser `Option.fromNullable` pour convertir les valeurs potentiellement `null` ou `undefined` en `Option`.
- Utiliser les combinateurs `Option` (`Option.getOrElse`, `Option.map`, `Option.match`, etc.) plutôt que `??`, `?` ou des ternaires pour gérer l'absence de valeur.
- Les frontières avec les APIs externes (Better Auth, DOM, etc.) sont le point de conversion : `Option.fromNullable` à l'entrée, `.pipe(Option.getOrElse(...))` à la sortie si nécessaire.
- Pour l'accès indexé (`record[key]`), préférer `Record.get(record, key)` qui retourne un `Option`.

### TypeScript strict

- `tsconfig.base.json` avec `strict: true` et `noUncheckedIndexedAccess: true`.
- Chaque package étend cette config — impossible de relâcher la strictness.
- Éviter les assertions de type (`as`) — préférer les type guards, `Schema.decode`, ou restructurer le code pour que le type soit inféré correctement.

### Lisibilité — fonctions nommées plutôt que commentaires

- Préférer extraire une mini-fonction avec un nom explicite plutôt que d'ajouter un commentaire au-dessus d'un bloc de code.
- Le nom de la fonction remplace le commentaire — il documente l'intention et reste synchronisé avec le code.

### Skill types — taxonomie à 15 skills

- **15 skill types** répartis en 3 familles : Fondations (3, fermés), Core (7, ouverts), Grammaire (5, ouverts).
- **Un skill = un format d'exercice unique** — pas de formats multiples par skill.
- **2 points d'entrée** dans le graphe : Écoute syllabique (skill 1) et Sens des kanji (skill 5).
- Les skills de grammaire **déverrouillent des instances** plus complexes dans les skills core.
- Référence complète : `_bmad-output/specs/skill-taxonomy.md`

### JLPT non structurant

- Le système de difficulté est propriétaire (3 axes : fréquence BCCWJ, profondeur graphe, complexité intrinsèque).
- Le JLPT est un output dérivé, jamais un input.

## Approche test — ATDD + TDD

Chaque critère d'acceptance est validé par un test automatisé ou une commande vérifiable.

- **Tests d'intégration** (Vitest + Testcontainers) : valident les interactions avec PostgreSQL via des containers éphémères.
- **Tests E2E** (Playwright) : valident les parcours utilisateur dans le navigateur.
- **Tests unitaires** (Vitest) : valident la logique domaine pure (Effect).

Règle : un AC sans test automatisé est un AC non validé.

### TDD — Red-Green-Refactor

Pour toute logique testable (domain, services, repositories, API), appliquer le cycle TDD :

1. **Red** — Écrire le test qui échoue en premier
2. **Green** — Écrire le minimum de code pour faire passer le test
3. **Refactor** — Simplifier le code en gardant les tests verts

Le TDD ne s'applique pas au boilerplate (config, wiring de routes, CSS/markup).

### Rédaction des User Stories — tests explicites

Chaque étape d'implémentation d'une US doit inclure des sous-tâches (`- [ ]`) explicites pour l'écriture des tests associés à ses AC. Ne pas compter sur une mention implicite dans la ligne "Vérification" — le test doit être une checkbox à part entière.
