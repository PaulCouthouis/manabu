# US6 — Seed data vocabulaire

## Résumé

Les 5000 mots les plus fréquents du japonais (corpus BCCWJ) sont chargés en base avec leurs métadonnées (meaning anglais, frequency, components). Chaque mot génère 6 `ContentItem` associés aux skills core 4, 6, 7, 8, 9, 10. En pré-étape, 16 kana supplémentaires (sokuon, chōon, katakana étendus) sont ajoutés pour permettre la décomposition en components. Le fichier de données utilise les classes domaine (`WordElement.make()`) pour garantir la validité à la compilation. L'insertion se fait via une migration SQL. Les données sont découpées en fichiers de 1000 mots classés par fréquence d'usage (corpus BCCWJ).

**Sprint :** Sprint 1 — Fondations
**Dépendances :** US5 (Seed kana), US5b (Seed kanji)
**Approche :** ATDD — chaque critère d'acceptance est validé par un test automatisé ou une commande vérifiable.

## Architecture

### Corpus : 5000 mots fréquents

Les 5000 mots les plus fréquents du corpus BCCWJ (Balanced Corpus of Contemporary Written Japanese, ~100M mots) constituent le corpus initial. Ce volume couvre ~98% des mots rencontrés dans un texte courant (Nation 2001). La source de meanings est JMdict (Japanese-Multilingual Dictionary).

### Pré-étape : extension kana

16 kana supplémentaires sont nécessaires pour décomposer les mots en `components` :

**Sokuon et Chōon (3) — sans ContentItems :**

| ID | Caractère | Nom | Rôle |
|---|---|---|---|
| 209 | っ | Sokuon hiragana | Double consonne (きっと, ちょっと) |
| 210 | ッ | Sokuon katakana | Double consonne (サッカー, ネット) |
| 211 | ー | Chōon | Allongement voyelle katakana (コーヒー, ラーメン) |

Ces 3 kana n'ont **aucun ContentItem** — ce ne sont pas des compétences à acquérir. Une **micro-leçon** est déclenchée la première fois que l'apprenant les rencontre dans un exercice de mot.

**Katakana étendus (13) — avec ContentItems Skill 1 + Skill 3 :**

| ID | Caractère | Son | Exemples |
|---|---|---|---|
| 212 | ティ | ti | パーティー, ティッシュ |
| 213 | ディ | di | ディスク, ディナー |
| 214 | ファ | fa | ファイル, ソファ |
| 215 | フィ | fi | フィルム, オフィス |
| 216 | フェ | fe | カフェ, ブッフェ |
| 217 | フォ | fo | フォーク, フォント |
| 218 | ウィ | wi | ウィキ, ウィンドウ |
| 219 | ウェ | we | ウェブ, ウェディング |
| 220 | ウォ | wo | ウォーター |
| 221 | デュ | dyu | プロデューサー |
| 222 | シェ | she | シェア, シェフ |
| 223 | ジェ | je | ジェット, プロジェクト |
| 224 | チェ | che | チェック, チェーン |

Ces 13 katakana étendus sont de vrais kana à apprendre. Ils ont **2 ContentItems chacun** :
- **Skill 1** (Écoute & répétition syllabique) — le katakana étendu s'affiche en récompense (pas de hiragana pour ces sons)
- **Skill 3** (Lecture katakana) — voir le katakana étendu → produire le son

**Total pré-étape :** 16 kana, 26 ContentItems (13 × 2)

### Données par mot

| Champ | Type | Source | Description |
|---|---|---|---|
| `id` | `WordId` | Séquentiel 5000-9999 | ID stable pour FK |
| `written` | `string` | JMdict, forme dictionnaire | Forme écrite naturelle (avec kanji si jōyō, en kana sinon) |
| `meaning` | `string` | JMdict | Sens en anglais |
| `components` | `NonEmptyArray<KanaId \| KanjiId>` | Décomposition caractère par caractère | Chaque caractère mappé vers son KanaId ou KanjiId |
| `frequency` | `number` | BCCWJ lemme | Rang de fréquence (1 = plus fréquent) |

### Règles linguistiques du corpus

**Forme écrite (`written`) :**
- Toujours la **forme dictionnaire** : 食べる (pas 食べます), 大きい (pas 大きな)
- Si un mot contient un **kanji hors jōyō**, la forme `written` utilise le kana à la place (ex: ちゅうちょ pas 躊躇) — c'est l'usage réel japonais

**Inclus :**
- Noms, verbes, adjectifs い et な, adverbes
- Mots katakana fréquents (コーヒー, ラーメン, テレビ)
- Mots tout en hiragana (すごい, おいしい, ありがとう)
- Mots-kanji simples (猫, 犬, 山) — redondance voulue avec le Skill 5, documentée dans l'US4

**Inclus (expressions figées universelles) :**
- ください, ごめんなさい, すみません — utilisées universellement, même par les enfants, ce sont des mots autonomes

**Exclus :**
- Particules isolées (は, が, を, に, で...) → `GrammarElement` (US7)
- Conjugaisons comme entrées séparées (食べます, 食べた...)
- Formes polies d'expressions déjà présentes en forme plain (ありがとうございます, おはようございます...) → la transformation plain → poli relève des skills de grammaire (Skill 12 pour les conjugaisons, Skill 13 pour le keigo)
- Verbes de keigo isolés (ございます, いらっしゃる...) → `GrammarElement` Skill 13
- Suffixes/préfixes non autonomes (〜的, 〜さん, お〜)
- Onomatopées rares

### Règle de décomposition des components

> La forme `written` est parcourue caractère par caractère. Chaque caractère est mappé vers le `KanjiId` ou `KanaId` correspondant.

- Un kanji jōyō → son `KanjiId` (plage 1000-3135)
- Un kana standard → son `KanaId` (plage 1-208)
- Un sokuon/chōon → son `KanaId` (209-211)
- Un katakana étendu (digraphe) → un seul `KanaId` (212-224). Ex: ティ = `KanaId(212)`, pas `KanaId(テ)` + petit ィ
- La séquence des components correspond exactement à l'ordre des caractères dans `written`

Exemples :

```
食べる   → [KanjiId(食), KanaId(べ), KanaId(る)]
コーヒー → [KanaId(コ), KanaId(ー), KanaId(ヒ), KanaId(ー)]
学生     → [KanjiId(学), KanjiId(生)]
お願い   → [KanaId(お), KanjiId(願), KanaId(い)]
きっと   → [KanaId(き), KanaId(っ), KanaId(と)]
パーティー → [KanaId(パ), KanaId(ー), KanaId(ティ), KanaId(ー)]
サッカー → [KanaId(サ), KanaId(ッ), KanaId(カ), KanaId(ー)]
```

### Associations skill types

| Mot | Skills associés | ContentItems par mot |
|---|---|---|
| Tout mot | Skill 4 (Écoute & répétition) | 1 |
| Tout mot | Skill 6 (Compréhension orale) | 1 |
| Tout mot | Skill 7 (Lecture à voix haute) | 1 |
| Tout mot | Skill 8 (Compréhension écrite) | 1 |
| Tout mot | Skill 9 (Production orale) | 1 |
| Tout mot | Skill 10 (Production écrite) | 1 |

**Total ContentItems mots :** 5000 × 6 = **30 000**

### Structure des fichiers

```
packages/
  domain/
    src/
      kana-extended-data.ts    # 16 kana supplémentaires (sokuon, chōon, katakana étendus)
      word-data/
        freq-01.ts             # 1000 mots les plus fréquents (rang 1-1000)
        freq-02.ts             # 1000 mots suivants (rang 1001-2000)
        freq-03.ts             # rang 2001-3000
        freq-04.ts             # rang 3001-4000
        freq-05.ts             # 1000 derniers mots (rang 4001-5000)
        index.ts               # Agrège tout → export const wordData
  db/
    src/
      migrations/
        0006_seed_kana_extended.ts  # Migration : insertion 16 kana + 26 ContentItems
        0007_seed_words.ts          # Migration : insertion 5000 mots + 30 000 ContentItems
```

Chaque fichier `freq-XX.ts` exporte un `ReadonlyArray<WordElement>`. L'`index.ts` les concatène en un seul `wordData` consommé par la migration et les tests.

### Pipeline de génération (2 passes)

Même pattern éprouvé que l'US5b :

**Passe 1 — Métadonnées :**
- Générer les 5 fichiers avec `id`, `written`, `meaning`, `frequency`
- `components: [KanaId(1)]` comme placeholder (le schema `NonEmptyArray` impose au moins un élément)
- L'IA se concentre sur la sélection des mots, le ranking BCCWJ et les meanings JMdict

**Passe 2 — Components :**
- Rescanner chaque mot, décomposer `written` caractère par caractère
- Mapper chaque caractère vers son `KanjiId` ou `KanaId` existant
- Les katakana étendus (ティ, ファ...) reconnus comme un seul `KanaId`
- Écraser le placeholder

### Source de fréquence

Les mots sont triés par fréquence d'apparition en tant que lemme dans le corpus BCCWJ. Les particules et morphèmes non autonomes sont filtrés avant le ranking.

## Critères d'acceptance

### Pré-étape — Extension kana

| # | Critère | Type de vérification | Étape |
|---|---|---|---|
| AC-K1 | 16 kana supplémentaires sont présents (3 sokuon/chōon + 13 étendus) | Unitaire | 0 |
| AC-K2 | IDs continus 209-224 | Unitaire | 0 |
| AC-K3 | Les 3 sokuon/chōon n'ont aucun ContentItem | Intégration | 0 |
| AC-K4 | Les 13 katakana étendus ont chacun 2 ContentItems (Skill 1 + Skill 3) | Intégration | 0 |
| AC-K5 | Les tests existants de l'US5 (208 kana) ne sont pas impactés | CI | 0 |

### Données mots

| # | Critère | Type de vérification | Étape |
|---|---|---|---|
| AC1 | 5000 mots sont présents | Unitaire | 1 |
| AC2 | Pas de `written` en doublon | Unitaire | 1 |
| AC3 | IDs continus 5000-9999, pas de trou ni doublon | Unitaire | 1 |
| AC4 | `meaning` non vide pour chaque mot | Unitaire | 1 |
| AC5 | `frequency` > 0 pour chaque mot | Unitaire | 1 |
| AC6 | `components` non vide pour chaque mot | Unitaire | 1 |
| AC7 | Tous les `KanjiId` dans `components` existent dans les 2136 kanji jōyō | Unitaire | 1 |
| AC8 | Tous les `KanaId` dans `components` existent dans les 224 kana (208 standard + 16 étendus) | Unitaire | 1 |
| AC9 | La forme `written` est cohérente avec les components (mêmes caractères, même ordre) | Unitaire | 1 |
| AC10 | Aucun mot n'est une particule (liste noire : は, が, を, に, で, へ, と, も, の, か, よ, ね, な, わ, や, から, まで, より, だけ, しか, ばかり, ほど, くらい, など, って) | Unitaire | 1 |

### Migration mots

| # | Critère | Type de vérification | Étape |
|---|---|---|---|
| AC11 | Chaque mot a exactement 6 ContentItems (skills 4, 6, 7, 8, 9, 10) | Intégration | 2 |
| AC12 | Aucun ContentItem en doublon (contrainte UNIQUE respectée) | Intégration | 2 |
| AC13 | Round-trip : seed → lecture via SQL → données correctes | Intégration | 2 |
| AC14 | 30 000 ContentItems mots au total | Intégration | 2 |

### Build

| # | Critère | Type de vérification | Étape |
|---|---|---|---|
| AC15 | `pnpm build` compile sans erreur | CI / manuel | 3 |

## Étapes d'implémentation

### Étape 0 — Extension kana (pré-étape)

- [x] Créer `packages/domain/src/kana-extended-data.ts` avec les 16 kana supplémentaires
  - [x] 3 sokuon/chōon : っ (209), ッ (210), ー (211)
  - [x] 13 katakana étendus : ティ (212) → チェ (224)
  - [x] Utiliser `KanaElement.make()` pour chaque entrée
- [x] Écrire les tests unitaires (TDD) :
  - [x] Test : 16 kana supplémentaires présents → AC-K1
  - [x] Test : IDs continus 209-224 → AC-K2
- [x] Créer la migration `0006_seed_kana_extended.ts`
  - [x] Insérer les 16 kana
  - [x] Créer les 26 ContentItems (13 katakana étendus × Skill 1 + Skill 3)
  - [x] Ne PAS créer de ContentItems pour les 3 sokuon/chōon
- [x] Écrire les tests d'intégration (TDD) :
  - [x] Test : les 3 sokuon/chōon n'ont aucun ContentItem → AC-K3
  - [x] Test : les 13 katakana étendus ont chacun 2 ContentItems → AC-K4
  - [x] Test : les tests US5 existants passent toujours → AC-K5

### Étape 1 — Fichiers de données mots (passe 1 + passe 2)

- [ ] Créer le dossier `packages/domain/src/word-data/`
- [ ] Générer les 5 fichiers de données par fréquence (freq-01.ts → freq-05.ts) — **passe 1** avec `components: [KanaId(1)]` placeholder
- [ ] Créer `index.ts` qui agrège tous les fichiers → `export const wordData`
- [ ] Rescanner et compléter les `components` réels — **passe 2**
- [ ] Écrire les tests unitaires (TDD) sur le dataset agrégé :
  - [ ] Test : 5000 mots présents → AC1
  - [ ] Test : pas de `written` en doublon → AC2
  - [ ] Test : IDs continus 5000-9999 → AC3
  - [ ] Test : `meaning` non vide → AC4
  - [ ] Test : `frequency` > 0 → AC5
  - [ ] Test : `components` non vide → AC6
  - [ ] Test : tous les KanjiId référencés existent dans les jōyō → AC7
  - [ ] Test : tous les KanaId référencés existent dans les 224 kana → AC8
  - [ ] Test : cohérence `written` ↔ `components` → AC9
  - [ ] Test : aucun mot n'est une particule → AC10

### Étape 2 — Migration seed mots

- [ ] Créer la migration `0007_seed_words.ts` qui insère les 5000 éléments via SQL (batchs de 500)
- [ ] Dans la même migration, créer les 30 000 ContentItems (chaque mot × skills 4, 6, 7, 8, 9, 10)
- [ ] Écrire les tests d'intégration (Vitest + Testcontainers) :
  - [ ] Test : chaque mot a exactement 6 ContentItems → AC11
  - [ ] Test : aucun ContentItem en doublon → AC12
  - [ ] Test : round-trip seed → lecture → données correctes → AC13
  - [ ] Test : 30 000 ContentItems mots au total → AC14

### Étape 3 — Vérifications finales

- [ ] `pnpm build` compile sans erreur → AC15
- [ ] Mise à jour du CLAUDE.md si nécessaire

## Sources de données

| Source | Usage | Licence |
|---|---|---|
| **BCCWJ** (NINJAL) | Rangs de fréquence par lemme | Données statistiques publiques |
| **JMdict** (EDRDG) | Meanings anglais, formes dictionnaire | CC-BY-SA 4.0 |
| **Liste jōyō** (2010) | Déterminer si un kanji est jōyō (sinon → kana) | Domaine public |

## Hors scope

| Élément | Raison | US/Sprint prévu |
|---|---|---|
| Meanings en français | Anglais uniquement pour l'instant | US future si besoin |
| Readings (furigana) | Pas nécessaires pour les skills core — la forme écrite naturelle suffit | US future si besoin |
| Données d'exercice (audio, distracteurs QCM) | Sprint 2 | Sprint 2 |
| Seed grammaire | US dédiée | US7 |
| Seed phrases (SentenceElement) | Les phrases pourront être générées dynamiquement | Sprint 2-3 |
| Micro-leçons sokuon/chōon | Le contenu des leçons est hors scope, seul le déclencheur "première rencontre" est documenté | Sprint 2 |
| Conjugaisons comme entrées séparées | Un mot = sa forme dictionnaire uniquement | Jamais |
| Mots composés de kanji hors jōyō | Écrits en kana, pas exclus | — |

## Décisions architecturales prises

| Question | Décision | Justification |
|---|---|---|
| Volume du corpus | 5000 mots (pas 200) | Couvre ~98% des mots d'un texte courant. Volume ambitieux mais réaliste avec génération IA. |
| Source de fréquence | BCCWJ (lemme) | Corpus de référence du japonais contemporain, ~100M mots, académiquement validé. |
| Kanji hors jōyō dans les mots | Forme kana dans `written` | Usage réel japonais — les kanji rares sont écrits en kana dans les journaux et livres. |
| Associations skills | 6 skills core par mot (4, 6, 7, 8, 9, 10) | Un mot est un objet cognitif multi-facettes : écoute, compréhension orale/écrite, lecture, production orale/écrite. |
| Sokuon/Chōon | KanaElements sans ContentItems + micro-leçon | Ce sont des mécanismes d'écriture, pas des compétences. Expliqués en contexte la première fois. |
| Katakana étendus | KanaElements avec Skill 1 + Skill 3 | Ce sont de vrais kana à apprendre. Le Skill 1 montre le katakana étendu en récompense (pas de hiragana pour ces sons). |
| Katakana étendus — scope | 13 digraphes courants | Couvre la quasi-totalité des emprunts. Les rares (トゥ, ドゥ, ツァ...) sont exclus. |
| Particules | Exclues (liste noire) | Les particules relèvent de `GrammarElement` (US7), pas du vocabulaire. |
| Forme des mots | Forme dictionnaire uniquement | 食べる suffit — les conjugaisons ne sont pas des mots séparés. |
| Plage d'IDs mots | WordId 5000-9999 | Après kana (1-224) et kanji (1000-3135). Espace suffisant et lisible. |
| Découpage fichiers | 5 fichiers de 1000 mots, classés par fréquence | Moins de fichiers que US5b, mais chaque fichier reste gérable (~1000 entrées). |
| Pipeline de génération | 2 passes (placeholder → components) | Pattern éprouvé US5b. Simplifie le travail de l'IA en séparant sélection et décomposition. |
| Formes polies | Exclues si une forme plain existe déjà | La transformation plain → poli relève des skills de grammaire (Skill 12, 13). Les expressions figées universelles (ください, ごめんなさい) sont conservées. |
| Redondance mot-kanji | Voulue et documentée | 猫-KanjiElement (Skill 5) et 猫-WordElement (skills core) sont cognitivement différents (US4). |
| Méthode de curation | IA assistée, tests comme filet | 5000 mots est un volume trop important pour la curation manuelle. L'IA croise BCCWJ + JMdict, les tests valident. |

## Risques

| Risque | Impact | Mitigation |
|---|---|---|
| Volume de la migration (5000 + 30 000 inserts) | Migration lente en CI | Batchs de 500, même pattern que US5b en plus gros. Testcontainers gère. |
| Mots BCCWJ incluant des particules ou morphèmes | Pollution du corpus | Liste noire de particules + test AC10. Review par lots. |
| Erreurs de décomposition IA (components incorrects) | FK cassées, mots incohérents | Test AC9 (cohérence written ↔ components), tests AC7/AC8 (IDs existants). |
| Katakana étendus non reconnus comme digraphes | Décomposition en 2 caractères au lieu de 1 | Pipeline de décomposition avec détection explicite des 13 digraphes. Test AC9 valide. |
| Meanings JMdict ambigus ou trop longs | QCM confus au Sprint 2 | Curer les meanings : 1 sens principal, concis. Review par lots. |
| Certains mots fréquents BCCWJ sont des noms propres | Noms propres dans le corpus | Filtrer les noms propres (catégorie JMdict). |
| 5 fichiers de 1000 mots impactent le temps de build | Build lent | 5 fichiers seulement, impact minimal. |
