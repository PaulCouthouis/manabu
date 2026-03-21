# US5 — Seed data kana

## Résumé

Les ~208 kana standard (hiragana + katakana) sont chargés en base avec leurs métadonnées et leurs associations aux skill types Foundation. Le fichier de données utilise les classes domaine (`KanaElement.make()`) pour garantir la validité à la compilation. L'insertion se fait via une migration SQL qui utilise le `LinguisticElementRepo` existant. Les `ContentItem` associés sont créés dans la même migration.

**Sprint :** Sprint 1 — Fondations
**Dépendances :** US4 (Modèle de contenu linguistique)
**Approche :** ATDD — chaque critère d'acceptance est validé par un test automatisé ou une commande vérifiable.

## Architecture

### Fichier de données typé

Les données kana vivent dans un fichier TypeScript structuré qui utilise les `Schema.Class` du domaine. Chaque entrée est construite via `KanaElement.make()` — le Schema valide les champs à la compilation. Ce fichier est la **source de vérité** lisible et reviewable.

### Migration via le repo

La migration importe le fichier de données et utilise le `LinguisticElementRepo` pour insérer les éléments. Le `Schema.encode` du repo garantit la cohérence domaine → SQL. Les `ContentItem` sont créés dans la même migration via le `ContentItemRepo`.

### Associations skill types

| kanaType | Skills associés | ContentItems par élément |
|---|---|---|
| hiragana | F1 (Écoute & répétition syllabique) + F2 (Lecture hiragana) | 2 |
| katakana | F3 (Lecture katakana) | 1 |

**Total ContentItems :** 104 × 2 + 104 × 1 = **312**

Justification : le skill F1 cible le **son** (la syllabe). Le hiragana s'affiche en récompense après bonne réponse. Le son /a/ est le même pour あ et ア — c'est le hiragana qui porte le ContentItem F1, pas le katakana.

### Structure des fichiers

```
packages/
  domain/
    src/
      kana-data.ts             # Données de référence — 208 kana (comme SkillTypes)
  db/
    src/
      migrations/
        0004_seed_kana.ts      # Migration : insertion éléments + ContentItems
```

## Corpus kana — 208 caractères

### Décomposition

| Bloc | Hiragana | Katakana | Count par système |
|---|---|---|---|
| Gojūon (base) | あ→ん | ア→ン | 46 |
| Dakuten (゛) | が→ど, ば→ぼ | ガ→ド, バ→ボ | 20 |
| Handakuten (゜) | ぱ→ぽ | パ→ポ | 5 |
| Yōon (combinaisons) | きゃ→ぴょ | キャ→ピョ | 33 |
| **Total** | **104** | **104** | **208** |

### Ordre gojūon détaillé

**Gojūon (46) :**
あ い う え お / か き く け こ / さ し す せ そ / た ち つ て と / な に ぬ ね の / は ひ ふ へ ほ / ま み む め も / や ゆ よ / ら り る れ ろ / わ を ん

**Dakuten (20) :**
が ぎ ぐ げ ご / ざ じ ず ぜ ぞ / だ ぢ づ で ど / ば び ぶ べ ぼ

**Handakuten (5) :**
ぱ ぴ ぷ ぺ ぽ

**Yōon (33) :**
きゃ きゅ きょ / しゃ しゅ しょ / ちゃ ちゅ ちょ / にゃ にゅ にょ / ひゃ ひゅ ひょ / みゃ みゅ みょ / りゃ りゅ りょ / ぎゃ ぎゅ ぎょ / じゃ じゅ じょ / びゃ びゅ びょ / ぴゃ ぴゅ ぴょ

### Schéma de sortOrder

| Plage | Contenu |
|---|---|
| 1-46 | Hiragana gojūon |
| 47-66 | Hiragana dakuten |
| 67-71 | Hiragana handakuten |
| 72-104 | Hiragana yōon |
| 105-150 | Katakana gojūon |
| 151-170 | Katakana dakuten |
| 171-175 | Katakana handakuten |
| 176-208 | Katakana yōon |

Les hiragana viennent en premier (appris avant les katakana). À l'intérieur de chaque bloc, l'ordre gojūon standard.

## Critères d'acceptance

| # | Critère | Type de vérification | Étape |
|---|---|---|---|
| AC1 | 104 hiragana sont présents (46 gojūon + 20 dakuten + 5 handakuten + 33 yōon) | Unitaire + Intégration | 1, 2 |
| AC2 | 104 katakana sont présents (même décomposition) | Unitaire + Intégration | 1, 2 |
| AC3 | Le sortOrder est continu (1-208, pas de trou ni doublon) | Unitaire | 1 |
| AC4 | Pas de character en doublon | Unitaire | 1 |
| AC5 | Chaque hiragana a un ContentItem F1 et un ContentItem F2 | Intégration | 2 |
| AC6 | Chaque katakana a un ContentItem F3 | Intégration | 2 |
| AC7 | Aucun ContentItem en doublon (contrainte UNIQUE respectée) | Intégration | 2 |
| AC8 | Round-trip : seed → lecture via repo → données correctes | Intégration | 2 |
| AC9 | `pnpm build` compile sans erreur | CI / manuel | 3 |

## Étapes d'implémentation

### Étape 1 — Fichier de données kana

- [x] Créer `packages/db/src/seed/kana-data.ts`
- [x] Structurer les données par blocs (gojūon, dakuten, handakuten, yōon) × (hiragana, katakana)
- [x] Utiliser `KanaElement.make()` pour chaque entrée
- [x] Écrire les tests unitaires (TDD) sur le fichier de données :
  - [x] Test : 104 hiragana présents → AC1
  - [x] Test : 104 katakana présents → AC2
  - [x] Test : sortOrder continu 1-208, pas de trou ni doublon → AC3
  - [x] Test : pas de character en doublon → AC4

### Étape 2 — Migration seed

- [x] Créer la migration qui importe `kana-data.ts` et insère les éléments via SQL direct
- [x] Dans la même migration, créer les ContentItems (hiragana → F1+F2, katakana → F3) via SQL direct
- [x] Écrire les tests d'intégration (Vitest + Testcontainers) :
  - [x] Test : chaque hiragana a un ContentItem F1 et un ContentItem F2 → AC5
  - [x] Test : chaque katakana a un ContentItem F3 → AC6
  - [x] Test : aucun ContentItem en doublon → AC7
  - [x] Test : round-trip seed → lecture → données correctes → AC8

### Étape 3 — Vérifications finales

- [x] `pnpm build` compile sans erreur → AC9
- [x] Mise à jour du CLAUDE.md si nécessaire

## Hors scope

| Élément | Raison | US/Sprint prévu |
|---|---|---|
| Katakana étendus (ティ, ファ, etc.) | Pas dans le syllabaire standard — introduits en contexte de mots avec micro-leçon | US6 / Sprint 2 |
| Sokuon (っ/ッ) et allongements (ー) | Introduits en contexte de mots (skills core) | US6 |
| Seed kanji | US dédiée | US5b |
| Seed vocabulaire | US dédiée | US6 |
| Données d'exercice (audio, distracteurs) | Sprint 2 | Sprint 2 |
| Micro-leçon katakana étendus | Mécanisme pédagogique contextuel | Sprint 2 |

## Décisions architecturales prises

| Question | Décision | Justification |
|---|---|---|
| Katakana étendus inclus ? | Non — hors scope | Pas dans le syllabaire standard. Introduits en contexte de vocabulaire avec micro-leçon contextuelle. |
| Format des données | Fichier TS avec `KanaElement.make()` | Validation Schema à la compilation, lisible à la review, réutilise les classes domaine. |
| Mécanisme d'insertion | Migration via repos Effect existants | Réutilise le `Schema.encode` du repo, cohérence domaine → SQL garantie. |
| ContentItems F1 pour katakana ? | Non — F1 associé uniquement aux hiragana | F1 cible le son (syllabe). Le hiragana s'affiche en récompense. Le son est partagé hiragana/katakana, un seul ContentItem suffit. |
| sortOrder : hiragana ou katakana en premier ? | Hiragana en premier (1-104), katakana ensuite (105-208) | Ordre d'apprentissage naturel : hiragana avant katakana. |
| IDs : attribués dans le fichier ou auto-générés ? | Attribués dans le fichier via `KanaId(n)` | Permet des FK stables pour les composants des mots (US6). IDs prévisibles facilitent le debug et les tests. |

## Risques

| Risque | Impact | Mitigation |
|---|---|---|
| Le compte de 208 est incorrect (kana manquant ou en trop) | Incohérence avec les skills F1/F2/F3 | Tests unitaires qui vérifient le count exact par bloc. Référence croisée avec des sources fiables (table gojūon standard). |
| Les IDs attribués manuellement entrent en conflit avec d'autres seeds (US5b, US6) | FK cassées | Réserver des plages d'IDs par US : US5 = 1-208, US5b = 1000+, US6 = 2000+. |
| La migration via le repo est plus lente qu'un INSERT brut | Migration lente en CI | Acceptable pour 208 éléments + 312 ContentItems. Pas un problème de performance. |
