# US7 — Seed data grammaire

## Résumé

259 points de grammaire répartis sur les 5 skills de grammaire (11-15) sont chargés en base avec leurs métadonnées (name, explanation, frequency, formCount). Chaque GrammarElement génère 1 `ContentItem` associé à son skill. En pré-étape, 52 mots supplémentaires (10 nombres de base + 42 combinaisons nombre+compteur) sont ajoutés comme `WordElement` pour fournir les instances concrètes nécessaires aux exercices de compteurs. Les combinaisons nombre+compteur utilisent les chiffres arabes dans `written` (ex: `3本`) pour refléter l'usage réel ; les `components` ne contiennent que les éléments linguistiques japonais (le chiffre arabe n'est pas un composant). Le fichier de données utilise `GrammarElement.make()` pour garantir la validité à la compilation. L'insertion se fait via une migration SQL.

**Sprint :** Sprint 1 — Fondations
**Dépendances :** US4 (Modèle contenu), US5 (Seed kana), US5b (Seed kanji), US6 (Seed vocabulaire)
**Approche :** ATDD — chaque critère d'acceptance est validé par un test automatisé ou une commande vérifiable.

## Architecture

### Corpus : 259 points de grammaire

| Skill | Description | GrammarElements |
|---|---|---|
| **11** | Particules & connecteurs | 80 |
| **12** | Conjugaisons & patterns | 93 |
| **13** | Keigo | 28 |
| **14** | Donner/recevoir | 14 |
| **15** | Compteurs & temps | 44 |

### Pré-étape : extension vocabulaire (nombres + compteurs)

52 mots supplémentaires sont nécessaires pour les exercices du Skill 15 :

**Nombres de base (10) — WordElements avec 6 ContentItems chacun :**

| ID | written | meaning | components |
|---|---|---|---|
| 10000 | 一 | one | [KanjiId(一)] |
| 10001 | 二 | two | [KanjiId(二)] |
| 10002 | 三 | three | [KanjiId(三)] |
| 10003 | 四 | four | [KanjiId(四)] |
| 10004 | 五 | five | [KanjiId(五)] |
| 10005 | 六 | six | [KanjiId(六)] |
| 10006 | 七 | seven | [KanjiId(七)] |
| 10007 | 八 | eight | [KanjiId(八)] |
| 10008 | 九 | nine | [KanjiId(九)] |
| 10009 | 億 | hundred million | [KanjiId(億)] |

**Combinaisons nombre+compteur (42) — WordElements avec chiffres arabes :**

Les combinaisons ciblent les **alternances phonétiques irrégulières** (rendaku, changements de lecture) que l'apprenant doit maîtriser. Les combinaisons régulières n'ont pas besoin d'instance explicite.

| ID | written | meaning | components | Alternance |
|---|---|---|---|---|
| **人 (people)** | | | | |
| 10010 | 1人 | one person | [KanjiId(人)] | ひとり (irrég.) |
| 10011 | 2人 | two people | [KanjiId(人)] | ふたり (irrég.) |
| 10012 | 3人 | three people | [KanjiId(人)] | さんにん (régulier à partir de 3) |
| **本 (long thin objects)** | | | | |
| 10013 | 1本 | one (long object) | [KanjiId(本)] | いっぽん |
| 10014 | 2本 | two (long objects) | [KanjiId(本)] | にほん |
| 10015 | 3本 | three (long objects) | [KanjiId(本)] | さんぼん |
| **匹 (small animals)** | | | | |
| 10016 | 1匹 | one (small animal) | [KanjiId(匹)] | いっぴき |
| 10017 | 3匹 | three (small animals) | [KanjiId(匹)] | さんびき |
| **杯 (cups/glasses)** | | | | |
| 10018 | 1杯 | one cup | [KanjiId(杯)] | いっぱい |
| 10019 | 3杯 | three cups | [KanjiId(杯)] | さんばい |
| **冊 (books)** | | | | |
| 10020 | 1冊 | one book | [KanjiId(冊)] | いっさつ |
| **回 (times)** | | | | |
| 10021 | 1回 | one time | [KanjiId(回)] | いっかい |
| **階 (floors)** | | | | |
| 10022 | 1階 | first floor | [KanjiId(階)] | いっかい |
| **個 (pieces)** | | | | |
| 10023 | 1個 | one piece | [KanjiId(個)] | いっこ |
| **枚 (flat objects)** | | | | |
| 10024 | 1枚 | one (flat object) | [KanjiId(枚)] | いちまい |
| **時 (hours)** | | | | |
| 10025 | 1時 | one o'clock | [KanjiId(時)] | いちじ |
| 10026 | 4時 | four o'clock | [KanjiId(時)] | よじ (irrég.) |
| 10027 | 7時 | seven o'clock | [KanjiId(時)] | しちじ (irrég.) |
| 10028 | 9時 | nine o'clock | [KanjiId(時)] | くじ (irrég.) |
| **分 (minutes)** | | | | |
| 10029 | 1分 | one minute | [KanjiId(分)] | いっぷん |
| 10030 | 3分 | three minutes | [KanjiId(分)] | さんぷん |
| **月 (months)** | | | | |
| 10031 | 1月 | January | [KanjiId(月)] | いちがつ |
| 10032 | 4月 | April | [KanjiId(月)] | しがつ (irrég.) |
| 10033 | 7月 | July | [KanjiId(月)] | しちがつ (irrég.) |
| 10034 | 9月 | September | [KanjiId(月)] | くがつ (irrég.) |
| **日 (days of month)** | | | | |
| 10035 | 1日 | first day | [KanjiId(日)] | ついたち (très irrég.) |
| 10036 | 2日 | second day | [KanjiId(日)] | ふつか (irrég.) |
| 10037 | 3日 | third day | [KanjiId(日)] | みっか (irrég.) |
| 10038 | 4日 | fourth day | [KanjiId(日)] | よっか (irrég.) |
| 10039 | 5日 | fifth day | [KanjiId(日)] | いつか (irrég.) |
| 10040 | 6日 | sixth day | [KanjiId(日)] | むいか (irrég.) |
| 10041 | 7日 | seventh day | [KanjiId(日)] | なのか (irrég.) |
| 10042 | 8日 | eighth day | [KanjiId(日)] | ようか (irrég.) |
| 10043 | 9日 | ninth day | [KanjiId(日)] | ここのか (irrég.) |
| 10044 | 10日 | tenth day | [KanjiId(日)] | とおか (irrég.) |
| **歳 (age)** | | | | |
| 10045 | 20歳 | twenty years old | [KanjiId(歳)] | はたち (très irrég.) |
| **足 (footwear)** | | | | |
| 10046 | 1足 | one pair (shoes) | [KanjiId(足)] | いっそく |
| **軒 (buildings)** | | | | |
| 10047 | 1軒 | one house | [KanjiId(軒)] | いっけん |
| 10048 | 3軒 | three houses | [KanjiId(軒)] | さんげん |
| **羽 (birds)** | | | | |
| 10049 | 1羽 | one bird | [KanjiId(羽)] | いちわ |
| 10050 | 3羽 | three birds | [KanjiId(羽)] | さんば |
| 10051 | 6羽 | six birds | [KanjiId(羽)] | ろっぱ |

**Total pré-étape :** 52 WordElements, 312 ContentItems (52 × 6 skills core)

**Règle written pour les combinaisons nombre+compteur :** la forme `written` utilise les chiffres arabes (3本, 4時, 1日) car c'est l'usage réel japonais. Les `components` ne contiennent que les éléments linguistiques japonais — le chiffre arabe n'est pas un composant.

### Données par GrammarElement

| Champ | Type | Source | Description |
|---|---|---|---|
| `id` | `GrammarId` | Séquentiel 1-259 | ID stable pour FK |
| `name` | `string` | Curation manuelle | Nom du point de grammaire (en anglais) |
| `explanation` | `string` | Curation manuelle | Explication courte (en anglais) |
| `frequency` | `number` | Rang intra-skill | Ordre d'enseignement au sein du skill |
| `formCount` | `number` | Analyse linguistique | Nombre de formes/variations/exceptions |

### Associations skill types

| GrammarElement | Skill associé | ContentItems |
|---|---|---|
| Particules & connecteurs (1-80) | Skill 11 | 1 chacun |
| Conjugaisons & patterns (81-173) | Skill 12 | 1 chacun |
| Keigo (174-201) | Skill 13 | 1 chacun |
| Donner/recevoir (202-215) | Skill 14 | 1 chacun |
| Compteurs & temps (216-259) | Skill 15 | 1 chacun |

**Total ContentItems grammaire :** 259

### Inventaire complet par skill

#### Skill 11 — Particules & connecteurs (80 éléments)

**Particules (24) :**

| # | Élément | Name | Freq | formCount |
|---|---|---|---|---|
| 1 | だ | copula | 1 | 1 |
| 2 | は | topic marker | 2 | 1 |
| 3 | が | subject/conjunctive marker | 3 | 2 |
| 4 | を | object marker | 4 | 1 |
| 5 | に | target/location marker | 5 | 5 |
| 6 | の | possessive/nominalizer | 6 | 3 |
| 7 | で | means/location marker | 7 | 3 |
| 8 | と | quotation/and/with/conditional | 8 | 4 |
| 9 | も | also/even | 9 | 1 |
| 10 | か | question marker | 10 | 2 |
| 11 | から | from/because/since | 11 | 3 |
| 12 | へ | direction marker | 12 | 1 |
| 13 | まで | until/as far as | 13 | 1 |
| 14 | より | than/from (formal) | 14 | 2 |
| 15 | だけ | only/just | 15 | 1 |
| 16 | しか | only (+ negative) | 16 | 1 |
| 17 | や | and (non-exhaustive) | 17 | 1 |
| 18 | など | etc./things like | 18 | 1 |
| 19 | ばかり | just/nothing but | 19 | 2 |
| 20 | ほど | extent/degree | 20 | 2 |
| 21 | くらい/ぐらい | about/approximately | 21 | 1 |
| 22 | よ | emphasis/assertion | 22 | 1 |
| 23 | ね | confirmation/agreement | 23 | 1 |
| 24 | わ | soft emphasis | 24 | 1 |

**Connecteurs (12) :**

| # | Élément | Name | Freq | formCount |
|---|---|---|---|---|
| 25 | けど/けれど(も) | but/although | 25 | 3 |
| 26 | ので | because (objective) | 26 | 1 |
| 27 | のに | despite/even though | 27 | 1 |
| 28 | し | and also/moreover | 28 | 1 |
| 29 | て (conjonctif) | and then/by doing | 29 | 1 |
| 30 | たら | if/when (conditional) | 30 | 1 |
| 31 | ば | if (conditional) | 31 | 1 |
| 32 | なら | if (contextual) | 32 | 1 |
| 33 | ても/でも | even if | 33 | 1 |
| 34 | ながら | while doing | 34 | 1 |
| 35 | たり | doing things like | 35 | 1 |
| 36 | つつ | while (formal) | 36 | 1 |

**Expressions fonctionnelles formelles (16) :**

| # | Élément | Name | Freq | formCount |
|---|---|---|---|---|
| 37 | に関して/に関する | regarding | 37 | 2 |
| 38 | について/につき | about/concerning | 38 | 2 |
| 39 | に対して/に対する | towards/against | 39 | 2 |
| 40 | にとって | for (perspective) | 40 | 1 |
| 41 | において/における | in/at (formal) | 41 | 2 |
| 42 | によって/により | by means of/depending | 42 | 3 |
| 43 | に基づいて | based on | 43 | 1 |
| 44 | をもとに | based on (source) | 44 | 1 |
| 45 | を通じて/を通して | through/throughout | 45 | 2 |
| 46 | にわたって | over/spanning | 46 | 1 |
| 47 | に沿って | along/in line with | 47 | 1 |
| 48 | に応じて | according to | 48 | 1 |
| 49 | をはじめ | starting with | 49 | 1 |
| 50 | を込めて | with (feeling) put in | 50 | 1 |
| 51 | に伴って | along with/as | 51 | 1 |
| 52 | とともに | together with/as | 52 | 2 |

**Connecteurs de nuance (20) :**

| # | Élément | Name | Freq | formCount |
|---|---|---|---|---|
| 53 | 上で (うえで) | after doing/in doing | 53 | 2 |
| 54 | 上に (うえに) | in addition to | 54 | 1 |
| 55 | 以上 (いじょう) | since/now that | 55 | 1 |
| 56 | 一方 (いっぽう) | while/on the other hand | 56 | 1 |
| 57 | 反面 (はんめん) | on the other hand | 57 | 1 |
| 58 | かわりに | instead of/in exchange | 58 | 2 |
| 59 | 次第 (しだい) | as soon as/depends on | 59 | 2 |
| 60 | 限り (かぎり) | as long as/unless | 60 | 2 |
| 61 | に限って | precisely when | 61 | 1 |
| 62 | からには | now that/since | 62 | 1 |
| 63 | 以来 (いらい) | since (time) | 63 | 1 |
| 64 | たびに | every time | 64 | 1 |
| 65 | まま | as is/unchanged | 65 | 1 |
| 66 | とおり/どおり | as/in the way | 66 | 2 |
| 67 | くせに | even though (critical) | 67 | 1 |
| 68 | わりに | considering/for | 68 | 1 |
| 69 | あまり | so much that (excess) | 69 | 1 |
| 70 | からこそ | precisely because | 70 | 1 |
| 71 | ものの | although (written) | 71 | 1 |
| 72 | ものなら | if one could/if you dare | 72 | 2 |

**Particules de nuance (8) :**

| # | Élément | Name | Freq | formCount |
|---|---|---|---|---|
| 73 | こそ | emphasis (it is... that) | 73 | 1 |
| 74 | さえ | even (+ さえ〜ば) | 74 | 2 |
| 75 | すら/ですら | even (emphatic, formal) | 75 | 1 |
| 76 | だらけ | full of/covered in | 76 | 1 |
| 77 | っけ | wasn't it? (vague recall) | 77 | 1 |
| 78 | ものか | no way/as if | 78 | 1 |
| 79 | 向け (むけ) | aimed at/for | 79 | 1 |
| 80 | 抜き (ぬき) | without/leaving out | 80 | 1 |

#### Skill 12 — Conjugaisons & patterns (93 éléments)

**Conjugaisons pures (28) :**

| # | Élément | Name | Freq | formCount |
|---|---|---|---|---|
| 1 | です/ではありません | copula polite forms | 1 | 4 |
| 2 | ます form | polite non-past | 2 | 3 |
| 3 | ません | polite negative | 3 | 3 |
| 4 | ました | polite past | 4 | 3 |
| 5 | ませんでした | polite past negative | 5 | 3 |
| 6 | ない form | plain negative | 6 | 3 |
| 7 | た form | plain past | 7 | 4 |
| 8 | なかった | plain past negative | 8 | 1 |
| 9 | て form | conjunctive | 9 | 4 |
| 10 | ている | progressive/resultative | 10 | 2 |
| 11 | potential form | can do | 11 | 3 |
| 12 | passive form | is done to | 12 | 3 |
| 13 | causative form | make/let do | 13 | 3 |
| 14 | imperative form | command | 14 | 3 |
| 15 | prohibitive な | negative command | 15 | 1 |
| 16 | volitional form | let's/I'll | 16 | 3 |
| 17 | conditional ば form | if (hypothetical) | 17 | 3 |
| 18 | conditional たら form | if/when | 18 | 1 |
| 19 | causative-passive | made to do | 19 | 3 |
| 20 | い-adj negative (くない) | i-adj negative | 20 | 1 |
| 21 | い-adj past (かった) | i-adj past | 21 | 1 |
| 22 | い-adj past neg (くなかった) | i-adj past negative | 22 | 1 |
| 23 | い-adj adverb (く) | i-adj to adverb | 23 | 1 |
| 24 | い-adj て form (くて) | i-adj conjunctive | 24 | 1 |
| 25 | な-adj forms | na-adj inflection | 25 | 4 |
| 26 | ないで | negative conjunctive (without) | 26 | 1 |
| 27 | なくて | te-form of negative | 27 | 1 |
| 28 | ず/ずに | negative conjunctive (formal) | 28 | 2 |

**Patterns — transformation verbale (65) :**

| # | Élément | Name | Freq | formCount |
|---|---|---|---|---|
| 29 | たい | want to do | 29 | 2 |
| 30 | たがる | wants to do (3rd person) | 30 | 1 |
| 31 | てもいい | may/allowed to | 31 | 1 |
| 32 | てはいけない | must not | 32 | 1 |
| 33 | なければならない | must do | 33 | 3 |
| 34 | なくてもいい | don't have to | 34 | 1 |
| 35 | てくれる | do for me | 35 | 1 |
| 36 | てあげる | do for someone | 36 | 1 |
| 37 | てもらう | have someone do | 37 | 1 |
| 38 | ことができる | can do (formal) | 38 | 1 |
| 39 | ことがある | there are times when | 39 | 2 |
| 40 | ようにする | try to/make sure to | 40 | 1 |
| 41 | ようになる | come to/become able | 41 | 1 |
| 42 | てしまう | end up doing/completely | 42 | 2 |
| 43 | ておく | do in advance | 43 | 1 |
| 44 | てみる | try doing | 44 | 1 |
| 45 | たばかり | just did | 45 | 1 |
| 46 | ところだ | about to/just now | 46 | 3 |
| 47 | はずだ | should be/expected | 47 | 1 |
| 48 | そうだ (appearance) | looks like | 48 | 2 |
| 49 | そうだ (hearsay) | I heard that | 49 | 1 |
| 50 | ようだ/みたいだ | seems like | 50 | 2 |
| 51 | らしい | apparently | 51 | 1 |
| 52 | つもりだ | intend to | 52 | 1 |
| 53 | ことにする | decide to | 53 | 1 |
| 54 | ことになる | it's been decided | 54 | 1 |
| 55 | てある | is in a state of | 55 | 1 |
| 56 | ていく | go on doing | 56 | 1 |
| 57 | てくる | come to/until now | 57 | 1 |
| 58 | すぎる | too much | 58 | 1 |
| 59 | やすい | easy to do | 59 | 1 |
| 60 | にくい | hard to do | 60 | 1 |
| 61 | 受身 indirect passive | suffering passive | 61 | 1 |
| 62 | させてもらう/させていただく | allow me to | 62 | 2 |
| 63 | てほしい | want someone to do | 63 | 1 |
| 64 | たらどう | why don't you | 64 | 1 |
| 65 | べきだ | should (moral) | 65 | 1 |
| 66 | なさい | polite command | 66 | 1 |
| 67 | ば〜ほど | the more the more | 67 | 1 |
| 68 | がる | show signs of (3rd person) | 68 | 1 |
| 69 | ようにと | tell someone to | 69 | 1 |
| 70 | かもしれない | might/maybe | 70 | 1 |
| 71 | にちがいない | must be/no doubt | 71 | 1 |
| 72 | わけだ | it means/no wonder | 72 | 2 |
| 73 | ものだ | used to/that's how it is | 73 | 2 |
| 74 | ざるを得ない | can't help but | 74 | 2 |
| 75 | わけにはいかない | can't afford to | 75 | 2 |
| 76 | っぽい | -ish/seems like | 76 | 1 |
| 77 | がち | tend to (negative) | 77 | 1 |
| 78 | 気味 (ぎみ) | slightly/touch of | 78 | 1 |
| 79 | たとえ〜ても | even if (hypothetical) | 79 | 1 |
| 80 | どんなに〜ても | no matter how much | 80 | 1 |
| 81 | てたまらない | unbearably | 81 | 1 |
| 82 | てならない | can't help feeling | 82 | 1 |
| 83 | てしょうがない | can't help it | 83 | 1 |
| 84 | ないではいられない | can't help doing | 84 | 1 |
| 85 | かける/かけ | half-done/about to | 85 | 1 |
| 86 | きる/きれる/きれない | completely/can't fully | 86 | 2 |
| 87 | 得る (うる/える) | possible/can happen | 87 | 2 |
| 88 | つつある | in the process of | 88 | 1 |
| 89 | ないことはない | not that one can't | 89 | 1 |
| 90 | しかない | have no choice but | 90 | 1 |
| 91 | ほかない/ほかはない | have no choice but (formal) | 91 | 1 |
| 92 | 抜く (ぬく) | do thoroughly | 92 | 1 |
| 93 | てこそ | only by doing... can | 93 | 1 |

#### Skill 13 — Keigo (28 éléments)

| # | Élément | Name | Freq | formCount | Dépendances |
|---|---|---|---|---|---|
| 1 | お〜になる | honorific verb pattern | 1 | 1 | — |
| 2 | お〜する/いたす | humble verb pattern | 2 | 2 | — |
| 3 | お〜ください | please do (respectful, wago) | 3 | 1 | — |
| 4 | ご〜ください | please do (respectful, kango) | 4 | 1 | — |
| 5 | お/ご + noun | honorific prefix | 5 | 2 | — |
| 6 | 〜様/〜さま | honorific suffix | 6 | 1 | — |
| 7 | でございます | to be (very polite) | 7 | 1 | dep: です (Skill 12) |
| 8 | いらっしゃる | to be/go/come (respectful) | 8 | 3 | dep: いる, 行く, 来る |
| 9 | おっしゃる | to say (respectful) | 9 | 1 | dep: 言う |
| 10 | ご覧になる | to see/look (respectful) | 10 | 1 | dep: 見る |
| 11 | 召し上がる | to eat/drink (respectful) | 11 | 1 | dep: 食べる, 飲む |
| 12 | くださる | to give (respectful) | 12 | 1 | dep: くれる |
| 13 | なさる | to do (respectful) | 13 | 1 | dep: する |
| 14 | ご存知 | to know (respectful) | 14 | 1 | dep: 知る |
| 15 | 〜てくださいませんか | could you please (respectful) | 15 | 1 | dep: て form (Skill 12) |
| 16 | 参る | to go/come (humble) | 16 | 2 | dep: 行く, 来る |
| 17 | 申す | to say (humble) | 17 | 1 | dep: 言う |
| 18 | 申し上げる | to say/tell (very humble) | 18 | 1 | dep: 言う |
| 19 | いたす | to do (humble) | 19 | 1 | dep: する |
| 20 | おる | to be (humble) | 20 | 1 | dep: いる |
| 21 | 拝見する | to see/look (humble) | 21 | 1 | dep: 見る |
| 22 | 伺う | to ask/visit (humble) | 22 | 2 | dep: 聞く, 訪ねる |
| 23 | いただく | to receive/eat (humble) | 23 | 2 | dep: もらう, 食べる |
| 24 | 差し上げる | to give (humble) | 24 | 1 | dep: あげる |
| 25 | 存じる | to know/think (humble) | 25 | 2 | dep: 知る, 思う |
| 26 | 〜ていただけませんか | could you please (humble) | 26 | 1 | dep: て form (Skill 12) |
| 27 | させていただく | allow me to (humble) | 27 | 1 | dep: causative (Skill 12) |
| 28 | かねる | unable to (polite refusal) | 28 | 1 | — |

#### Skill 14 — Donner/recevoir (14 éléments)

| # | Élément | Name | Freq | formCount | Dépendances |
|---|---|---|---|---|---|
| 1 | あげる | to give (outward) | 1 | 1 | — |
| 2 | もらう | to receive | 2 | 1 | — |
| 3 | くれる | to give (inward, to me) | 3 | 1 | — |
| 4 | てあげる | to do for someone | 4 | 1 | dep: て form (Skill 12), あげる |
| 5 | てもらう | to have someone do | 5 | 1 | dep: て form (Skill 12), もらう |
| 6 | てくれる | to do for me (favor) | 6 | 1 | dep: て form (Skill 12), くれる |
| 7 | やる | to give (downward/casual) | 7 | 1 | — |
| 8 | 差し上げる | to give (humble) | 8 | 1 | dep: あげる, Skill 13 |
| 9 | いただく | to receive (humble) | 9 | 1 | dep: もらう, Skill 13 |
| 10 | くださる | to give to me (respectful) | 10 | 1 | dep: くれる, Skill 13 |
| 11 | て差し上げる | to do for someone (humble) | 11 | 1 | dep: て form, 差し上げる |
| 12 | ていただく | to have someone do (humble) | 12 | 1 | dep: て form, いただく |
| 13 | てくださる | to do for me (respectful) | 13 | 1 | dep: て form, くださる |
| 14 | てやる | to do for (downward/casual) | 14 | 1 | dep: て form, やる |

#### Skill 15 — Compteurs & temps (44 éléments)

**Expressions temporelles (14) :**

| # | Élément | Name | Freq | formCount |
|---|---|---|---|---|
| 1 | 時 (じ) | hours (clock) | 1 | 3 |
| 2 | 分 (ふん/ぷん) | minutes | 2 | 3 |
| 3 | 半 (はん) | half | 3 | 1 |
| 4 | 日 (にち/か) | days of month | 4 | 10 |
| 5 | 曜日 (ようび) | days of week | 5 | 1 |
| 6 | 月 (がつ) | months of year | 6 | 3 |
| 7 | 年 (ねん) | years | 7 | 1 |
| 8 | 前/後 (まえ/ご/あと) | before/after | 8 | 3 |
| 9 | 間 (あいだ/かん) | during/between | 9 | 2 |
| 10 | 月間 (かげつ) | duration in months | 10 | 2 |
| 11 | 日間 (にちかん) | duration in days | 11 | 2 |
| 12 | 時間 (じかん) | duration in hours | 12 | 1 |
| 13 | 週間 (しゅうかん) | weeks | 13 | 2 |
| 14 | 秒 (びょう) | seconds | 14 | 1 |

**Compteurs courants (30) :**

| # | Élément | Name | Freq | formCount |
|---|---|---|---|---|
| 15 | つ (hitotsu...) | general counter (native) | 15 | 10 |
| 16 | 個 (こ) | general counter (sino) | 16 | 4 |
| 17 | 人 (にん/り) | people | 17 | 3 |
| 18 | 本 (ほん) | long thin objects | 18 | 3 |
| 19 | 枚 (まい) | flat thin objects | 19 | 1 |
| 20 | 匹 (ひき) | small animals | 20 | 3 |
| 21 | 台 (だい) | machines/vehicles | 21 | 1 |
| 22 | 冊 (さつ) | books/volumes | 22 | 2 |
| 23 | 杯 (はい) | cups/glasses/bowls | 23 | 3 |
| 24 | 回 (かい) | times/occurrences | 24 | 2 |
| 25 | 階 (かい) | floors/stories | 25 | 2 |
| 26 | 番 (ばん) | ordinal/number | 26 | 1 |
| 27 | 歳/才 (さい) | age | 27 | 2 |
| 28 | 円 (えん) | yen | 28 | 1 |
| 29 | キロ | kilo/kilometer | 29 | 1 |
| 30 | 度 (ど) | degrees/times | 30 | 1 |
| 31 | 足 (そく) | pairs of footwear | 31 | 2 |
| 32 | 着 (ちゃく) | suits of clothing | 32 | 1 |
| 33 | 軒 (けん) | houses/buildings | 33 | 2 |
| 34 | 頭 (とう) | large animals | 34 | 1 |
| 35 | 羽 (わ) | birds/rabbits | 35 | 3 |
| 36 | 通 (つう) | letters/emails | 36 | 1 |
| 37 | 丁目 (ちょうめ) | city block | 37 | 1 |
| 38 | 組 (くみ) | groups/sets | 38 | 1 |
| 39 | 曲 (きょく) | songs/pieces | 39 | 1 |
| 40 | 席 (せき) | seats | 40 | 1 |
| 41 | 行 (ぎょう) | lines of text | 41 | 1 |
| 42 | 口 (くち) | bites/donations | 42 | 1 |
| 43 | 切れ (きれ) | slices | 43 | 1 |
| 44 | 粒 (つぶ) | grains/small round things | 44 | 1 |

### Règles architecturales

#### Composition des formes conjuguées

Toute forme conjuguée (ている, potential, passive, causative...) peut elle-même recevoir les flexions de base (ない, た, ます, て). Le moteur d'exercice (Sprint 2-3) génère ces combinaisons dynamiquement quand les deux GrammarElements prérequis sont maîtrisés. Il n'y a **pas** de GrammarElement pour chaque combinaison — cela évite l'explosion combinatoire.

Exemple : ていない n'existe pas comme GrammarElement. Le moteur le propose quand l'apprenant maîtrise à la fois ている (rang 10) et ない (rang 6).

#### Prérequis cross-skill documentés

Certains GrammarElements ne peuvent être enseignés qu'après la maîtrise d'un élément d'un autre skill. Ces contraintes sont gérées par le moteur d'ordonnancement au runtime, pas dans le modèle de données.

**Skill 11 → Skill 12 :**

| Élément (Skill 11) | Prérequis (Skill 12) |
|---|---|
| しか (rang 16) | forme ない |
| ばかり (rang 19) | forme た |
| ほど (rang 20) | forme ば |
| て conjonctif (rang 29) | て form |
| たら (rang 30) | forme た |
| ば (rang 31) | forme ば |
| ても/でも (rang 33) | て form |
| たり (rang 35) | forme た |

**Skill 13 → WordElements :**

Les verbes de keigo (sonkeigo/kenjōgo) ne sont enseignés qu'après la maîtrise du verbe de base correspondant comme WordElement dans le Skill 8 (compréhension écrite). Voir le tableau du Skill 13 pour les dépendances verbe par verbe.

**Skill 14 → Skill 12 + Skill 13 :**

Les formes て+donner/recevoir requièrent la maîtrise de la て form (Skill 12). Les versions keigo requièrent en plus la maîtrise du Skill 13.

**WordElements compteurs → Skill 15 :**

Les combinaisons nombre+compteur (3本, 4時, 1日...) ne sont enseignées qu'après la maîtrise du compteur correspondant dans le Skill 15. Le moteur d'ordonnancement ne propose 3本 que quand l'apprenant a vu le compteur 本.

| WordElement | Prérequis (Skill 15) |
|---|---|
| 1人, 2人, 3人 | 人 (people) |
| 1本, 2本, 3本 | 本 (long thin objects) |
| 1匹, 3匹 | 匹 (small animals) |
| 1杯, 3杯 | 杯 (cups/glasses) |
| 1冊 | 冊 (books) |
| 1回 | 回 (times) |
| 1階 | 階 (floors) |
| 1個 | 個 (pieces) |
| 1枚 | 枚 (flat objects) |
| 1時, 4時, 7時, 9時 | 時 (hours) |
| 1分, 3分 | 分 (minutes) |
| 1月, 4月, 7月, 9月 | 月 (months) |
| 1日〜10日 | 日 (days of month) |
| 20歳 | 歳 (age) |
| 1足 | 足 (footwear) |
| 1軒, 3軒 | 軒 (buildings) |
| 1羽, 3羽, 6羽 | 羽 (birds) |

#### Classification verbale

La classification godan/ichidan/irrégulier est une propriété du **WordElement**, pas du GrammarElement. Le moteur d'exercice sélectionne des verbes dans le corpus de l'apprenant et adapte les distracteurs QCM en fonction du groupe verbal. La progression intra-GrammarElement va : ichidan (régulier) → godan (alternances) → irréguliers (する, 来る). Le `formCount` capture le nombre de groupes/variations à maîtriser.

#### Chevauchements inter-skills voulus

| Élément | Skill 12 | Skill 13 | Skill 14 |
|---|---|---|---|
| てくれる/てあげる/てもらう | Construction て + verbe | — | Choix directionnel qui/à qui |
| させていただく | Construction causatif + もらう | Registre keigo | — |
| 差し上げる/いただく/くださる | — | Substitution keigo du verbe de base | Choix directionnel qui/à qui |

Ces chevauchements sont complémentaires : chaque skill pose une question différente sur le même matériau linguistique.

### Structure des fichiers

```
packages/
  domain/
    src/
      counter-word-data.ts       # 52 WordElements (nombres + combinaisons compteur)
      grammar-data/
        skill-11.ts              # 80 GrammarElements — particules & connecteurs
        skill-12.ts              # 93 GrammarElements — conjugaisons & patterns
        skill-13.ts              # 28 GrammarElements — keigo
        skill-14.ts              # 14 GrammarElements — donner/recevoir
        skill-15.ts              # 44 GrammarElements — compteurs & temps
        index.ts                 # Agrège tout → export const grammarData
  db/
    src/
      migrations/
        0008_seed_counter_words.ts   # Migration : 52 mots + 312 ContentItems
        0009_seed_grammar.ts         # Migration : 259 GrammarElements + 259 ContentItems
```

Chaque fichier `skill-XX.ts` exporte un `ReadonlyArray<GrammarElement>`. L'`index.ts` les concatène en un seul `grammarData` consommé par la migration et les tests.

## Critères d'acceptance

### Pré-étape — Extension vocabulaire

| # | Critère | Type de vérification | Étape |
|---|---|---|---|
| AC-W1 | 52 WordElements supplémentaires sont présents (10 nombres + 42 combinaisons) | Unitaire | 0 |
| AC-W2 | IDs continus 10000-10051 | Unitaire | 0 |
| AC-W3 | Les combinaisons nombre+compteur utilisent des chiffres arabes dans `written` | Unitaire | 0 |
| AC-W4 | Les `components` ne contiennent que des KanjiId valides (pas de chiffres arabes) | Unitaire | 0 |
| AC-W5 | Chaque mot a exactement 6 ContentItems (skills 4, 6, 7, 8, 9, 10) | Intégration | 0 |
| AC-W6 | 312 ContentItems mots au total | Intégration | 0 |
| AC-W7 | Les tests existants de l'US6 ne sont pas impactés | CI | 0 |

### Données grammaire

| # | Critère | Type de vérification | Étape |
|---|---|---|---|
| AC1 | 259 GrammarElements sont présents | Unitaire | 1 |
| AC2 | Pas de `name` en doublon | Unitaire | 1 |
| AC3 | IDs continus 1-259, pas de trou ni doublon | Unitaire | 1 |
| AC4 | `name` et `explanation` non vides pour chaque élément | Unitaire | 1 |
| AC5 | `frequency` > 0 pour chaque élément | Unitaire | 1 |
| AC6 | `formCount` > 0 pour chaque élément | Unitaire | 1 |
| AC7 | Répartition correcte : 80 (Skill 11) + 93 (Skill 12) + 28 (Skill 13) + 14 (Skill 14) + 44 (Skill 15) | Unitaire | 1 |

### Migration grammaire

| # | Critère | Type de vérification | Étape |
|---|---|---|---|
| AC8 | Chaque GrammarElement a exactement 1 ContentItem pour son skill | Intégration | 2 |
| AC9 | Aucun ContentItem en doublon (contrainte UNIQUE respectée) | Intégration | 2 |
| AC10 | Round-trip : seed → lecture via SQL → données correctes | Intégration | 2 |
| AC11 | 259 ContentItems grammaire au total | Intégration | 2 |

### Build

| # | Critère | Type de vérification | Étape |
|---|---|---|---|
| AC12 | `pnpm build` compile sans erreur | CI / manuel | 3 |

## Étapes d'implémentation

### Étape 0 — Extension vocabulaire (nombres + compteurs)

- [x] Créer `packages/domain/src/counter-word-data.ts` avec les 52 WordElements
  - [x] 10 nombres de base (一〜九 + 億) avec `written` en kanji
  - [x] 42 combinaisons nombre+compteur avec `written` en chiffres arabes (3本, 4時, 1日...)
  - [x] `components` ne contenant que les KanjiId (pas de chiffre arabe)
  - [x] Utiliser `WordElement.make()` pour chaque entrée
  - [x] IDs 10000-10051
- [x] Écrire les tests unitaires (TDD) :
  - [x] Test : 52 WordElements présents → AC-W1
  - [x] Test : IDs continus 10000-10051 → AC-W2
  - [x] Test : les combinaisons utilisent des chiffres arabes dans `written` → AC-W3
  - [x] Test : les `components` ne contiennent que des KanjiId valides → AC-W4
- [x] Créer la migration `0008_seed_counter_words.ts`
  - [x] Insérer les 52 mots
  - [x] Créer les 312 ContentItems (52 mots × skills 4, 6, 7, 8, 9, 10)
- [x] Écrire les tests d'intégration (TDD) :
  - [x] Test : chaque mot a exactement 6 ContentItems → AC-W5
  - [x] Test : 312 ContentItems au total → AC-W6
  - [x] Test : les tests US6 existants passent toujours → AC-W7

### Étape 1 — Fichiers de données grammaire

- [ ] Créer le dossier `packages/domain/src/grammar-data/`
- [ ] Créer les 5 fichiers de données par skill :
  - [ ] `skill-11.ts` — 80 particules & connecteurs
  - [ ] `skill-12.ts` — 93 conjugaisons & patterns
  - [ ] `skill-13.ts` — 28 keigo
  - [ ] `skill-14.ts` — 14 donner/recevoir
  - [ ] `skill-15.ts` — 44 compteurs & temps
- [ ] Créer `index.ts` qui agrège tous les fichiers → `export const grammarData`
- [ ] Utiliser `GrammarElement.make()` pour chaque entrée
- [ ] Écrire les tests unitaires (TDD) sur le dataset agrégé :
  - [ ] Test : 259 GrammarElements présents → AC1
  - [ ] Test : pas de `name` en doublon → AC2
  - [ ] Test : IDs continus 1-259 → AC3
  - [ ] Test : `name` et `explanation` non vides → AC4
  - [ ] Test : `frequency` > 0 → AC5
  - [ ] Test : `formCount` > 0 → AC6
  - [ ] Test : répartition par skill correcte → AC7

### Étape 2 — Migration seed grammaire

- [ ] Créer la migration `0009_seed_grammar.ts` qui insère les 259 éléments via SQL (batchs de 100)
- [ ] Dans la même migration, créer les 259 ContentItems (chaque GrammarElement × son skill)
- [ ] Écrire les tests d'intégration (Vitest + Testcontainers) :
  - [ ] Test : chaque GrammarElement a exactement 1 ContentItem → AC8
  - [ ] Test : aucun ContentItem en doublon → AC9
  - [ ] Test : round-trip seed → lecture → données correctes → AC10
  - [ ] Test : 259 ContentItems grammaire au total → AC11

### Étape 3 — Vérifications finales

- [ ] `pnpm build` compile sans erreur → AC12
- [ ] Mise à jour du CLAUDE.md si nécessaire

## Sources de données

| Source | Usage | Licence |
|---|---|---|
| **Manuels JLPT N5-N1** | Inventaire des points de grammaire | Synthèse de sources publiques |
| **BCCWJ** (NINJAL) | Fréquence d'apparition des particules | Données statistiques publiques |
| **JMdict** (EDRDG) | Vérification des meanings | CC-BY-SA 4.0 |
| **Liste jōyō** (2010) | Validation des KanjiId dans les compteurs | Domaine public |

## Hors scope

| Élément | Raison | US/Sprint prévu |
|---|---|---|
| Micro-leçons (contenu du bouton "?") | Le contenu des leçons est hors scope, seul le GrammarElement est posé | Sprint 2 |
| Instances d'exercice (distracteurs QCM, phrases à trou) | Sprint 2 | Sprint 2 |
| Ordonnancement et prérequis cross-skill | Documenté ici, implémenté au runtime | Sprint 2-3 |
| Composition dynamique des formes conjuguées | Le moteur combinera les formes au runtime | Sprint 2-3 |
| Seed phrases (SentenceElement) | Générées dynamiquement à partir des mots + grammaire | Sprint 2-3 |
| Grammaire classique/littéraire (〜たる, 〜べからず...) | Japonais classique, pas moderne | Post-MVP |

## Décisions architecturales prises

| Question | Décision | Justification |
|---|---|---|
| Critère Skill 11 vs Skill 12 | "L'exercice demande-t-il de transformer un verbe ?" Oui → Skill 12, Non (choix d'expression à trou) → Skill 11 | Sépare clairement conjugaison (transformation) de syntaxe (sélection) |
| な prohibitif | Skill 12 (conjugaison), pas Skill 11 | C'est une forme impérative négative, pas une particule |
| な marqueur na-adj | Skill 12 (morphologie adjectivale), pas Skill 11 | C'est la flexion de l'adjectif, pas une particule |
| って (contraction de と) | Retiré — pas un GrammarElement séparé | Contraction familière, pas un point de grammaire à enseigner séparément |
| だ (copule) | Ajouté au Skill 11, rang 1 | Premier élément structurant de la phrase, fondamental |
| Conjugaison de だ (です etc.) | Skill 12, rang 1 | Progression naturelle : だ (Skill 11) → ses formes (Skill 12) |
| から, と, が avec double usage | Fusion en une seule entrée avec formCount augmenté | Même mot, usages différents — l'exercice couvre les deux contextes |
| Combinaisons de formes (ていない, etc.) | Pas de GrammarElement — composition au runtime | Évite l'explosion combinatoire. Le moteur combine quand les prérequis sont maîtrisés |
| Prérequis cross-skill (しか → ない) | Documenté, implémenté au runtime | L'ordonnancement est du Sprint 2-3, pas du seed data |
| Classification godan/ichidan | Propriété du WordElement, pas du GrammarElement | Le moteur sélectionne les verbes et adapte les distracteurs |
| Chevauchement Skill 12/13/14 | Voulu et complémentaire | Chaque skill pose une question différente sur le même matériau |
| Keigo : ordre d'enseignement | ください patterns en haut, verbes de substitution après | ください est du keigo quotidien, les verbes humbles sont plus avancés |
| Keigo : dépendances verbe de base | Documenté, ordonnancement runtime | On n'enseigne pas いらっしゃる avant いる/行く/来る |
| Nombres (一〜九) | WordElements (étape 0), pas GrammarElements | Les nombres sont des mots, pas de la grammaire |
| Combinaisons nombre+compteur | WordElements avec chiffres arabes dans `written` | 3本 est la forme réelle, `components` ne garde que le kanji |
| Plage d'IDs GrammarElements | GrammarId 1-259 | Espace d'IDs séparé (GrammarId ≠ KanaId/KanjiId/WordId) |
| Plage d'IDs mots compteurs | WordId 10000-10051 | Suite des 5000 mots (5000-9999) de l'US6 |
| Découpage fichiers grammaire | 5 fichiers, un par skill | Correspondance directe skill → fichier, lisible et maintenable |
| Expressions fonctionnelles formelles | Skill 11, pas Skill 12 | に関して, において, etc. sont des expressions à trou, pas des transformations verbales |

## Risques

| Risque | Impact | Mitigation |
|---|---|---|
| 259 GrammarElements + 52 WordElements = volume modéré | Migration gérable | Batchs de 100, même pattern que US5b/US6 |
| Les kanji des nombres (一〜九) et compteurs doivent exister dans les 2136 jōyō | FK cassées si absent | Vérifier par test unitaire que tous les KanjiId référencés existent |
| Les `explanations` en anglais doivent être concises et claires | QCM confus au Sprint 2 | Curation par lots, review linguistique |
| Certains compteurs rares (丁目, 粒) sont peu utiles au MVP | Corpus trop large | Tous inclus par décision explicite — le moteur d'ordonnancement priorise par fréquence |
| Les prérequis cross-skill non modélisés pourraient être oubliés | Exercices proposés trop tôt | Documentés dans cette US, à implémenter comme contraintes d'ordonnancement au Sprint 2-3 |
