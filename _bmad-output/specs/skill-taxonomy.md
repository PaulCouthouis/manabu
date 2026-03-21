# Taxonomie des Skill Types — Manabu

**Date :** 2026-03-21
**Statut :** Validée
**Décision prise par :** Paul (Party Mode — Sensei, Yuki, Hana)

## Principes de design

- **Un skill = un format d'exercice unique** — pas de formats multiples par skill
- **Les skills de grammaire déverrouillent des instances** plus complexes dans les skills core
- **La grammaire n'est pas un modificateur** — ce sont de vrais skills avec des exercices dédiés
- **L'écriture manuscrite est exclue définitivement** — on se concentre sur les compétences utiles (clavier, oral)
- **Le JLPT est un output dérivé**, jamais un input structurant

## Points d'entrée

Deux points d'entrée indépendants dans le graphe :
- **Skill 1** (Écoute & répétition syllabique) — branche phonologique/kana
- **Skill 5** (Sens des kanji) — branche kanji, accessible sans kana

## Fondations — 3 skills fermés

| # | Skill | Description | Format | Scope | Prérequis |
|---|---|---|---|---|---|
| **1** | Écoute & répétition syllabique | Entendre une syllabe japonaise, la reproduire vocalement. Le hiragana correspondant s'affiche en récompense après bonne réponse. | Écouter → répéter (Speech Recognition) | ~106 syllabes (gojūon + dakuten + handakuten + yōon) | — |
| **2** | Lecture hiragana | Voir un hiragana, produire le son correspondant. | Voir → prononcer (Speech Recognition) | ~106 hiragana (hors sokuon/allongements) | Skill 1 |
| **3** | Lecture katakana | Voir un katakana, produire le son correspondant. Aide hiragana→katakana affichée jusqu'à la première bonne réponse sur chaque caractère, puis katakana seul. | Voir → prononcer (Speech Recognition) | ~106 katakana | Skill 2 |

### Notes sur les fondations

- **Skills fermés** : scope fini et dénombrable, l'apprenant peut "terminer" ces skills
- **Sokuon (っ) et allongements** : exclus des fondations, introduits plus tard dans le contexte de mots (skills 4, 7)
- **Effet de découverte** : le skill 1 sert de pré-exposition aux hiragana (récompense visuelle). Pour les katakana, le scaffolding hiragana→katakana remplit ce rôle.

## Core — 7 skills ouverts et progressifs

| # | Skill | Description | Format | Prérequis |
|---|---|---|---|---|
| **4** | Écoute & répétition | Entendre un mot ou une phrase, le reproduire vocalement. La forme écrite naturelle (avec kanji) s'affiche en récompense. Commence par des mots, progresse vers des phrases. | Écouter → répéter (Speech Recognition) | Skill 1 |
| **5** | Sens des kanji | Voir un kanji isolé, identifier son sens. Inclut les kanji autonomes (猫 = chat) et les kanji non autonomes (学 = étude). | QCM (4 choix de sens) | — |
| **6** | Compréhension orale | Entendre un mot ou une phrase, identifier son sens. | QCM (4 choix de sens) | Skill 4 |
| **7** | Lecture à voix haute | Voir un mot ou une phrase dans sa forme écrite naturelle (avec kanji), le prononcer correctement. Découverte via le skill 4 (l'apprenant a déjà vu et entendu le mot). | Voir → prononcer (Speech Recognition) | Skill 2, 3, 4 |
| **8** | Compréhension écrite | Voir un mot ou une phrase dans sa forme écrite naturelle, identifier son sens. Pour les kanji-mots simples (猫), la redondance avec le skill 5 est voulue : elle montre que le kanji est aussi un mot. | QCM (4 choix de sens) | Skill 5, 7 |
| **9** | Production orale | Voir le sens (en français/anglais), dire le mot ou la phrase en japonais. | Voir sens → prononcer (Speech Recognition) | Skill 6, 7 |
| **10** | Production écrite | Voir le sens (en français/anglais), taper le mot ou la phrase en japonais au clavier. | Voir sens → saisie clavier (IME) | Skill 8 |

### Notes sur les skills core

- **Skills ouverts** : scope illimité, la difficulté monte progressivement avec le contenu
- **Skill 4 comme pré-exposition** : le skill 4 est au skill 7 ce que le skill 1 est au skill 2 — il sert de découverte (le mot entendu et sa forme écrite) avant de demander la lecture
- **Forme écrite naturelle** : toujours afficher la forme la plus "réelle" du mot (猫 plutôt que ねこ)

## Grammaire — 5 skills ouverts et progressifs

| # | Skill | Description | Format | Prérequis |
|---|---|---|---|---|
| **11** | Particules & connecteurs | Choisir la bonne particule ou le bon connecteur dans une phrase à trou. Particules (~25 : は, が, を, に, で...) puis connecteurs (~15 : けど, から, ので...) en instances avancées. | QCM phrase à trou | Skill 8 |
| **12** | Conjugaisons & patterns | Conjuguer un verbe ou adjectif dans la forme demandée. Inclut les conjugaisons pures (て-form, ない, passé...) et les patterns grammaticaux (〜たい, 〜てもいい, 〜なければならない...) comme instances avancées. Couvre godan, ichidan, irréguliers. | QCM | Skill 8 |
| **13** | Keigo | Transformer une expression en sa forme polie, respectueuse ou humble. Progression : teineigo (だ→です) → sonkeigo → kenjougo → substitutions complexes. | QCM | Skill 8 |
| **14** | Donner/recevoir | Choisir le bon verbe selon qui donne/fait quelque chose à/pour qui. ~9 formes (あげる, もらう, くれる + formes en て + honorifiques). | QCM phrase à trou | Skill 8 |
| **15** | Compteurs & nombres | Associer le bon compteur à un objet/contexte. Inclut les ~30 compteurs (本, 枚, 匹...), les nombres, et les expressions temporelles (jours, mois, heures). La lecture/prononciation des compteurs (3本 → sanbon) est gérée comme instances du skill 7 déverrouillées par la progression dans ce skill. | QCM | Skill 8 |

### Notes sur les skills de grammaire

- **Micro-leçon toujours accessible** : chaque exercice de grammaire a un bouton "?" qui ouvre une leçon explicative du concept. Ce bouton reste disponible en permanence, contrairement au scaffolding katakana qui disparaît après la première bonne réponse.
- **La copule (だ/です)** : apprise comme mot de vocabulaire dans les skills core, ses conjugaisons apparaissent dans le skill 12.
- **Les skills de grammaire déverrouillent des instances** dans les skills core : par exemple, maîtriser les particules permet de rencontrer des phrases plus complexes dans les skills 4, 6, 7, 8, 9, 10.

## Graphe de dépendances

```
Skill 1 ──→ Skill 2 ──→ Skill 3 ──┐
    │                               │
    └──→ Skill 4 ──→ Skill 6 ──────┤
              │                     │
              └─────────────────────┼──→ Skill 7 ──┐
                                    │               │
Skill 5 ────────────────────────────┘          ┌────┤
                                               │    │
                              Skill 9 ←── (6, 7)    │
                                                     │
                              Skill 8 ←── (5, 7) ───→ Skill 10
                                  │
                                  ├──→ Skill 11 (Particules & connecteurs)
                                  ├──→ Skill 12 (Conjugaisons & patterns)
                                  ├──→ Skill 13 (Keigo)
                                  ├──→ Skill 14 (Donner/recevoir)
                                  └──→ Skill 15 (Compteurs & nombres)
```

### Points d'entrée (sans prérequis)
- **Skill 1** — Écoute & répétition syllabique
- **Skill 5** — Sens des kanji

### Skill terminal le plus exigeant
- **Skill 9** (Production orale) — nécessite écoute + lecture + rappel
- **Skill 10** (Production écrite) — nécessite lecture + compréhension + saisie

## Décisions architecturales prises

| Question | Décision | Justification |
|---|---|---|
| F3 (Kanji de base) du PRD | Remplacé par skill 5 (Sens des kanji) | Scope élargi à tous les kanji, pas juste les ~80 de base |
| C7 (Écriture manuscrite) | Retiré définitivement | Pas pertinent — les Japonais eux-mêmes tapent au clavier |
| Grammaire : skills vs modificateurs | Skills séparés | Impossible de comprendre une phrase sans bases grammaticales — la grammaire est un prérequis, pas un bonus |
| G1 + G4 du brainstorming | Fusionnés (skill 11) | Même format d'exercice (phrase à trou), les connecteurs sont des instances avancées des particules |
| G2 + G3 du brainstorming | Fusionnés (skill 12) | Les patterns reposent sur les conjugaisons — instances avancées du même mécanisme |
| G7 (Compteurs) prononciation | Instances du skill 7 | La lecture "3本 → sanbon" est une instance de lecture à voix haute déverrouillée par le skill 15 |
| Nombres et temps | Intégrés au skill 15 | Même type de système irrégulier que les compteurs |
| Onomatopées | Vocabulaire | Traitées comme instances dans les skills core (4-8) |
| Expressions idiomatiques | Post-MVP | Skills combinés, pas atomiques — à traiter en phase ultérieure |
| Copule (だ/です) | Mot de vocabulaire | Apprise dans les skills core, conjugaisons dans le skill 12 |
