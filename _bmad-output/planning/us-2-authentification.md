# US2 — Authentification

## Résumé

Un visiteur peut s'inscrire avec email et mot de passe, se connecter, se déconnecter. Sa session persiste entre les visites. Les routes protégées ne sont accessibles qu'aux utilisateurs authentifiés. Les endpoints auth sont protégés par rate limiting.

**Sprint :** Sprint 1 — Fondations
**Dépendances :** US1 (Setup projet)
**Approche :** ATDD — chaque critère d'acceptance est validé par un test automatisé ou une commande vérifiable.

## Choix d'authentification

| Aspect | Choix |
|---|---|
| Méthode d'inscription | Email + mot de passe |
| Mécanisme de session | Cookies (HttpOnly, Secure, SameSite) |
| Stockage session | PostgreSQL (via Better Auth) |
| Social login | Hors scope (Phase 2) |

Les session cookies sont le défaut Better Auth et le choix naturel pour une PWA mono-app : sécurisés (pas d'accès JS, pas de vol via XSS), compatibles SSR (TanStack Start lit le cookie nativement), zéro config supplémentaire.

## Architecture

### Nouveau package `@manabu/auth`

L'authentification est un concern transversal d'infrastructure — elle n'appartient ni au domain (métier japonais), ni au db (données métier), ni au web (présentation). Un package dédié isole toute la configuration Better Auth.

```
packages/
  auth/              # @manabu/auth — Better Auth config, client, middleware
    src/
      server.ts      # Config serveur Better Auth (adapter pg, plugins)
      client.ts      # Client Better Auth pour le frontend
      middleware.ts   # Middleware de protection des routes
      index.ts       # Barrel export
    package.json
    tsconfig.json
```

### Dépendances mises à jour

```
apps/web       →  @manabu/auth, @manabu/domain, @manabu/db, @manabu/ui, @manabu/shared
packages/auth  →  @manabu/shared
packages/db    →  @manabu/domain, @manabu/shared
packages/ui    →  @manabu/shared
packages/domain →  @manabu/shared
packages/shared →  (aucune dépendance interne)
```

`auth` ne dépend pas de `db` — Better Auth prend directement la connexion PostgreSQL via son propre adapter.

### Approche Effect TS

Better Auth est wrappé dans Effect pour rester cohérent avec l'approche "Effect partout" de la stack :
- Les appels Better Auth (signup, signin, signout, getSession) sont encapsulés dans des `Effect` pour bénéficier de la gestion d'erreurs typée et de la composabilité
- Les erreurs auth sont des `Data.TaggedError` Effect (`AuthError`, `InvalidCredentials`, `EmailAlreadyExists`...)
- Le middleware de protection des routes retourne un `Effect` avec l'erreur `Unauthorized`

### Pages auth dans `apps/web`

```
apps/web/app/
  routes/
    auth/
      sign-in.tsx    # Page de connexion
      sign-up.tsx    # Page d'inscription
    index.tsx        # Page d'accueil (mise à jour : bouton → sign-up)
```

## Critères d'acceptance

| # | Critère | FR/NFR | Type de vérification | Étape |
|---|---|---|---|---|
| AC1 | Un visiteur peut créer un compte avec email et mot de passe | FR28 | E2E (Playwright) | 3 |
| AC2 | Un utilisateur peut se connecter avec ses identifiants | FR29 | E2E (Playwright) | 3 |
| AC3 | Un utilisateur peut se déconnecter | FR29 | E2E (Playwright) | 3 |
| AC4 | Un utilisateur connecté qui ferme et rouvre l'app reste connecté (session persistante) | FR31 | E2E (Playwright) | 4 |
| AC5 | Un visiteur non authentifié est redirigé vers `/auth/sign-in` lorsqu'il accède à une route protégée | — | E2E (Playwright) | 4 |
| AC6 | Les mots de passe sont hashés en base (jamais stockés en clair) | NFR7 | Intégration (Vitest + Testcontainers) | 2 |
| AC7 | Les endpoints auth sont protégés par rate limiting (ex: max 10 tentatives/min/IP) | NFR9 | Intégration (Vitest) | 2 |
| AC8 | La session expire après 30 jours d'inactivité | NFR11 | Intégration (Vitest) | 2 |
| AC9 | Les pages sign-in et sign-up utilisent des composants Park UI et sont responsives sur 375px | — | E2E (Playwright) | 3 |
| AC10 | `pnpm build` compile le nouveau package `@manabu/auth` sans erreur | — | CI / manuel | 1 |

## Étapes d'implémentation

### Étape 1 — Package `@manabu/auth`

- [x] Créer `packages/auth/` avec `package.json` (`@manabu/auth`), `tsconfig.json` (étend `tsconfig.base.json`)
- [x] Installer Better Auth et l'adapter PostgreSQL
- [x] Configurer le serveur Better Auth (`src/server.ts`) :
  - [x] Adapter PostgreSQL (connexion via variables d'environnement)
  - [x] Plugin rate limiting
  - [x] Expiration de session à 30 jours
- [x] Exporter le client Better Auth (`src/client.ts`) pour le frontend
- [x] Créer le middleware de protection des routes (`src/middleware.ts`)
- [x] Ajouter `@manabu/auth` comme dépendance de `apps/web`
- [x] **Vérification :** `pnpm build` passe → AC10

### Étape 2 — Intégration serveur & API auth

- [x] Monter le handler Better Auth dans `apps/web` (API route `/api/auth/*`)
- [x] Exécuter les migrations Better Auth (tables `user`, `session`, `account`, `verification`)
- [x] Écrire les tests d'intégration (Vitest + Testcontainers) :
  - [x] Test : le mot de passe est hashé en base, jamais stocké en clair → AC6
  - [x] Test : le rate limiting bloque après N tentatives/min/IP → AC7
  - [x] Test : la session expire après 30 jours d'inactivité → AC8

### Étape 3 — Pages auth & UI

- [x] Créer la page `/auth/sign-up` avec composants Park UI :
  - [x] Champs : email, mot de passe, confirmation mot de passe
  - [x] Bouton "Create account"
  - [x] Lien vers sign-in
  - [x] Gestion des erreurs (email already taken, password too short...)
- [x] Créer la page `/auth/sign-in` avec composants Park UI :
  - [x] Champs : email, mot de passe
  - [x] Bouton "Sign in"
  - [x] Lien vers sign-up
  - [x] Gestion des erreurs (invalid credentials)
- [x] Mettre à jour la page d'accueil (`/`) selon l'état d'authentification :
  - [x] **Visiteur non connecté** : heading "Manabu", texte d'accroche, bouton "Get started" → `/auth/sign-up`
  - [x] **Utilisateur connecté** : même page avec son email affiché et bouton "Sign out" à la place
- [x] Vérifier le responsive 375px sur les pages auth
- [x] Écrire les tests E2E (Playwright) :
  - [x] Test : parcours inscription (email + mdp) → AC1
  - [x] Test : parcours connexion avec identifiants valides → AC2
  - [x] Test : parcours déconnexion → AC3
  - [x] Test : pages sign-in/sign-up responsives sur 375px avec composants Park UI → AC9

### Étape 4 — Protection des routes & persistance de session

- [x] Appliquer le middleware de protection sur les routes qui le nécessitent
- [x] Rediriger les visiteurs non authentifiés vers `/auth/sign-in`
- [x] Vérifier la persistance de session (fermer/rouvrir le navigateur)
- [x] Écrire les tests E2E (Playwright) :
  - [x] Test : accès route protégée sans auth → redirection vers `/auth/sign-in` → AC5
  - [x] Test : session persistante après fermeture/réouverture navigateur → AC4

### Étape 5 — Mise à jour du CLAUDE.md

- [x] Ajouter `@manabu/auth` dans le graphe de dépendances du CLAUDE.md
- [x] Documenter les routes auth disponibles

## Hors scope

| Élément | Raison | Sprint prévu |
|---|---|---|
| Réinitialisation de mot de passe (FR30) | Nice-to-have pour les fondations | Sprint 5 |
| Suppression de compte (FR32) | GDPR, pas critique pour la validation | Sprint 5 |
| Export de données (FR33) | GDPR, pas critique pour la validation | Sprint 5 |
| Social login (Google, GitHub...) | Pas nécessaire au MVP | Phase 2 |
| Freemium / trial / gestion d'abonnement | App gratuite au MVP | Phase 2 |

## Risques

| Risque | Impact | Mitigation |
|---|---|---|
| Better Auth + TanStack Start : intégration non triviale | Blocage à l'étape 2 | Vérifier la compatibilité via la doc Better Auth pour les frameworks Vite/Vinxi. TanStack Start utilise Vinxi sous le capot. |
| Migrations Better Auth conflictuent avec les migrations métier futures | Confusion dans le schéma DB | Better Auth gère ses propres tables (`user`, `session`...). Les tables métier (`skill_type`, `content`...) seront dans un schéma ou namespace séparé si nécessaire. |
| Rate limiting trop agressif en dev | Friction au développement | Configurer des limites généreuses en dev, strictes en production via variables d'environnement. |
