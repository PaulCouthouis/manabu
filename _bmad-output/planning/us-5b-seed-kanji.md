# US5b — Seed data kanji

## Résumé

Les 2136 kanji jōyō (révision 2010, sans variantes Unicode dupliquées) sont chargés en base avec leurs métadonnées (meanings anglais, strokeCount, frequency). Chaque kanji génère un `ContentItem` associé au Skill 5 (Sens des kanji). Le fichier de données utilise les classes domaine (`KanjiElement.make()`) pour garantir la validité à la compilation. L'insertion se fait via une migration SQL. Les données sont découpées en fichiers de 100 kanji classés par fréquence d'usage (corpus Aozora Bunko).

**Sprint :** Sprint 1 — Fondations
**Dépendances :** US4 (Modèle de contenu linguistique)
**Approche :** ATDD — chaque critère d'acceptance est validé par un test automatisé ou une commande vérifiable.

## Architecture

### Corpus : les 2136 kanji jōyō

La liste officielle des 2136 jōyō kanji (常用漢字, révision 2010) constitue le corpus exhaustif et définitif. Les 4 variantes Unicode (剝/剥, 塡/填, 頰/頬, 𠮟/叱) sont dédupliquées — seule la forme standard est conservée. Aucun kanji hors jōyō ne sera intégré — un apprenant qui maîtrise ces kanji couvre 99.2% des kanji rencontrés dans la presse et la littérature courante.

### Données par kanji

| Champ | Type | Source | Description |
|---|---|---|---|
| `id` | `KanjiId` | Séquentiel 1000-3135 | ID stable pour FK (WordElement.components en US6) |
| `character` | `string` | Liste jōyō officielle | Le kanji Unicode |
| `meanings` | `Array<string>` | KANJIDIC2, curé | Sens en anglais (1-5 meanings pertinents) |
| `components` | `Array<KanjiId>` | Décomposition IDS, filtrée | Kanji jōyō qui composent structurellement ce kanji |
| `frequency` | `number` | Aozora Bunko corpus | Rang de fréquence (1 = plus fréquent) |
| `strokeCount` | `number` | KANJIDIC2 | Nombre de traits |

### Règle de décomposition des composants

> Un kanji B est composant de A si et seulement si B apparaît dans la décomposition structurelle (IDS — Ideographic Description Sequences) de A **ET** B ∈ {2136 jōyō}.

- Les variantes radicales sont rattachées au kanji plein : 亻→人, 氵→水, 灬→火, 扌→手, 忄→心, 辶→辵, 阝→阜/邑, 刂→刀, 冫→冰, 飠→食, 犭→犬, 礻→示, 衤→衣, etc.
- Un kanji sans composant jōyō a `components: []` (kanji atomique).
- Le graphe de composants doit former un **DAG** (pas de cycle). Validé par `validateComponentGraph` existant.

### Associations skill types

| Kanji | Skill associé | ContentItems par kanji |
|---|---|---|
| Tout kanji jōyō | Skill 5 (Sens des kanji) | 1 |

**Total ContentItems :** 2136

Justification : les `KanjiElement` servent uniquement au Skill 5 (identifier le sens d'un kanji isolé). Les kanji en tant que mots relèvent des `WordElement` (US6) avec leurs propres associations aux skills core 4-10.

### Structure des fichiers

```
packages/
  domain/
    src/
      kanji-data/
        freq-01.ts        # 100 kanji les plus fréquents (rang 1-100)
        freq-02.ts        # 100 kanji suivants (rang 101-200)
        ...               # ... (22 fichiers au total)
        freq-22.ts        # 40 derniers kanji (rang 2101-2136)
        index.ts          # Agrège tout → export const kanjiData
  db/
    src/
      migrations/
        0005_seed_kanji.ts  # Migration : insertion éléments + ContentItems
```

Chaque fichier exporte un `ReadonlyArray<KanjiElement>`. L'`index.ts` les concatène en un seul `kanjiData` consommé par la migration et les tests. Le découpage par tranches de 100 kanji classés par fréquence facilite la curation par lots et reflète l'ordre d'utilité réelle.

### Source de fréquence

Les kanji sont triés par fréquence d'apparition dans le corpus Aozora Bunko (via `scriptin/kanji-frequency`). Les kanji sans données de fréquence dans ce corpus sont placés en fin de liste.

## Critères d'acceptance

| # | Critère | Type de vérification | Étape |
|---|---|---|---|
| AC1 | 2136 kanji jōyō sont présents | Unitaire | 1 |
| AC2 | Pas de character en doublon | Unitaire | 1 |
| AC3 | IDs continus 1000-3135, pas de trou ni doublon | Unitaire | 1 |
| AC4 | Le graphe de `components` forme un DAG valide (pas de cycle) | Unitaire | 1 |
| AC5 | Tous les KanjiId référencés dans `components` existent dans le dataset | Unitaire | 1 |
| AC6 | `meanings` non vide pour chaque kanji (au moins 1 meaning) | Unitaire | 1 |
| AC7 | `strokeCount` > 0 pour chaque kanji | Unitaire | 1 |
| AC8 | `frequency` > 0 pour chaque kanji | Unitaire | 1 |
| AC9 | Chaque kanji a exactement 1 ContentItem associé au Skill 5 | Intégration | 2 |
| AC10 | Aucun ContentItem en doublon (contrainte UNIQUE respectée) | Intégration | 2 |
| AC11 | Round-trip : seed → lecture via SQL → données correctes | Intégration | 2 |
| AC12 | `pnpm build` compile sans erreur | CI / manuel | 3 |

## Étapes d'implémentation

### Étape 1 — Fichiers de données kanji

- [x] Créer le dossier `packages/domain/src/kanji-data/`
- [x] Créer les 22 fichiers de données par fréquence (freq-01.ts → freq-22.ts)
- [x] Créer `index.ts` qui agrège tous les fichiers → `export const kanjiData`
- [x] Utiliser `KanjiElement.make()` pour chaque entrée
- [x] Renseigner les composants selon la règle IDS filtrée aux jōyō (deuxième passe — 1765 kanji avec composants)
- [x] Écrire les tests unitaires (TDD) sur le dataset agrégé :
  - [x] Test : 2136 kanji présents → AC1
  - [x] Test : pas de character en doublon → AC2
  - [x] Test : IDs continus 1000-3135 → AC3
  - [x] Test : graphe de composants est un DAG valide → AC4
  - [x] Test : tous les composants référencés existent → AC5
  - [x] Test : meanings non vide pour chaque kanji → AC6
  - [x] Test : strokeCount > 0 → AC7
  - [x] Test : frequency > 0 → AC8

### Étape 2 — Migration seed

- [x] Créer la migration `0005_seed_kanji.ts` qui insère les 2136 éléments via SQL
- [x] Dans la même migration, créer les 2136 ContentItems (chaque kanji → Skill 5)
- [x] Écrire les tests d'intégration (Vitest + Testcontainers) :
  - [x] Test : chaque kanji a exactement 1 ContentItem Skill 5 → AC9
  - [x] Test : aucun ContentItem en doublon → AC10
  - [x] Test : round-trip seed → lecture → données correctes → AC11

### Étape 3 — Vérifications finales

- [x] `pnpm build` compile sans erreur → AC12
- [x] Mise à jour du CLAUDE.md si nécessaire (pas de changement requis)

## Sources de données

| Source | Usage | Licence |
|---|---|---|
| **Liste jōyō officielle** (2010) | Liste des 2136 kanji, grades scolaires | Domaine public (décret gouvernemental) |
| **KANJIDIC2** (EDRDG) | meanings anglais, strokeCount, readings | CC-BY-SA 4.0 |
| **BCCWJ** (NINJAL) | Rangs de fréquence | Données statistiques publiques |
| **CJK IDS** (Unicode/CHISE) | Décomposition structurelle pour les composants | Open data |

## Hors scope

| Élément | Raison | US/Sprint prévu |
|---|---|---|
| Kanji hors jōyō (jinmeiyō, hyōgai) | Décision définitive — les 2136 jōyō couvrent 99.2% des usages | Jamais |
| Meanings en français | Anglais uniquement pour l'instant | US future si besoin |
| Readings (on'yomi, kun'yomi) | Pas nécessaires pour le Skill 5 (sens uniquement) | US future si besoin |
| Seed vocabulaire (mots) | US dédiée | US6 |
| Données d'exercice (distracteurs QCM pour Skill 5) | Sprint 2 | Sprint 2 |
| Ordre d'apprentissage / difficulté propriétaire | Le frequency + components suffisent pour l'US5b, l'algo de difficulté viendra plus tard | Sprint 2 |

## Décisions architecturales prises

| Question | Décision | Justification |
|---|---|---|
| Corpus kanji | 2136 jōyō exhaustif | Liste officielle, fermée, couvre 99.2% des usages réels. Pas de débat de sélection. |
| Kanji hors jōyō | Exclus définitivement | Trade-off maîtrise/couverture optimal. Les jinmeiyō et raretés n'apportent pas assez de valeur. |
| Langue des meanings | Anglais uniquement | KANJIDIC2 est en anglais, évite un travail de traduction massif prématuré. |
| Découpage fichiers | Par tranches de 100, classé par fréquence Aozora Bunko | 22 fichiers de taille uniforme, reflètent l'ordre d'utilité réelle. Facilite la curation par lots. |
| Règle de décomposition | IDS filtrée aux jōyō uniquement | Objectif, reproductible, vérifiable. Pas de jugement subjectif. |
| Variantes radicales | Rattachées au kanji plein (亻→人, 氵→水, etc.) | Permet de référencer le kanji jōyō correspondant dans le graphe. |
| Plage d'IDs | 1000-3135 | Convention US5 : kana = 1-208, kanji = 1000+. IDs séquentiels par rang de fréquence. |
| ContentItems | 1 par kanji, Skill 5 uniquement | KanjiElement sert uniquement au Skill 5. Les mots kanji relèvent des WordElement (US6). |
| Méthode de curation | IA assistée, review par grade, tests comme filet | 2136 kanji est un volume trop important pour la curation manuelle pure. L'IA croise les sources, les tests valident. |

## Risques

| Risque | Impact | Mitigation |
|---|---|---|
| Erreurs dans le graphe de composants (cycle, référence manquante) | Crash de `validateComponentGraph`, données incohérentes | Tests AC4 + AC5, review par grade, validation DAG automatique |
| Données KANJIDIC2 incomplètes ou incorrectes pour certains kanji | Meanings manquants ou trompeurs | AC6 (meanings non vide), review humaine par lots |
| Décomposition IDS ambiguë pour certains kanji | Composants incorrects | Croiser plusieurs sources, privilegier la décomposition la plus consensuelle |
| Volume du fichier de migration (2136 éléments + 2136 ContentItems) | Migration lente en CI | Acceptable — même pattern que US5 (208+312), juste plus gros. Testcontainers gère. |
| Rang de fréquence BCCWJ indisponible pour certains kanji rares | `frequency` arbitraire | Attribuer le rang max+1 pour les kanji sans donnée BCCWJ (très rares parmi les jōyō) |
