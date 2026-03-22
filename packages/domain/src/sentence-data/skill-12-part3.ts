import type { SentenceElement } from "../linguistic-element.js"
import { s } from "./helpers.js"

export const skill12Part3Sentences: ReadonlyArray<SentenceElement> = [
  // ---------------------------------------------------------------------------
  // Grammar 450: にちがいない — strong certainty (must be, no doubt)
  // ---------------------------------------------------------------------------
  // R1 (top1000, 1 grammar)
  s(
    71501,
    "彼は本当のことを言っているにちがいない。",
    "He must be telling the truth.",
    [5366, 5201, 5038, 5004, 450],
    1,
  ),
  // R2 (top2000, 1 grammar)
  s(
    71502,
    "この結果は何か間違いがあるにちがいない。",
    "There must be some kind of mistake in these results.",
    [5078, 5044, 6110, 450],
    2,
  ),
  // R3 (top3000, 1 grammar)
  s(
    71503,
    "あの選手は今回の試合で優勝するにちがいない。",
    "That player must be going to win this tournament.",
    [7112, 6029, 7113, 7115, 450],
    3,
  ),
  // R4 (top4000, 1 grammar)
  s(
    71504,
    "この構造には何か根本的な問題があるにちがいない。",
    "There must be some fundamental problem with this structure.",
    [8003, 8074, 5067, 450],
    4,
  ),
  // R5 (top5000, 1 grammar)
  s(
    71505,
    "あの政治家は権威を利用しているにちがいない。",
    "That politician must be exploiting his authority.",
    [8199, 8174, 5014, 450],
    5,
  ),
  // R6 (top1000, 2 grammar skill12)
  s(
    71506,
    "彼女は怒っているにちがいないから、謝りたい。",
    "She must be angry, so I want to apologize.",
    [5367, 5415, 5895, 450, 408],
    6,
  ),
  // R7 (top3000, 2 grammar skill12)
  s(
    71507,
    "あの作品は感動的なものにちがいないと聞いたそうだ。",
    "I heard that work must be something moving.",
    [6039, 7093, 5011, 450, 428],
    7,
  ),
  // R8 (top5000, 2 grammar diff skills: 450 + skill11 369)
  s(
    71508,
    "努力したからこそ、成功したにちがいない。",
    "Precisely because they made the effort, they must have succeeded.",
    [5914, 5912, 450, 369],
    8,
  ),
  // R9 (top3000, 3 grammar: 450 + skill12 431 + skill11 325)
  s(
    71509,
    "彼は来年留学するつもりなので、合格したにちがいない。",
    "Since he intends to study abroad next year, he must have passed.",
    [5366, 5291, 5643, 6068, 450, 431, 325],
    9,
  ),
  // R10 (top5000, 3 grammar: each diff skill — 450 skill12 + 341 skill11 + 501 skill14)
  s(
    71510,
    "先生によって選ばれた学生は、努力の成果にちがいないものをあげる。",
    "The student chosen by the teacher gives something that must be the result of effort.",
    [5350, 5352, 5914, 8011, 5187, 450, 341, 501],
    10,
  ),

  // ---------------------------------------------------------------------------
  // Grammar 451: わけだ — logical conclusion / impossibility with わけがない
  // ---------------------------------------------------------------------------
  // R1
  s(
    71511,
    "毎日練習しているから、上手いわけだ。",
    "He practices every day, so no wonder he's skilled.",
    [5293, 5487, 5692, 451],
    1,
  ),
  // R2
  s(
    71512,
    "十分に準備したから、成功するわけだ。",
    "We prepared thoroughly, so of course it will succeed.",
    [6007, 5488, 5912, 451],
    2,
  ),
  // R3
  s(
    71513,
    "彼は毎日練習しているのだから、試合に負けるわけがない。",
    "Since he practices every day, there's no way he'd lose the match.",
    [5366, 5293, 5487, 7113, 451],
    3,
  ),
  // R4
  s(
    71514,
    "この基礎がしっかりしていれば、失敗するわけがない。",
    "With a solid foundation like this, there's no way it can fail.",
    [8015, 5385, 5913, 451],
    4,
  ),
  // R5
  s(
    71515,
    "あれだけ慎重に検討したのだから、問題が起こるわけがない。",
    "Since we examined it that carefully, there's no way a problem would occur.",
    [8079, 6228, 5067, 5139, 451],
    5,
  ),
  // R6 (top1000, 2 grammar skill12)
  s(
    71516,
    "彼は子供の頃からずっと日本語を勉強しているから、話せるわけだ。",
    "He's been studying Japanese since childhood, so naturally he can speak it.",
    [5366, 5364, 5270, 5926, 5017, 451, 390],
    6,
  ),
  // R7 (top3000, 2 grammar skill12)
  s(
    71517,
    "季節が変わると、気温も変わるわけだ。毎年そうなっている。",
    "When the season changes, the temperature changes too. That's how it's been every year.",
    [7019, 5145, 5551, 451, 389],
    7,
  ),
  // R8 (top5000, 2 grammar: 451 + skill13 479)
  s(
    71518,
    "先生がそうおっしゃるのだから、正しいわけでございます。",
    "Since the teacher says so, it must be correct.",
    [5350, 6109, 451, 479],
    8,
  ),
  // R9 (top3000, 3 grammar: 451 + skill12 426 + skill11 327)
  s(
    71519,
    "あんなに練習したのに上手くならないはずがない。上達するわけだ。",
    "Despite all that practice, there's no way you wouldn't improve. Naturally you'll progress.",
    [5487, 5692, 6613, 451, 426, 326],
    9,
  ),
  // R10 (top5000, 3 grammar: 451 skill12 + 373 skill11 + 509 skill14)
  s(
    71520,
    "先生でさえ認めた能力なのだから、成功するわけだ。いただいた評価は当然だ。",
    "Even the teacher acknowledged that ability, so naturally it will succeed. The evaluation received is well-deserved.",
    [5350, 6017, 5540, 5912, 6127, 5202, 451, 373, 509],
    10,
  ),

  // ---------------------------------------------------------------------------
  // Grammar 452: ものだ — nostalgia / general truth
  // ---------------------------------------------------------------------------
  // R1
  s(
    71521,
    "子供の頃はよく友達と遊んだものだ。",
    "When I was a child, I used to play with friends a lot.",
    [5364, 5801, 5072, 5131, 452],
    1,
  ),
  // R2
  s(
    71522,
    "昔の学生は辞書をよく使ったものだ。",
    "Students in the past used to use dictionaries a lot.",
    [5352, 5623, 5801, 5014, 452],
    2,
  ),
  // R3
  s(
    71523,
    "季節が変わると人の気持ちも変わるものだ。",
    "When the seasons change, people's feelings change too — that's just how it is.",
    [7019, 5145, 5037, 5074, 452],
    3,
  ),
  // R4
  s(
    71524,
    "本来、努力は必ず報われるものだ。",
    "By nature, effort is always rewarded.",
    [8073, 5486, 6028, 452],
    4,
  ),
  // R5
  s(
    71525,
    "人格は長い時間をかけて作られるものだ。",
    "Character is shaped over a long period of time.",
    [8165, 5025, 5065, 5016, 452],
    5,
  ),
  // R6 (top1000, 2 grammar skill12)
  s(
    71526,
    "昔は家族と一緒に夕食を食べたものだ。食べたくなった。",
    "I used to eat dinner with my family. Now I want to eat like that again.",
    [5353, 5091, 5307, 5124, 452, 408],
    6,
  ),
  // R7 (top3000, 2 grammar skill12)
  s(
    71527,
    "子供の頃は毎日友達と遊んだものだ。あの頃に戻れたらいいのに。",
    "When I was a child, I played with friends every day. If only I could go back to those days.",
    [5364, 5293, 5072, 5131, 452, 397],
    7,
  ),
  // R8 (top5000, 2 grammar: 452 + skill15 538)
  s(
    71528,
    "昔は毎朝三回走ったものだ。",
    "I used to run three times every morning.",
    [5294, 10002, 5134, 452, 538],
    8,
  ),
  // R9 (top3000, 3 grammar: 452 + skill12 436 + skill11 333)
  s(
    71529,
    "子供の頃は歌を歌いながら歩いてきたものだ。",
    "As a child, I used to walk along singing songs.",
    [5364, 5459, 5135, 452, 436, 333],
    9,
  ),
  // R10 (top5000, 3 grammar: 452 skill12 + 362 skill11 + 515 skill15)
  s(
    71530,
    "大学以来、毎朝七時に起きて走ったものだ。",
    "Ever since college, I used to wake up at seven every morning and run.",
    [5114, 5294, 10027, 5127, 5134, 452, 362, 515],
    10,
  ),

  // ---------------------------------------------------------------------------
  // Grammar 453: ざるを得ない — unavoidable obligation (can't help but)
  // ---------------------------------------------------------------------------
  // R1
  s(
    71531,
    "時間がないから、今日は帰らざるを得ない。",
    "Since there's no time, I have no choice but to go home today.",
    [5065, 5069, 5126, 453],
    1,
  ),
  // R2
  s(
    71532,
    "医者の言葉を聞いて、手術を受けざるを得なかった。",
    "After hearing the doctor's words, I had no choice but to undergo surgery.",
    [6010, 5073, 5011, 5447, 5160, 453],
    2,
  ),
  // R3
  s(
    71533,
    "困難な状況では、方針を変えざるを得ない。",
    "In a difficult situation, we have no choice but to change our policy.",
    [7133, 5516, 7131, 5171, 453],
    3,
  ),
  // R4
  s(
    71534,
    "構造的な問題がある以上、制度を見直さざるを得ない。",
    "Given the structural problems, we have no choice but to review the system.",
    [8003, 5067, 5535, 5938, 453],
    4,
  ),
  // R5
  s(
    71535,
    "資源が不足しているので、政策を変えざるを得ない。",
    "Since resources are insufficient, we have no choice but to change the policy.",
    [8007, 8009, 5171, 453],
    5,
  ),
  // R6 (top1000, 2 grammar skill12)
  s(
    71536,
    "雨が降っているので、傘を持って行かざるを得ない。",
    "Since it's raining, I have no choice but to bring an umbrella.",
    [5545, 5327, 5012, 5008, 453, 389],
    6,
  ),
  // R7 (top3000, 2 grammar skill12)
  s(
    71537,
    "予測が外れたので、計画を変えざるを得なくなった。",
    "Since the prediction was wrong, we had no choice but to change the plan.",
    [7129, 5480, 5171, 453, 420],
    7,
  ),
  // R8 (top5000, 2 grammar: 453 + skill14 502)
  s(
    71538,
    "あまりに困ったので、上司から助けをもらわざるを得なかった。",
    "I was so troubled that I had no choice but to receive help from my boss.",
    [8090, 5474, 5935, 5186, 453, 502],
    8,
  ),
  // R9 (top3000, 3 grammar: 453 + skill12 421 + skill11 325)
  s(
    71539,
    "間違いをしてしまったので、最初からやり直さざるを得ない。",
    "Since I ended up making a mistake, I have no choice but to start over.",
    [6110, 5205, 5185, 453, 421, 325],
    9,
  ),
  // R10 (top5000, 3 grammar: 453 skill12 + 310 skill11 + 529 skill15)
  s(
    71540,
    "一つ目の問題から解決せざるを得ない。",
    "We have no choice but to solve the first problem.",
    [5093, 5067, 5526, 453, 310, 529],
    10,
  ),

  // ---------------------------------------------------------------------------
  // Grammar 454: わけにはいかない — can't afford to (social/moral constraint)
  // ---------------------------------------------------------------------------
  // R1
  s(
    71541,
    "約束したから、行かないわけにはいかない。",
    "Since I made a promise, I can't afford not to go.",
    [5482, 5008, 454],
    1,
  ),
  // R2
  s(
    71542,
    "大事な会議があるので、休むわけにはいかない。",
    "Since there's an important meeting, I can't afford to take a day off.",
    [5109, 5345, 5130, 454],
    2,
  ),
  // R3
  s(
    71543,
    "試合の前日だから、遊ぶわけにはいかない。",
    "Since it's the day before the match, I can't afford to goof off.",
    [7113, 5131, 454],
    3,
  ),
  // R4
  s(
    71544,
    "責任がある以上、途中で止めるわけにはいかない。",
    "As long as I have responsibility, I can't afford to stop midway.",
    [6145, 5141, 454],
    4,
  ),
  // R5
  s(
    71545,
    "慎重に進めるべき仕事だから、急ぐわけにはいかない。",
    "Since it's a job that should be handled carefully, I can't afford to rush.",
    [8079, 5066, 454],
    5,
  ),
  // R6 (top1000, 2 grammar skill12)
  s(
    71546,
    "先生が待っているから、遅れるわけにはいかない。急いで行きたい。",
    "Since the teacher is waiting, I can't be late. I want to hurry and go.",
    [5350, 5149, 5032, 5008, 454, 408],
    6,
  ),
  // R7 (top3000, 2 grammar skill12)
  s(
    71547,
    "季節の変わり目だから、体調を崩すわけにはいかないようにする。",
    "Since it's the change of season, I make sure I don't fall ill.",
    [7019, 5428, 454, 419],
    7,
  ),
  // R8 (top5000, 2 grammar: 454 + skill11 361)
  s(
    71548,
    "約束した以上、行かないわけにはいかないからには、準備をしなければならない。",
    "Since I promised and therefore can't afford not to go, I must prepare.",
    [5482, 5008, 5488, 454, 361],
    8,
  ),
  // R9 (top3000, 3 grammar: 454 + skill12 412 + skill11 324)
  s(
    71549,
    "試験があるから、勉強しないわけにはいかないし、しなければならないけど、疲れた。",
    "I can't afford not to study since there's an exam, and I have to, but I'm tired.",
    [5347, 5926, 5422, 454, 412, 324],
    9,
  ),
  // R10 (top5000, 3 grammar: 454 skill12 + 359 skill11 + 499 skill13)
  s(
    71550,
    "お客様がいらっしゃる限り、失礼するわけにはいかない。させていただきます。",
    "As long as the customer is here, I can't afford to be rude. Please allow me.",
    [5792, 5795, 454, 359, 499],
    10,
  ),

  // ---------------------------------------------------------------------------
  // Grammar 455: っぽい — resemblance / tendency (-ish, seems like)
  // ---------------------------------------------------------------------------
  // R1
  s(
    71551,
    "今日は寒いから、冬っぽい天気だ。",
    "It's cold today, so the weather is winter-ish.",
    [5069, 5553, 5559, 5542, 455],
    1,
  ),
  // R2
  s(
    71552,
    "あの人は子供っぽい性格だ。",
    "That person has a childish personality.",
    [5037, 5364, 6097, 455],
    2,
  ),
  // R3
  s(
    71553,
    "この絵画は現代っぽいスタイルだ。",
    "This painting has a contemporary-ish style.",
    [7105, 6306, 455],
    3,
  ),
  // R4
  s(
    71554,
    "あの人の話し方は嘘っぽい。",
    "The way that person talks sounds lie-ish.",
    [5037, 6611, 455],
    4,
  ),
  // R5
  s(
    71555,
    "この建物は古くて、廃墟っぽい雰囲気がある。",
    "This building is old and has an abandoned ruin-ish atmosphere.",
    [5595, 5024, 455],
    5,
  ),
  // R6 (top1000, 2 grammar skill12)
  s(
    71556,
    "この服は安っぽいけど、着てみたい。",
    "These clothes look cheap-ish, but I want to try wearing them.",
    [5324, 5666, 5700, 455, 408],
    6,
  ),
  // R7 (top3000, 2 grammar skill12)
  s(
    71557,
    "彼の演技は素人っぽいが、だんだん上手くなってきた。",
    "His acting was amateurish, but he's gradually gotten better.",
    [5366, 7104, 5849, 5692, 455, 436],
    7,
  ),
  // R8 (top5000, 2 grammar: 455 + skill11 326)
  s(
    71558,
    "本気で頑張っているのに、適当っぽいと思われる。",
    "Even though I'm genuinely trying hard, people think I seem careless-ish.",
    [6118, 5500, 5700, 5005, 455, 326],
    8,
  ),
  // R9 (top3000, 3 grammar: 455 + skill12 429 + skill11 327)
  s(
    71559,
    "この料理は甘っぽいようだし、子供っぽい味みたいだ。",
    "This dish seems sweet-ish, and the taste seems childish.",
    [5308, 7002, 5364, 7001, 455, 429, 327],
    9,
  ),
  // R10 (top5000, 3 grammar: 455 skill12 + 375 skill11 + 529 skill15)
  s(
    71560,
    "一つ目の部屋は埃だらけで、古っぽい。",
    "The first room is covered in dust and looks old-ish.",
    [5093, 5329, 5024, 455, 375, 529],
    10,
  ),

  // ---------------------------------------------------------------------------
  // Grammar 456: がち — negative tendency (tend to, prone to)
  // ---------------------------------------------------------------------------
  // R1
  s(
    71561,
    "最近、忘れがちなことが多い。",
    "Lately, there are many things I tend to forget.",
    [5206, 5148, 5021, 456],
    1,
  ),
  // R2
  s(71562, "忙しいと、食事を抜きがちになる。", "When busy, I tend to skip meals.", [5304, 456], 2),
  // R3
  s(
    71563,
    "冬は運動不足になりがちだ。",
    "In winter, one tends to lack exercise.",
    [5559, 6491, 456],
    3,
  ),
  // R4
  s(
    71564,
    "慎重すぎると、決定が遅れがちになる。",
    "If you're too cautious, decisions tend to be delayed.",
    [8079, 8020, 5032, 456],
    4,
  ),
  // R5
  s(
    71565,
    "不安定な状況では、人は感情的になりがちだ。",
    "In unstable situations, people tend to become emotional.",
    [8127, 5516, 5037, 8145, 456],
    5,
  ),
  // R6 (top1000, 2 grammar skill12)
  s(
    71566,
    "疲れていると、忘れがちになってしまう。",
    "When tired, I tend to forget things and end up doing so.",
    [5422, 5148, 456, 421],
    6,
  ),
  // R7 (top3000, 2 grammar skill12)
  s(
    71567,
    "独身の人は食事を抜きがちだが、健康に気をつけるべきだ。",
    "Single people tend to skip meals, but they should watch their health.",
    [7226, 5037, 5304, 5451, 5933, 456, 444],
    7,
  ),
  // R8 (top5000, 2 grammar: 456 + skill11 355)
  s(
    71568,
    "仕事は忙しいがちな一方で、趣味の時間も大切だ。",
    "While work tends to be busy, hobby time is also important.",
    [5066, 5040, 5112, 456, 355],
    8,
  ),
  // R9 (top3000, 3 grammar: 456 + skill12 437 + skill11 327)
  s(
    71569,
    "冬は食べすぎがちだし、運動もしなさすぎるようだ。",
    "In winter, one tends to overeat, and seems to exercise too little as well.",
    [5559, 5124, 5452, 456, 437, 327],
    9,
  ),
  // R10 (top5000, 3 grammar: 456 skill12 + 339 skill11 + 515 skill15)
  s(
    71570,
    "学生にとって、朝七時に起きるのは遅れがちだ。",
    "For students, waking up at seven in the morning tends to make them late.",
    [5352, 5296, 10027, 5127, 456, 339, 515],
    10,
  ),

  // ---------------------------------------------------------------------------
  // Grammar 457: 気味 (ぎみ) — slight degree / touch of
  // ---------------------------------------------------------------------------
  // R1
  s(
    71571,
    "最近、風邪気味で体がだるい。",
    "Lately I've had a touch of a cold and feel sluggish.",
    [5206, 5444, 5428, 457],
    1,
  ),
  // R2
  s(
    71572,
    "今回の試験は難しくて、不合格気味だ。",
    "This exam was difficult, and I have a touch of failing.",
    [6029, 5347, 6069, 457],
    2,
  ),
  // R3
  s(
    71573,
    "緊張気味の声で発表を始めた。",
    "She began the presentation in a slightly nervous voice.",
    [7076, 5059, 6026, 5142, 457],
    3,
  ),
  // R4
  s(
    71574,
    "最近は経済が不安定気味で心配だ。",
    "The economy has been somewhat unstable lately, which is worrying.",
    [5206, 5518, 8127, 5407, 457],
    4,
  ),
  // R5
  s(
    71575,
    "彼は疲弊気味で、休暇が必要だ。",
    "He's somewhat exhausted and needs a vacation.",
    [5366, 9207, 6285, 5085, 457],
    5,
  ),
  // R6 (top1000, 2 grammar skill12)
  s(
    71576,
    "風邪気味だから、早く寝たい。",
    "I have a touch of a cold, so I want to go to bed early.",
    [5444, 5031, 5128, 457, 408],
    6,
  ),
  // R7 (top3000, 2 grammar skill12)
  s(
    71577,
    "疲れ気味で集中できなくなってきた。",
    "I've been slightly tired and gradually losing the ability to concentrate.",
    [5422, 6105, 457, 436],
    7,
  ),
  // R8 (top5000, 2 grammar: 457 + skill11 324)
  s(
    71578,
    "風邪気味だけど、仕事を休むわけにはいかない。",
    "I have a touch of a cold, but I can't afford to miss work.",
    [5444, 5066, 5130, 457, 324],
    8,
  ),
  // R9 (top3000, 3 grammar: 457 + skill12 437 + skill11 325)
  s(
    71579,
    "食べすぎ気味なので、運動しなければならない。",
    "Since I've been eating a bit too much, I need to exercise.",
    [5124, 5452, 457, 437, 325],
    9,
  ),
  // R10 (top5000, 3 grammar: 457 skill12 + 351 skill11 + 501 skill14)
  s(
    71580,
    "不安気味の友人とともに、励ましの言葉をあげた。",
    "Together with a somewhat anxious friend, I offered words of encouragement.",
    [6099, 5369, 5073, 5187, 457, 351, 501],
    10,
  ),

  // ---------------------------------------------------------------------------
  // Grammar 458: たとえ〜ても — even if (concessive + hypothetical)
  // ---------------------------------------------------------------------------
  // R1
  s(71581, "たとえ雨が降っても、行く。", "Even if it rains, I'm going.", [5545, 5008, 458], 1),
  // R2
  s(
    71582,
    "たとえ失敗しても、また挑戦する。",
    "Even if I fail, I'll try again.",
    [5913, 5502, 458],
    2,
  ),
  // R3
  s(
    71583,
    "たとえ困難があっても、諦めない。",
    "Even if there are difficulties, I won't give up.",
    [7133, 5501, 458],
    3,
  ),
  // R4
  s(
    71584,
    "たとえ批判されても、自分の信じることを続ける。",
    "Even if I'm criticized, I'll continue what I believe.",
    [5512, 5050, 8093, 5172, 458],
    4,
  ),
  // R5
  s(
    71585,
    "たとえ孤独であっても、信念を貫く。",
    "Even if I'm alone, I'll stand by my beliefs.",
    [7085, 458],
    5,
  ),
  // R6 (top1000, 2 grammar skill12)
  s(
    71586,
    "たとえ難しくても、最後まで頑張りたい。",
    "Even if it's hard, I want to do my best until the end.",
    [5204, 5500, 458, 408],
    6,
  ),
  // R7 (top3000, 2 grammar skill12)
  s(
    71587,
    "たとえ試合に負けても、後悔しないようにする。",
    "Even if I lose the match, I'll make sure I have no regrets.",
    [7113, 7087, 458, 419],
    7,
  ),
  // R8 (top5000, 2 grammar: 458 + skill14 506)
  s(
    71588,
    "たとえ失敗しても、友人が励ましてくれる。",
    "Even if I fail, my friend will encourage me.",
    [5913, 5369, 458, 506],
    8,
  ),
  // R9 (top3000, 3 grammar: 458 + skill12 444 + skill11 327)
  s(
    71589,
    "たとえ難しくても、諦めるべきではないし、挑戦すべきだ。",
    "Even if it's hard, you shouldn't give up, and you should challenge yourself.",
    [5501, 5502, 458, 444, 327],
    9,
  ),
  // R10 (top5000, 3 grammar: 458 skill12 + 372 skill11 + 515 skill15)
  s(
    71590,
    "たとえ朝七時に起きなくても、その日こそ頑張る。",
    "Even if I don't wake up at seven, that very day I'll do my best.",
    [5296, 10027, 5127, 5039, 5500, 458, 372, 515],
    10,
  ),

  // ---------------------------------------------------------------------------
  // Grammar 459: どんなに〜ても — no matter how much
  // ---------------------------------------------------------------------------
  // R1
  s(
    71591,
    "どんなに忙しくても、食事はちゃんと取る。",
    "No matter how busy I am, I properly eat meals.",
    [5304, 5382, 5181, 459],
    1,
  ),
  // R2
  s(
    71592,
    "どんなに努力しても、結局うまくいかないこともある。",
    "No matter how hard you try, sometimes things just don't work out.",
    [5914, 6000, 459],
    2,
  ),
  // R3
  s(
    71593,
    "どんなに練習しても、完璧にはならない。",
    "No matter how much you practice, you won't become perfect.",
    [5487, 5717, 459],
    3,
  ),
  // R4
  s(
    71594,
    "どんなに慎重に進めても、予想外のことが起こる。",
    "No matter how carefully you proceed, unexpected things happen.",
    [8079, 6252, 5139, 459],
    4,
  ),
  // R5
  s(
    71595,
    "どんなに資源があっても、適切に管理しなければ意味がない。",
    "No matter how many resources there are, they're meaningless without proper management.",
    [8007, 5699, 6282, 5075, 459],
    5,
  ),
  // R6 (top1000, 2 grammar skill12)
  s(
    71596,
    "どんなに食べても、すぐにお腹が空いてしまう。",
    "No matter how much I eat, my stomach quickly empties.",
    [5124, 5389, 5438, 5568, 459, 421],
    6,
  ),
  // R7 (top3000, 2 grammar skill12)
  s(
    71597,
    "どんなに困難でも、諦めないことにする。",
    "No matter how difficult it is, I decide not to give up.",
    [7133, 5501, 459, 432],
    7,
  ),
  // R8 (top5000, 2 grammar: 459 + skill11 369)
  s(
    71598,
    "どんなに大変でも、努力したからこそ成長できる。",
    "No matter how tough it is, precisely because you tried, you can grow.",
    [5113, 5914, 5915, 459, 369],
    8,
  ),
  // R9 (top3000, 3 grammar: 459 + skill12 438 + skill11 325)
  s(
    71599,
    "どんなに分かりやすい説明でも、理解しにくいので、聞き直す。",
    "No matter how easy the explanation is to understand, it's hard to understand, so I ask again.",
    [5498, 5901, 459, 438, 325],
    9,
  ),
  // R10 (top5000, 3 grammar: 459 skill12 + 340 skill11 + 501 skill14)
  s(
    71600,
    "どんなに厳しい状況においても、友人が支えをあげる。",
    "No matter how severe the situation, a friend gives support.",
    [5516, 5369, 459, 340, 501],
    10,
  ),

  // ---------------------------------------------------------------------------
  // Grammar 460: てたまらない — unbearable degree
  // ---------------------------------------------------------------------------
  // R1
  s(71601, "暑くてたまらない。", "It's unbearably hot.", [5552, 460], 1),
  // R2
  s(
    71602,
    "新しい仕事が不安でたまらない。",
    "I'm unbearably anxious about my new job.",
    [5023, 5066, 6099, 460],
    2,
  ),
  // R3
  s(
    71603,
    "試合の結果が気になってたまらない。",
    "I can't help worrying about the match results.",
    [7113, 5078, 5931, 460],
    3,
  ),
  // R4
  s(
    71604,
    "決意したのに、不安でたまらない。",
    "Even though I made up my mind, I'm unbearably anxious.",
    [8082, 6099, 460],
    4,
  ),
  // R5
  s(
    71605,
    "孤独感がひどくて、寂しくてたまらない。",
    "The loneliness is terrible, and I'm unbearably lonely.",
    [9079, 5418, 460],
    5,
  ),
  // R6 (top1000, 2 grammar skill12)
  s(
    71606,
    "暑くてたまらないから、水を飲みたい。",
    "It's unbearably hot, so I want to drink water.",
    [5552, 5309, 5125, 460, 408],
    6,
  ),
  // R7 (top3000, 2 grammar skill12)
  s(
    71607,
    "合格の知らせが嬉しくてたまらないと感じている。",
    "I feel unbearably happy about the news of passing.",
    [6068, 5414, 5076, 460, 389],
    7,
  ),
  // R8 (top5000, 2 grammar: 460 + skill11 369)
  s(
    71608,
    "努力したからこそ、結果が楽しみでたまらない。",
    "Precisely because I worked hard, I can't help looking forward to the results.",
    [5914, 5078, 5412, 460, 369],
    8,
  ),
  // R9 (top3000, 3 grammar: 460 + skill12 435 + skill11 333)
  s(
    71609,
    "歩きながら考えていくと、気になってたまらない。",
    "As I walk and think going forward, I can't help being concerned.",
    [5135, 5015, 5931, 460, 435, 333],
    9,
  ),
  // R10 (top5000, 3 grammar: 460 skill12 + 337 skill11 + 501 skill14)
  s(
    71610,
    "この問題について知りたくてたまらないから、先生に本をあげて聞いた。",
    "I desperately want to know about this problem, so I gave the teacher a book and asked.",
    [5067, 5009, 5350, 5056, 5011, 460, 337, 501],
    10,
  ),

  // ---------------------------------------------------------------------------
  // Grammar 461: てならない — irrepressible feeling (can't help feeling)
  // ---------------------------------------------------------------------------
  // R1
  s(71611, "彼のことが心配でならない。", "I can't help worrying about him.", [5366, 5407, 461], 1),
  // R2
  s(
    71612,
    "新しい環境が不安でならない。",
    "I can't help feeling anxious about the new environment.",
    [5023, 6400, 6099, 461],
    2,
  ),
  // R3
  s(
    71613,
    "友情の大切さが身に染みてならない。",
    "I can't help deeply feeling the importance of friendship.",
    [7090, 5112, 461],
    3,
  ),
  // R4
  s(
    71614,
    "決意したのに、将来のことが不安でならない。",
    "Even though I resolved myself, I can't help feeling anxious about the future.",
    [8082, 6099, 461],
    4,
  ),
  // R5
  s(
    71615,
    "共感できる話を聞くと、涙が出てならない。",
    "When I hear a story I can empathize with, I can't help but tear up.",
    [9083, 5017, 5011, 5010, 461],
    5,
  ),
  // R6 (top1000, 2 grammar skill12)
  s(
    71616,
    "子供の将来が心配でならないから、教えてあげたい。",
    "I can't help worrying about the child's future, so I want to teach them.",
    [5364, 5407, 5164, 461, 408],
    6,
  ),
  // R7 (top3000, 2 grammar skill12)
  s(
    71617,
    "試合に負けたことが悔しくてならなかったが、後悔はしないことにした。",
    "I couldn't help feeling frustrated about losing, but I decided not to regret it.",
    [7113, 7087, 461, 432],
    7,
  ),
  // R8 (top5000, 2 grammar: 461 + skill11 372)
  s(
    71618,
    "この結果こそ、残念でならない。",
    "This result in particular, I can't help finding regrettable.",
    [5078, 5799, 461, 372],
    8,
  ),
  // R9 (top3000, 3 grammar: 461 + skill12 389 + skill11 325)
  s(
    71619,
    "友達が留学しているので、寂しくてならない。会いたい。",
    "My friend is studying abroad, so I can't help feeling lonely. I want to see them.",
    [5072, 5643, 5418, 5150, 461, 389, 325],
    9,
  ),
  // R10 (top5000, 3 grammar: 461 skill12 + 313 skill11 + 504 skill14)
  s(
    71620,
    "年配の先生より若い先生の方が心配でならない。教えてあげたくなる。",
    "I can't help worrying more about the younger teacher than the older one.",
    [5350, 5037, 5407, 5164, 461, 313, 504],
    10,
  ),

  // ---------------------------------------------------------------------------
  // Grammar 462: てしょうがない — irrepressible state (can't help it)
  // ---------------------------------------------------------------------------
  // R1
  s(71621, "眠くてしょうがない。", "I'm hopelessly sleepy.", [5423, 462], 1),
  // R2
  s(
    71622,
    "新しい仕事が楽しくてしょうがない。",
    "I can't help finding my new job fun.",
    [5023, 5066, 5412, 462],
    2,
  ),
  // R3
  s(
    71623,
    "演奏を聴いて、感動してしょうがなかった。",
    "I heard the performance and couldn't help being moved.",
    [7095, 7093, 462],
    3,
  ),
  // R4
  s(
    71624,
    "決意した後も、緊張してしょうがない。",
    "Even after I made up my mind, I can't help being nervous.",
    [8082, 5888, 462],
    4,
  ),
  // R5
  s(
    71625,
    "旅人の話を聞いて、興味があってしょうがない。",
    "After hearing the traveler's story, I can't help being interested.",
    [8211, 5017, 5011, 6101, 462],
    5,
  ),
  // R6 (top1000, 2 grammar skill12)
  s(
    71626,
    "お腹が空いてしょうがないから、早く食べたい。",
    "I'm hopelessly hungry, so I want to eat soon.",
    [5438, 5568, 5031, 5124, 462, 408],
    6,
  ),
  // R7 (top3000, 2 grammar skill12)
  s(
    71627,
    "旅行の写真を見て、行きたくてしょうがなくなった。",
    "Looking at travel photos, I came to desperately want to go.",
    [5614, 5461, 5006, 5008, 462, 420],
    7,
  ),
  // R8 (top5000, 2 grammar: 462 + skill14 506)
  s(
    71628,
    "悲しくてしょうがない時、友人が話を聞いてくれる。",
    "When I'm hopelessly sad, my friend listens to me.",
    [5413, 5040, 5369, 5017, 5011, 462, 506],
    8,
  ),
  // R9 (top3000, 3 grammar: 462 + skill12 408 + skill11 327)
  s(
    71629,
    "新しい楽器を弾きたくてしょうがないし、練習を続けたい。",
    "I desperately want to play the new instrument, and I want to keep practicing.",
    [5023, 7096, 5487, 5172, 462, 408, 327],
    9,
  ),
  // R10 (top5000, 3 grammar: 462 skill12 + 363 skill11 + 515 skill15)
  s(
    71630,
    "毎朝七時に起きるたびに、眠くてしょうがない。",
    "Every time I wake up at seven in the morning, I'm hopelessly sleepy.",
    [5294, 10027, 5127, 5423, 462, 363, 515],
    10,
  ),

  // ---------------------------------------------------------------------------
  // Grammar 463: ないではいられない — compulsion (can't help doing)
  // ---------------------------------------------------------------------------
  // R1
  s(
    71631,
    "悲しい映画を見ると、泣かないではいられない。",
    "When I watch a sad movie, I can't help crying.",
    [5413, 5457, 5006, 5133, 463],
    1,
  ),
  // R2
  s(
    71632,
    "不安な状況では、心配しないではいられない。",
    "In an anxious situation, I can't help worrying.",
    [6099, 5516, 5886, 463],
    2,
  ),
  // R3
  s(
    71633,
    "感動的な演奏を聴くと、涙を流さないではいられない。",
    "When I hear a moving performance, I can't help shedding tears.",
    [7093, 7095, 463],
    3,
  ),
  // R4
  s(
    71634,
    "勇気ある行動を見ると、尊敬しないではいられない。",
    "When I see courageous actions, I can't help feeling respect.",
    [8081, 6170, 5006, 5900, 463],
    4,
  ),
  // R5
  s(
    71635,
    "共感できる話を聞くと、心を動かされないではいられない。",
    "When I hear a relatable story, I can't help being moved.",
    [9083, 5017, 5011, 5058, 5140, 463],
    5,
  ),
  // R6 (top1000, 2 grammar skill12)
  s(
    71636,
    "美味しいものを見ると、食べないではいられない。食べてしまう。",
    "When I see something delicious, I can't help eating it. I end up eating it.",
    [5006, 5124, 463, 421],
    6,
  ),
  // R7 (top3000, 2 grammar skill12)
  s(
    71637,
    "美しい演奏を聴くと、感動しないではいられないものだ。",
    "When you hear a beautiful performance, you can't help being moved — that's just how it is.",
    [6108, 7095, 7093, 463, 452],
    7,
  ),
  // R8 (top5000, 2 grammar: 463 + skill11 369)
  s(
    71638,
    "努力したからこそ、感動しないではいられない。",
    "Precisely because of the effort, I can't help being moved.",
    [5914, 7093, 463, 369],
    8,
  ),
  // R9 (top3000, 3 grammar: 463 + skill12 389 + skill11 325)
  s(
    71639,
    "友達が頑張っているので、応援しないではいられない。",
    "Since my friend is working hard, I can't help cheering them on.",
    [5072, 5500, 7114, 463, 389, 325],
    9,
  ),
  // R10 (top5000, 3 grammar: 463 skill12 + 344 skill11 + 504 skill14)
  s(
    71640,
    "あの話を通して聞くと、涙を流さないではいられない。教えてあげたい。",
    "When you hear that story from start to finish, you can't help crying. I want to tell others.",
    [5017, 5011, 5164, 463, 344, 504],
    10,
  ),

  // ---------------------------------------------------------------------------
  // Grammar 464: かける/かけ — incomplete action / about to
  // ---------------------------------------------------------------------------
  // R1
  s(71641, "言いかけて、やめた。", "I started to say something, then stopped.", [5004, 464], 1),
  // R2
  s(
    71642,
    "読みかけの本を机の上に置いた。",
    "I put the half-read book on the desk.",
    [5136, 5056, 5046, 5182, 464],
    2,
  ),
  // R3
  s(
    71643,
    "食べかけの料理をそのままにして、出かけた。",
    "I left the half-eaten dish as it was and went out.",
    [5124, 5308, 5010, 464],
    3,
  ),
  // R4
  s(
    71644,
    "書きかけの論文を見直さなければならない。",
    "I need to review the half-written thesis.",
    [5137, 7013, 5938, 464],
    4,
  ),
  // R5
  s(
    71645,
    "壊れかけの建物は危険だ。",
    "A building on the verge of collapse is dangerous.",
    [5595, 5712, 464],
    5,
  ),
  // R6 (top1000, 2 grammar skill12)
  s(
    71646,
    "話しかけて、言いたいことを思い出した。",
    "I started to speak and recalled what I wanted to say.",
    [5946, 5004, 5928, 464, 408],
    6,
  ),
  // R7 (top3000, 2 grammar skill12)
  s(
    71647,
    "読みかけの小説が面白そうだ。",
    "The half-read novel looks interesting.",
    [5136, 6041, 5412, 464, 427],
    7,
  ),
  // R8 (top5000, 2 grammar: 464 + skill11 364)
  s(
    71648,
    "壊れかけの机をそのまま使っている。",
    "I'm using the desk that's on the verge of breaking as is.",
    [5182, 5014, 464, 364],
    8,
  ),
  // R9 (top3000, 3 grammar: 464 + skill12 422 + skill11 328)
  s(
    71649,
    "読みかけの本を読んでおいて、試験に備える。",
    "I'll finish reading the half-read book in advance and prepare for the exam.",
    [5136, 5056, 5347, 464, 422, 328],
    9,
  ),
  // R10 (top5000, 3 grammar: 464 skill12 + 318 skill11 + 530 skill15)
  s(
    71650,
    "食べかけのケーキが三個残っていたばかりだ。",
    "There were just three half-eaten pieces of cake left.",
    [5124, 6080, 10002, 10023, 464, 318, 530],
    10,
  ),

  // ---------------------------------------------------------------------------
  // Grammar 465: きる/きれる/きれない — complete/exhaustive action
  // ---------------------------------------------------------------------------
  // R1
  s(
    71651,
    "この本は長すぎて、読みきれない。",
    "This book is too long; I can't read it all.",
    [5056, 5025, 5136, 465],
    1,
  ),
  // R2
  s(
    71652,
    "全部の資料を調べきるのは難しい。",
    "It's difficult to investigate all the materials thoroughly.",
    [5106, 5537, 5163, 465],
    2,
  ),
  // R3
  s(
    71653,
    "あの選手は最後まで走りきった。",
    "That player ran to the very end.",
    [7112, 5204, 5134, 465],
    3,
  ),
  // R4
  s(
    71654,
    "基礎から応用まで学びきるには時間がかかる。",
    "It takes time to learn thoroughly from basics to applied.",
    [8015, 8016, 5926, 5065, 465],
    4,
  ),
  // R5
  s(
    71655,
    "人格を完全に理解しきることはできない。",
    "You cannot fully understand a person's character.",
    [8165, 5717, 5901, 465],
    5,
  ),
  // R6 (top1000, 2 grammar skill12)
  s(
    71656,
    "食べきれないほど料理を作ってしまった。",
    "I ended up making more food than I can eat.",
    [5124, 5308, 5016, 465, 421],
    6,
  ),
  // R7 (top3000, 2 grammar skill12)
  s(
    71657,
    "困難を乗り越えきったと信じている。",
    "I believe I've completely overcome the difficulties.",
    [7133, 5941, 7099, 465, 389],
    7,
  ),
  // R8 (top5000, 2 grammar: 465 + skill11 310)
  s(
    71658,
    "朝から晩まで働ききった。",
    "I worked completely from morning until night.",
    [5296, 5298, 5129, 465, 310],
    8,
  ),
  // R9 (top3000, 3 grammar: 465 + skill12 438 + skill11 327)
  s(
    71659,
    "この説明は分かりやすいし、理解しきれる。",
    "This explanation is easy to understand, and you can fully grasp it.",
    [5498, 5013, 5901, 465, 438, 327],
    9,
  ),
  // R10 (top5000, 3 grammar: 465 skill12 + 345 skill11 + 526 skill15)
  s(
    71660,
    "五時間にわたって話しきった。",
    "I talked thoroughly over a span of five hours.",
    [10004, 5065, 5017, 465, 345, 526],
    10,
  ),

  // ---------------------------------------------------------------------------
  // Grammar 466: 得る (うる/える) — possibility (can happen)
  // ---------------------------------------------------------------------------
  // R1
  s(71661, "そんなことはあり得ない。", "Such a thing is impossible.", [5038, 466], 1),
  // R2
  s(
    71662,
    "予想外の結果もあり得る。",
    "Unexpected results are also possible.",
    [6252, 5078, 466],
    2,
  ),
  // R3
  s(
    71663,
    "試合中に何が起こり得るかは分からない。",
    "You never know what can happen during a match.",
    [7113, 5044, 5139, 5013, 466],
    3,
  ),
  // R4
  s(
    71664,
    "構造的な変化はいつでもあり得る。",
    "Structural changes can happen at any time.",
    [8003, 6008, 5766, 466],
    4,
  ),
  // R5
  s(
    71665,
    "この傾向が続けば、危機もあり得る。",
    "If this tendency continues, a crisis is also possible.",
    [9166, 5144, 8022, 466],
    5,
  ),
  // R6 (top1000, 2 grammar skill12)
  s(
    71666,
    "失敗はあり得るから、準備しておく。",
    "Failure is possible, so I'll prepare in advance.",
    [5485, 5488, 466, 422],
    6,
  ),
  // R7 (top3000, 2 grammar skill12)
  s(
    71667,
    "予測できない事態もあり得るものだ。",
    "Unpredictable situations can also occur — that's how things are.",
    [7129, 466, 452],
    7,
  ),
  // R8 (top5000, 2 grammar: 466 + skill11 354)
  s(
    71668,
    "失敗以上に、大きな成功もあり得る。",
    "Beyond failure, great success is also possible.",
    [5485, 5088, 5018, 5484, 466, 354],
    8,
  ),
  // R9 (top3000, 3 grammar: 466 + skill12 449 + skill11 327)
  s(
    71669,
    "試合の結果は変わり得るし、優勝できるかもしれない。",
    "The match results can change, and winning the championship might be possible.",
    [7113, 5078, 5145, 7115, 466, 449, 327],
    9,
  ),
  // R10 (top5000, 3 grammar: 466 skill12 + 358 skill11 + 531 skill15)
  s(
    71670,
    "状況次第で三人が参加し得る。",
    "Depending on the situation, three people could possibly participate.",
    [5516, 10012, 6171, 466, 358, 531],
    10,
  ),

  // ---------------------------------------------------------------------------
  // Grammar 467: つつある — ongoing process of change
  // ---------------------------------------------------------------------------
  // R1
  s(
    71671,
    "世界は変わりつつある。",
    "The world is in the process of changing.",
    [5064, 5145, 467],
    1,
  ),
  // R2
  s(
    71672,
    "社会の考え方は変化しつつある。",
    "The way society thinks is in the process of changing.",
    [5083, 5507, 6008, 467],
    2,
  ),
  // R3
  s(
    71673,
    "環境問題は改善しつつある。",
    "Environmental problems are in the process of improving.",
    [7049, 5067, 6239, 467],
    3,
  ),
  // R4
  s(
    71674,
    "基礎的な研究が進歩しつつある。",
    "Basic research is in the process of advancing.",
    [8015, 5524, 467],
    4,
  ),
  // R5
  s(
    71675,
    "民主的な価値観が広がりつつある。",
    "Democratic values are in the process of spreading.",
    [8172, 8166, 467],
    5,
  ),
  // R6 (top1000, 2 grammar skill12)
  s(
    71676,
    "日本語が上手になりつつあるから、もっと話したい。",
    "My Japanese is getting better, so I want to speak more.",
    [5270, 5692, 5017, 467, 408],
    6,
  ),
  // R7 (top3000, 2 grammar skill12)
  s(
    71677,
    "環境が改善しつつあるようだ。",
    "The environment seems to be improving.",
    [7049, 6239, 467, 429],
    7,
  ),
  // R8 (top5000, 2 grammar: 467 + skill11 351)
  s(
    71678,
    "技術の進歩とともに、生活は変わりつつある。",
    "Along with technological progress, life is changing.",
    [5523, 5077, 5145, 467, 351],
    8,
  ),
  // R9 (top3000, 3 grammar: 467 + skill12 435 + skill11 325)
  s(
    71679,
    "季節が変わりつつあるので、気温が下がっていく。",
    "Since the season is changing, the temperature will keep dropping.",
    [7019, 5145, 5551, 467, 435, 325],
    9,
  ),
  // R10 (top5000, 3 grammar: 467 skill12 + 336 skill11 + 521 skill15)
  s(
    71680,
    "この年に関する研究は進みつつある。",
    "Research concerning this year is in the process of advancing.",
    [5041, 5524, 467, 336, 521],
    10,
  ),

  // ---------------------------------------------------------------------------
  // Grammar 468: ないことはない — reluctant possibility (not that one can't)
  // ---------------------------------------------------------------------------
  // R1
  s(
    71681,
    "行けないことはないけど、時間がかかる。",
    "It's not that I can't go, but it takes time.",
    [5008, 5065, 468],
    1,
  ),
  // R2
  s(
    71682,
    "分からないことはないが、確かに難しい。",
    "It's not that I can't understand, but it's certainly difficult.",
    [5013, 6001, 468],
    2,
  ),
  // R3
  s(
    71683,
    "この料理が食べられないことはないが、好きではない。",
    "It's not that I can't eat this dish, but I don't like it.",
    [5308, 5124, 5213, 468],
    3,
  ),
  // R4
  s(
    71684,
    "推測できないことはないが、根拠が弱い。",
    "It's not that I can't speculate, but the basis is weak.",
    [8076, 5030, 468],
    4,
  ),
  // R5
  s(
    71685,
    "共感できないことはないが、完全には同意できない。",
    "It's not that I can't empathize, but I can't fully agree.",
    [9083, 5717, 468],
    5,
  ),
  // R6 (top1000, 2 grammar skill12)
  s(
    71686,
    "食べられないことはないけど、食べたくない。",
    "It's not that I can't eat it, but I don't want to.",
    [5124, 468, 408],
    6,
  ),
  // R7 (top3000, 2 grammar skill12)
  s(
    71687,
    "この曲は弾けないことはないが、難しそうだ。",
    "It's not that I can't play this piece, but it looks difficult.",
    [7096, 468, 427],
    7,
  ),
  // R8 (top5000, 2 grammar: 468 + skill14 505)
  s(
    71688,
    "手伝えないことはないが、教えてもらいたい。",
    "It's not that I can't help, but I'd like to be taught.",
    [5166, 5164, 468, 505],
    8,
  ),
  // R9 (top3000, 3 grammar: 468 + skill12 417 + skill11 324)
  s(
    71689,
    "理解できないことはないけど、説明することができないのが難しい。",
    "It's not that I can't understand, but not being able to explain is difficult.",
    [5901, 5498, 468, 417, 324],
    9,
  ),
  // R10 (top5000, 3 grammar: 468 skill12 + 314 skill11 + 504 skill14)
  s(
    71690,
    "この問題は解けないことはないが、だけで解決してあげられない。",
    "It's not that I can't solve this problem, but I can't resolve it for you on my own.",
    [5067, 5526, 468, 314, 504],
    10,
  ),

  // ---------------------------------------------------------------------------
  // Grammar 469: しかない — no choice but (lack of alternatives)
  // ---------------------------------------------------------------------------
  // R1
  s(
    71691,
    "もう時間がないから、走るしかない。",
    "There's no time left, so I have no choice but to run.",
    [5392, 5065, 5134, 469],
    1,
  ),
  // R2
  s(
    71692,
    "医者に言われたから、手術を受けるしかなかった。",
    "The doctor told me, so I had no choice but to undergo surgery.",
    [6010, 5004, 5447, 5160, 469],
    2,
  ),
  // R3
  s(
    71693,
    "困難な状況では、前に進むしかない。",
    "In a difficult situation, you have no choice but to move forward.",
    [7133, 5516, 5048, 469],
    3,
  ),
  // R4
  s(
    71694,
    "決定が出た以上、従うしかない。",
    "Since the decision has been made, there's no choice but to follow it.",
    [8020, 469],
    4,
  ),
  // R5
  s(
    71695,
    "資源が限られている以上、節約するしかない。",
    "Since resources are limited, we have no choice but to economize.",
    [8007, 5664, 469],
    5,
  ),
  // R6 (top1000, 2 grammar skill12)
  s(
    71696,
    "電車が止まっているから、歩くしかない。歩いてみよう。",
    "Since the train has stopped, I have no choice but to walk. Let's try walking.",
    [5121, 5141, 5135, 469, 423],
    6,
  ),
  // R7 (top3000, 2 grammar skill12)
  s(
    71697,
    "予測が外れた以上、新しい方針を立てるしかないだろう。",
    "Since the prediction was wrong, we probably have no choice but to set a new policy.",
    [7129, 7131, 469, 395],
    7,
  ),
  // R8 (top5000, 2 grammar: 469 + skill11 361)
  s(
    71698,
    "約束したからには、最後まで頑張るしかない。",
    "Now that I've promised, I have no choice but to do my best until the end.",
    [5482, 5204, 5500, 469, 361],
    8,
  ),
  // R9 (top3000, 3 grammar: 469 + skill12 389 + skill11 325)
  s(
    71699,
    "友達が困っているので、助けるしかない。",
    "Since my friend is in trouble, I have no choice but to help.",
    [5072, 7100, 469, 389, 325],
    9,
  ),
  // R10 (top5000, 3 grammar: 469 skill12 + 340 skill11 + 515 skill15)
  s(
    71700,
    "朝九時の会議において、出席するしかない。",
    "At the nine o'clock morning meeting, I have no choice but to attend.",
    [5296, 10028, 5345, 469, 340, 515],
    10,
  ),

  // ---------------------------------------------------------------------------
  // Grammar 470: ほかない/ほかはない — formal no alternative
  // ---------------------------------------------------------------------------
  // R1
  s(71701, "もう待つほかない。", "There's nothing to do but wait.", [5392, 5149, 470], 1),
  // R2
  s(
    71702,
    "医者の判断を信じるほかない。",
    "We have no choice but to trust the doctor's judgment.",
    [6010, 5506, 6400, 470],
    2,
  ),
  // R3
  s(
    71703,
    "困難に立ち向かうほかはない。",
    "We have no choice but to face the difficulty.",
    [7133, 470],
    3,
  ),
  // R4
  s(
    71704,
    "決定に従うほかない。反省するしかない。",
    "We have no choice but to follow the decision. We can only reflect on it.",
    [8020, 8095, 470],
    4,
  ),
  // R5
  s(
    71705,
    "この状況では、忍耐するほかない。",
    "In this situation, there's no choice but to endure.",
    [5516, 5875, 470],
    5,
  ),
  // R6 (top1000, 2 grammar skill12)
  s(
    71706,
    "電車がないから、歩くほかない。疲れてしまう。",
    "Since there's no train, I have no choice but to walk. I'll end up exhausted.",
    [5121, 5135, 5422, 470, 421],
    6,
  ),
  // R7 (top3000, 2 grammar skill12)
  s(
    71707,
    "予測が外れた以上、受け入れるほかないものだ。",
    "Since the prediction was wrong, you have no choice but to accept it — that's how it is.",
    [7129, 470, 452],
    7,
  ),
  // R8 (top5000, 2 grammar: 470 + skill11 354)
  s(
    71708,
    "失敗以上に大きな問題が起きたら、やり直すほかない。",
    "If a problem bigger than failure occurs, there's no choice but to redo it.",
    [5485, 5088, 5018, 5067, 5139, 5185, 470, 354],
    8,
  ),
  // R9 (top3000, 3 grammar: 470 + skill12 389 + skill11 333)
  s(
    71709,
    "考えながら待っているほかないが、結果を信じている。",
    "There's no choice but to wait while thinking, but I believe in the result.",
    [5015, 5149, 5078, 7100, 470, 389, 333],
    9,
  ),
  // R10 (top5000, 3 grammar: 470 skill12 + 337 skill11 + 502 skill14)
  s(
    71710,
    "この問題について、先生の助言をもらうほかない。",
    "Regarding this problem, there's no choice but to receive the teacher's advice.",
    [5067, 5350, 5186, 470, 337, 502],
    10,
  ),

  // ---------------------------------------------------------------------------
  // Grammar 471: 抜く (ぬく) — thorough / persevering completion
  // ---------------------------------------------------------------------------
  // R1
  s(71711, "最後まで走り抜いた。", "I ran all the way to the end.", [5204, 5134, 471], 1),
  // R2
  s(
    71712,
    "長い研究を調べ抜いた結果、答えが見つかった。",
    "After thoroughly investigating through long research, I found the answer.",
    [5025, 5524, 5163, 5078, 5162, 5179, 471],
    2,
  ),
  // R3
  s(
    71713,
    "困難な試合を戦い抜いた。",
    "I fought through a difficult match to the very end.",
    [7133, 7113, 471],
    3,
  ),
  // R4
  s(
    71714,
    "あらゆる困難を乗り越え、生き抜いた。",
    "I overcame every difficulty and survived.",
    [5941, 5176, 471],
    4,
  ),
  // R5
  s(
    71715,
    "長い人生を生き抜いた人には知恵がある。",
    "People who have lived through a long life have wisdom.",
    [5025, 5176, 5037, 5539, 471],
    5,
  ),
  // R6 (top1000, 2 grammar skill12)
  s(
    71716,
    "最後まで頑張り抜いて、やっと休みたい。",
    "I persevered to the very end, and finally I want to rest.",
    [5204, 5500, 5390, 5130, 471, 408],
    6,
  ),
  // R7 (top3000, 2 grammar skill12)
  s(
    71717,
    "困難を乗り越え抜いたからこそ、強くなれたはずだ。",
    "It's because I persevered through difficulties that I should have become stronger.",
    [7133, 5941, 5029, 471, 426],
    7,
  ),
  // R8 (top5000, 2 grammar: 471 + skill11 369)
  s(
    71718,
    "努力したからこそ、最後まで走り抜けた。",
    "Precisely because of the effort, I was able to run to the very end.",
    [5914, 5204, 5134, 471, 369],
    8,
  ),
  // R9 (top3000, 3 grammar: 471 + skill12 389 + skill11 325)
  s(
    71719,
    "友達が応援しているので、最後まで頑張り抜いた。",
    "Since my friends were cheering me on, I persevered to the end.",
    [5072, 7114, 5204, 5500, 471, 389, 325],
    9,
  ),
  // R10 (top5000, 3 grammar: 471 skill12 + 345 skill11 + 526 skill15)
  s(
    71720,
    "五時間にわたって考え抜いた。",
    "I thought it through thoroughly over five hours.",
    [10004, 5065, 5015, 471, 345, 526],
    10,
  ),

  // ---------------------------------------------------------------------------
  // Grammar 472: てこそ — only through X can Y be achieved
  // ---------------------------------------------------------------------------
  // R1
  s(
    71721,
    "やってみてこそ、分かることがある。",
    "Only by trying can you understand some things.",
    [5185, 5013, 472],
    1,
  ),
  // R2
  s(
    71722,
    "失敗してこそ、成長できる。",
    "Only through failure can you grow.",
    [5913, 5915, 472],
    2,
  ),
  // R3
  s(
    71723,
    "練習してこそ、試合で勝てる。",
    "Only through practice can you win a match.",
    [5487, 7113, 472],
    3,
  ),
  // R4
  s(
    71724,
    "基礎を学んでこそ、応用が効く。",
    "Only by learning the basics can applied knowledge be effective.",
    [8015, 5926, 8016, 472],
    4,
  ),
  // R5
  s(
    71725,
    "共感してこそ、信頼が生まれる。",
    "Only through empathy is trust born.",
    [9083, 5899, 5174, 472],
    5,
  ),
  // R6 (top1000, 2 grammar skill12)
  s(
    71726,
    "自分で考えてこそ、本当に分かるようになる。",
    "Only by thinking for yourself will you truly come to understand.",
    [5050, 5015, 5201, 5013, 472, 420],
    6,
  ),
  // R7 (top3000, 2 grammar skill12)
  s(
    71727,
    "困難を経験してこそ、人は強くなれるものだ。",
    "Only through experiencing hardship can a person become strong — that's how it is.",
    [7133, 5925, 5037, 5029, 472, 452],
    7,
  ),
  // R8 (top5000, 2 grammar: 472 + skill11 369)
  s(
    71728,
    "努力したからこそ、苦しんでこそ、成功がある。",
    "Precisely because you tried, and only through suffering, is there success.",
    [5914, 5883, 5484, 472, 369],
    8,
  ),
  // R9 (top3000, 3 grammar: 472 + skill12 389 + skill11 325)
  s(
    71729,
    "友達が支えているので、頑張ってこそ結果が出る。",
    "Since friends are supporting me, only by persevering will results come.",
    [5072, 5500, 5078, 5010, 472, 389, 325],
    9,
  ),
  // R10 (top5000, 3 grammar: 472 skill12 + 351 skill11 + 515 skill15)
  s(
    71730,
    "毎朝七時に起きる生活とともに、努力してこそ成功する。",
    "Together with a life of waking at seven every morning, only through effort does one succeed.",
    [5294, 10027, 5127, 5077, 5914, 5484, 472, 351, 515],
    10,
  ),
]
