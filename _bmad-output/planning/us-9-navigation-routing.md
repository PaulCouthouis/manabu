# US9 — Navigation & routing

## Résumé

Les routes des écrans principaux de l'application existent en coquille vide. Deux layouts protégés coexistent : le layout standard (écrans principaux) et le layout exercice (plein écran). Le routing est prêt pour que les sprints suivants ajoutent le contenu et la navigation.

**Sprint :** Sprint 1 — Fondations
**Dépendances :** US1, US2
**Approche :** ATDD

## Décisions architecturales

| Question | Décision | Justification |
|---|---|---|
| Écrans MVP | Home, Progression, Profil, Session | Minimum pour FR36, coquilles vides. |
| Bottom nav bar | Hors scope Sprint 1 | Pas de composants de navigation tant que les écrans n'ont pas de contenu. |
| Layout exercice | Layout séparé plein écran | Prépare le mode immersif du Sprint 2. |
| `/dashboard` | Supprimé, remplacé par `/home` | "Home" plus naturel pour une app d'apprentissage. |
| Récap de session | État dans le flow exercice, pas une route | Sprint 2. |

## Routes

```
routes/
  _protected.tsx                ← layout standard (existant)
  _protected/
    home.tsx                    ← NEW — remplace dashboard.tsx
    progress.tsx                ← NEW — coquille
    profile.tsx                 ← NEW — coquille
  _exercise.tsx                 ← NEW — layout plein écran, auth protégé
  _exercise/
    session.tsx                 ← NEW — coquille
```

## Critères d'acceptance

### Routes — Coquilles

| # | Critère | Type | Étape |
|---|---|---|---|
| AC1 | `/home` rend une page avec un titre identifiable | E2E | 2 |
| AC2 | `/progress` rend une page avec un titre identifiable | E2E | 2 |
| AC3 | `/profile` rend une page avec un titre identifiable | E2E | 2 |
| AC4 | `/session` rend une page plein écran | E2E | 3 |

### Auth — Protection

| # | Critère | Type | Étape |
|---|---|---|---|
| AC5 | Un utilisateur non authentifié sur `/home`, `/progress`, `/profile` est redirigé vers `/auth/sign-in` | E2E | 2 |
| AC6 | Un utilisateur non authentifié sur `/session` est redirigé vers `/auth/sign-in` | E2E | 3 |

### Layouts

| # | Critère | Type | Étape |
|---|---|---|---|
| AC7 | Les routes `_protected/*` utilisent le layout standard | E2E | 2 |
| AC8 | Les routes `_exercise/*` utilisent le layout plein écran (distinct du layout standard) | E2E | 3 |

### Build

| # | Critère | Type | Étape |
|---|---|---|---|
| AC9 | `pnpm build` compile sans erreur | CI | 4 |
| AC10 | `pnpm lint` passe sans erreur | CI | 4 |

## Étapes d'implémentation

### Étape 1 — Renommage dashboard → home

- [x] Supprimer `_protected/dashboard.tsx`
- [x] Créer `_protected/home.tsx` (coquille : titre "Home")

### Étape 2 — Routes protégées (layout standard)

- [x] Créer `_protected/progress.tsx` (coquille : titre "Progression")
- [x] Créer `_protected/profile.tsx` (coquille : titre "Profil")
- [x] Test E2E : chaque route rend sa coquille → AC1, AC2, AC3
- [x] Test E2E : routes protégées par auth → AC5
- [x] Test E2E : le layout standard est utilisé → AC7

### Étape 3 — Layout exercice plein écran

- [x] Créer `_exercise.tsx` (layout protégé, plein écran, auth via `getAuthSessionFn`)
- [x] Créer `_exercise/session.tsx` (coquille : titre "Session")
- [x] Test E2E : `/session` rend la coquille → AC4
- [x] Test E2E : `/session` protégé par auth → AC6
- [x] Test E2E : layout distinct du standard → AC8

### Étape 4 — Vérifications finales

- [ ] `pnpm build` sans erreur → AC9
- [ ] `pnpm lint` sans erreur → AC10
- [ ] Tests existants passent (non-régression)

## Hors scope

| Élément | Raison | Sprint prévu |
|---|---|---|
| Bottom nav bar | Pas de composants de navigation sans contenu dans les écrans | Sprint 2+ |
| Contenu des écrans | Carte radar, exercices, historique | Sprint 2-4 |
| Récap de session | État dans le flow exercice | Sprint 2 |
| Animations de transition | Polish | Sprint 5 |
