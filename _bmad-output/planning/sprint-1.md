# Sprint 1 — Fondations (Semaines 1-2)

## 1. Objectif

Construire tout ce qui doit exister pour que le Sprint 2 puisse livrer des exercices jouables. Le Sprint 1 ne produit pas de valeur utilisateur directe — il pose le socle sur lequel le produit entier repose.

**Résultat testable :** à la fin du sprint, le domaine japonais est complet et queryable, un utilisateur peut s'authentifier, et l'app s'affiche sur mobile.

## 2. Contexte

Premier sprint d'un cycle de 5 (~10 semaines, dev solo). Chaque sprint suivant dépend directement de ce qui est livré ici :

| Sprint suivant | Ce qu'il attend du Sprint 1 |
|---|---|
| Sprint 2 — Exercice core | Le contenu linguistique et les skill types pour construire les composants d'exercice |
| Sprint 3 — Intelligence | Les structures de progression utilisateur et de SRS |
| Sprint 4 — Expérience | Tout ce qui précède |
| Sprint 5 — Polish & launch | Tout ce qui précède |

**Stack choisie (cf. PRD) :** TypeScript strict, Effect TS, TanStack Start, Panda CSS, Park UI, PostgreSQL (`@effect/sql`), Better Auth.

**Approche architecturale :** DDD + CQRS léger. Le domaine métier est défini en premier — entités, agrégats, value objects. Le schéma base de données en découle comme détail d'implémentation. La séparation lecture/écriture se fait naturellement via les Effect Services, sans infrastructure lourde (pas d'event sourcing, pas de bus de messages).

## 3. Capacités livrées

### 3.1 Domaine : compétences & contenu japonais

#### Les 17 skill types

L'apprentissage du japonais est décomposé en 17 compétences atomiques, organisées en 3 familles :

**Fondamentaux (F1-F3)** — les briques de base de l'écriture japonaise :
- **F1** — Reconnaissance des Hiragana (voir un caractère → identifier le son)
- **F2** — Reconnaissance des Katakana (voir un caractère → identifier le son)
- **F3** — Reconnaissance des Kanji de base (voir un caractère → identifier le sens)

**Core (C1-C7)** — les compétences d'usage de la langue :
- **C1** — Perception audio (entendre un son → identifier le kana)
- **C2** — Compréhension orale (entendre un mot/phrase → comprendre le sens)
- **C3** — Reconnaissance kanji (voir un kanji → connaître sa lecture)
- **C4** — Lecture → prononciation (voir un mot → savoir le dire)
- **C5** — Lecture → sens (voir un mot → comprendre sa signification)
- **C6** — Rappel productif (connaître le sens → produire le mot japonais)
- **C7** — Écriture (connaître le caractère → savoir l'écrire)

**Grammaire (G1-G7)** — modificateurs de difficulté, pas des compétences séparées. Chaque point de grammaire génère des instances plus complexes des skills core C1-C7. Exemple : 犬 (chien) en C5 est simple ; 犬が好きです (j'aime les chiens) est toujours du C5 mais avec un prérequis grammatical qui augmente la difficulté.

#### Graphe de dépendances

Les skill types sont reliés par un graphe de dépendances qui détermine l'ordre de déverrouillage. Principes :
- Certains skills sont des points d'entrée sans prérequis (ex: F1, F2)
- Les skills avancés nécessitent la maîtrise de prérequis (ex: la lecture kanji requiert la connaissance des kana)
- La progression est non-linéaire : plusieurs chemins coexistent, l'apprenant n'est jamais sur un rail unique

Le graphe exact sera formalisé au moment de l'implémentation de cette US. Le PRD servira de guide mais le graphe sera affiné avec la réalité linguistique.

#### Contenu linguistique

Une instance de contenu est un élément linguistique (kana, mot, point de grammaire) caractérisé par :
- **Association skill types** — à quels skills cet élément peut servir d'exercice (le même mot peut être exercé en écoute, lecture, rappel...)
- **Score de difficulté** composite sur 3 axes :
  - **Fréquence d'usage** — rang dans le corpus BCCWJ. Plus c'est fréquent, plus c'est prioritaire.
  - **Profondeur dans le graphe** — nombre de prérequis à maîtriser avant. Plus c'est profond, plus c'est tard.
  - **Complexité intrinsèque** — nombre de traits/lectures (kanji), longueur en mora (mots), composants/exceptions (grammaire)

### 3.2 Identité : inscription & connexion

Un visiteur peut :
- Créer un compte avec email et mot de passe
- Se connecter à son compte
- Se déconnecter
- Retrouver sa session en revenant sur l'app

### 3.3 App : socle navigable

- L'app se lance dans un navigateur mobile et s'affiche correctement
- L'écran d'accueil existe (contenu minimal)
- La navigation entre les futurs écrans est en place (routing)
- Le design system est intégré et les composants UI sont prêts à être utilisés au Sprint 2

## 4. Seed data — contenu de démarrage

Le contenu initial est créé manuellement pour ce sprint :

| Type | Volume | Détail |
|---|---|---|
| Kana | ~240 | Hiragana + Katakana, toutes combinaisons de base (gojūon, dakuten, yōon) |
| Mots | ~200 | Mots les plus fréquents (source : BCCWJ, JMdict) |
| Grammaire | ~50 | Points de grammaire fondamentaux |

Chaque élément est livré avec :
- Ses métadonnées linguistiques (lectures, traductions, catégorie)
- Ses scores de difficulté calculés manuellement sur les 3 axes
- Ses associations aux skill types concernés

## 5. User Stories

| US | Titre | Résumé | Dépendances |
|---|---|---|---|
| US1 | Setup projet | Le projet démarre en local avec la stack complète. Un écran minimal s'affiche. | — |
| US2 | Authentification | Un visiteur peut s'inscrire, se connecter, se déconnecter. Sa session persiste. | US1 |
| US3 | Skill types & graphe de dépendances | Les 17 skill types sont définis avec leurs familles et leur graphe de dépendances complet. | US1 |
| US4 | Modèle de contenu linguistique | Une instance de contenu est modélisée avec ses métadonnées, son score de difficulté (3 axes) et ses associations skill types. | US3 |
| US5 | Seed data kana | Les ~240 kana (hiragana + katakana) sont chargés avec leurs scores et associations. | US4 |
| US6 | Seed data vocabulaire | Les ~200 mots fréquents sont chargés avec leurs scores et associations. | US4 |
| US7 | Seed data grammaire | Les ~50 points de grammaire sont chargés avec leurs liens vers les instances core modifiées. | US4 |
| US8 | Structures de progression utilisateur | Les entités pour la progression par skill et le SRS par paire exercice/réponse sont définies (structures prêtes, pas de logique). | US3 |
| US9 | Navigation & routing | Les écrans principaux existent en coquille vide, la navigation entre eux fonctionne. | US1 |

### Ordre d'implémentation

```
US1 (Setup)
├── US2 (Auth)
├── US3 (Skill types & graphe)
│   ├── US4 (Modèle contenu)
│   │   ├── US5 (Seed kana)
│   │   ├── US6 (Seed vocabulaire)
│   │   └── US7 (Seed grammaire)
│   └── US8 (Structures progression)
└── US9 (Navigation)
```

Chaque US fera l'objet d'un document détaillé au moment de son implémentation.

## 6. Hors scope

| Élément | Raison | Sprint prévu |
|---|---|---|
| Exercices interactifs | Pas de composant d'exercice, pas de logique de session | Sprint 2 |
| Moteur SRS | Les structures existent mais le moteur n'est pas implémenté | Sprint 3 |
| Moteur de recommandation | Idem | Sprint 3 |
| Scoring & progression | Idem | Sprint 3 |
| Carte radar | Pas de visualisation | Sprint 4 |
| Détection de blocage / déblocage | Pas de logique adaptative | Sprint 4 |
| Réinitialisation de mot de passe | Nice-to-have pour les fondations | Sprint 5 |
| Export / suppression de données | GDPR, pas critique pour la validation | Sprint 5 |
| PWA (manifest, service worker) | Pas nécessaire pour développer | Sprint 5 |

## 7. Risques

| Risque | Impact | Mitigation |
|---|---|---|
| Le modèle de données ne supporte pas les besoins des sprints suivants | Refonte coûteuse au Sprint 2-3 | Approche DDD : définir les entités pour le domaine complet (y compris SRS, scoring, progression) même si la logique vient plus tard |
| Le seed data est insuffisant ou mal structuré | Exercices pauvres au Sprint 2 | Se baser sur des sources fiables (BCCWJ, JMdict, KANJIDIC). Valider manuellement la cohérence des scores |
| Le graphe de dépendances est mal calibré | Déverrouillage incohérent, frustration utilisateur | Le graphe sera affiné itérativement. Conception initiale basée sur la recherche (Nation 2001, CEFR, JF Standard) |
| Better Auth ne couvre pas les besoins futurs (trial, freemium) | Migration auth en Phase 2 | Vérifier dès maintenant que Better Auth supporte les extensions nécessaires |
