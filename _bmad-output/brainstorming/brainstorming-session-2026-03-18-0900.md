---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: 'Système de compétences granulaire + IA adaptative pour apprentissage du japonais (Manabu)'
session_goals: 'Établir taxonomie complète des skills, logique de sélection adaptative des exercices, système de mémorisation espacée'
selected_approach: 'ai-recommended'
techniques_used: ['Morphological Analysis', 'Role Playing', 'First Principles Thinking']
ideas_generated: [19 insights, 9 canaux]
context_file: ''
session_active: false
workflow_completed: true
facilitation_notes: 'Paul a une vision très claire et structurée. Il pense naturellement en systèmes. Les challenges First Principles ont été particulièrement productifs pour casser des hypothèses implicites.'
---

# Brainstorming Session Results — Manabu

**Facilitateur:** Paul
**Date:** 2026-03-18

---

## Session Overview

**Sujet:** Conception d'une application d'apprentissage du japonais pilotée par l'IA (Manabu) — système de compétences ultra-granulaire pour sélection adaptative d'exercices

**Objectifs:**
- Établir la taxonomie complète des skills pour l'apprentissage du japonais
- Concevoir la logique de sélection adaptative des exercices par IA
- Intégrer un système de mémorisation espacée (SRS)
- Garantir zéro frustration pour l'apprenant à tous les niveaux

### Session Setup

- Deux grandes familles de compétences : Compréhension et Production
- Sous-catégories imbriquées à un niveau d'abstraction très fin
- Chaque réponse enregistrée pour SRS et analyse de progression
- L'IA doit cibler l'exercice le plus pertinent selon les priorités d'apprentissage

---

## Technique Selection

**Approche:** Techniques recommandées par l'IA
**Contexte d'analyse:** Conception de système complexe (taxonomie hiérarchique + logique adaptative)

**Techniques recommandées:**

- **Morphological Analysis:** Exploration systématique de toutes les dimensions de compétences et leurs combinaisons
- **Role Playing:** Incarner différents profils d'apprenants pour valider et enrichir l'arbre de skills
- **First Principles Thinking:** Revenir aux vérités fondamentales de l'acquisition du japonais pour élaguer et valider

---

## Technique Execution Results

### Morphological Analysis — Canaux d'interaction avec la langue

**Focus :** Identifier tous les canaux par lesquels un apprenant interagit avec le japonais

**9 canaux identifiés :**

| # | Canal | Description | Famille |
|---|-------|-------------|---------|
| 1 | Reconnaissance phonétique pure | Entendre du japonais et pouvoir répéter les sons/syllabes sans comprendre le sens | Compréhension |
| 2 | Lecture (prononciation) | Voir un kana/kanji/mot écrit et savoir le prononcer correctement, sans connaître le sens | Compréhension |
| 3 | Reconnaissance visuelle du sens | Voir un kanji ou combinaison de kanji et en comprendre le sens, sans savoir le prononcer | Compréhension |
| 4 | Compréhension auditive du sens | Entendre un mot et en comprendre le sens directement | Compréhension |
| 5 | Décomposition grammaticale structurelle | Identifier les rôles grammaticaux (sujet/verbe/complément) via les marqueurs, même sans connaître le vocabulaire | Compréhension |
| 6 | Compréhension globale (texte long / écoute longue) | Extraire le sens général d'un contenu sans tout comprendre — résumer, identifier le thème | Compréhension |
| 7 | Production orale (prononciation active) | Produire correctement les sons japonais — accent, intonation, rythme | Production |
| 8 | Production écrite (clavier) | Taper du japonais au clavier — convertir sa pensée en kana/kanji via l'IME | Production |
| 9 | Traduction / Formulation | Exprimer une idée en japonais — choisir les mots, la structure, le registre de politesse | Production |

**Unités linguistiques identifiées :** son/syllabe, mot, phrase, texte long, dialogue

**Insight clé :** La taxonomie complète doit s'appuyer sur la recherche en linguistique appliquée et en SLA (Second Language Acquisition) — frameworks CEFR, JF Standard, travaux de Krashen, Nation, etc.

**Concept fondamental : Skills atomiques vs composés**
- Un exercice atomique teste UN seul skill
- Un exercice composé cumule plusieurs skills
- Les atomiques d'abord, les composés ensuite

---

### Role Playing — Validation par personas

**Focus :** Incarner des profils d'apprenants pour stress-tester la grille de skills

#### Persona 1 : Marc — Débutant absolu (28 ans, développeur)
_Tous skills à 0. Premier contact avec l'app._

**Découvertes :**
- **Leçons contextuelles intégrées** — Chaque exercice atomique est lié à une micro-leçon accessible via un bouton. L'app est centrée sur l'exercice, mais la théorie est toujours à un clic. Pas de parcours de cours obligatoire — l'apprentissage théorique est "pull", pas "push".
- **Contenu éditorial de base** — Articles introductifs (les 3 écritures, qu'est-ce qu'un hiragana, points de grammaire) disponibles comme ressources permanentes.
- **Un exercice = un skill** — Chaque session est mono-skill. Les mêmes mots reviennent à travers différents exercices, les connexions se font naturellement.
- **Sessions courtes (~5 min)** — La brièveté garantit que les mêmes mots reviennent fréquemment. La connexion entre skills se fait par la fréquence, pas par le forçage.
- **Liberté guidée** — L'IA recommande les exercices optimaux, mais l'utilisateur reste libre de choisir. Quand plusieurs chemins sont équivalents, on randomise ou on laisse le choix.
- **Priorisation à 3 niveaux** — (1) Prérequis strict : verrou dur. (2) Recommandation forte : un chemin clairement meilleur. (3) Équivalence : plusieurs chemins valides.

#### Persona 2 : Yuki — Intermédiaire rouillée (35 ans, franco-japonaise, ex-N4)
_A étudié 2 ans en fac, arrêté il y a 3 ans._

**Découvertes :**
- **Onboarding en 3 phases** — (1) Auto-évaluation pour calibrage grossier. (2) Test de placement qui part de cette base — si tu dis que tu lis les kana, on ne te teste pas là-dessus. (3) Adaptation continue en temps réel.
- **Détection de plafond dynamique** — On monte en difficulté jusqu'à l'échec pour trouver la frontière réelle du skill.

#### Persona 3 : Kenji — Otaku asymétrique (22 ans, appris par les anime)
_Écoute élevée, lecture kanji quasi nulle, grammaire intuitive._

**Découvertes :**
- **Test de placement multi-skill avec arrêt adaptatif** — ~30 min, évalue chaque skill indépendamment. Monte en difficulté jusqu'à l'échec, puis passe au skill suivant. Résultat : une carte radar, pas un niveau global.

#### Persona 4 : Sophie — Blocage persistant (45 ans, cadre, 6 mois d'utilisation)
_Stagne en écoute, confond certains sons, frustration croissante._

**Découvertes :**
- **Gestion de blocage à 3 stratégies** — (1) Baisser la difficulté pour restaurer la confiance. (2) Pivoter vers un autre skill et revenir plus tard. (3) Demander feedback — "tu veux persister ou faire une pause ?"
- **Coach IA conversationnel** — En cas de blocage, l'IA ouvre un dialogue pour comprendre la difficulté et proposer des conseils personnalisés.
- **Recommandation de ressources externes** — YouTube, podcasts, articles adaptés au niveau ET au blocage spécifique. L'app admet ses propres limites.

---

### First Principles Thinking — Challenges des hypothèses

**Focus :** Revenir aux vérités fondamentales, casser les hypothèses implicites

#### Challenge 1 : La granularité est-elle un risque ?
**Verdict : CONFIRMÉ comme force.**
La frustration dans l'apprentissage vient souvent de ne pas savoir QUOI améliorer. La granularité des skills EST la proposition de valeur de Manabu. C'est ce qui le différencie de Duolingo et des autres. La complexité technique est un challenge d'ingénierie, pas un défaut de design.

#### Challenge 2 : Le prérequis compréhension → production est-il universel ?
**Verdict : CASSÉ.**
Certains skills de production (répétition orale, apprentissage de mots par l'écoute) n'ont PAS besoin de la lecture comme prérequis. Un utilisateur pourrait progresser uniquement à l'oral sans toucher à l'écrit. L'arbre de skills n'est pas linéaire — c'est un graphe avec plusieurs points d'entrée.

#### Challenge 3 : L'IA est-elle nécessaire partout ?
**Verdict : RECADRÉ — IA stratégique, pas omniprésente.**
- **IA en amont** — Génération de contenu (questions, exercices) réutilisable par tous les utilisateurs
- **IA en temps réel** — Analyse du profil pour choisir la bonne question parmi celles pré-générées, ou en générer de nouvelles
- **IA comme simplificateur** — Remplacer des algorithmes trop complexes par un LLM qui "comprend" le profil
- **SRS universel** — L'unité du SRS est la paire exercice/réponse. Un seul moteur pour tous les skills. C'est algorithmique, pas IA.
- **Contenu pré-généré + sélection intelligente** — Réduit les coûts et la latence.

---

## Idea Organization and Prioritization

### Thème 1 : Architecture des Skills (FONDATION)
- 9 canaux identifiés (compréhension × 6 + production × 3)
- Skills atomiques vs composés
- Granularité = proposition de valeur
- Graphe de dépendances avec points d'entrée multiples
- Ancrage académique nécessaire (SLA, CEFR, JF Standard)

### Thème 2 : Moteur d'exercices & UX
- Exercice = mono-skill, sessions ~5 min
- Vocabulaire partagé entre types d'exercices
- Liberté guidée (recommandation sans contrainte)
- Priorisation à 3 niveaux (verrou / recommandation / équivalence)
- Leçons contextuelles accessibles via bouton

### Thème 3 : Onboarding & positionnement
- 3 phases : auto-évaluation → test de placement → adaptation continue
- Test multi-skill ~30 min avec arrêt adaptatif
- Carte radar par skill, pas de niveau global
- Détection de plafond dynamique

### Thème 4 : Anti-frustration & accompagnement
- 3 stratégies de déblocage
- Coach IA conversationnel
- Ressources externes contextuelles

### Thème 5 : Architecture technique & rôle de l'IA
- SRS universel (paire exercice/réponse)
- IA en 3 rôles (amont, temps réel, simplificateur)
- Contenu pré-généré + sélection intelligente

### Concepts breakthrough
- La granularité des skills est le produit lui-même
- Le SRS universel sur la paire exercice/réponse simplifie radicalement l'architecture
- Plusieurs points d'entrée dans le graphe de skills

---

## Prioritization Results

### Priorité 1 : Taxonomie des skills
Recherche académique (SLA, CEFR, JF Standard) + cartographie complète des skills atomiques + graphe de dépendances.
**C'est le livrable fondateur. Sans ça, rien d'autre ne peut exister.**

### Priorité 2 : Exercices par skill atomique
Pour chaque skill atomique, définir le(s) type(s) d'exercice qui le testent. Format des questions, réponses attendues, validation que chaque skill est "testable".

### Priorité 3 : Système de scoring des skills
Comment un skill monte (bonne réponse), comment il baisse (mauvaise réponse, oubli), seuils de déclenchement pour recommandations et prérequis.

### Quick win (reporté) : Onboarding
Hypothèse de départ = utilisateur 100% débutant. L'onboarding viendra quand le système de base sera solide.

### Long terme : Exercices composés multi-skills
Combiner plusieurs skills dans un même exercice. Requiert que les atomiques soient bien établis d'abord.

---

## Session Summary

### Achievements
- **19 insights structurants** couvrant architecture, UX, onboarding, anti-frustration et technique
- **9 canaux d'interaction** identifiés et classifiés
- **4 personas** testés révélant des mécanismes clés
- **3 hypothèses challengées** dont 1 cassée (compréhension → production)
- **Plan d'action priorisé** en 3 étapes claires

### Creative Facilitation Narrative
La session a commencé par une cartographie systématique (Morphological Analysis) qui a posé les fondations. Le Role Playing a ensuite donné vie au système en révélant des besoins concrets à travers 4 profils d'apprenants très différents. Le First Principles Thinking a été le moment le plus transformateur — en challengeant l'hypothèse "compréhension avant production", on a découvert que le graphe de skills est plus riche et flexible que prévu.

### Prochaines étapes
1. **Recherche académique** sur la taxonomie des compétences en acquisition du japonais
2. **Construction de l'arbre de skills** avec granularité maximale
3. **Mapping exercices ↔ skills** pour valider la testabilité
4. **Conception du système de scoring** pour mesurer la progression
