# US5b — Seed data kanji

## Résumé

Les 2136 kanji jōyō sont chargés en base avec leurs métadonnées (meanings anglais, strokeCount, frequency, graphe de composants). Chaque kanji génère un `ContentItem` associé au Skill 5 (Sens des kanji). Le fichier de données utilise les classes domaine (`KanjiElement.make()`) pour garantir la validité à la compilation. L'insertion se fait via une migration SQL. Les données sont découpées par grade scolaire japonais pour faciliter la curation et la review.

**Sprint :** Sprint 1 — Fondations
**Dépendances :** US4 (Modèle de contenu linguistique)
**Approche :** ATDD — chaque critère d'acceptance est validé par un test automatisé ou une commande vérifiable.

## Architecture

### Corpus : les 2136 kanji jōyō

La liste officielle des jōyō kanji (常用漢字), fixée par le Ministère de l'Éducation japonais (révision 2010), constitue le corpus exhaustif et définitif. Aucun kanji hors jōyō ne sera intégré — un apprenant qui maîtrise ces 2136 kanji couvre 99.2% des kanji rencontrés dans la presse et la littérature courante.

### Données par kanji

| Champ | Type | Source | Description |
|---|---|---|---|
| `id` | `KanjiId` | Séquentiel 1000-3135 | ID stable pour FK (WordElement.components en US6) |
| `character` | `string` | Liste jōyō officielle | Le kanji Unicode |
| `meanings` | `Array<string>` | KANJIDIC2, curé | Sens en anglais (1-5 meanings pertinents) |
| `components` | `Array<KanjiId>` | Décomposition IDS, filtrée | Kanji jōyō qui composent structurellement ce kanji |
| `frequency` | `number` | BCCWJ corpus | Rang de fréquence (1 = plus fréquent) |
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
        grade-1.ts        # 80 kanji (教育漢字 année 1)
        grade-2.ts        # 160 kanji
        grade-3.ts        # 200 kanji
        grade-4.ts        # 202 kanji
        grade-5.ts        # 193 kanji
        grade-6.ts        # 191 kanji
        secondary-1.ts    # ~380 kanji secondaire (les plus fréquents)
        secondary-2.ts    # ~380 kanji secondaire (fréquence moyenne)
        secondary-3.ts    # ~350 kanji secondaire (les moins fréquents)
        index.ts          # Agrège tout → export const kanjiData
  db/
    src/
      migrations/
        0005_seed_kanji.ts  # Migration : insertion éléments + ContentItems
```

Chaque fichier de grade exporte un `ReadonlyArray<KanjiElement>`. L'`index.ts` les concatène en un seul `kanjiData` consommé par la migration et les tests. Le découpage n'a aucun impact sur l'application — c'est un choix de lisibilité pour la curation.

### Découpage du secondaire

Les 1130 kanji du secondaire (grades 7+) n'ont pas de sous-grades officiels. Ils sont découpés en 3 tranches par **rang de fréquence BCCWJ** :
- `secondary-1.ts` : rang 1-380 (les plus fréquents)
- `secondary-2.ts` : rang 381-760
- `secondary-3.ts` : rang 761-1130

## Critères d'acceptance

| # | Critère | Type de vérification | Étape |
|---|---|---|---|
| AC1 | 2136 kanji jōyō sont présents (80+160+200+202+193+191+1130) | Unitaire | 1 |
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

- [ ] Créer le dossier `packages/domain/src/kanji-data/`
- [ ] Créer les fichiers de données par grade (grade-1.ts → grade-6.ts)
- [ ] Créer les fichiers secondaire par tranche de fréquence (secondary-1.ts → secondary-3.ts)
- [ ] Créer `index.ts` qui agrège tous les fichiers → `export const kanjiData`
- [ ] Utiliser `KanjiElement.make()` pour chaque entrée
- [ ] Renseigner les composants selon la règle IDS filtrée aux jōyō
- [ ] Écrire les tests unitaires (TDD) sur le dataset agrégé :
  - [ ] Test : 2136 kanji présents → AC1
  - [ ] Test : pas de character en doublon → AC2
  - [ ] Test : IDs continus 1000-3135 → AC3
  - [ ] Test : graphe de composants est un DAG valide → AC4
  - [ ] Test : tous les composants référencés existent → AC5
  - [ ] Test : meanings non vide pour chaque kanji → AC6
  - [ ] Test : strokeCount > 0 → AC7
  - [ ] Test : frequency > 0 → AC8

### Étape 2 — Migration seed

- [ ] Créer la migration `0005_seed_kanji.ts` qui insère les 2136 éléments via SQL
- [ ] Dans la même migration, créer les 2136 ContentItems (chaque kanji → Skill 5)
- [ ] Écrire les tests d'intégration (Vitest + Testcontainers) :
  - [ ] Test : chaque kanji a exactement 1 ContentItem Skill 5 → AC9
  - [ ] Test : aucun ContentItem en doublon → AC10
  - [ ] Test : round-trip seed → lecture → données correctes → AC11

### Étape 3 — Vérifications finales

- [ ] `pnpm build` compile sans erreur → AC12
- [ ] Mise à jour du CLAUDE.md si nécessaire

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
| Découpage fichiers | Par grade scolaire (1-6) + secondaire en 3 tranches fréquence | Grade = classement officiel, stable, non arbitraire. Secondaire découpé par fréquence BCCWJ pour équilibrer les tailles. |
| Règle de décomposition | IDS filtrée aux jōyō uniquement | Objectif, reproductible, vérifiable. Pas de jugement subjectif. |
| Variantes radicales | Rattachées au kanji plein (亻→人, 氵→水, etc.) | Permet de référencer le kanji jōyō correspondant dans le graphe. |
| Plage d'IDs | 1000-3135 | Convention US5 : kana = 1-208, kanji = 1000+. Laisse de la marge. |
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
