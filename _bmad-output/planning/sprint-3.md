# Sprint 3 — Intelligence et wiring (Semaines 5-6)

## 1. Objectif

Connecter les composants d'exercice (Sprint 2) à la vraie base de données et implémenter l'intelligence de l'application : SRS, disponibilité des contenus, recommandation, boucle de session complète et progression.

**Résultat testable :** un apprenant peut lancer une session, faire 5 exercices réels issus de la DB, et retrouver ses résultats dans sa page de progression. Les contenus se débloquent organiquement au fur et à mesure de la maîtrise.

## 2. Bilan Sprint 2

### Scope livré

| Composant | US | Skills couverts | Status |
|---|---|---|---|
| DrillQueue | US10 | Transversal | Done |
| SessionSummary | US11 | Transversal | Done |
| VoiceRecorder | US12 | Transversal vocal | Done |
| MultimodalInput | US13 | Transversal input | Done |
| SpeechRepeat | US14 | 1, 2, 3, 4, 7 | Done |
| MeaningExercise | US15 | 5, 6, 8 | Done |
| OralProduction | US16 | 9 | Done |
| WrittenProduction | US17 | 10 | Done |
| FillInTheBlank | US18 | 11-15 | Done |
| MicroLesson | US19 | Transversal grammaire | Done |
| RewardDisplay | US20 | Transversal | Done |
| IMEHelpModal | US21 | Skill 10 | Done |

**12/12 US livrées.** Les 5 composants d'exercice couvrent les 15 skills avec Storybook coverage complète. Architecture ports & fakes solide (SpeechRecognitionApi, AnswerValidationApi, SpeechSynthesisApi, MicrophoneApi, UserAgentApi).

### Refactors notables

- `styled()` systématisé à la place de `css()`
- Lucide icons remplacent les emojis dans tous les composants
- Effect `Array` partout (plus de `.map()` natif)
- DRY : `makeSpeakAtom` / `makeValidateAtom` factorisés

### Actions Sprint 2 reportées

| Priorite | Action | Detail |
|---|---|---|
| Rouge | Pipeline CI/CD | GitHub Actions : lint + types + tests sur chaque push |
| Jaune | Temps de seed en test | ~50 000 INSERT — mesurer et optimiser |
| Jaune | Audit qualitatif phrases | Echantillonner les 2 590 phrases generees |
| Vert | Scope userId | Toute query sur ReviewCard scopee au userId |

## 3. Specification de l'intelligence

### Approche

Comme pour le Sprint 2 (conception skill par skill avant decoupe US), le Sprint 3 commence par la specification du comportement de l'application avant de definir les donnees et le decoupage en US. Les 5 axes ci-dessous ont ete valides en session de conception.

---

### Axe 1 — Modele SRS

#### Algorithme : FSRS

FSRS (Free Spaced Repetition Scheduler) est l'algorithme retenu. Manabu se positionne "research-anchored" — SM-2 serait obsolete. FSRS a ete adopte par Anki en 2023, ses formules sont publiques et calibrees sur des millions de reviews.

#### Unite de review

**Card SRS = ContentItem** (junction `element_id` + `skill_type_id`).

Un meme mot peut etre maitrise en reconnaissance (Skill 5) mais pas en production (Skill 9) — ce sont des cards distinctes.

#### Etats FSRS

```
ReviewCard:
  contentItemId   — reference vers ContentItem
  userId          — scope utilisateur
  state           — "new" | "learning" | "review"
  stability       — parametre FSRS (duree de retention)
  difficulty      — parametre FSRS (difficulte intrinseque)
  nextReviewAt    — prochaine date de revision
  lastReviewAt    — derniere revision
```

#### Interaction scaffolding / SRS

**Nouvelle carte (state = "new") :**
- Scaffolding double passage : avec aide, puis sans aide
- Les 2 passages reussis du premier coup = 1 tentative
- Echec a un passage = recycle en fin de DrillQueue, compteur tentatives++

**Carte en revision (state = "review") :**
- Passage unique, sans aide
- Reussi = retire de la queue
- Echoue = recycle, compteur tentatives++

#### Mapping ratings FSRS

| Tentatives avant succes | Rating FSRS |
|---|---|
| 1 (reussi directement) | Good |
| 2 | Hard |
| 3+ | Again |
| Jamais reussi (abandon) | Ignore |

**Pas de Easy au MVP.** 3 ratings, zero ambiguite.

#### Intervalles typiques (premiere review)

| Rating | Effet | Intervalle typique |
|---|---|---|
| Good | Stabilite nominale | ~1 jour |
| Hard | Stabilite reduite | ~quelques heures a 1 jour |
| Again | Stabilite quasi-reset, relearning | Prochaine session (meme jour) |

#### Deux mecanismes complementaires

- **Intra-session** : le DrillQueue recycle l'item (2-3 min)
- **Inter-session** : FSRS calcule le prochain review (heures a jours)

Les deux ne sont pas redondants : le recyclage DrillQueue est de l'entrainement immediat, le SRS gere la retention a long terme.

---

### Axe 2 — Graphe de progression et disponibilite

#### Disponibilite d'un ContentItem

Un ContentItem `(element E, skill S)` est **disponible** quand toutes ses dependances sont satisfaites. Les dependances viennent de deux sources :

**Source 1 — SkillGraph + composants linguistiques :**

Pour chaque skill prerequis P de S (defini dans `SkillGraph`) :

1. **Short-circuit sur E** : si E lui-meme est applicable au skill P, alors `ReviewCard(E, P)` doit avoir `nextReviewAt > now`. Si ce check echoue, STOP — non disponible.
2. **Composants** : chaque composant de E applicable au skill P doit avoir `ReviewCard(composant, P)` avec `nextReviewAt > now`.

L'applicabilite depend du type d'element et du skill :
- Kana → Skills 1, 2, 3 (selon hiragana/katakana)
- Kanji → Skill 5
- Mot → Skills 4-10
- Sentence → Skills 4-10

**Source 2 — Grammar points (Skills 11-15 uniquement) :**

Si E est une sentence avec N grammar points :
- N == 1 → pas de prerequis GP (point d'entree)
- N > 1 → chaque GP doit avoir ete etudie (= au moins une ReviewCard d'une sentence contenant ce GP, dans un skill grammaire, avec `nextReviewAt > now`)

Les sentences de rank 1-5 ont typiquement 1 seul GP et servent de bootstrap — pas de circularite.

**Defaut** : pas de prerequis + pas de composants → disponible (points d'entree : kana dans Skill 1, kanji dans Skill 5).

#### Exemples avec donnees reelles

**Skill 2 (lire hiragana) — ContentItem (a / あ, Skill 2) :**
- Prerequis Skill 2 : [Skill 1]
- あ applicable a Skill 1 → ReviewCard(あ, Skill 1) `nextReviewAt > now`

**Skill 4 (ecoute mot) — ContentItem (する, Skill 4) :**
- Prerequis Skill 4 : [Skill 1]
- Composants de する : [し (kana 13), る (kana 41)]
- し et る applicables a Skill 1 → ReviewCards `nextReviewAt > now`

**Skill 7 (lire a voix haute) — ContentItem (大きい, Skill 7) :**
- Prerequis Skill 7 : [Skill 2, Skill 3, Skill 4]
- Skill 4 : 大きい applicable (mot) → ReviewCard(大きい, Skill 4) `nextReviewAt > now` — **short-circuit si echoue**
- Skill 2 : composants hiragana き, い → ReviewCards dans Skill 2
- Skill 3 : aucun composant katakana → ignore
- Le kanji 大 n'est pas prerequis (pas besoin de connaitre le sens pour lire a voix haute)

**Skill 8 (comprehension ecrite) — ContentItem (名前, Skill 8) :**
- Prerequis Skill 8 : [Skill 5, Skill 7]
- Skill 5 : composants kanji 名 et 前 → ReviewCards dans Skill 5
- Skill 7 : 名前 applicable (mot) → ReviewCard(名前, Skill 7)

**Skill 11 (grammaire particules) — Sentence (これは本だ, rank 1) :**
- Prerequis Skill 11 : [Skill 8]
- Mots composants これ, 本 → ReviewCards dans Skill 8
- GP : [だ] seul → 1 GP, pas de prerequis GP (bootstrap)

**Skill 11 — Sentence (今日は休日だ, rank 6) :**
- Mots composants → ReviewCards dans Skill 8
- GP : [だ, は] → 2 GP → だ et は doivent avoir ete etudies dans des sentences plus simples

#### Jouabilite d'un skill

Un skill est **jouable** quand il a **>= 5 ContentItems disponibles** — assez pour remplir une session DrillQueue.

---

### Axe 3 — Recommendation engine

#### Deux flux d'entree

**Quick session** (bouton principal sur `/home`) :
- L'app selectionne le skill optimal automatiquement
- Zero friction, l'apprenant est en session en 2 secondes

**Choix libre** (depuis `/progress`) :
- L'apprenant voit ses skills jouables et en choisit un
- Flux exploratoire pour travailler un point faible

#### Etape 1 — Selection du skill (quick session)

```
selectSkill(userId):
  overdueCounts = pour chaque skill jouable:
    count(ReviewCards ou nextReviewAt < now)
  
  si max(overdueCounts) > 0:
    → skill avec le plus de overdue
    → tie-break: skill.id le plus bas (fondations d'abord)
  
  sinon:
    newCounts = pour chaque skill jouable:
      count(ContentItems disponibles sans ReviewCard)
    → skill avec le plus de nouvelles cartes
    → tie-break: skill.id le plus bas
```

Priorite aux revisions : les cartes overdue font perdre de la retention.

#### Etape 2 — Selection des 5 items (identique pour les deux flux)

```
selectItems(skill, 5):
  overdue = ReviewCards du skill ou nextReviewAt < now
            triees par nextReviewAt ASC (les plus en retard d'abord)
  
  items = prendre min(5, len(overdue))
  
  si len(items) < 5:
    new = ContentItems disponibles sans ReviewCard
          tries par ordre pedagogique
    items += prendre (5 - len(items))
  
  retourner items
```

Pas de ratio fixe nouvelles/revisions. Les overdue sont prioritaires, les nouvelles cartes completent.

#### Ordre pedagogique des nouvelles cartes

| Type d'element | Critere de tri |
|---|---|
| Kana | `sortOrder` (ordre syllabaire あ→ん) |
| Kanji | `frequency` ASC (les plus frequents d'abord, BCCWJ) |
| Mots | `frequency` ASC |
| Sentences | `sentenceRank` ASC (les plus simples d'abord) |

---

### Axe 4 — Session loop

#### Cycle de vie

```
INIT    → selection skill + 5 items → construction DrillQueue
LOOP    → current() → exercice → resultat → succeed/recycle
END     → DrillQueue vide → SessionSummary / abandon → confirmation
PERSIST → resultats → FSRS → ReviewCards
```

LOOP et END existent deja (composants Sprint 2). INIT et PERSIST sont les nouveautes Sprint 3.

#### INIT — Construction de la session

```
initSession(userId, skillId?):
  si skillId fourni → choix libre
  sinon → selectSkill(userId)
  
  items = selectItems(skill, 5)
  
  pour chaque item:
    si ReviewCard existe → state = "review" (pas de scaffolding)
    sinon               → state = "new" (scaffolding double passage)
  
  creer Session(userId, skillId, startedAt)
  retourner DrillQueue.from(items)
```

#### PERSIST — Sauvegarde et calcul SRS (CQRS light)

**Command path (ecriture) :**

1. **Au fil de l'eau** : chaque exercice termine → `saveExerciseResult(userId, contentItemId, attempt, success/fail)`. Sauvegarde brute, pas de calcul SRS. Protection contre la perte de donnees si fermeture de l'app.

2. **A la fin** : `finalizeSession(userId, sessionId)` :
   - Recuperer les resultats bruts de la session
   - Pour chaque ContentItem : compter les tentatives totales
   - Mapper vers rating FSRS (1 → Good, 2 → Hard, 3+ → Again)
   - Creer ou mettre a jour les ReviewCards
   - Recalculer `nextReviewAt` via FSRS
   - Marquer la session comme finalisee (`finalizedAt`)

**Query path (lecture) :**
- `selectSkill` — lit les overdue counts et disponibilites
- `selectItems` — lit les ReviewCards et ContentItems disponibles
- `isAvailable(contentItem)` — lit les `nextReviewAt` des dependances

Les `exercise_result` sont la source de verite (append-only, comme des events). Les `ReviewCards` sont une projection calculee par FSRS. On peut recalculer toutes les ReviewCards a partir des resultats bruts si l'algorithme change.

#### Abandon et recovery

**Abandon explicite** (bouton avec confirmation modale) :
- Items succeeded → traites normalement (rating FSRS selon tentatives)
- Items attempted (echoues, encore dans la queue) → rating Again
- Items pending (jamais presentes) → ignores

**Session orpheline** (fermeture app, perte connexion) :
- Les resultats au fil de l'eau sont deja sauves
- Au prochain lancement, detection de session non finalisee (`finalizedAt IS NULL`)
- Finalisation automatique avec les resultats disponibles

---

### Axe 5 — Scoring et progression

#### Maitrise d'un skill

- **Skills fermes (1, 2, 3)** : compteur + barre de progression `acquis / total`
  - Pool fixe (~208 kana), le pourcentage est stable et motivant
- **Skills ouverts (4-15)** : compteur absolu seul ("42 mots maitrises")
  - Le pool grandit avec les deblocages, un pourcentage serait frustrant

Un element est "maitrise" = sa ReviewCard est en etat `review` (intervalle FSRS attribue).

#### Page /progress

```
Par skill:
  - Nom du skill + icone
  - Compteur: "X elements maitrises"
  - Skills fermes: barre de progression X/total
  - Etat visuel: verrouille / jouable / en cours
  - Notification de deblocage (nice-to-have)

Global:
  - Nombre total d'elements maitrises (tous skills)
  - Streak: jours consecutifs avec >= 1 session completee
  - Sessions aujourd'hui
```

#### Donnees

Tout est derive des tables existantes :
- Compteur maitrise = `count(ReviewCards en etat "review" pour ce skill)`
- Streak = jours consecutifs avec >= 1 row dans `exercise_result`
- Sessions aujourd'hui = `count(sessions finalisees today)`

Pas de table de scoring dediee. Le radar chart est reporte a un sprint ulterieur.

---

## 4. Modele de donnees

Deduit de la specification d'intelligence :

### Nouvelles tables

```sql
-- Session d'exercice
CREATE TABLE session (
  id            SERIAL PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES "user"(id),
  skill_type_id INTEGER NOT NULL REFERENCES skill_type(id),
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalized_at  TIMESTAMPTZ  -- NULL = session en cours / orpheline
);

-- Resultat brut par exercice (append-only, source de verite)
CREATE TABLE exercise_result (
  id              SERIAL PRIMARY KEY,
  session_id      INTEGER NOT NULL REFERENCES session(id),
  content_item_id INTEGER NOT NULL REFERENCES content_item(id),
  attempt         INTEGER NOT NULL,  -- numero de tentative (1, 2, 3...)
  success         BOOLEAN NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Table existante a enrichir

```sql
-- ReviewCard (existe deja, ajout des colonnes FSRS)
ALTER TABLE review_card ADD COLUMN state TEXT NOT NULL DEFAULT 'new';
    -- 'new' | 'learning' | 'review'
ALTER TABLE review_card ADD COLUMN stability REAL NOT NULL DEFAULT 0;
ALTER TABLE review_card ADD COLUMN difficulty REAL NOT NULL DEFAULT 0;
ALTER TABLE review_card ADD COLUMN last_review_at TIMESTAMPTZ;
```

## 5. Decoupage en User Stories

### Vue d'ensemble

| Phase | US | Nom | Dependances |
|---|---|---|---|
| 1 | US22 | FSRS engine | aucune |
| 1 | US23 | Disponibilite ContentItems | aucune |
| 1 | US24 | Real STT (Web Speech API) | aucune |
| 2 | US25 | Migrations SQL + repositories | aucune |
| 2 | US26 | Recommendation engine | US22, US23 |
| 3 | US27 | Session loop serveur | US25, US26 |
| 4 | US28 | Wiring route /session | US27, US24 |
| 4 | US29 | Page /progress | US25 |

### US22 — FSRS engine (logique pure)

**Package :** `packages/domain`
**Approche :** TDD, logique pure Effect, zero dependance infra

**Etapes :**

1. Types FSRS : `FsrsState` (stability, difficulty, retrievability), `FsrsRating` (Again, Hard, Good), `FsrsParams` (parametres par defaut)
   - [ ] Definir les types
   - [ ] Test : les types acceptent les valeurs valides, rejettent les invalides
2. Fonction `scheduleReview` : etat actuel + rating → nouvel etat + nextReviewAt
   - [ ] Test : Good sur nouvelle carte → stabilite initiale, nextReviewAt ~1 jour
   - [ ] Test : Hard → stabilite reduite, intervalle plus court
   - [ ] Test : Again → quasi-reset, relearning
   - [ ] Test : Good successifs → intervalles croissants exponentiellement
   - [ ] Test : Again apres plusieurs Good → contraction forte mais pas reset total
3. Fonction `mapAttemptsToRating` : nombre de tentatives → rating FSRS
   - [ ] Test : 1 tentative → Good
   - [ ] Test : 2 tentatives → Hard
   - [ ] Test : 3+ tentatives → Again
4. Service Effect `FsrsScheduler` avec tag + implementation par defaut
   - [ ] Test : le service est injectable via Layer

---

### US23 — Disponibilite des ContentItems

**Packages :** port dans `packages/domain`, implementation dans `packages/db`
**Approche :** tests d'integration Testcontainers

**Etapes :**

1. Service `ContentAvailability` (port dans domain)
   - [ ] Definir l'interface : `isAvailable(userId, contentItemId) → Effect<boolean>`
   - [ ] Definir l'interface : `getAvailableItems(userId, skillId) → Effect<Array<ContentItem>>`
   - [ ] Definir l'interface : `isSkillPlayable(userId, skillId) → Effect<boolean>`
2. Implementation query — short-circuit sur l'element lui-meme
   - [ ] Test integration : ContentItem sans prerequis (kana Skill 1) → toujours disponible
   - [ ] Test integration : ContentItem avec prerequis skill non retenu → non disponible
   - [ ] Test integration : short-circuit — element pas retenu dans skill prerequis → non disponible sans verifier les composants
3. Implementation query — composants linguistiques
   - [ ] Test integration : tous les composants retenus → disponible
   - [ ] Test integration : un composant sans ReviewCard → non disponible
   - [ ] Test integration : un composant avec nextReviewAt < now (expire) → non disponible
4. Implementation query — grammar points (Skills 11-15)
   - [ ] Test integration : sentence avec 1 GP (bootstrap) → pas de prerequis GP
   - [ ] Test integration : sentence avec 2+ GP, tous etudies → disponible
   - [ ] Test integration : sentence avec 2+ GP, un GP jamais etudie → non disponible
5. Jouabilite skill
   - [ ] Test integration : skill avec >= 5 items disponibles → jouable
   - [ ] Test integration : skill avec < 5 items disponibles → non jouable

---

### US24 — Real STT (Web Speech API)

**Package :** `packages/exercises`
**Approche :** implementation du port `SpeechRecognitionApi` existant

**Etapes :**

1. Implementation `SpeechRecognitionApi` via Web Speech API
   - [ ] Layer browser : `SpeechRecognitionApi.Browser`
   - [ ] Gestion langue (ja-JP) + continuous mode
   - [ ] Mapping resultat Web Speech → `SpeechResult` (match/mismatch/noise)
2. Gestion du seuil de confiance
   - [ ] Resultats low-confidence → verdict `noise` (ignore)
   - [ ] Test : confidence < seuil → noise
3. Integration dans le Provider exercises
   - [ ] Remplacer le fake par le layer browser dans le wiring app
   - [ ] Le fake reste disponible pour Storybook et tests

---

### US25 — Migrations SQL + repositories

**Package :** `packages/db`
**Approche :** migrations sequentielles, tests d'integration Testcontainers

**Etapes :**

1. Migration : table `session`
   - [ ] Creer la table (id, user_id, skill_type_id, started_at, finalized_at)
   - [ ] Index sur user_id + finalized_at (query sessions orphelines)
2. Migration : table `exercise_result`
   - [ ] Creer la table (id, session_id, content_item_id, attempt, success, created_at)
   - [ ] Index sur session_id
3. Migration : enrichissement `review_card`
   - [ ] Ajouter colonnes FSRS (state, stability, difficulty, last_review_at)
   - [ ] Migration des donnees existantes vers state = 'new'
4. Repository `SessionRepo`
   - [ ] `create(userId, skillId) → Effect<Session>`
   - [ ] `finalize(sessionId) → Effect<void>`
   - [ ] `findOrphan(userId) → Effect<Option<Session>>`
   - [ ] Tests integration pour chaque methode
5. Repository `ExerciseResultRepo`
   - [ ] `save(sessionId, contentItemId, attempt, success) → Effect<void>`
   - [ ] `getBySession(sessionId) → Effect<Array<ExerciseResult>>`
   - [ ] Tests integration
6. Enrichissement `ReviewCardRepo`
   - [ ] `upsert(userId, contentItemId, fsrsState) → Effect<void>`
   - [ ] `getOverdue(userId, skillId) → Effect<Array<ReviewCard>>`
   - [ ] Tests integration

---

### US26 — Recommendation engine

**Packages :** port dans `packages/domain`, implementation dans `packages/db`
**Dependances :** US22 (FSRS), US23 (disponibilite)
**Approche :** TDD pour la logique de selection, integration pour les queries

**Etapes :**

1. Service `RecommendationEngine` dans domain
   - [ ] Definir l'interface : `selectSkill(userId) → Effect<SkillType>`
   - [ ] Definir l'interface : `selectItems(userId, skillId, count) → Effect<Array<DrillItem>>`
2. `selectSkill` — logique de selection
   - [ ] Test : skills avec overdue → choisit celui avec le plus de overdue
   - [ ] Test : pas de overdue → choisit le skill avec le plus de nouvelles cartes
   - [ ] Test : tie-break → skill.id le plus bas
   - [ ] Test : aucun skill jouable → erreur typee `NoPlayableSkill`
3. `selectItems` — composition overdue + nouvelles
   - [ ] Test : 3 overdue + 2 nouvelles → 5 items
   - [ ] Test : 5+ overdue → 5 overdue, 0 nouvelles
   - [ ] Test : 0 overdue → 5 nouvelles
   - [ ] Test : nouvelles triees par frequence/sortOrder/rank
   - [ ] Test : chaque item annote new/review pour le scaffolding DrillQueue

---

### US27 — Session loop serveur (INIT + PERSIST)

**Packages :** `packages/domain` (orchestration), `packages/db` (persistence)
**Dependances :** US25 (repos), US26 (recommendation)
**Approche :** CQRS light — commands (ecriture) et queries (lecture) separees

**Etapes :**

1. Service `SessionOrchestrator` dans domain
   - [ ] Definir l'interface : `initSession(userId, skillId?) → Effect<SessionData>`
   - [ ] Definir l'interface : `saveResult(sessionId, contentItemId, attempt, success) → Effect<void>`
   - [ ] Definir l'interface : `finalizeSession(sessionId) → Effect<SessionSummaryData>`
2. `initSession` — construction de la session
   - [ ] Test : quick session → selectSkill + selectItems + creer Session en DB
   - [ ] Test : choix libre → utiliser skillId fourni + selectItems
   - [ ] Test : retourne DrillQueue avec items annotes new/review
3. `saveResult` — sauvegarde au fil de l'eau
   - [ ] Test : enregistre dans exercise_result
4. `finalizeSession` — calcul SRS
   - [ ] Test : item 1 tentative → Good → ReviewCard mise a jour
   - [ ] Test : item 2 tentatives → Hard
   - [ ] Test : item 3+ tentatives → Again
   - [ ] Test : item jamais reussi (abandon) → ignore
   - [ ] Test : nouvelle carte → ReviewCard creee en etat learning/review
   - [ ] Test : session marquee finalisee (finalizedAt)
5. Recovery session orpheline
   - [ ] Test : session non finalisee detectee au init → finaliser d'abord
   - [ ] Test : resultats partiels sauvegardes → finalisation correcte

---

### US28 — Wiring route /session end-to-end

**Package :** `apps/web`
**Dependances :** US27 (session loop), US24 (real STT)

**Etapes :**

1. Server functions TanStack Start
   - [ ] `initSessionFn` → appelle SessionOrchestrator.initSession
   - [ ] `saveResultFn` → appelle SessionOrchestrator.saveResult
   - [ ] `finalizeSessionFn` → appelle SessionOrchestrator.finalizeSession
2. Provider de session cote client
   - [ ] Atom runtime avec les layers reels (browser STT, TTS, etc.)
   - [ ] DrillQueue alimente par les donnees serveur
   - [ ] Chaque resultat d'exercice → appel saveResultFn
3. Wiring des composants exercice
   - [ ] SpeechRepeat, MeaningExercise, OralProduction, WrittenProduction, FillInTheBlank → donnees reelles
   - [ ] SessionSummary → donnees de finalisation
   - [ ] Test E2E : lancer session → 5 exercices → recap

---

### US29 — Page /progress avec scoring

**Package :** `apps/web`, `packages/ui`
**Dependances :** US25 (repositories pour les queries)

**Etapes :**

1. Server function `getProgressFn`
   - [ ] Compteur maitrise par skill (ReviewCards etat "review")
   - [ ] Barre de progression pour skills fermes (1-3)
   - [ ] Etat de chaque skill (verrouille / jouable / en cours)
   - [ ] Stats globales (total maitrise, streak, sessions aujourd'hui)
2. Composant SkillCard
   - [ ] Affiche nom, icone, compteur, etat
   - [ ] Barre de progression pour skills fermes
   - [ ] Cliquable si jouable → lance session avec ce skill
3. Composant ProgressDashboard
   - [ ] Liste des skills avec SkillCard
   - [ ] Stats globales en header
   - [ ] Storybook stories avec donnees mockees
4. Wiring route /progress
   - [ ] Remplacer le contenu placeholder actuel
   - [ ] Server function → composants
