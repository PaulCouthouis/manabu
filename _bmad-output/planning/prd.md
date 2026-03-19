---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete]
inputDocuments:
  - _bmad-output/brainstorming/brainstorming-session-2026-03-18-0900.md
  - _bmad-output/brainstorming/brainstorming-session-2026-03-18-1000.md
workflowType: 'prd'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 2
  projectDocs: 0
classification:
  projectType: web_app_pwa
  domain: edtech
  complexity: medium
  projectContext: greenfield
---

# Product Requirements Document - Manabu

**Author:** Paul
**Date:** 2026-03-19

## Executive Summary

Les outils d'apprentissage du japonais échouent là où ça compte : quand l'apprenant stagne, il ne sait pas *quoi* améliorer. Duolingo, Anki et les manuels traitent la langue comme un bloc monolithique — un niveau global, un parcours linéaire, et un mur de progression inévitable.

**La granularité des compétences EST le produit.** Manabu décompose l'apprentissage du japonais en 17 skill types atomiques organisés dans un graphe de dépendances non-linéaire. Chaque exercice cible un seul skill. L'apprenant voit exactement où il en est sur chaque dimension via une carte radar personnalisée — et l'app sait toujours quoi lui proposer ensuite. Les sessions durent ~5 minutes, conçues pour un usage quotidien sur mobile.

Le public cible : tout adulte apprenant le japonais, du débutant absolu à l'intermédiaire avancé, quels que soient son point d'entrée (kana, kanji pour sinophones, écoute pour les profils immersifs) et sa langue maternelle. L'interface sera en anglais au lancement.

### Ce qui rend Manabu unique

**Progression sans mur.** Deux mécanismes garantissent que l'apprenant ne se retrouve jamais bloqué sans recours au MVP :
- **Graphe non-linéaire à points d'entrée multiples** — le parcours s'adapte au profil, pas l'inverse. Quand un skill bloque, le système pivote vers un skill adjacent ou baisse la difficulté.
- **SRS universel sur la paire exercice/réponse** — un seul moteur de mémorisation espacée pour tous les skills, éliminant la complexité de SRS multiples par type de compétence

En phase croissance, un coach IA conversationnel viendra compléter ces stratégies de déblocage.

**Architecture fondée sur la recherche.** La grammaire n'est pas une catégorie séparée mais un prérequis qui déverrouille des instances plus difficiles des mêmes 7 skills core. Cela unifie vocabulaire et grammaire sous un même modèle de données et simplifie le moteur de recommandation. Ancrage académique : Nation (2001), Hatta (2020), CEFR, JF Standard.

**IA en 2 rôles au MVP :**
- **Génération amont** — création de contenu (exercices, questions) réutilisable par tous les utilisateurs
- **Sélection temps réel** — analyse du profil pour choisir l'exercice optimal parmi le contenu pré-généré

*Phase 3 : coach IA conversationnel — dialogue personnalisé en cas de blocage, recommandation de ressources externes.*

## Classification du projet

- **Type :** Web App (PWA)
- **Domaine :** EdTech — apprentissage des langues
- **Complexité :** Technique haute (moteur adaptatif IA, graphe de dépendances, SRS universel), réglementaire basse (public adulte, pas de données sensibles)
- **Contexte :** Greenfield — nouveau produit

## Critères de succès

### Succès utilisateur

- **Time-to-first-value** — L'utilisateur voit sa carte radar et comprend la proposition de valeur (granularité des skills) en <3 minutes après sa première ouverture.
- **Moment "aha!"** — L'utilisateur ressent qu'il a franchi un cap grâce à l'application. Mesurable : notification quand un skill passe un seuil de maîtrise, progression visible sur la carte radar.
- **Zéro mur de progression** — Aucun utilisateur ne doit rester bloqué sans recours pendant plus d'une session. Le système de déblocage (pivot, régression de difficulté, coach IA) intervient automatiquement.
- **Sessions quotidiennes complétées** — L'utilisateur termine ses sessions ~5 min sans abandon en cours. Taux de complétion de session cible : >85%.
- **Calibrage perçu comme juste** — L'utilisateur considère que sa carte radar reflète fidèlement ses compétences réelles. Mesurable via feedback implicite (pas de recalibrage manuel fréquent).

### Succès business

**MVP (gratuit) :**
- **Rétention J1 :** >60%
- **Rétention J7 :** >30%
- **Rétention J30 :** >15%
- **Usage quotidien (DAU/MAU) :** >40% — indicateur de création d'habitude

**Phase 2 (freemium) :**
- **Modèle :** 1 session/jour (~5 exercices) gratuite, abonnement pro illimité, trial de 15 jours
- **Conversion trial → payant :** 5-10% (standard EdTech)
- **Churn mensuel abonnés :** <5%

### Succès technique

- **Latence sélection d'exercice (recommandation)** — <3s toléré entre deux exercices
- **Latence pendant l'exercice** — <200ms pour toute interaction une fois l'exercice lancé (affichage, validation, feedback). Critique pour le flow.
- **SRS universel** — Un seul moteur de mémorisation espacée couvrant les 17 skill types, résultats cohérents entre skills.
- **Disponibilité PWA** — >99.5% uptime

### Qualité d'apprentissage

- **Progression réelle** — >60% des utilisateurs actifs à J30 ont progressé d'au moins 1 niveau sur ≥3 skills core. Ce KPI garantit que le produit enseigne effectivement, pas seulement qu'il retient.
- **Corrélation skill/réalité** — Les utilisateurs qui progressent dans l'app rapportent une amélioration perçue de leurs capacités en japonais (mesurable par survey trimestriel).

### Résultats mesurables

| Métrique | Cible MVP (3 mois, gratuit) | Cible Phase 2 (12 mois, freemium) |
|---|---|---|
| Utilisateurs inscrits | 5 000 | 50 000 |
| Utilisateurs actifs J30 | 600 (12%) | 10 000 (20%) |
| Conversion trial → payant | N/A (gratuit) | 8-10% |
| DAU/MAU | >35% | >45% |
| Churn mensuel abonnés | N/A (gratuit) | <5% |
| Sessions complétées/jour/utilisateur actif | 1.2 | 1.8 |
| Progression réelle à J30 (≥3 skills) | >50% | >65% |

## Scoping & développement phasé

### Stratégie MVP

**Type :** Problem-solving MVP — valider que la décomposition en skills atomiques + système de difficulté propriétaire crée une progression perçue comme supérieure aux alternatives.

**Ressources :** Développeur solo (Paul). Chaque feature doit justifier son coût d'implémentation par sa contribution directe à la validation de l'hypothèse core.

**Principe directeur :** App 100% gratuite au MVP. Pas de monétisation. L'objectif est de valider le produit.

### MVP — Feature set (Phase 1)

**Journeys supportés :** Marc (débutant, happy path), Sophie (blocage), Nina (UX edge case).

**Must-have :**

| Feature | Justification | Effort |
|---|---|---|
| 17 skill types + graphe de dépendances | Le cœur du produit. Priorisation : F1→F3, puis C1→C7, puis G1→G7. | Modèle de données : 1 sem |
| Système de difficulté propriétaire (3 axes) | Non négociable — c'est ce qui fait que chaque exercice est au bon niveau. | Intégré au modèle |
| 2-3 composants d'exercice paramétrables | QCM (stimulus+options), input texte, player audio. Le skill type paramètre le composant. | 1-2 sem |
| SRS universel | Paire exercice/réponse. FSRS ou SM-2. Un seul moteur. | 1 sem |
| Moteur de recommandation à règles | Graphe + SRS + score de difficulté. Déterministe. | 1-2 sem |
| Carte radar | Recharts RadarChart. Visualisation par skill type. | 1-2 jours |
| Détection de blocage + déblocage | Règle de pivot + régression de difficulté. | 3-5 jours |
| Micro-leçons contextuelles | Markdown statique dans bottom sheet. Bouton "?" par type d'exercice. | 3-5 jours |
| Scoring + progression | Par skill instance, montée/descente, seuils. | 1 sem |
| Seed data manuelle | ~240 kana + ~200 mots (fréquents, scores calculés manuellement) + ~50 points de grammaire. | 2-3 jours |
| PWA installable | Manifest + service worker minimal (installabilité, pas d'offline). | 2-3 jours |
| Better Auth | Signup/login simple (email + password). | 2-3 jours |

**Retiré du MVP :**

| Feature | Raison |
|---|---|
| Stripe / freemium / trial | App gratuite au MVP. Monétisation en phase 2. |
| Notifications / rappels | Rétention, pas validation produit. |
| Séquence de réengagement | Idem. |
| First-run experience élaboré | Écran minimal suffit. Itération UX avec les données. |
| Pipeline contenu automatisé (MeCab/Sudachi) | Seed data manuelle au MVP. Pipeline quand le concept est validé. |

### Ordre d'implémentation

| Sprint | Semaines | Livrable | Résultat testable |
|---|---|---|---|
| 1 — Fondations | 1-2 | Setup projet (Effect TS, TanStack Start, Panda CSS, Park UI, Postgres, Better Auth) + modèle de données + seed data | Base technique fonctionnelle |
| 2 — Exercice core | 3-4 | Composant QCM paramétrable + input texte + player audio (Web Speech API) + session de 5 exercices | Exercices de kana jouables |
| 3 — Intelligence | 5-6 | SRS universel + scoring + moteur de recommandation à règles | L'app choisit le bon exercice et les révisions SRS fonctionnent |
| 4 — Expérience | 7-8 | Carte radar + système de difficulté (3 axes) + blocage/déblocage + micro-leçons | Expérience complète bout en bout |
| 5 — Polish + launch | 9-10 | PWA manifest + écran d'accueil minimal + bug fixes + déploiement | App launchable |

**Timeline estimée : ~10 semaines** pour un dev solo concentré.

### Phase 2 — Monétisation & rétention

- Modèle freemium (Stripe) — 1 session/jour gratuite, trial 15 jours, abonnement pro
- Notifications / rappels quotidiens
- Séquence de réengagement
- First-run experience complet
- Pipeline contenu automatisé (MeCab/Sudachi → score → génération IA → validation)
- Extension du contenu (~500 → ~3 000+ mots)
- Onboarding / test de placement adaptatif

### Phase 3 — Croissance

- Moteur de recommandation IA/ML
- Exercices composés multi-skills
- Coach IA conversationnel
- Mode offline
- Audio Neural TTS pré-généré (remplacement Web Speech API)
- Recommandation de ressources externes
- Contenu éditorial

### Phase 4 — Vision

- Support multilingue de l'interface
- Profils spécialisés par objectif
- Production orale avec évaluation IA
- Communauté
- API ouverte
- Estimation JLPT (output dérivé)

### Risques et mitigation

**Risque technique : le système de difficulté à 3 axes est complexe à calibrer.**
Mitigation : fréquence (BCCWJ) et profondeur (graphe) sont objectives. La complexité intrinsèque commence avec des heuristiques simples. Les poids sont tunables sans refonte.

**Risque technique : dev solo = bus factor de 1.**
Mitigation : Effect TS impose une architecture composable et testable. PRD et brainstormings documentent les décisions.

**Risque marché : les utilisateurs ne perçoivent pas la valeur de la granularité.**
Mitigation : c'est exactement ce que le MVP valide. Métrique : progression réelle à J30 sur ≥3 skills.

**Risque contenu : seed data manuelle insuffisante pour tester l'hypothèse.**
Mitigation : ~240 kana + ~200 mots + ~50 grammaire couvrent les skills fondamentaux et core. Suffisant pour valider la boucle exercice→SRS→progression→carte radar. Accélérable rapidement si confiance.

**Risque scope : 10 semaines est optimiste pour un dev solo.**
Mitigation : chaque sprint produit un livrable testable. Si le sprint 4 déborde, l'app est déjà utilisable (exercices + SRS + recommandation fonctionnent). La carte radar et le déblocage peuvent être reportés au sprint 5.

## Exigences spécifiques au domaine

### Conformité & réglementaire

- **GDPR** — Stockage et traitement des données utilisateurs (profil, progression, données SRS). Consentement explicite au signup, droit à l'export et à la suppression des données, hébergement compatible EU. Standard pour toute app web ciblant un public international.

### Accessibilité

- **WCAG 2.1 AA** — Minimum requis pour une app éducative. Contraste suffisant, navigation clavier, compatibilité lecteurs d'écran. Particulièrement important pour les exercices audio (C1, C2) : sous-titres et alternatives visuelles nécessaires. Le journey de Nina (profil non-tech, 52 ans) valide ce besoin.

### Qualité du contenu linguistique

- **Précision des données** — Les exercices reposent sur des données linguistiques (prononciation, traductions, points de grammaire, lectures kanji). Une erreur dans le contenu détruit la confiance immédiatement. Processus requis : validation humaine ou double-check IA de tout contenu avant mise en production. Source de données : dictionnaires de référence (JMdict, KANJIDIC) et corpus de fréquence (BCCWJ).

## Innovation & patterns novateurs

### Domaines d'innovation identifiés

**1. Paradigme de granularité atomique des compétences.**
Les apps existantes (Duolingo, WaniKani, Bunpro, Anki) opèrent soit sur un axe unique (WaniKani = kanji, Bunpro = grammaire), soit sur un niveau global sans décomposition (Duolingo). Manabu décompose l'apprentissage en 17 skill types atomiques avec un graphe de dépendances formel, permettant une progression non-linéaire multi-dimensionnelle.

**2. Unification vocabulaire-grammaire.**
La grammaire crée des instances plus difficiles des mêmes skills core, pas des skills séparés. Fondé sur Nation (2001), jamais implémenté dans un produit. Un seul modèle de données, un seul moteur de recommandation, un seul SRS.

**3. SRS exercice-réponse.**
Extension du SRS classique (paire question-réponse, type Anki) à des exercices typés multi-format. Le SRS track "est-ce que tu maîtrises cette compétence sur ce contenu", pas "est-ce que tu connais ce mot".

**4. Système de difficulté propriétaire.**
Manabu rejette les classifications externes (JLPT N5-N1) comme système de progression. La difficulté de chaque instance est un score composite calculé sur 3 axes :
- **Fréquence d'usage** — rang dans le corpus BCCWJ (~100M mots). Un mot fréquent = prioritaire.
- **Profondeur dans le graphe** — nombre de prérequis nécessaires. Dérivé automatiquement par analyse morphologique (MeCab/Sudachi).
- **Complexité intrinsèque** — traits/lectures pour les kanji, longueur en mora pour les mots, composants/exceptions pour la grammaire.

Score : `difficulté = w1 × fréquence + w2 × profondeur + w3 × complexité` (poids tunables, enrichis post-launch par le taux de réussite réel des utilisateurs).

Les listes JLPT servent de source de contenu, pas de structure. Une "estimation JLPT" sera un output dérivé post-MVP, jamais un input structurant.

**5. Connexion inter-skills par fréquence.**
Les mêmes instances de contenu sont exercées à travers différents skill types. L'apprenant voit 犬 en lecture (C5), l'entend en écoute (C2), le rappelle en production (C6). La connexion émerge de la fréquence de répétition, pas d'exercices composés. C'est pourquoi les exercices mono-skill suffisent au MVP — les connexions se font naturellement par la brièveté et la fréquence des sessions.

### Contexte marché & paysage concurrentiel

| Concurrent | Approche | Limitation |
|---|---|---|
| Duolingo | Parcours linéaire gamifié | Pas de diagnostic granulaire, même exercice pour tous |
| WaniKani | Kanji uniquement, SRS | Un seul skill type, pas de graphe |
| Bunpro | Grammaire uniquement, SRS | Un seul skill type, pas d'intégration vocabulaire |
| Anki | Flashcards libres | Pas de structure, pas de recommandation, effort sur l'utilisateur |
| Lingodeer | Parcours structuré | Linéaire, pas de carte de compétences |

Aucun concurrent ne combine : décomposition atomique multi-skill + graphe de dépendances + SRS universel + système de difficulté propriétaire + recommandation adaptative.

### Approche de validation

- **Validation de la taxonomie** — Confrontation aux frameworks académiques (CEFR, JF Standard, Nation). Déjà réalisée — 7 écarts analysés, tous résolus.
- **Validation du score de difficulté** — Corrélation entre le score calculé et le taux de réussite réel post-launch. Ajustement des poids par régression.
- **Validation du moteur de recommandation** — A/B test : recommandation à règles vs random dans les zones d'équivalence. Mesure : progression réelle à J30.
- **Validation de l'anti-frustration** — Tracking du taux de sessions abandonnées. Cible : <5%.

### Atténuation des risques

- **Risque : la granularité submerge l'utilisateur** — Mitigation : la carte radar est une visualisation, pas un choix. L'utilisateur ne choisit pas parmi 17 skills — l'app recommande. La complexité est dans le moteur, pas dans l'UX.
- **Risque : le score de difficulté initial est imprécis** — Mitigation : les 3 axes sont des proxys solides fondés sur la linguistique. Le 4ème axe (données réelles) s'ajoute post-launch. Les poids sont tunables sans refonte.
- **Risque : l'algorithme à règles (MVP) est trop rigide** — Mitigation : le graphe est bien défini, le score de difficulté est continu. Les règles sont déterministes mais expressives. Le ML viendra enrichir, pas remplacer.
- **Avantage structurel : scalabilité du contenu** — Le modèle type/instance + score de difficulté signifie que l'ajout de contenu est un import + calcul, pas une refonte. Pipeline : corpus → parsing morphologique → calcul de score → génération d'exercices IA → validation.

## User Journeys

### Journey 1 : Marc — Le débutant absolu (MVP, happy path)

**Marc, 28 ans, développeur web à Lyon.** Il a toujours voulu apprendre le japonais mais n'a jamais tenu plus de 2 semaines sur Duolingo. Ce qui le frustrait : l'impression d'empiler des mots sans comprendre comment ils s'articulent, et un niveau "23%" qui ne voulait rien dire.

**Ouverture.** Marc découvre Manabu via un post Reddit. Il s'inscrit, crée son compte. L'app lui présente un écran de bienvenue minimaliste : sa carte radar — 17 dimensions, toutes à zéro — et une explication en une phrase : "Chaque axe est une compétence. Tes exercices vont les faire grandir une par une." Pas de choix paralysant : l'app recommande de commencer par les hiragana (F1). Un bouton : "C'est parti." Time-to-first-value : <3 min entre l'inscription et la compréhension de la proposition de valeur.

**Progression.** Premier exercice : voir un caractère, choisir le son parmi 4 options. Marc hésite sur き — il tape sur le bouton "?" qui ouvre une micro-leçon de 15 secondes expliquant le son et le tracé. Il réussit 4/5 exercices. Session terminée en 4 minutes. Sa carte radar bouge : F1 passe de 0 à 5%. Le lendemain, il ouvre l'app : le SRS a ciblé les caractères hésitants et lui propose une session de consolidation. Après 4 jours, F1 est à 30% et l'app déverrouille C4 (lecture→prononciation) : "Nouveau skill débloqué !" Marc voit le graphe de dépendances progresser.

**Climax.** Après 2 semaines (~70 min d'exercices cumulés), Marc passe devant un restaurant japonais et lit les katakana sur l'enseigne : ラーメン. Il sait que ça dit "rāmen". C'est concret, c'est réel, c'est la première fois qu'une app lui donne ce pouvoir.

**Résolution.** Marc fait sa session quotidienne en buvant son café. Les skills avancent à des rythmes différents — C2 (compréhension orale) est plus lent que C5 (lecture→sens), et c'est normal. La carte radar devient asymétrique, et ça lui plaît : c'est *sa* carte, pas un pourcentage générique.

**Capabilities révélées :** inscription, first-run experience (carte radar + explication + recommandation initiale), exercices F1/F2/F3, micro-leçon contextuelle (bouton "?"), SRS, déverrouillage progressif via graphe, système de scoring.

---

### Journey 2 : Sophie — Le mur de progression (MVP, edge case)

**Sophie, 45 ans, cadre dans une boîte internationale.** Elle utilise Manabu depuis 6 mois. Ses skills kana et vocabulaire simple sont solides, mais elle stagne en compréhension orale (C2). Les sons se confondent, les phrases vont trop vite. Avant Manabu, ce genre de blocage l'aurait fait abandonner.

**Ouverture.** Sophie ouvre l'app. Le moteur de recommandation (algorithme à règles : graphe + SRS + pondération) lui propose un exercice C2. Elle échoue. Puis un autre — échec. Le système évalue sa session : score en dessous du seuil de maîtrise sur 3 sessions consécutives de C2. La règle de détection de blocage se déclenche.

**Progression.** L'app affiche un message : "L'écoute te résiste en ce moment. Tu veux persister, ou travailler autre chose en attendant ?" Sophie choisit de pivoter. Le moteur de recommandation applique la règle de pivot : proposer un skill adjacent qui renforce indirectement le skill bloqué. Il sélectionne C4 (lecture→prononciation) sur du vocabulaire que Sophie connaît déjà en lecture. Un bouton "?" lui propose une micro-leçon sur la prononciation des mots longs. C'est plus facile, sa confiance remonte. En parallèle, le SRS recalibre les exercices C2 : les prochaines propositions seront des mots plus courts, prononcés plus lentement.

**Climax.** Après 3 jours de pivot, le moteur repropose C2 avec des exercices recalibrés. Sophie en réussit 4 sur 5. La carte radar montre C2 qui remonte. Le mur n'était pas infranchissable — il fallait le contourner.

**Résolution.** Sophie comprend que la stagnation sur un skill n'est pas un échec global. L'app lui a montré qu'elle progressait sur d'autres dimensions pendant ce temps. Elle n'a jamais eu le sentiment d'être "bloquée sans recours".

**Capabilities révélées :** détection de blocage par règle (score session < seuil × 3 sessions consécutives), choix utilisateur (persister/pivoter), règle de pivot vers skill adjacent, micro-leçon contextuelle, recalibrage dynamique du SRS, feedback émotionnel positif.

---

### Journey 3 : Léo — L'utilisateur gratuit casual (Post-MVP, Phase 2 — freemium)

**Léo, 19 ans, étudiant.** Il est curieux du japonais mais pas prêt à payer. Il télécharge Manabu parce que c'est gratuit.

**Ouverture.** Léo s'inscrit, voit la carte radar, trouve le concept cool. Le trial de 15 jours lui donne accès illimité. Il fait sa première session sur les hiragana.

**Progression (trial).** Pendant 15 jours, Léo fait 2-3 sessions par jour. Il avance vite sur F1, F2, et commence C4. Au jour 12, une notification lui rappelle : "Ton essai gratuit se termine dans 3 jours. Voici ta progression." Sa carte radar montre de vrais progrès sur 5 skills. Au jour 14 : "Dernier jour d'accès illimité demain."

**Climax — Jour 16 (transition).** Le trial expire. L'app affiche un écran récapitulatif : "En 15 jours, tu as progressé sur 5 skills et complété 42 exercices. À ce rythme, tu pourrais débloquer C5 (lecture→sens) dans 8 jours." Puis le choix : s'abonner ou continuer en gratuit. Léo choisit gratuit.

**Résolution — Scénario A (conversion retardée).** Léo passe en mode gratuit : 1 session/jour (~5 exercices). Il continue sa routine quotidienne — c'est suffisant pour maintenir le SRS, mais il ne peut plus accélérer. Après 2 semaines en gratuit, il ressent la friction : il veut enchaîner mais l'app lui dit "à demain". Il prend l'abo.

**Résolution — Scénario B (rétention gratuite).** Léo fait sa session quotidienne. C'est lent mais il progresse. L'app ne le punit pas — elle le maintient engagé.

**Résolution — Scénario C (désengagement + réengagement).** Léo arrête de venir au jour 18. Au jour 19, notification : "Ton SRS a 3 hiragana à consolider — 2 minutes suffisent." Pas de réponse. Au jour 23, notification : "Ça fait 5 jours — ta progression en F1 commence à s'effriter." Au jour 30, dernière tentative : "Tu avais progressé sur 5 skills. Reviens faire une session pour ne pas perdre tes acquis." Si Léo revient, le SRS recalibre et la reprise est douce.

**Capabilities révélées :** gestion du trial (15 jours), notifications progressives (J-3, J-1, fin trial), écran récap trial avec projection, limitation freemium (1 session/jour), paywall, séquence de réengagement (J+1, J+5, J+14 après inactivité), recalibrage SRS après absence.

---

### Journey 4 : Nina — L'utilisatrice qui ne comprend pas l'exercice (MVP, edge case UX)

**Nina, 52 ans, enseignante de français.** Motivée mais peu à l'aise avec les apps. Elle a installé Manabu sur recommandation de sa fille.

**Ouverture.** Nina termine les hiragana de base et le moteur déverrouille C1 (perception audio). L'exercice lui joue un son et lui demande de sélectionner la transcription. Nina fixe l'écran. Elle ne comprend pas ce qu'on attend d'elle — "segmenter" un son, ça ne lui parle pas.

**Progression.** Nina tape sur le bouton "?". La micro-leçon s'ouvre : "Tu vas entendre un son japonais. Choisis le kana qui correspond à ce que tu entends." Un exemple animé lui montre le flow : son → sélection → feedback. Elle comprend. Elle retente, réussit 3/5. L'app valide la session avec encouragement.

**Climax.** À la session suivante, Nina tombe sur un exercice C4 (lecture→prononciation). Même réflexe : bouton "?", micro-leçon, elle comprend le format. Elle prend confiance. Les micro-leçons deviennent son filet de sécurité.

**Résolution.** Nina n'a jamais le sentiment que l'app est "pour les jeunes" ou "trop compliquée". Chaque nouveau type d'exercice a une explication accessible. Elle recommande Manabu à ses collègues.

**Capabilities révélées :** micro-leçon contextuelle par type d'exercice (explication + exemple animé), accessibilité UX pour profils non-tech, découverte progressive des formats d'exercice.

---

### Journey 5 : Yuki — L'intermédiaire rouillée (Post-MVP)

**Yuki, 35 ans, franco-japonaise.** Ex-N4, arrêté il y a 3 ans. Compétences résiduelles inégales : lecture correcte, écoute rouillée, production orale presque perdue.

**Ouverture.** Yuki s'inscrit et passe le test de placement adaptatif (~30 min). Le test détecte que F1/F2 sont quasi-maîtrisés, C5 est correct, C2 est fragile, C6 est faible. Sa carte radar est un polygone asymétrique qui reflète exactement son profil.

**Progression.** L'app ne lui fait pas refaire les hiragana. Elle commence par les skills faibles (C2, C6) avec du vocabulaire connu. Après 1 mois, elle retrouve son niveau d'écoute sans avoir perdu de temps sur ce qu'elle savait.

**Capabilities révélées :** test de placement adaptatif multi-skill, calibrage initial asymétrique, reprise de progression sur profil non-débutant. *Toutes post-MVP.*

---

### Journey 6 : Kenji — Le profil asymétrique (Post-MVP)

**Kenji, 22 ans, otaku.** Comprend le japonais parlé couramment (anime), ne lit presque pas les kanji, grammaire intuitive non formalisée.

**Ouverture.** Le test de placement révèle un profil extrême : C1/C2 très élevés, C3/C5 quasi nuls. L'app entre par les kanji (C3→C5) avec du vocabulaire connu à l'oral. Les exercices de grammaire formalisent ce qu'il sait intuitivement. Il lit sa première page de manga sans furigana.

**Capabilities révélées :** points d'entrée multiples dans le graphe (C3 sans kana), transfert cross-canal, profil extrêmement asymétrique. *Toutes post-MVP.*

---

### Résumé des capabilities par journey

| Capability | Marc | Sophie | Nina | Léo | Yuki | Kenji |
|---|---|---|---|---|---|---|
| First-run experience (carte radar + reco initiale) | MVP | — | MVP | Post | Post | Post |
| Exercices atomiques par skill | MVP | MVP | MVP | Post | Post | Post |
| Micro-leçons contextuelles (bouton "?") | MVP | MVP | MVP | — | — | — |
| SRS universel | MVP | MVP | MVP | Post | Post | Post |
| Graphe de dépendances / déverrouillage | MVP | MVP | MVP | Post | Post | Post |
| Carte radar | MVP | MVP | MVP | Post | Post | Post |
| Choix utilisateur (exercices équivalents) | MVP | MVP | — | — | — | — |
| Détection de blocage + déblocage | — | MVP | — | — | — | — |
| Feedback post-réponse + récap session | MVP | MVP | MVP | — | — | — |
| Persistance de session | MVP | MVP | MVP | — | — | — |
| Freemium / trial / paywall | — | — | — | Post | — | — |
| Notifications / rappels | — | — | — | Post | — | — |
| Séquence de réengagement | — | — | — | Post | — | — |
| Test de placement adaptatif | — | — | — | — | Post | Post |
| Points d'entrée multiples (C3) | — | — | — | — | — | Post |

## Exigences spécifiques Web App (PWA)

### Vue d'ensemble technique

Manabu est une PWA mobile-first, SPA, conçue pour des sessions courtes (~5 min) d'exercices interactifs. Pas d'expérience desktop dédiée au MVP — le design mobile s'affiche tel quel sur grand écran.

### Stack technique

| Couche | Technologie |
|---|---|
| Langage | TypeScript (strict) |
| Framework core | Effect TS (backend 100%, frontend ~80%) |
| Frontend | React + Effect Atom + TanStack Start |
| CSS | Panda CSS (utility-first, type-safe) |
| Composants UI | Park UI (composants accessibles, basé sur Ark UI) |
| Base de données | PostgreSQL via `@effect/sql` |
| Authentification | Better Auth |
| Paiement (Phase 2) | Stripe (freemium / trial / abonnement) |
| Audio MVP | Web Speech Synthesis API (voix japonaises natives du navigateur) |
| NLP Pipeline (Phase 2, amont) | MeCab / Sudachi pour l'analyse morphologique japonaise |
| Hébergement | Railway ou Fly.io (Node runtime, Postgres managé) |

### Audio : stratégie MVP → croissance

| Phase | Approche | Coût infra |
|---|---|---|
| MVP | Web Speech Synthesis API (TTS navigateur) | Zéro |
| Croissance | Neural TTS pré-généré (Google Cloud / Azure) + Cloudflare R2 + CDN | Faible |

Le TTS navigateur est robotique mais fonctionnel. La migration vers du TTS pré-généré viendra quand la qualité audio deviendra un facteur de rétention mesurable.

### Support navigateurs

- **Cible :** Chrome, Safari, Firefox, Edge (2 dernières versions)
- **Exclus :** Internet Explorer, navigateurs legacy
- **Mobile :** Chrome Android, Safari iOS (cibles primaires)
- **Contrainte Web Speech API :** Vérifier la disponibilité des voix japonaises par navigateur/OS. Fallback si indisponible : affichage de la transcription romaji sans audio.

### Design responsive

- **Mobile-first** — UI conçue pour 360-428px de large
- **Pas d'expérience desktop dédiée au MVP**
- **Composants critiques mobile :** carte radar (touch-friendly), exercices (gros boutons, feedback visuel immédiat), navigation par tap

### Performance targets

| Métrique | Cible |
|---|---|
| First Contentful Paint | <1.5s |
| Time to Interactive | <3s |
| Latence recommandation | <3s |
| Latence interaction exercice | <200ms |
| Lighthouse Performance Score | >75 MVP, >90 croissance |

### SEO

Non pertinent au MVP — contenu derrière authentification. Landing page statique pour le référencement marketing.

### Considérations d'implémentation

**Effect TS comme colonne vertébrale :**
- Services Effect pour le moteur de recommandation, le SRS, le scoring — composabilité et testabilité
- `@effect/sql` pour les queries PostgreSQL type-safe
- Effect Atom côté frontend pour l'état réactif (progression, carte radar, état d'exercice)
- Scheduling Effect pour les jobs batch (pipeline contenu, recalcul SRS)

**TanStack Start :**
- SSR pour la landing page / pages marketing
- Client-side routing pour l'app d'exercices (SPA behavior)
- Data loading intégré pour le pré-chargement des exercices

**Better Auth :**
- Signup/login (email + password, social login optionnel)
- Session management
- *Phase 2 : intégration avec le modèle freemium (trial 15 jours, états: trial → free → pro → churned)*

**Stripe (Phase 2) :**
- Checkout pour l'abonnement pro
- Webhooks → Effect TS service pour les changements d'état
- Customer portal pour la gestion d'abonnement

**PostgreSQL (seul au MVP) :**
- Contenu linguistique (seed data MVP : ~240 kana + ~200 mots + ~50 grammaire ; extensible via pipeline Phase 2) avec scores de difficulté
- Graphe de dépendances (relations entre skill types et instances)
- Données SRS par utilisateur par instance (dernière réponse, score, prochaine révision)
- Sessions et analytics (historique des réponses, temps)
- Redis en phase croissance si les queries de recommandation deviennent un bottleneck

**Pipeline NLP (Phase 2, batch amont, pas temps réel) :**
- MeCab/Sudachi décompose les phrases en composants
- Dérivation automatique des prérequis par instance
- Calcul du score de difficulté composite
- Résultats stockés en Postgres, consommés par le serveur
- *Au MVP : scores et prérequis calculés manuellement sur le seed data*

## Exigences fonctionnelles

### Gestion des compétences

- **FR1:** L'apprenant peut visualiser sa carte radar montrant sa progression sur chacun des 17 skill types.
- **FR2:** Le système peut calculer le score de difficulté de chaque instance de contenu selon 3 axes (fréquence d'usage, profondeur dans le graphe, complexité intrinsèque).
- **FR3:** Le système peut déterminer les prérequis de chaque instance de contenu via le graphe de dépendances entre skill types.
- **FR4:** Le système peut déverrouiller de nouveaux skill types pour l'apprenant lorsque les prérequis sont satisfaits.
- **FR5:** L'apprenant peut voir quels skill types sont déverrouillés, verrouillés, et en progression.

### Exercices

- **FR6:** L'apprenant peut compléter un exercice atomique ciblant un seul skill type.
- **FR7:** Le système peut présenter un exercice sous forme de QCM (stimulus visuel ou audio + options texte ou audio).
- **FR8:** Le système peut présenter un exercice sous forme d'input texte (stimulus + champ de saisie).
- **FR9:** Le système peut produire de l'audio en japonais pour les exercices d'écoute et de prononciation.
- **FR10:** Le système peut afficher une transcription textuelle lorsque l'audio n'est pas disponible.
- **FR11:** L'apprenant peut accéder à une micro-leçon contextuelle expliquant le format et l'objectif de chaque type d'exercice.
- **FR12:** Le système peut générer des distracteurs pertinents pour les exercices QCM (confusions plausibles).
- **FR13:** L'apprenant peut compléter une session de ~5 exercices en ~5 minutes.
- **FR14:** L'apprenant voit immédiatement après chaque réponse si elle est correcte, la bonne réponse si incorrecte, et l'impact sur sa progression.
- **FR15:** L'apprenant voit un récapitulatif à la fin de chaque session (exercices complétés, skills impactés, progression).

### Mémorisation espacée (SRS)

- **FR16:** Le système peut planifier la révision de chaque paire exercice/réponse selon un algorithme de mémorisation espacée.
- **FR17:** Le système peut ajuster l'intervalle de révision en fonction de la réponse de l'apprenant (correcte, incorrecte, temps de réponse).
- **FR18:** Le système peut recalibrer les intervalles de révision après une période d'absence de l'apprenant.

### Recommandation & progression

- **FR19:** Le système peut sélectionner l'exercice optimal pour l'apprenant via un algorithme à règles (graphe de dépendances + SRS + score de difficulté).
- **FR20:** Le système peut scorer la progression de l'apprenant par skill instance (montée sur bonne réponse, descente sur mauvaise réponse, seuils de maîtrise).
- **FR21:** Le système peut détecter un blocage de l'apprenant sur un skill (score session en dessous du seuil sur plusieurs sessions consécutives).
- **FR22:** Le système peut proposer un pivot vers un skill adjacent lorsqu'un blocage est détecté.
- **FR23:** Le système peut baisser la difficulté des exercices sur un skill bloqué.
- **FR24:** L'apprenant peut choisir entre persister sur un skill bloqué ou pivoter vers un autre skill.
- **FR25:** Le système informe l'apprenant lorsqu'il n'y a plus de nouveau contenu disponible sur un skill type, tout en continuant les révisions SRS existantes.
- **FR42:** Lorsque plusieurs exercices sont équivalents selon le moteur de recommandation, l'apprenant peut choisir parmi les options proposées.

### Contenu linguistique

- **FR26:** Le système peut stocker et servir des instances de contenu (mots, kanji, points de grammaire) avec leurs métadonnées (score de difficulté, prérequis, skill type associé).
- **FR27:** Le système peut associer chaque instance de contenu à un ou plusieurs skill types pour lesquels elle sert d'exercice.

### Gestion utilisateur

- **FR28:** Un visiteur peut créer un compte avec email et mot de passe.
- **FR29:** Un utilisateur peut se connecter et se déconnecter.
- **FR30:** Un utilisateur peut réinitialiser son mot de passe via email.
- **FR31:** Un utilisateur peut retrouver sa progression complète après reconnexion.
- **FR32:** Un utilisateur peut supprimer son compte et toutes ses données.
- **FR33:** Un utilisateur peut exporter ses données de progression.

### Navigation & expérience

- **FR34:** L'apprenant est guidé vers son premier exercice après création de compte (recommandation initiale).
- **FR35:** Quand l'apprenant ouvre l'app, le système lui propose de lancer une session adaptée à son état actuel (SRS + recommandation).
- **FR36:** L'apprenant peut naviguer entre les écrans principaux (carte radar, exercice en cours, historique de progression).
- **FR37:** L'apprenant peut consulter son historique d'activité (sessions complétées, exercices réalisés, évolution de la progression).
- **FR38:** Le système sauvegarde la progression d'une session en cours ; si l'apprenant quitte et revient, ses réponses partielles sont conservées.
- **FR39:** L'application peut être installée sur un appareil mobile via le navigateur (PWA).

### Accessibilité

- **FR40:** L'application est utilisable au clavier et compatible avec les lecteurs d'écran.
- **FR41:** Les exercices audio disposent d'une alternative visuelle (transcription textuelle).

## Exigences non fonctionnelles

### Performance

- **NFR1:** Toute interaction pendant un exercice (affichage, validation de réponse, feedback) se complète en <200ms.
- **NFR2:** La sélection d'exercice par le moteur de recommandation se complète en <3s.
- **NFR3:** First Contentful Paint <1.5s.
- **NFR4:** Time to Interactive <3s.
- **NFR5:** Lighthouse Performance Score >75 au MVP, >90 en phase croissance.

### Sécurité & confidentialité

- **NFR6:** Toutes les communications client-serveur sont chiffrées (HTTPS/TLS).
- **NFR7:** Les mots de passe sont hashés et ne sont jamais stockés en clair.
- **NFR8:** Les données de progression de l'utilisateur ne sont accessibles qu'à l'utilisateur authentifié.
- **NFR9:** Les endpoints d'authentification et l'API sont protégés par rate limiting.
- **NFR10:** Politique de confidentialité accessible depuis l'app. Consentement explicite au signup. Aucun tracking tiers sans consentement.
- **NFR11:** Les sessions d'authentification expirent après 30 jours d'inactivité.

### Disponibilité

- **NFR12:** Uptime >99.5%.
- **NFR13:** En cas d'indisponibilité du serveur, l'utilisateur voit un message d'erreur explicite (pas d'écran blanc).
- **NFR14:** Les données utilisateur sont sauvegardées automatiquement avec possibilité de restauration. Rétention minimum : 7 jours.

### Accessibilité

- **NFR15:** Conformité WCAG 2.1 niveau AA (inclut : contraste suffisant, navigation clavier avec indicateur de focus visible, compatibilité lecteurs d'écran).
- **NFR16:** Les exercices audio sont utilisables sans son (transcription textuelle — FR41).

### Qualité du contenu

- **NFR17:** Toute instance de contenu linguistique passe par un processus de validation avant mise en production. Aucune instance non validée n'est servie aux utilisateurs.
