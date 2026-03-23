# Sprint 2 — Exercice core (Semaines 3-4)

## 1. Objectif

Livrer les composants d'exercice dans Storybook pour chaque skill type. Les composants sont isolés, testables et démontrables avec des données mockées. Le wiring avec la vraie DB et le moteur de recommandation se fera au Sprint 3.

**Résultat testable :** à la fin du sprint, chaque composant d'exercice est visible et interactif dans Storybook avec ses différents états (idle, succès, échec, skip, récap).

## 2. Bilan Sprint 1

### Scope livré vs prévu

| Type | Prévu | Livré | Delta |
|---|---|---|---|
| Kana | ~240 | ~208 | ✅ Aligné |
| Kanji | ~120-150 | 2 136 (jōyō complet) | ×15 |
| Mots | ~200 | 5 000 (BCCWJ) | ×25 |
| Grammaire | ~50 | 259 | ×5 |
| Phrases | — | 2 590 | 🆕 US7 BIS |
| Content items | — | ~50 000+ | 🆕 |

**11/11 US livrées.** Le corpus linguistique est complet — pas de blocage contenu pour le Sprint 2.

### Actions identifiées pour le Sprint 2

| Priorité | Action | Détail |
|---|---|---|
| 🔴 | Pipeline CI/CD | GitHub Actions : lint + types + tests intégration + E2E sur chaque push |
| 🟡 | Temps de seed en test | ~50 000 INSERT — mesurer et optimiser (DB pré-seedée vs re-seed à chaque run) |
| 🟡 | Audit qualitatif phrases | Échantillonner les 2 590 phrases générées pour vérifier naturalité et utilité pédagogique |
| 🟢 | Scope userId | Toute query sur ReviewCard doit être scopée au userId de la session (pas d'IDOR) |

## 3. Approche — conception skill par skill

### Pourquoi pas de découpage technique a priori

Le PRD mentionne « 2-3 composants d'exercice paramétrables (QCM, input texte, player audio) ». Mais on ne sait pas encore quels skills partagent le même format d'exercice. Un découpage en US par composant technique (US-QCM, US-Input, US-Audio) serait prématuré.

**Approche retenue :** passer les 15 skills un par un en session de conception. Les patterns communs émergeront naturellement. Le découpage en US se fera ensuite, basé sur les composants réellement identifiés.

### Processus de conception par skill

Pour chaque skill, décider :

1. **Stimulus** — quoi ? sous quelle forme ? (texte, audio, image)
2. **Interaction** — comment l'apprenant répond ? (QCM, saisie, voix)
3. **Distracteurs** — logique de génération ? (proches visuellement, phonétiquement, sémantiquement)
4. **Feedback** — quoi montrer en cas de succès/erreur ?
5. **Scaffolding** — aide temporaire pour les débutants ?
6. **Composant partagé ?** — est-ce qu'un format déjà conçu convient ?

### Ordre de conception

Commencer par les **Fondations (F1-F3)** pour poser les premiers patterns, puis **Core (C1-C7)**, puis **Grammaire (G1-G5)**.

## 4. Matrice de conception des exercices

### Règles de design globales

| Règle | Détail |
|---|---|
| **Zéro romaji** | Jamais de romaji affiché nulle part dans l'app |
| **Session = queue de 5** | DrillQueue : 5 items, échec/skip → recyclage en fin de queue, fin quand queue vide |
| **Abandon** | Bouton permanent + modale confirmation avec compteur (ex: "You completed 3/5") |
| **Récap de fin** | Items réussis : contenu complet + 🔊 + 🎙️ + nb essais. Items tentés non réussis : feedback réduit (pas de récompense). Items non tentés : non affichés |
| **Transcript affiché** | Sur erreur, toujours afficher ce que le Speech Recognition a compris ("You said: ...") |
| **Autoplay modèle** | Après toute tentative vocale, autoplay du son correct (~0.5s de délai) |
| **Auto-advance** | Succès → auto-advance (~2s). Échec → Next manuel. Skip → auto-advance (sauf Skill 9/10 → Next manuel) |
| **Micro always-on** | Skills vocaux : micro chaud dès la question, VAD automatique, waveform visible. Grisé pendant le feedback |
| **Seuil de confiance SR** | Résultats basse confiance ignorés (bruit de fond) |
| **Récompense visuelle** | Le contenu visuel (kana, mot écrit) est une récompense de réussite — non affiché en cas d'échec |

### Fondations — 3 skills fermés

| # | Skill | Stimulus | Interaction | Feedback succès | Feedback échec | Scaffolding | Composant |
|---|---|---|---|---|---|---|---|
| **1** | Écoute & répétition syllabique | Audio d'une syllabe (~137 : 104 hiragana + 33 katakana spéciaux) | Speech Recognition — répéter le son. Micro obligatoire, pas de fallback | Autoplay modèle → 「Kana unlocked」(animation fade-in + scale + glow) → auto-advance | Autoplay modèle → comparaison 🔊🎙️ + transcript → Next manuel | Aucun | `SpeechRepeat` |
| **2** | Lecture hiragana | Hiragana affiché en grand (~104) | Speech Recognition — prononcer le kana vu. Skip vocal "skip" si inconnu (texte indicatif discret) | Autoplay modèle → check visuel → auto-advance | Autoplay modèle → 🔊 son correct → transcript → Next manuel | Aucun | `SpeechRepeat` |
| **3** | Lecture katakana | Katakana affiché (~137 : 104 standards + 33 spéciaux) | Speech Recognition — prononcer le kana vu. Skip vocal "skip" | Autoplay modèle → auto-advance | Autoplay modèle → transcript → Next manuel | `し → シ` (hiragana → katakana). Double passage en session : succès avec scaffolding → nouvel item sans scaffolding en fin de queue. Échec sans scaffolding → recyclé sans (pas de régression). Absent pour katakana spéciaux | `SpeechRepeat` |

### Core — 7 skills ouverts

| # | Skill | Stimulus | Interaction | Feedback succès | Feedback échec | Scaffolding | Composant |
|---|---|---|---|---|---|---|---|
| **4** | Écoute & répétition (mots) | Audio d'un mot | Speech Recognition — répéter le mot | Autoplay modèle → 「Word unlocked」(mot en kanji) → auto-advance | Autoplay modèle → comparaison 🔊🎙️ + transcript → Next manuel | Aucun | `SpeechRepeat` |
| **5** | Sens des mots | Word affiché (pas "kanji", un mot) | Évolutive : QCM 2 → QCM 4 → input libre. Tap (QCM), clavier/voix (input libre, toggle `InputModeToggle`). Skip vocal en input libre | Auto-advance | Bonne réponse affichée → Next manuel | Aucun | `MeaningExercise` |
| **6** | Compréhension orale | Audio d'un mot ou d'une phrase. Replay illimité | Comme Skill 5 : QCM 2 → QCM 4 → input libre | Auto-advance | Bonne réponse affichée → Next manuel | Aucun | `MeaningExercise` |
| **7** | Lecture à voix haute | Texte japonais affiché (word ou sentence, avec kanji) | Speech Recognition — lire à voix haute. Skip vocal "skip" | Autoplay modèle → auto-advance | Autoplay modèle → transcript → comparaison 🔊🎙️ → Next manuel | Word → furigana `<ruby>` + double passage (avec → sans). Sentence → aucun furigana (les mots sont déjà acquis individuellement) | `SpeechRepeat` |
| **8** | Compréhension écrite | Texte japonais affiché (word ou sentence) | Comme Skill 5 : QCM 2 → QCM 4 → input libre | Auto-advance | Bonne réponse affichée → Next manuel | Aucun | `MeaningExercise` |
| **9** | Production orale | Sens en anglais (word ou sentence) | Speech Recognition — dire le japonais. Micro obligatoire | Autoplay modèle → texte japonais affiché (récompense) → auto-advance | Autoplay modèle → transcript ("You said: ...") → pas de texte japonais → Next manuel | Aucun (sommet de la pyramide) | `OralProduction` |
| **10** | Production écrite | Sens en anglais (word ou sentence) | Saisie clavier IME japonais. Bouton skip (pas vocal) | Check ✅ → auto-advance | Réponse utilisateur + bonne réponse affichées → Next manuel | Aucun. Modale aide IME au premier lancement (détection device iOS/Android/macOS/Windows) + bouton ⌨️ Help permanent | `WrittenProduction` |

#### Notes Core

- **Skill 5 vs 8** : même composant `MeaningExercise`. Skill 5 = words uniquement (point d'entrée débutant). Skill 8 = words + sentences (plus avancé).
- **Skill 6** : couvre mots ET phrases. Input libre mots = synonymes acceptés. Input libre phrases = validation en cascade : exact match → fuzzy (Levenshtein) → rejet évident → appel IA similarité sémantique (détail Sprint 3).
- **Skill 9** : skip = Next **manuel** (pas auto-advance, c'est le sommet de la pyramide, l'apprenant a besoin de temps). Feedback échec/skip = audio uniquement, pas de texte japonais (le texte est la récompense de réussite).
- **Skill 10** : prérequis IME japonais. Même approche que le micro pour le Skill 1 — si pas d'IME, message explicatif. Validation mots = exact match, forme kanji exigée. Validation phrases = cascade + IA.
- **Toggle clavier/voix** : `InputModeToggle` avec préférence persistée. Disponible sur Skills 5, 6, 8 en mode input libre.

### Grammaire — 5 skills ouverts

| # | Skill | Stimulus | Interaction | Distracteurs | Feedback | Composant |
|---|---|---|---|---|---|---|
| **11** | Particules & connecteurs | Phrase à trou (1-3 trous) | Grille de 8-12 particules (は, が, を, に, で, へ, と, も, の, か, よ, ね). Validation auto quand tous les trous remplis. Undo pour revenir au trou précédent (2-3 trous) | Toutes les particules de la grille | Succès → 🔊 phrase complète autoplay → auto-advance. Échec → bonne réponse surlignée + 🔊 phrase complète → Next manuel | `FillInTheBlank` |
| **12** | Conjugaisons & patterns | Phrase à trou + sens en anglais | 4-6 boutons : formes conjuguées du verbe/adjectif | Autres formes du même verbe/adjectif | Succès → 🔊 phrase complète autoplay → auto-advance. Échec → bonne réponse + 🔊 phrase complète → Next manuel | `FillInTheBlank` |
| **13** | Keigo | Phrase à trou + contexte | 4-6 boutons : formes neutre, honorifique, humble | Formes des autres registres | Succès → 🔊 phrase complète autoplay → auto-advance. Échec → bonne réponse + 🔊 phrase complète → Next manuel | `FillInTheBlank` |
| **14** | Donner/recevoir | Phrase à trou + contexte | 4-6 boutons : あげる, もらう, くれる et formes keigo | Autres verbes de don/réception | Succès → 🔊 phrase complète autoplay → auto-advance. Échec → bonne réponse + 🔊 phrase complète → Next manuel | `FillInTheBlank` |
| **15** | Compteurs & nombres | Phrase à trou + contexte | 4-6 boutons : compteurs (本, 匹, 枚, 個...) | Autres compteurs | Succès → 🔊 phrase complète autoplay → auto-advance. Échec → bonne réponse + 🔊 phrase complète → Next manuel | `FillInTheBlank` |

#### Notes Grammaire

- **Micro-leçon adaptative** (Skills 11-15) : au lancement de la session, analyse des 5 phrases → déduction des points de grammaire → identification des points **nouveaux** → modale `MicroLesson` uniquement pour les nouveaux. Bouton 💡 permanent pour revoir la leçon du groupe (affiche tous les points du groupe, pas juste la réponse).
- **Micro non requis** pour les skills de grammaire (interaction tap uniquement).
- **Phrases liées aux points de grammaire** : chaque phrase en base a un tableau `grammarPoints`. Table de jonction `sentence_grammar_point` en DB. Content items déjà créés par skill (migration 0013).
- **Grammar point ID ranges** : Skill 11 (300-379), Skill 12 (380-472), Skill 13 (473-500), Skill 14 (501-514), Skill 15 (515-558).

## 5. Composants d'exercice identifiés

### Composants d'exercice

| Composant | Description | Skills servis |
|---|---|---|
| `SpeechRepeat` | Écouter ou voir → prononcer via Speech Recognition | 1, 2, 3, 4, 7 |
| `MeaningExercise` | Voir/entendre → trouver le sens (QCM 2 → QCM 4 → input libre) | 5, 6, 8 |
| `OralProduction` | Voir le sens → produire le japonais à voix haute | 9 |
| `WrittenProduction` | Voir le sens → taper le japonais au clavier (IME) | 10 |
| `FillInTheBlank` | Phrase à trou → choisir le bon élément (grille ou boutons) | 11, 12, 13, 14, 15 |

### Composants transversaux

| Composant | Description | Skills concernés |
|---|---|---|
| `DrillQueue` | Session de 5 items en queue FIFO. Échec/skip → recyclage en fin de queue. Fin quand queue vide. Supporte le double passage (scaffolding avec → sans) | Tous |
| `SessionSummary` | Récap de fin de session. Réussis : contenu + 🔊 + 🎙️ + nb essais. Tentés non réussis : feedback réduit, pas de récompense visuelle. Non tentés : absents | Tous |
| `VoiceRecorder` | Micro always-on + waveform animée (Web Audio AnalyserNode). États : listening (🔴), processing (⏳), paused (⚫ grisé pendant feedback). VAD automatique | 1, 2, 3, 4, 5 (mode voix), 6 (mode voix), 7, 8 (mode voix), 9 |
| `InputModeToggle` | Switch 🎙️ / ⌨️. Préférence persistée (localStorage) | 5, 6, 8 |
| `MicroLesson` | Modale adaptative affichant N points de grammaire. Contenu passé en props. Déclenchée auto au premier lancement si points nouveaux | 11, 12, 13, 14, 15 |
| `KanaUnlocked` | Animation de déblocage : fade-in + scale + glow + texte 「Kana unlocked」(~1.5s). Distinction 🆕 nouveau / ✅ révisé | 1 |
| `WordUnlocked` | Animation de déblocage : mot en kanji + 「Word unlocked」 | 4 |
| `IMEHelpModal` | Modale d'aide installation clavier japonais. Détection device (iOS/Android/macOS/Windows). Auto au premier lancement Skill 10, bouton ⌨️ Help permanent | 10 |

## 6. User Stories

### Architecture des packages

Le Sprint 2 introduit deux nouveaux packages :

```
packages/exercises/        # @manabu/exercises
  src/
    logic/                 # Logique pure (Effect, pas de React)
      drill-queue.ts
      session-result.ts
    components/            # Composants React
      speech-repeat/
      meaning-exercise/
      oral-production/
      written-production/
      fill-in-the-blank/
      session-summary/
      voice-recorder/
      input-mode-toggle/
      micro-lesson/
      kana-unlocked/
      word-unlocked/
      ime-help-modal/

packages/storybook/        # Config Storybook centralisée
  .storybook/              # Migration depuis packages/ui
```

Dépendances :
```
packages/exercises  →  @manabu/ui, @manabu/shared
packages/storybook  →  @manabu/ui, @manabu/exercises
apps/web            →  @manabu/exercises
```

### US transversales (socle)

| US | Titre | Résumé | Dépendances |
|---|---|---|---|
| US10 | Setup packages + DrillQueue | Créer `packages/exercises` + `packages/storybook` (migration Storybook depuis `packages/ui`). Implémenter la logique pure DrillQueue (TDD) : queue FIFO de 5 items, recyclage échec/skip en fin de queue, double passage scaffolding (avec → sans), détection queue vide. Pas de React. | — |
| US11 | SessionSummary | Composant récap de fin de session. Items réussis : contenu complet + 🔊 modèle + 🎙️ apprenant + nb essais/skips. Items tentés non réussis : pas de récompense visuelle, 🔊 modèle uniquement. Items non tentés : absents. Distinction session complète / abandonnée. Stories Storybook. | US10 |
| US12 | VoiceRecorder | Composant micro always-on + waveform animée (Web Audio AnalyserNode). VAD automatique (détection début/fin de parole). États : listening (🔴 actif), processing (⏳), paused (⚫ grisé pendant feedback). Seuil de confiance pour ignorer le bruit de fond. Stories Storybook. | US10 |
| US13 | InputModeToggle | Switch 🎙️ / ⌨️ pour alterner entre mode clavier et mode voix. Préférence persistée en localStorage. Stories Storybook. | US10 |

### US composants d'exercice

| US | Titre | Résumé | Dépendances |
|---|---|---|---|
| US14 | SpeechRepeat | Composant écouter/voir → prononcer via Speech Recognition. Gère les Skills 1 (audio → répéter, kana unlocked), 2 (voir hiragana → prononcer, skip vocal), 3 (voir katakana → prononcer, scaffolding し→シ + double passage), 4 (audio mot → répéter, word unlocked), 7 (texte japonais → lire, furigana conditionnel word/sentence). Micro always-on, autoplay modèle, auto-advance succès/skip, Next manuel erreur, transcript affiché. Stories par skill. | US10, US11, US12 |
| US15 | MeaningExercise | Composant voir/entendre → trouver le sens. Progression QCM 2 → QCM 4 → input libre. Gère Skills 5 (word → sens), 6 (audio mot/phrase → sens, replay illimité), 8 (texte mot/phrase → sens). Toggle clavier/voix en input libre. Skip vocal en input libre. Stories par skill et par mode (QCM 2, QCM 4, input libre clavier, input libre voix). | US10, US11, US13 |
| US16 | OralProduction | Composant sens → produire le japonais à voix haute (Skill 9). Micro obligatoire. Feedback succès : autoplay modèle + texte japonais affiché (récompense). Feedback échec : autoplay modèle + transcript, pas de texte japonais. Skip : autoplay modèle + 🔊 replay, Next manuel (pas auto-advance). Stories Storybook. | US10, US11, US12 |
| US17 | WrittenProduction | Composant sens → taper le japonais au clavier IME (Skill 10). Bouton skip (pas vocal). Validation exact match, forme kanji exigée. Feedback échec : réponse utilisateur + bonne réponse affichées. Stories Storybook. | US10, US11 |
| US18 | FillInTheBlank | Composant phrase à trou. Gère Skills 11 (grille 8-12 particules, 1-3 trous, undo), 12 (4-6 formes conjuguées), 13 (4-6 formes keigo), 14 (4-6 verbes don/réception), 15 (4-6 compteurs). Validation auto quand tous les trous remplis. Feedback : 🔊 phrase complète autoplay (succès et échec). Stories par skill. | US10, US11 |

### US complémentaires

| US | Titre | Résumé | Dépendances |
|---|---|---|---|
| US19 | MicroLesson | Modale adaptative affichant N points de grammaire nouveaux. Bouton 💡 permanent pour revoir la leçon du groupe (affiche tous les points, pas juste la réponse). Contenu passé en props — le wiring avec la détection « nouveau vs déjà vu » c'est Sprint 3. Stories Storybook. | US18 |
| US20 | Animations de récompense | KanaUnlocked : animation fade-in + scale + glow + texte 「Kana unlocked」(~1.5s), distinction 🆕 nouveau / ✅ révisé. WordUnlocked : mot en kanji + 「Word unlocked」. CSS pur (keyframes Panda CSS). Stories Storybook. | US14 |
| US21 | IMEHelpModal | Modale d'aide installation clavier japonais. Détection device (iOS/Android/macOS/Windows) via User Agent. Auto au premier lancement Skill 10. Bouton ⌨️ Help permanent. Contenu détaillé des étapes par device = Sprint 3. Stories Storybook. | US17 |

### Ordre d'implémentation recommandé

```
Phase 1 (parallélisable) :  US10  US12  US13
Phase 2 :                   US11
Phase 3 (parallélisable) :  US14  US15  US16  US17  US18
Phase 4 (parallélisable) :  US19  US20  US21
```

## 7. Informations de référence

### Formats d'exercice — décisions finales (vs taxonomie initiale)

| Skill | Taxonomie initiale | Décision finale | Changement |
|---|---|---|---|
| 1 | Écouter → répéter (SR) | Écouter → répéter (SR) | ✅ Confirmé |
| 2 | Voir → prononcer (SR) | Voir → prononcer (SR) + skip vocal | ✅ Ajout skip |
| 3 | Voir → prononcer (SR) + scaffolding | Voir → prononcer (SR) + scaffolding し→シ + double passage | ✅ Enrichi |
| 4 | Écouter → répéter (SR) | Écouter → répéter (SR) | ✅ Confirmé |
| 5 | QCM (4 choix) | QCM 2 → QCM 4 → input libre (progression) | 🔄 Enrichi |
| 6 | QCM (4 choix) | QCM 2 → QCM 4 → input libre + validation IA phrases | 🔄 Enrichi |
| 7 | Voir → prononcer (SR) | Voir → prononcer (SR) + furigana conditionnel (word only) | ✅ Enrichi |
| 8 | QCM (4 choix) | QCM 2 → QCM 4 → input libre (= Skill 5 étendu aux phrases) | 🔄 Enrichi |
| 9 | Voir sens → prononcer (SR) | Voir sens → prononcer (SR), feedback audio only | ✅ Confirmé |
| 10 | Voir sens → saisie clavier (IME) | Voir sens → saisie clavier (IME) + aide installation | ✅ Enrichi |
| 11 | QCM phrase à trou | Phrase à trou, grille 8-12 particules, 1-3 trous | ✅ Enrichi |
| 12 | QCM | Phrase à trou, 4-6 formes conjuguées | 🔄 Changé |
| 13 | QCM | Phrase à trou, 4-6 formes keigo | 🔄 Changé |
| 14 | QCM phrase à trou | Phrase à trou, 4-6 verbes de don/réception | ✅ Confirmé |
| 15 | QCM | Phrase à trou, 4-6 compteurs | 🔄 Changé |

### Décisions de design

- Un skill = un format d'exercice unique (la progression QCM 2→4→input libre est un paramètre, pas un format différent)
- Écriture manuscrite exclue définitivement (skill 10 = clavier IME)
- Micro-leçon adaptative (bouton 💡) sur les exercices de grammaire — affiche le groupe, pas juste la réponse
- La forme écrite naturelle (avec kanji) est toujours la forme affichée
- Le skill 1 sert de pré-exposition aux kana (récompense visuelle 「Kana unlocked」)
- Le skill 4 sert de pré-exposition aux mots écrits (récompense visuelle 「Word unlocked」)
- Scaffolding し→シ dans le skill 3 (double passage dans la session)
- Furigana conditionnel dans le skill 7 (word = furigana + double passage, sentence = pas de furigana)
- Zéro romaji dans toute l'app
- Micro always-on avec VAD sur les skills vocaux (mains-libres)
- Sprint 2 = composants Storybook uniquement, pas de wiring DB

## 8. Hors scope Sprint 2

| Élément | Raison | Sprint prévu |
|---|---|---|
| Moteur SRS | Structures prêtes (ReviewCard), logique au Sprint 3 | Sprint 3 |
| Moteur de recommandation | Sélection basique suffit pour valider les exercices | Sprint 3 |
| Scoring & progression | Enregistrer les résultats oui, calculer la progression non | Sprint 3 |
| Validation IA (phrases input libre) | Cascade exact → fuzzy → IA à détailler | Sprint 3 |
| Contenu micro-leçons | Rédaction des explications de grammaire | Sprint 3 |
| Audio des phrases | TTS ou enregistrements pour les 2 590 phrases | Sprint 3 |
| Contenu modale IME Help | Screenshots et étapes par device | Sprint 3 |
| Carte radar | Pas de visualisation | Sprint 4 |
| Détection de blocage | Pas de logique adaptative | Sprint 4 |
