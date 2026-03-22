import * as fs from "node:fs"
import * as path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// --- Build character → ID mappings ---

// Parse kana: extract characters in order from the string literals
const gojuon =
  "あ い う え お か き く け こ さ し す せ そ た ち つ て と な に ぬ ね の は ひ ふ へ ほ ま み む め も や ゆ よ ら り る れ ろ わ を ん".split(
    " ",
  )
const dakuten = "が ぎ ぐ げ ご ざ じ ず ぜ ぞ だ ぢ づ で ど ば び ぶ べ ぼ".split(" ")
const handakuten = "ぱ ぴ ぷ ぺ ぽ".split(" ")
const yoon =
  "きゃ きゅ きょ しゃ しゅ しょ ちゃ ちゅ ちょ にゃ にゅ にょ ひゃ ひゅ ひょ みゃ みゅ みょ りゃ りゅ りょ ぎゃ ぎゅ ぎょ じゃ じゅ じょ びゃ びゅ びょ ぴゃ ぴゅ ぴょ".split(
    " ",
  )

const hiraganaChars = [...gojuon, ...dakuten, ...handakuten, ...yoon]
const katakanaChars = hiraganaChars.map((s) =>
  s.replace(/[\u3041-\u3096]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60)),
)

const charToId = new Map<string, number>()
const idToChar = new Map<number, string>()

// Hiragana: IDs 1-104
hiraganaChars.forEach((ch, i) => {
  charToId.set(ch, i + 1)
  idToChar.set(i + 1, ch)
})
// Katakana: IDs 105-208
katakanaChars.forEach((ch, i) => {
  charToId.set(ch, i + 105)
  idToChar.set(i + 105, ch)
})

// Extended kana
const extendedKana: [number, string][] = [
  [209, "っ"],
  [210, "ッ"],
  [211, "ー"],
  [212, "ティ"],
  [213, "ディ"],
  [214, "ファ"],
  [215, "フィ"],
  [216, "フェ"],
  [217, "フォ"],
  [218, "ウィ"],
  [219, "ウェ"],
  [220, "ウォ"],
  [221, "デュ"],
  [222, "シェ"],
  [223, "ジェ"],
  [224, "チェ"],
]
for (const [id, ch] of extendedKana) {
  charToId.set(ch, id)
  idToChar.set(id, ch)
}

// Kanji: parse from kanji-data files
const kanjiDir = path.join(__dirname, "../src/kanji-data")
for (let i = 1; i <= 22; i++) {
  const file = fs.readFileSync(path.join(kanjiDir, `freq-${String(i).padStart(2, "0")}.ts`), "utf8")
  const regex = /k\((\d+),\s*"([^"]+)"/g
  let match
  while ((match = regex.exec(file)) !== null) {
    const id = parseInt(match[1])
    const ch = match[2]
    charToId.set(ch, id)
    idToChar.set(id, ch)
  }
}

console.log(`Loaded ${charToId.size} character→ID mappings`)

// --- Decompose a written form into component IDs ---

// Extended katakana digraphs (must be checked before single chars)
const digraphs = [
  "ティ",
  "ディ",
  "ファ",
  "フィ",
  "フェ",
  "フォ",
  "ウィ",
  "ウェ",
  "ウォ",
  "デュ",
  "シェ",
  "ジェ",
  "チェ",
]

function decompose(written: string): number[] | null {
  const components: number[] = []
  let i = 0
  while (i < written.length) {
    let found = false
    // Check digraphs first (2-char katakana)
    if (i + 1 < written.length) {
      const di = written.substring(i, i + 2)
      if (digraphs.includes(di) && charToId.has(di)) {
        components.push(charToId.get(di)!)
        i += 2
        found = true
      }
    }
    if (!found) {
      // Check yōon (2-char hiragana/katakana)
      if (i + 1 < written.length) {
        const pair = written.substring(i, i + 2)
        if (charToId.has(pair)) {
          components.push(charToId.get(pair)!)
          i += 2
          found = true
        }
      }
    }
    if (!found) {
      const ch = written[i]
      // Handle 々 (noma/kurikaeshi) — repeat the previous character's ID
      if (ch === "々" && components.length > 0) {
        components.push(components[components.length - 1])
        i += 1
        found = true
      } else if (charToId.has(ch)) {
        components.push(charToId.get(ch)!)
        i += 1
      } else {
        return null // Unknown character
      }
    }
  }
  return components
}

// --- Parse freq files ---

interface WordEntry {
  id: number
  written: string
  meaning: string
  components: number[]
  frequency: number
  file: string
}

function parseFreqFile(filename: string): WordEntry[] {
  const content = fs.readFileSync(path.join(__dirname, `../src/word-data/${filename}`), "utf8")
  const entries: WordEntry[] = []
  // Match w(id, "written", "meaning", [...], freq)
  const regex = /w\((\d+),\s*"([^"]*)",\s*"([^"]*)",\s*\[([^\]]*)\],\s*(\d+)\)/g
  let match
  while ((match = regex.exec(content)) !== null) {
    entries.push({
      id: parseInt(match[1]),
      written: match[2],
      meaning: match[3],
      components: match[4]
        .split(",")
        .map((s) => parseInt(s.trim()))
        .filter((n) => !isNaN(n)),
      frequency: parseInt(match[5]),
      file: filename,
    })
  }
  return entries
}

const files = ["freq-01.ts", "freq-02.ts", "freq-03.ts", "freq-04.ts", "freq-05.ts"]
const allEntries: WordEntry[][] = files.map(parseFreqFile)

console.log(`Parsed entries per file: ${allEntries.map((e) => e.length).join(", ")}`)

// --- Analyze problems ---

// 1. Find duplicates
const seenWritten = new Map<string, number>() // written → file index
const duplicates: { written: string; fileIdx: number; origFileIdx: number }[] = []

for (let fi = 0; fi < allEntries.length; fi++) {
  for (const entry of allEntries[fi]) {
    if (seenWritten.has(entry.written)) {
      duplicates.push({
        written: entry.written,
        fileIdx: fi,
        origFileIdx: seenWritten.get(entry.written)!,
      })
    } else {
      seenWritten.set(entry.written, fi)
    }
  }
}
console.log(`Found ${duplicates.length} duplicate written forms`)

// 2. Check components
let componentErrors = 0
for (const entries of allEntries) {
  for (const entry of entries) {
    const reconstructed = entry.components.map((id) => idToChar.get(id) ?? "?").join("")
    if (reconstructed !== entry.written) {
      componentErrors++
    }
  }
}
console.log(`Found ${componentErrors} entries with incorrect components`)

// 3. Check ID continuity
const allIds = allEntries
  .flat()
  .map((e) => e.id)
  .sort((a, b) => a - b)
const expectedIds = Array.from({ length: 5000 }, (_, i) => 5000 + i)
const missingIds = expectedIds.filter((id) => !allIds.includes(id))
const extraIds = allIds.filter((id) => !expectedIds.includes(id))
console.log(
  `Missing IDs: ${missingIds.length} (${missingIds.slice(0, 10).join(", ")}${missingIds.length > 10 ? "..." : ""})`,
)
console.log(`Extra/duplicate IDs: ${extraIds.length}`)

// --- Fix problems ---

// For each file, remove duplicates and fix components
const PARTICLES = new Set([
  "は",
  "が",
  "を",
  "に",
  "で",
  "へ",
  "と",
  "も",
  "の",
  "か",
  "よ",
  "ね",
  "な",
  "わ",
  "や",
  "から",
  "まで",
  "より",
  "だけ",
  "しか",
  "ばかり",
  "ほど",
  "くらい",
  "など",
  "って",
])

// Remove duplicates (keep first occurrence)
const globalSeen = new Set<string>()
const cleanedEntries: WordEntry[][] = []

// Build set of jōyō kanji characters for non-jōyō detection
const joyoKanjiChars = new Set<string>()
for (const [ch, id] of charToId) {
  if (id >= 1000) joyoKanjiChars.add(ch)
}

// Rewrite 々 in written form: replace with the preceding character
function rewriteNoma(written: string): string {
  let result = ""
  for (let i = 0; i < written.length; i++) {
    if (written[i] === "々" && result.length > 0) {
      result += result[result.length - 1]
    } else {
      result += written[i]
    }
  }
  return result
}

// Kanji → kana rewrites for words with preferred kana spelling
const kanjiToKanaRewrites = new Map<string, string>([
  ["事", "こと"],
  ["物", "もの"],
  ["所", "ところ"],
  ["訳", "わけ"],
  ["為", "ため"],
  ["筈", "はず"],
  ["沢山", "たくさん"],
  ["出来る", "できる"],
  ["頂く", "いただく"],
  ["下さる", "くださる"],
  ["貰う", "もらう"],
  ["有る", "ある"],
  ["居る", "いる"],
  ["成る", "なる"],
  ["仕舞う", "しまう"],
  ["直ぐ", "すぐ"],
  ["未だ", "まだ"],
  ["余り", "あまり"],
  ["既に", "すでに"],
  ["又", "また"],
  ["丁度", "ちょうど"],
  ["一寸", "ちょっと"],
  ["兎に角", "とにかく"],
  ["何時", "いつ"],
  ["何故", "なぜ"],
  ["流石", "さすが"],
])

function rewriteKanjiToKana(written: string): string {
  return kanjiToKanaRewrites.get(written) ?? written
}

// Check if a written form contains non-jōyō kanji
const kanjiRange = /[\u4e00-\u9fff]/
function hasNonJoyoKanji(written: string): boolean {
  for (const ch of written) {
    if (kanjiRange.test(ch) && !joyoKanjiChars.has(ch)) return true
  }
  return false
}

for (let fi = 0; fi < allEntries.length; fi++) {
  const cleaned: WordEntry[] = []
  for (const entry of allEntries[fi]) {
    // Rewrite 々
    entry.written = rewriteNoma(entry.written)

    // Rewrite kanji → kana for words with preferred kana spelling
    entry.written = rewriteKanjiToKana(entry.written)

    // Skip words with non-jōyō kanji
    if (hasNonJoyoKanji(entry.written)) continue

    if (!globalSeen.has(entry.written) && !PARTICLES.has(entry.written)) {
      globalSeen.add(entry.written)
      // Fix components
      const correctComponents = decompose(entry.written)
      if (correctComponents && correctComponents.length > 0) {
        entry.components = correctComponents
        cleaned.push(entry)
      }
      // If decompose fails, skip the entry (will be replaced)
    }
  }
  cleanedEntries.push(cleaned)
}

console.log(`After dedup, entries per file: ${cleanedEntries.map((e) => e.length).join(", ")}`)
const totalClean = cleanedEntries.reduce((sum, e) => sum + e.length, 0)
console.log(`Total clean entries: ${totalClean}, need: 5000, gap: ${5000 - totalClean}`)

// --- Generate replacement words ---
// We need to fill the gaps with new unique words

const replacementWords: { written: string; meaning: string }[] = [
  // Common words that are likely missing
  { written: "けれど", meaning: "but, however" },
  { written: "やはり", meaning: "as expected, after all" },
  { written: "やっぱり", meaning: "as expected (casual)" },
  { written: "そろそろ", meaning: "soon, gradually" },
  { written: "ぼちぼち", meaning: "little by little" },
  { written: "ぶらぶら", meaning: "aimlessly, idly" },
  { written: "どきどき", meaning: "heart pounding" },
  { written: "わくわく", meaning: "excited, thrilled" },
  { written: "にこにこ", meaning: "smiling" },
  { written: "ぴかぴか", meaning: "sparkling, shiny" },
  { written: "ふわふわ", meaning: "fluffy, soft" },
  { written: "ぐるぐる", meaning: "going round and round" },
  { written: "ぺらぺら", meaning: "fluent, flimsy" },
  { written: "ぼろぼろ", meaning: "worn out, tattered" },
  { written: "がらがら", meaning: "rattling, empty" },
  { written: "ぎりぎり", meaning: "just barely, at the limit" },
  { written: "ごろごろ", meaning: "rumbling, lounging" },
  { written: "ざらざら", meaning: "rough, grainy" },
  { written: "じめじめ", meaning: "damp, humid" },
  { written: "すべすべ", meaning: "smooth, silky" },
  { written: "ぞくぞく", meaning: "shivering, thrilling" },
  { written: "ちくちく", meaning: "prickly, stinging" },
  { written: "のろのろ", meaning: "slowly, sluggishly" },
  { written: "はきはき", meaning: "clearly, briskly" },
  { written: "ひそひそ", meaning: "whispering" },
  { written: "ぶつぶつ", meaning: "muttering, grumbling" },
  { written: "へとへと", meaning: "exhausted" },
  { written: "めちゃくちゃ", meaning: "messy, absurd" },
  { written: "もぐもぐ", meaning: "munching" },
  { written: "よぼよぼ", meaning: "tottering, decrepit" },
  { written: "びしょびしょ", meaning: "soaking wet" },
  { written: "ぐちゃぐちゃ", meaning: "messy, muddled" },
  { written: "ばたばた", meaning: "flapping, bustling" },
  { written: "きらきら", meaning: "glittering, sparkling" },
  { written: "うろうろ", meaning: "wandering, loitering" },
  { written: "いらいら", meaning: "irritated, annoyed" },
  { written: "おどおど", meaning: "timid, nervous" },
  { written: "がたがた", meaning: "rattling, shaking" },
  { written: "くたくた", meaning: "exhausted, worn out" },
  { written: "げらげら", meaning: "laughing loudly" },
  { written: "こそこそ", meaning: "sneakily, stealthily" },
  { written: "さっぱり", meaning: "refreshing, not at all" },
  { written: "しっかり", meaning: "firmly, properly" },
  { written: "じっくり", meaning: "thoroughly, carefully" },
  { written: "すっかり", meaning: "completely, entirely" },
  { written: "せっかく", meaning: "with great effort, specially" },
  { written: "そっくり", meaning: "exactly alike" },
  { written: "たっぷり", meaning: "plenty, full" },
  { written: "つるつる", meaning: "slippery, smooth" },
  { written: "ねちねち", meaning: "persistently, stickily" },
  { written: "のんびり", meaning: "leisurely, carefree" },
  { written: "ぱっと", meaning: "suddenly, in a flash" },
  { written: "ひらひら", meaning: "fluttering" },
  { written: "ぷりぷり", meaning: "in a huff, plump" },
  { written: "ほっと", meaning: "with relief" },
  { written: "むかむか", meaning: "nauseous, angry" },
  { written: "めきめき", meaning: "rapidly improving" },
  { written: "りんりん", meaning: "tinkling, ringing" },
  { written: "わいわい", meaning: "noisily, boisterously" },
  { written: "ぎゅっと", meaning: "tightly, firmly" },
  { written: "こつこつ", meaning: "steadily, diligently" },
  { written: "ちらちら", meaning: "flickering, glancing" },
  { written: "てきぱき", meaning: "briskly, efficiently" },
  { written: "にやにや", meaning: "grinning, smirking" },
  { written: "ぬるぬる", meaning: "slimy, slippery" },
  { written: "ぱくぱく", meaning: "opening/closing mouth, eating" },
  { written: "ぴったり", meaning: "exactly, snugly" },
  { written: "ぽかぽか", meaning: "warm, toasty" },
  { written: "むずむず", meaning: "itchy, restless" },
  { written: "もやもや", meaning: "hazy, unclear feeling" },
  { written: "うとうと", meaning: "dozing off" },
  { written: "おろおろ", meaning: "flustered, bewildered" },
  { written: "かちかち", meaning: "hard, frozen, clicking" },
  { written: "きびきび", meaning: "brisk, lively" },
  { written: "ぐっすり", meaning: "sound asleep" },
  { written: "けちけち", meaning: "stingy, miserly" },
  { written: "さらさら", meaning: "smooth, flowing" },
  { written: "しとしと", meaning: "drizzling gently" },
  { written: "すくすく", meaning: "growing healthily" },
  { written: "そわそわ", meaning: "restless, fidgety" },
  { written: "たらたら", meaning: "dripping, dawdling" },
  { written: "ちょくちょく", meaning: "often, frequently" },
  { written: "てれてれ", meaning: "embarrassed, shy" },
  { written: "とぼとぼ", meaning: "trudging wearily" },
  { written: "なよなよ", meaning: "delicate, willowy" },
  { written: "ぬくぬく", meaning: "snug, cozy" },
  { written: "ねばねば", meaning: "sticky, gooey" },
  { written: "はらはら", meaning: "anxious, falling petals" },
  { written: "ぴちぴち", meaning: "lively, fresh" },
  { written: "ぷんぷん", meaning: "angry, smelly" },
  { written: "ぼんやり", meaning: "absentmindedly, vaguely" },
  { written: "まごまご", meaning: "confused, bewildered" },
  { written: "みすみす", meaning: "helplessly, before one's eyes" },
  { written: "むしむし", meaning: "muggy, humid" },
  { written: "めそめそ", meaning: "sniveling, whimpering" },
  { written: "もたもた", meaning: "slowly, clumsily" },
  { written: "よちよち", meaning: "toddling" },
  { written: "あたふた", meaning: "in a hurry, flustered" },
  { written: "いそいそ", meaning: "cheerfully, eagerly" },
  { written: "うじうじ", meaning: "indecisively, timidly" },
  { written: "えんえん", meaning: "crying, endlessly" },
  // More substantive words
  { written: "しつけ", meaning: "discipline, training" },
  { written: "つまみ", meaning: "snack, knob" },
  { written: "ぬいぐるみ", meaning: "stuffed animal" },
  { written: "はしご", meaning: "ladder" },
  { written: "ふすま", meaning: "sliding door" },
  { written: "まくら", meaning: "pillow" },
  { written: "やかん", meaning: "kettle" },
  { written: "よだれ", meaning: "drool, saliva" },
  { written: "わりばし", meaning: "disposable chopsticks" },
  { written: "あくび", meaning: "yawn" },
  { written: "いびき", meaning: "snoring" },
  { written: "うがい", meaning: "gargling" },
  { written: "おしゃべり", meaning: "chatting, talkative" },
  { written: "かかと", meaning: "heel" },
  { written: "くしゃみ", meaning: "sneeze" },
  { written: "けがわ", meaning: "fur, pelt" },
  { written: "さじ", meaning: "spoon" },
  { written: "すすめ", meaning: "recommendation" },
  { written: "たわし", meaning: "scrubbing brush" },
  { written: "ちりとり", meaning: "dustpan" },
  { written: "なべ", meaning: "pot, pan" },
  { written: "ぬか", meaning: "rice bran" },
  { written: "のこぎり", meaning: "saw (tool)" },
  { written: "ひじ", meaning: "elbow" },
  { written: "ふくらはぎ", meaning: "calf (of leg)" },
  { written: "へそ", meaning: "navel, belly button" },
  { written: "ほうき", meaning: "broom" },
  { written: "みぞ", meaning: "groove, ditch" },
  { written: "むしめがね", meaning: "magnifying glass" },
  { written: "めまい", meaning: "dizziness" },
  { written: "もみじ", meaning: "maple leaf" },
  { written: "ゆびわ", meaning: "ring (jewelry)" },
  { written: "よろい", meaning: "armor" },
  { written: "りんご", meaning: "apple" },
  { written: "わな", meaning: "trap, snare" },
  { written: "あせ", meaning: "sweat" },
  { written: "いちご", meaning: "strawberry" },
  { written: "うなぎ", meaning: "eel" },
  { written: "おかず", meaning: "side dish" },
  { written: "かぶ", meaning: "turnip" },
  { written: "きのこ", meaning: "mushroom" },
  { written: "くるみ", meaning: "walnut" },
  { written: "けむり", meaning: "smoke" },
  { written: "こおり", meaning: "ice" },
  { written: "さくら", meaning: "cherry blossom" },
  { written: "すずめ", meaning: "sparrow" },
  { written: "たこ", meaning: "octopus, kite" },
  { written: "つばめ", meaning: "swallow (bird)" },
  { written: "とかげ", meaning: "lizard" },
  { written: "なす", meaning: "eggplant" },
  { written: "にわとり", meaning: "chicken" },
  { written: "ぬま", meaning: "swamp, marsh" },
  { written: "ねずみ", meaning: "mouse, rat" },
  { written: "はと", meaning: "pigeon, dove" },
  { written: "ひまわり", meaning: "sunflower" },
  { written: "ふくろう", meaning: "owl" },
  { written: "へび", meaning: "snake" },
  { written: "ほたる", meaning: "firefly" },
  { written: "まつ", meaning: "pine tree" },
  { written: "みかん", meaning: "mandarin orange" },
  { written: "むぎ", meaning: "wheat, barley" },
  { written: "もも", meaning: "peach" },
  { written: "やぎ", meaning: "goat" },
  { written: "ゆり", meaning: "lily" },
  { written: "らくだ", meaning: "camel" },
  { written: "わし", meaning: "eagle" },
  { written: "あひる", meaning: "duck" },
  { written: "いのしし", meaning: "wild boar" },
  { written: "かめ", meaning: "turtle" },
  { written: "きつね", meaning: "fox" },
  { written: "くじら", meaning: "whale" },
  { written: "たぬき", meaning: "raccoon dog" },
  { written: "とんぼ", meaning: "dragonfly" },
  { written: "はち", meaning: "bee" },
  { written: "みみず", meaning: "earthworm" },
  { written: "もず", meaning: "shrike (bird)" },
  { written: "あさがお", meaning: "morning glory" },
  { written: "いちょう", meaning: "ginkgo" },
  { written: "うめ", meaning: "plum" },
  { written: "かえで", meaning: "maple" },
  { written: "きく", meaning: "chrysanthemum" },
  { written: "すぎ", meaning: "cedar" },
  { written: "たけ", meaning: "bamboo" },
  { written: "つつじ", meaning: "azalea" },
  { written: "なし", meaning: "pear" },
  { written: "ひのき", meaning: "cypress" },
  { written: "ふじ", meaning: "wisteria" },
  { written: "まつたけ", meaning: "matsutake mushroom" },
  { written: "やなぎ", meaning: "willow" },
  { written: "ゆず", meaning: "yuzu citrus" },
  { written: "すもう", meaning: "sumo wrestling" },
  { written: "おにぎり", meaning: "rice ball" },
  { written: "たたみ", meaning: "tatami mat" },
  { written: "ふろしき", meaning: "wrapping cloth" },
  { written: "ゆかた", meaning: "casual kimono" },
  { written: "おみやげ", meaning: "souvenir, gift" },
  { written: "ことわざ", meaning: "proverb" },
  { written: "からおけ", meaning: "karaoke" },
  { written: "わさび", meaning: "wasabi" },
  { written: "しょうゆ", meaning: "soy sauce" },
  { written: "みそ", meaning: "miso" },
  { written: "とうふ", meaning: "tofu" },
  { written: "うどん", meaning: "udon noodles" },
  { written: "そば", meaning: "buckwheat noodles" },
  { written: "てんぷら", meaning: "tempura" },
  { written: "すし", meaning: "sushi" },
  { written: "さしみ", meaning: "sashimi" },
  { written: "おでん", meaning: "oden (hot pot)" },
  { written: "にくじゃが", meaning: "meat and potato stew" },
  { written: "やきとり", meaning: "grilled chicken skewers" },
  { written: "おこのみやき", meaning: "savory pancake" },
  { written: "たこやき", meaning: "takoyaki, octopus balls" },
  { written: "まんじゅう", meaning: "steamed bun" },
  { written: "ようかん", meaning: "sweet bean jelly" },
  { written: "せんべい", meaning: "rice cracker" },
  { written: "だんご", meaning: "dumpling" },
  { written: "もち", meaning: "rice cake" },
  { written: "あんこ", meaning: "sweet bean paste" },
  { written: "きなこ", meaning: "soybean flour" },
  { written: "わがまま", meaning: "selfish, spoiled" },
  { written: "おとなしい", meaning: "quiet, gentle" },
  { written: "まじめ", meaning: "serious, earnest" },
  { written: "のんき", meaning: "carefree, easygoing" },
  { written: "ずるい", meaning: "sly, cunning" },
  { written: "けち", meaning: "stingy, miser" },
  { written: "おせっかい", meaning: "meddlesome" },
  { written: "あわてる", meaning: "to panic, to be flustered" },
  { written: "くやしい", meaning: "frustrating, mortifying" },
  { written: "なつかしい", meaning: "nostalgic" },
  { written: "すがすがしい", meaning: "refreshing, bracing" },
  { written: "いたずら", meaning: "mischief, prank" },
  { written: "おしゃれ", meaning: "fashionable, stylish" },
  { written: "だらしない", meaning: "slovenly, sloppy" },
  { written: "もったいない", meaning: "wasteful" },
  { written: "ありがたい", meaning: "grateful, thankful" },
  { written: "おめでたい", meaning: "auspicious, naive" },
  { written: "くだらない", meaning: "worthless, trivial" },
  { written: "みっともない", meaning: "shameful, unseemly" },
  { written: "ふざける", meaning: "to joke around" },
  { written: "なまける", meaning: "to be lazy" },
  { written: "はしゃぐ", meaning: "to frolic, be excited" },
  { written: "ためらう", meaning: "to hesitate" },
  { written: "とまどう", meaning: "to be bewildered" },
  { written: "あきらめる", meaning: "to give up" },
  { written: "くつろぐ", meaning: "to relax, feel at ease" },
  { written: "はげます", meaning: "to encourage" },
  { written: "ねだる", meaning: "to beg for, pester" },
  { written: "すねる", meaning: "to sulk, pout" },
  { written: "いじめる", meaning: "to bully, tease" },
  { written: "おだてる", meaning: "to flatter" },
  { written: "なぐさめる", meaning: "to console, comfort" },
  { written: "ほめる", meaning: "to praise" },
  { written: "しかる", meaning: "to scold" },
  { written: "あやまる", meaning: "to apologize" },
  { written: "ゆるす", meaning: "to forgive" },
  { written: "うらむ", meaning: "to resent, bear grudge" },
  { written: "ねたむ", meaning: "to envy, be jealous" },
  { written: "あこがれる", meaning: "to admire, long for" },
  { written: "なじむ", meaning: "to become familiar with" },
  { written: "はまる", meaning: "to get into, be addicted" },
  { written: "さぼる", meaning: "to skip, slack off" },
  { written: "ぐずぐず", meaning: "dawdling, procrastinating" },
  { written: "おっとり", meaning: "calm, gentle" },
  { written: "がっかり", meaning: "disappointed" },
  { written: "きっかり", meaning: "exactly, precisely" },
  { written: "くっきり", meaning: "clearly, distinctly" },
  { written: "げっそり", meaning: "haggard, emaciated" },
  { written: "こっそり", meaning: "secretly, stealthily" },
  { written: "すっきり", meaning: "refreshed, neat" },
  { written: "そっと", meaning: "softly, quietly" },
  { written: "どっと", meaning: "suddenly, all at once" },
  { written: "にっこり", meaning: "smiling sweetly" },
  { written: "ほんのり", meaning: "faintly, slightly" },
  { written: "ぐったり", meaning: "exhausted, limp" },
  { written: "しんみり", meaning: "quietly, solemnly" },
  { written: "のっそり", meaning: "slowly, sluggishly" },
  { written: "むっつり", meaning: "sullen, morose" },
  { written: "あっさり", meaning: "simply, lightly" },
  { written: "うっかり", meaning: "carelessly, accidentally" },
  { written: "うっすら", meaning: "faintly, dimly" },
  { written: "からっと", meaning: "crisp, dry" },
  { written: "ぐんぐん", meaning: "rapidly, steadily" },
  { written: "しっとり", meaning: "moist, calm" },
  { written: "じわじわ", meaning: "gradually, slowly" },
  { written: "ずばり", meaning: "exactly, directly" },
  { written: "そよそよ", meaning: "gently blowing" },
  { written: "とことん", meaning: "thoroughly" },
  { written: "なみなみ", meaning: "brimful" },
  { written: "ひんやり", meaning: "cool, chilly" },
  { written: "ほかほか", meaning: "warm, steamy" },
  { written: "みるみる", meaning: "visibly, rapidly" },
  { written: "めっきり", meaning: "remarkably, noticeably" },
  { written: "ゆったり", meaning: "spacious, relaxed" },
  { written: "わんわん", meaning: "bow-wow, crying loudly" },
  // Extra backup words
  { written: "ごちそう", meaning: "feast, treat" },
  { written: "おつまみ", meaning: "snack (with drinks)" },
  { written: "たいやき", meaning: "fish-shaped cake" },
  { written: "かきごおり", meaning: "shaved ice" },
  { written: "ところてん", meaning: "jelly noodles" },
  { written: "きんつば", meaning: "sweet bean cake" },
  { written: "おはぎ", meaning: "sweet rice ball" },
  { written: "あんみつ", meaning: "fruit and bean dessert" },
  { written: "いなり", meaning: "inari sushi" },
  { written: "かまぼこ", meaning: "fish cake" },
  { written: "ちくわ", meaning: "tube-shaped fish cake" },
  { written: "なると", meaning: "naruto fish cake" },
  { written: "つくだに", meaning: "preserved food in soy sauce" },
  { written: "ぬかづけ", meaning: "rice bran pickles" },
  { written: "はんぺん", meaning: "fish paste cake" },
  { written: "ふりかけ", meaning: "rice seasoning" },
  { written: "つけもの", meaning: "pickled vegetables" },
  // --- Batch 2: ~1150 additional words to fill the gap ---
  // Verbs (hiragana)
  { written: "あがる", meaning: "to rise, go up" },
  { written: "あける", meaning: "to open" },
  { written: "あそぶ", meaning: "to play" },
  { written: "あたる", meaning: "to hit, strike" },
  { written: "あつめる", meaning: "to collect" },
  { written: "あびる", meaning: "to bathe in" },
  { written: "あまる", meaning: "to remain, be left over" },
  { written: "あらう", meaning: "to wash" },
  { written: "あるく", meaning: "to walk" },
  { written: "いきる", meaning: "to live" },
  { written: "いける", meaning: "to arrange (flowers)" },
  { written: "いただく", meaning: "to receive (humble)" },
  { written: "いためる", meaning: "to stir-fry" },
  { written: "いれる", meaning: "to put in, insert" },
  { written: "うえる", meaning: "to plant" },
  { written: "うかぶ", meaning: "to float" },
  { written: "うける", meaning: "to receive" },
  { written: "うごく", meaning: "to move" },
  { written: "うたう", meaning: "to sing" },
  { written: "うつす", meaning: "to copy, transfer" },
  { written: "うつる", meaning: "to move, shift" },
  { written: "うまれる", meaning: "to be born" },
  { written: "うる", meaning: "to sell" },
  { written: "えらぶ", meaning: "to choose" },
  { written: "おいかける", meaning: "to chase" },
  { written: "おきる", meaning: "to wake up" },
  { written: "おくる", meaning: "to send" },
  { written: "おくれる", meaning: "to be late" },
  { written: "おこす", meaning: "to cause, wake up" },
  { written: "おこなう", meaning: "to carry out" },
  { written: "おこる", meaning: "to get angry" },
  { written: "おしえる", meaning: "to teach" },
  { written: "おす", meaning: "to push" },
  { written: "おちる", meaning: "to fall" },
  { written: "おどる", meaning: "to dance" },
  { written: "おぼえる", meaning: "to remember" },
  { written: "およぐ", meaning: "to swim" },
  { written: "おりる", meaning: "to get off, descend" },
  { written: "おわる", meaning: "to end" },
  { written: "かう", meaning: "to buy" },
  { written: "かえす", meaning: "to return (something)" },
  { written: "かえる", meaning: "to return home" },
  { written: "かかる", meaning: "to take (time/cost)" },
  { written: "かく", meaning: "to write, draw" },
  { written: "かくす", meaning: "to hide (something)" },
  { written: "かける", meaning: "to run, hang" },
  { written: "かさなる", meaning: "to pile up" },
  { written: "かす", meaning: "to lend" },
  { written: "かたづける", meaning: "to tidy up" },
  { written: "かつ", meaning: "to win" },
  { written: "かなう", meaning: "to come true" },
  { written: "かむ", meaning: "to bite, chew" },
  { written: "かよう", meaning: "to commute" },
  { written: "かわく", meaning: "to dry" },
  { written: "かわる", meaning: "to change" },
  { written: "きえる", meaning: "to disappear" },
  { written: "きく", meaning: "to listen, ask" },
  { written: "きこえる", meaning: "to be audible" },
  { written: "きずく", meaning: "to notice" },
  { written: "きまる", meaning: "to be decided" },
  { written: "きめる", meaning: "to decide" },
  { written: "きる", meaning: "to cut" },
  { written: "くばる", meaning: "to distribute" },
  { written: "くむ", meaning: "to draw (water)" },
  { written: "くらす", meaning: "to live, reside" },
  { written: "くらべる", meaning: "to compare" },
  { written: "くれる", meaning: "to give (to me)" },
  { written: "くわえる", meaning: "to add" },
  { written: "こえる", meaning: "to exceed, cross" },
  { written: "こぐ", meaning: "to row, pedal" },
  { written: "こす", meaning: "to cross over" },
  { written: "こたえる", meaning: "to answer" },
  { written: "ことなる", meaning: "to differ" },
  { written: "このむ", meaning: "to prefer, like" },
  { written: "こぼす", meaning: "to spill" },
  { written: "こまる", meaning: "to be troubled" },
  { written: "こむ", meaning: "to be crowded" },
  { written: "ころぶ", meaning: "to fall over" },
  { written: "さがす", meaning: "to search for" },
  { written: "さがる", meaning: "to go down" },
  { written: "さく", meaning: "to bloom" },
  { written: "さける", meaning: "to avoid" },
  { written: "ささえる", meaning: "to support" },
  { written: "さす", meaning: "to point, insert" },
  { written: "さそう", meaning: "to invite" },
  { written: "さわぐ", meaning: "to make noise" },
  { written: "さわる", meaning: "to touch" },
  { written: "しずむ", meaning: "to sink" },
  { written: "したがう", meaning: "to follow, obey" },
  { written: "しぬ", meaning: "to die" },
  { written: "しばる", meaning: "to tie, bind" },
  { written: "しまう", meaning: "to put away, finish" },
  { written: "しめす", meaning: "to show, indicate" },
  { written: "しめる", meaning: "to close, fasten" },
  { written: "しらべる", meaning: "to investigate" },
  { written: "すう", meaning: "to inhale, smoke" },
  { written: "すぎる", meaning: "to pass, exceed" },
  { written: "すくう", meaning: "to rescue" },
  { written: "すすむ", meaning: "to advance" },
  { written: "すてる", meaning: "to throw away" },
  { written: "すべる", meaning: "to slide, slip" },
  { written: "すむ", meaning: "to live, reside" },
  { written: "する", meaning: "to do" },
  { written: "すわる", meaning: "to sit down" },
  { written: "そだつ", meaning: "to grow up" },
  { written: "そだてる", meaning: "to raise, nurture" },
  { written: "そなえる", meaning: "to prepare" },
  { written: "そめる", meaning: "to dye" },
  { written: "たおれる", meaning: "to fall down, collapse" },
  { written: "たがやす", meaning: "to cultivate" },
  { written: "たしかめる", meaning: "to confirm" },
  { written: "たすける", meaning: "to help, rescue" },
  { written: "たずねる", meaning: "to visit, ask" },
  { written: "たたく", meaning: "to hit, knock" },
  { written: "たつ", meaning: "to stand" },
  { written: "たてる", meaning: "to build, stand up" },
  { written: "たのしむ", meaning: "to enjoy" },
  { written: "たのむ", meaning: "to request" },
  { written: "たべる", meaning: "to eat" },
  { written: "たまる", meaning: "to accumulate" },
  { written: "たりる", meaning: "to be enough" },
  { written: "ちかづく", meaning: "to approach" },
  { written: "ちがう", meaning: "to differ" },
  { written: "ちぢむ", meaning: "to shrink" },
  { written: "つかう", meaning: "to use" },
  { written: "つかまえる", meaning: "to catch" },
  { written: "つかむ", meaning: "to grab" },
  { written: "つかれる", meaning: "to get tired" },
  { written: "つく", meaning: "to arrive" },
  { written: "つくる", meaning: "to make" },
  { written: "つたえる", meaning: "to convey" },
  { written: "つづく", meaning: "to continue" },
  { written: "つづける", meaning: "to continue (trans.)" },
  { written: "つつむ", meaning: "to wrap" },
  { written: "つなぐ", meaning: "to connect" },
  { written: "つぶす", meaning: "to crush" },
  { written: "つむ", meaning: "to pile up" },
  { written: "つれる", meaning: "to take along" },
  { written: "できる", meaning: "to be able to" },
  { written: "てらす", meaning: "to illuminate" },
  { written: "とく", meaning: "to solve" },
  { written: "とける", meaning: "to melt, dissolve" },
  { written: "とどく", meaning: "to reach, arrive" },
  { written: "とどける", meaning: "to deliver" },
  { written: "とぶ", meaning: "to fly, jump" },
  { written: "とまる", meaning: "to stop" },
  { written: "とめる", meaning: "to stop (trans.)" },
  { written: "とる", meaning: "to take" },
  { written: "なおす", meaning: "to fix, cure" },
  { written: "なおる", meaning: "to be fixed, healed" },
  { written: "ながす", meaning: "to pour, drain" },
  { written: "ながれる", meaning: "to flow" },
  { written: "なく", meaning: "to cry" },
  { written: "なくす", meaning: "to lose" },
  { written: "なげる", meaning: "to throw" },
  { written: "ならう", meaning: "to learn" },
  { written: "ならぶ", meaning: "to line up" },
  { written: "ならべる", meaning: "to arrange" },
  { written: "なる", meaning: "to become" },
  { written: "なれる", meaning: "to get used to" },
  { written: "にげる", meaning: "to escape" },
  { written: "にる", meaning: "to resemble" },
  { written: "ぬく", meaning: "to pull out" },
  { written: "ぬぐ", meaning: "to take off (clothes)" },
  { written: "ぬる", meaning: "to paint, apply" },
  { written: "ぬれる", meaning: "to get wet" },
  { written: "ねがう", meaning: "to wish for" },
  { written: "ねむる", meaning: "to sleep" },
  { written: "ねる", meaning: "to go to bed" },
  { written: "のこす", meaning: "to leave behind" },
  { written: "のこる", meaning: "to remain" },
  { written: "のせる", meaning: "to place on" },
  { written: "のぞく", meaning: "to peek" },
  { written: "のぞむ", meaning: "to hope, overlook" },
  { written: "のばす", meaning: "to extend" },
  { written: "のびる", meaning: "to grow, stretch" },
  { written: "のぼる", meaning: "to climb" },
  { written: "のむ", meaning: "to drink" },
  { written: "のる", meaning: "to ride" },
  { written: "はいる", meaning: "to enter" },
  { written: "はかる", meaning: "to measure" },
  { written: "はく", meaning: "to sweep, wear (pants)" },
  { written: "はこぶ", meaning: "to carry" },
  { written: "はじまる", meaning: "to begin (intrans.)" },
  { written: "はじめる", meaning: "to begin (trans.)" },
  { written: "はしる", meaning: "to run" },
  { written: "はずす", meaning: "to remove, miss" },
  { written: "はたらく", meaning: "to work" },
  { written: "はなす", meaning: "to speak" },
  { written: "はなれる", meaning: "to separate" },
  { written: "はらう", meaning: "to pay" },
  { written: "はる", meaning: "to stick, stretch" },
  { written: "ひえる", meaning: "to get cold" },
  { written: "ひかる", meaning: "to shine" },
  { written: "ひく", meaning: "to pull, draw" },
  { written: "ひらく", meaning: "to open" },
  { written: "ひろう", meaning: "to pick up" },
  { written: "ひろがる", meaning: "to spread" },
  { written: "ふえる", meaning: "to increase" },
  { written: "ふく", meaning: "to blow, wipe" },
  { written: "ふせぐ", meaning: "to prevent" },
  { written: "ふむ", meaning: "to step on" },
  { written: "ふる", meaning: "to fall (rain)" },
  { written: "ふるう", meaning: "to wield, exert" },
  { written: "ふれる", meaning: "to touch" },
  { written: "へらす", meaning: "to reduce" },
  { written: "へる", meaning: "to decrease" },
  { written: "ほす", meaning: "to dry (in sun)" },
  { written: "ほる", meaning: "to dig" },
  { written: "まいる", meaning: "to go (humble)" },
  { written: "まがる", meaning: "to turn, bend" },
  { written: "まく", meaning: "to roll, sow" },
  { written: "まける", meaning: "to lose" },
  { written: "まざる", meaning: "to be mixed" },
  { written: "まぜる", meaning: "to mix" },
  { written: "まちがう", meaning: "to make a mistake" },
  { written: "まつ", meaning: "to wait" },
  { written: "まとめる", meaning: "to put together" },
  { written: "まなぶ", meaning: "to learn" },
  { written: "まもる", meaning: "to protect" },
  { written: "まよう", meaning: "to be lost, waver" },
  { written: "まわす", meaning: "to turn (trans.)" },
  { written: "まわる", meaning: "to go around" },
  { written: "みえる", meaning: "to be visible" },
  { written: "みがく", meaning: "to polish" },
  { written: "みつかる", meaning: "to be found" },
  { written: "みつける", meaning: "to find" },
  { written: "みとめる", meaning: "to recognize" },
  { written: "みる", meaning: "to see" },
  { written: "むかう", meaning: "to face, head for" },
  { written: "むく", meaning: "to peel, face" },
  { written: "むすぶ", meaning: "to tie, connect" },
  { written: "めざす", meaning: "to aim for" },
  { written: "もうける", meaning: "to earn, profit" },
  { written: "もえる", meaning: "to burn" },
  { written: "もつ", meaning: "to hold, have" },
  { written: "もどす", meaning: "to return (trans.)" },
  { written: "もどる", meaning: "to return" },
  { written: "もらう", meaning: "to receive" },
  { written: "もる", meaning: "to leak" },
  { written: "やく", meaning: "to burn, grill" },
  { written: "やくそく", meaning: "promise" },
  { written: "やける", meaning: "to be grilled" },
  { written: "やすむ", meaning: "to rest" },
  { written: "やぶる", meaning: "to tear, break" },
  { written: "やめる", meaning: "to quit, stop" },
  { written: "やる", meaning: "to do, give" },
  { written: "ゆく", meaning: "to go" },
  { written: "ゆずる", meaning: "to yield" },
  { written: "ゆでる", meaning: "to boil (food)" },
  { written: "ゆるす", meaning: "to permit" },
  { written: "ゆれる", meaning: "to sway, shake" },
  { written: "よぶ", meaning: "to call" },
  { written: "よむ", meaning: "to read" },
  { written: "よる", meaning: "to approach" },
  { written: "よろこぶ", meaning: "to be glad" },
  { written: "わかす", meaning: "to boil (water)" },
  { written: "わかる", meaning: "to understand" },
  { written: "わかれる", meaning: "to part, separate" },
  { written: "わく", meaning: "to boil, gush" },
  { written: "わすれる", meaning: "to forget" },
  { written: "わたす", meaning: "to hand over" },
  { written: "わたる", meaning: "to cross" },
  { written: "わらう", meaning: "to laugh" },
  { written: "われる", meaning: "to break (intrans.)" },
  // Adjectives
  { written: "あかるい", meaning: "bright" },
  { written: "あさい", meaning: "shallow" },
  { written: "あたたかい", meaning: "warm" },
  { written: "あたらしい", meaning: "new" },
  { written: "あつい", meaning: "hot, thick" },
  { written: "あぶない", meaning: "dangerous" },
  { written: "あまい", meaning: "sweet" },
  { written: "いそがしい", meaning: "busy" },
  { written: "いたい", meaning: "painful" },
  { written: "うすい", meaning: "thin, light" },
  { written: "うつくしい", meaning: "beautiful" },
  { written: "うまい", meaning: "skillful, delicious" },
  { written: "うるさい", meaning: "noisy" },
  { written: "うれしい", meaning: "happy" },
  { written: "えらい", meaning: "great, admirable" },
  { written: "おいしい", meaning: "delicious" },
  { written: "おおい", meaning: "many" },
  { written: "おおきい", meaning: "big" },
  { written: "おかしい", meaning: "funny, strange" },
  { written: "おそい", meaning: "slow, late" },
  { written: "おそろしい", meaning: "frightening" },
  { written: "おもい", meaning: "heavy" },
  { written: "おもしろい", meaning: "interesting" },
  { written: "かたい", meaning: "hard, stiff" },
  { written: "かなしい", meaning: "sad" },
  { written: "かゆい", meaning: "itchy" },
  { written: "かるい", meaning: "light (weight)" },
  { written: "かわいい", meaning: "cute" },
  { written: "きたない", meaning: "dirty" },
  { written: "きつい", meaning: "tight, hard" },
  { written: "きびしい", meaning: "strict, severe" },
  { written: "くさい", meaning: "smelly" },
  { written: "くやしい", meaning: "vexing" },
  { written: "くるしい", meaning: "painful, hard" },
  { written: "くわしい", meaning: "detailed" },
  { written: "こい", meaning: "thick, strong" },
  { written: "こわい", meaning: "scary" },
  { written: "さびしい", meaning: "lonely" },
  { written: "さむい", meaning: "cold" },
  { written: "しぶい", meaning: "astringent, cool" },
  { written: "するどい", meaning: "sharp" },
  { written: "せまい", meaning: "narrow" },
  { written: "たかい", meaning: "tall, expensive" },
  { written: "たのしい", meaning: "fun" },
  { written: "ちいさい", meaning: "small" },
  { written: "ちかい", meaning: "near" },
  { written: "つまらない", meaning: "boring" },
  { written: "つめたい", meaning: "cold (touch)" },
  { written: "つよい", meaning: "strong" },
  { written: "とおい", meaning: "far" },
  { written: "ながい", meaning: "long" },
  { written: "にがい", meaning: "bitter" },
  { written: "にくい", meaning: "hateful, hard to" },
  { written: "ぬるい", meaning: "lukewarm" },
  { written: "ねむい", meaning: "sleepy" },
  { written: "はげしい", meaning: "intense" },
  { written: "はずかしい", meaning: "embarrassing" },
  { written: "はやい", meaning: "fast, early" },
  { written: "ひくい", meaning: "low" },
  { written: "ひどい", meaning: "terrible" },
  { written: "ひろい", meaning: "wide, spacious" },
  { written: "ふかい", meaning: "deep" },
  { written: "ふとい", meaning: "thick" },
  { written: "ふるい", meaning: "old" },
  { written: "ほしい", meaning: "wanted, desired" },
  { written: "ほそい", meaning: "thin, slender" },
  { written: "まずい", meaning: "bad tasting" },
  { written: "まるい", meaning: "round" },
  { written: "みじかい", meaning: "short" },
  { written: "むずかしい", meaning: "difficult" },
  { written: "めずらしい", meaning: "rare, unusual" },
  { written: "やさしい", meaning: "gentle, easy" },
  { written: "やすい", meaning: "cheap" },
  { written: "やわらかい", meaning: "soft" },
  { written: "よい", meaning: "good" },
  { written: "よわい", meaning: "weak" },
  { written: "わかい", meaning: "young" },
  { written: "わるい", meaning: "bad" },
  // Nouns - body parts
  { written: "あたま", meaning: "head" },
  { written: "かお", meaning: "face" },
  { written: "め", meaning: "eye" },
  { written: "みみ", meaning: "ear" },
  { written: "はな", meaning: "nose" },
  { written: "くち", meaning: "mouth" },
  { written: "は", meaning: "tooth" },
  { written: "くび", meaning: "neck" },
  { written: "かた", meaning: "shoulder" },
  { written: "うで", meaning: "arm" },
  { written: "て", meaning: "hand" },
  { written: "ゆび", meaning: "finger" },
  { written: "つめ", meaning: "nail, claw" },
  { written: "むね", meaning: "chest" },
  { written: "せなか", meaning: "back" },
  { written: "おなか", meaning: "stomach" },
  { written: "こし", meaning: "waist, hip" },
  { written: "あし", meaning: "leg, foot" },
  { written: "ひざ", meaning: "knee" },
  { written: "かかと", meaning: "heel (foot)" },
  // Nouns - nature
  { written: "そら", meaning: "sky" },
  { written: "くも", meaning: "cloud" },
  { written: "あめ", meaning: "rain" },
  { written: "ゆき", meaning: "snow" },
  { written: "かぜ", meaning: "wind" },
  { written: "たいよう", meaning: "sun" },
  { written: "つき", meaning: "moon" },
  { written: "ほし", meaning: "star" },
  { written: "うみ", meaning: "sea" },
  { written: "かわ", meaning: "river" },
  { written: "やま", meaning: "mountain" },
  { written: "もり", meaning: "forest" },
  { written: "はやし", meaning: "woods" },
  { written: "いけ", meaning: "pond" },
  { written: "たき", meaning: "waterfall" },
  { written: "しま", meaning: "island" },
  { written: "いわ", meaning: "rock" },
  { written: "すな", meaning: "sand" },
  { written: "つち", meaning: "soil, earth" },
  { written: "みず", meaning: "water" },
  { written: "ひ", meaning: "fire" },
  { written: "にじ", meaning: "rainbow" },
  { written: "かみなり", meaning: "thunder" },
  { written: "あらし", meaning: "storm" },
  { written: "きり", meaning: "fog" },
  { written: "つゆ", meaning: "rainy season, dew" },
  { written: "しも", meaning: "frost" },
  // Nouns - food & drink
  { written: "ごはん", meaning: "rice, meal" },
  { written: "パン", meaning: "bread" },
  { written: "にく", meaning: "meat" },
  { written: "さかな", meaning: "fish" },
  { written: "やさい", meaning: "vegetable" },
  { written: "くだもの", meaning: "fruit" },
  { written: "たまご", meaning: "egg" },
  { written: "しお", meaning: "salt" },
  { written: "さとう", meaning: "sugar" },
  { written: "す", meaning: "vinegar" },
  { written: "あぶら", meaning: "oil" },
  { written: "みりん", meaning: "mirin" },
  { written: "だし", meaning: "stock, broth" },
  { written: "おちゃ", meaning: "tea" },
  { written: "みずたま", meaning: "polka dots" },
  { written: "こめ", meaning: "rice (uncooked)" },
  { written: "むぎちゃ", meaning: "barley tea" },
  { written: "にんじん", meaning: "carrot" },
  { written: "だいこん", meaning: "radish" },
  { written: "じゃがいも", meaning: "potato" },
  { written: "たまねぎ", meaning: "onion" },
  { written: "きゅうり", meaning: "cucumber" },
  { written: "トマト", meaning: "tomato" },
  { written: "キャベツ", meaning: "cabbage" },
  { written: "レタス", meaning: "lettuce" },
  { written: "ピーマン", meaning: "green pepper" },
  { written: "なすび", meaning: "eggplant (colloquial)" },
  { written: "ほうれんそう", meaning: "spinach" },
  { written: "ねぎ", meaning: "green onion" },
  { written: "しょうが", meaning: "ginger" },
  { written: "にんにく", meaning: "garlic" },
  { written: "バナナ", meaning: "banana" },
  { written: "メロン", meaning: "melon" },
  { written: "スイカ", meaning: "watermelon" },
  { written: "ぶどう", meaning: "grapes" },
  { written: "かき", meaning: "persimmon" },
  { written: "さくらんぼ", meaning: "cherry" },
  { written: "すいか", meaning: "watermelon (hiragana)" },
  // Nouns - house & daily life
  { written: "いえ", meaning: "house" },
  { written: "へや", meaning: "room" },
  { written: "まど", meaning: "window" },
  { written: "ドア", meaning: "door" },
  { written: "かべ", meaning: "wall" },
  { written: "ゆか", meaning: "floor" },
  { written: "やね", meaning: "roof" },
  { written: "にわ", meaning: "garden" },
  { written: "かいだん", meaning: "stairs" },
  { written: "おふろ", meaning: "bath" },
  { written: "トイレ", meaning: "toilet" },
  { written: "だいどころ", meaning: "kitchen" },
  { written: "テーブル", meaning: "table" },
  { written: "いす", meaning: "chair" },
  { written: "ベッド", meaning: "bed" },
  { written: "ソファー", meaning: "sofa" },
  { written: "たんす", meaning: "chest of drawers" },
  { written: "かがみ", meaning: "mirror" },
  { written: "でんき", meaning: "electricity, light" },
  { written: "スイッチ", meaning: "switch" },
  { written: "カーテン", meaning: "curtain" },
  { written: "じゅうたん", meaning: "carpet" },
  // Nouns - clothing
  { written: "ふく", meaning: "clothes" },
  { written: "シャツ", meaning: "shirt" },
  { written: "ズボン", meaning: "trousers" },
  { written: "スカート", meaning: "skirt" },
  { written: "くつ", meaning: "shoes" },
  { written: "くつした", meaning: "socks" },
  { written: "ぼうし", meaning: "hat" },
  { written: "コート", meaning: "coat" },
  { written: "セーター", meaning: "sweater" },
  { written: "ネクタイ", meaning: "necktie" },
  { written: "かさ", meaning: "umbrella" },
  { written: "かばん", meaning: "bag" },
  { written: "さいふ", meaning: "wallet" },
  { written: "めがね", meaning: "glasses" },
  { written: "とけい", meaning: "clock, watch" },
  { written: "ゆびわ", meaning: "ring (finger)" },
  { written: "ハンカチ", meaning: "handkerchief" },
  // Nouns - people & family
  { written: "ひと", meaning: "person" },
  { written: "おとこ", meaning: "man" },
  { written: "おんな", meaning: "woman" },
  { written: "こども", meaning: "child" },
  { written: "おとな", meaning: "adult" },
  { written: "あかちゃん", meaning: "baby" },
  { written: "おじいさん", meaning: "grandfather" },
  { written: "おばあさん", meaning: "grandmother" },
  { written: "おとうさん", meaning: "father" },
  { written: "おかあさん", meaning: "mother" },
  { written: "おにいさん", meaning: "older brother" },
  { written: "おねえさん", meaning: "older sister" },
  { written: "おとうと", meaning: "younger brother" },
  { written: "いもうと", meaning: "younger sister" },
  { written: "ともだち", meaning: "friend" },
  { written: "なかま", meaning: "companion" },
  { written: "せんせい", meaning: "teacher" },
  // Nouns - time
  { written: "きょう", meaning: "today" },
  { written: "あした", meaning: "tomorrow" },
  { written: "きのう", meaning: "yesterday" },
  { written: "あさ", meaning: "morning" },
  { written: "ひる", meaning: "noon, daytime" },
  { written: "よる", meaning: "night" },
  { written: "ゆうがた", meaning: "evening" },
  { written: "いま", meaning: "now" },
  { written: "むかし", meaning: "long ago" },
  { written: "みらい", meaning: "future" },
  // Nouns - places
  { written: "まち", meaning: "town" },
  { written: "むら", meaning: "village" },
  { written: "みち", meaning: "road, path" },
  { written: "はし", meaning: "bridge" },
  { written: "えき", meaning: "station" },
  { written: "みせ", meaning: "shop" },
  { written: "びょういん", meaning: "hospital" },
  { written: "がっこう", meaning: "school" },
  { written: "としょかん", meaning: "library" },
  { written: "こうえん", meaning: "park" },
  { written: "じんじゃ", meaning: "shrine" },
  { written: "おてら", meaning: "temple" },
  // Nouns - things
  { written: "もの", meaning: "thing" },
  { written: "ほん", meaning: "book" },
  { written: "かみ", meaning: "paper" },
  { written: "ペン", meaning: "pen" },
  { written: "えんぴつ", meaning: "pencil" },
  { written: "はさみ", meaning: "scissors" },
  { written: "のり", meaning: "glue" },
  { written: "テープ", meaning: "tape" },
  { written: "ひも", meaning: "string, cord" },
  { written: "はこ", meaning: "box" },
  { written: "ふくろ", meaning: "bag, sack" },
  { written: "びん", meaning: "bottle" },
  { written: "さら", meaning: "plate" },
  { written: "コップ", meaning: "glass, cup" },
  { written: "スプーン", meaning: "spoon" },
  { written: "フォーク", meaning: "fork" },
  { written: "ナイフ", meaning: "knife" },
  { written: "おはし", meaning: "chopsticks" },
  { written: "タオル", meaning: "towel" },
  { written: "せっけん", meaning: "soap" },
  // Nouns - animals (additional)
  { written: "いぬ", meaning: "dog" },
  { written: "ねこ", meaning: "cat" },
  { written: "うさぎ", meaning: "rabbit" },
  { written: "うま", meaning: "horse" },
  { written: "うし", meaning: "cow" },
  { written: "ぶた", meaning: "pig" },
  { written: "ひつじ", meaning: "sheep" },
  { written: "さる", meaning: "monkey" },
  { written: "とり", meaning: "bird" },
  { written: "むし", meaning: "insect" },
  { written: "ちょう", meaning: "butterfly" },
  { written: "あり", meaning: "ant" },
  { written: "せみ", meaning: "cicada" },
  { written: "かえる", meaning: "frog" },
  { written: "へび", meaning: "snake (animal)" },
  { written: "くま", meaning: "bear" },
  { written: "しか", meaning: "deer" },
  // Nouns - abstract / emotions
  { written: "きもち", meaning: "feeling" },
  { written: "こころ", meaning: "heart, mind" },
  { written: "いのち", meaning: "life" },
  { written: "ちから", meaning: "power, strength" },
  { written: "ゆめ", meaning: "dream" },
  { written: "のぞみ", meaning: "hope, wish" },
  { written: "よろこび", meaning: "joy" },
  { written: "かなしみ", meaning: "sadness" },
  { written: "いかり", meaning: "anger" },
  { written: "おどろき", meaning: "surprise" },
  { written: "さみしさ", meaning: "loneliness" },
  { written: "しあわせ", meaning: "happiness" },
  { written: "くるしみ", meaning: "suffering" },
  { written: "やさしさ", meaning: "kindness" },
  { written: "つよさ", meaning: "strength" },
  { written: "よわさ", meaning: "weakness" },
  // Nouns - weather & seasons
  { written: "はる", meaning: "spring" },
  { written: "なつ", meaning: "summer" },
  { written: "あき", meaning: "autumn" },
  { written: "ふゆ", meaning: "winter" },
  { written: "てんき", meaning: "weather" },
  { written: "くもり", meaning: "cloudy" },
  { written: "はれ", meaning: "clear weather" },
  { written: "たいふう", meaning: "typhoon" },
  { written: "じしん", meaning: "earthquake" },
  // Nouns - transportation
  { written: "くるま", meaning: "car" },
  { written: "じてんしゃ", meaning: "bicycle" },
  { written: "バス", meaning: "bus" },
  { written: "タクシー", meaning: "taxi" },
  { written: "でんしゃ", meaning: "train" },
  { written: "ひこうき", meaning: "airplane" },
  { written: "ふね", meaning: "ship, boat" },
  // Adverbs & misc
  { written: "とても", meaning: "very" },
  { written: "すこし", meaning: "a little" },
  { written: "たくさん", meaning: "many, a lot" },
  { written: "ぜんぶ", meaning: "all" },
  { written: "いつも", meaning: "always" },
  { written: "ときどき", meaning: "sometimes" },
  { written: "たまに", meaning: "occasionally" },
  { written: "ぜんぜん", meaning: "not at all" },
  { written: "まだ", meaning: "still, not yet" },
  { written: "もう", meaning: "already" },
  { written: "きっと", meaning: "surely" },
  { written: "たぶん", meaning: "probably" },
  { written: "もちろん", meaning: "of course" },
  { written: "やっと", meaning: "finally, at last" },
  { written: "ちょうど", meaning: "exactly, just" },
  { written: "だいたい", meaning: "roughly" },
  { written: "ほとんど", meaning: "almost, hardly" },
  { written: "まったく", meaning: "completely" },
  { written: "なかなか", meaning: "quite, considerably" },
  { written: "ますます", meaning: "increasingly" },
  { written: "しだいに", meaning: "gradually" },
  { written: "ようやく", meaning: "at last" },
  { written: "さすが", meaning: "as expected of" },
  { written: "なるほど", meaning: "I see, indeed" },
  { written: "つまり", meaning: "in other words" },
  { written: "たとえば", meaning: "for example" },
  { written: "しかし", meaning: "however" },
  { written: "けれども", meaning: "however" },
  { written: "それでも", meaning: "even so" },
  { written: "ところで", meaning: "by the way" },
  { written: "ところが", meaning: "however" },
  { written: "むしろ", meaning: "rather" },
  { written: "ただし", meaning: "however, provided" },
  { written: "ちなみに", meaning: "by the way" },
  // More nouns - tools & objects
  { written: "かぎ", meaning: "key" },
  { written: "でんわ", meaning: "telephone" },
  { written: "てがみ", meaning: "letter" },
  { written: "きって", meaning: "stamp" },
  { written: "はがき", meaning: "postcard" },
  { written: "しんぶん", meaning: "newspaper" },
  { written: "ざっし", meaning: "magazine" },
  { written: "じしょ", meaning: "dictionary" },
  { written: "ちず", meaning: "map" },
  { written: "しゃしん", meaning: "photograph" },
  { written: "え", meaning: "picture" },
  { written: "おんがく", meaning: "music" },
  { written: "うた", meaning: "song" },
  { written: "おどり", meaning: "dance" },
  { written: "まつり", meaning: "festival" },
  { written: "おもちゃ", meaning: "toy" },
  { written: "にんぎょう", meaning: "doll" },
  { written: "ゲーム", meaning: "game" },
  // More verbs
  { written: "あそばせる", meaning: "to let play" },
  { written: "いじる", meaning: "to fiddle with" },
  { written: "うなずく", meaning: "to nod" },
  { written: "えがく", meaning: "to draw, depict" },
  { written: "おがむ", meaning: "to pray, worship" },
  { written: "かかげる", meaning: "to raise, hold up" },
  { written: "きざむ", meaning: "to chop, carve" },
  { written: "くずす", meaning: "to demolish" },
  { written: "けずる", meaning: "to shave, scrape" },
  { written: "こする", meaning: "to rub, scrub" },
  { written: "さまたげる", meaning: "to hinder" },
  { written: "しぼる", meaning: "to squeeze" },
  { written: "すくう", meaning: "to scoop up" },
  { written: "せめる", meaning: "to attack" },
  { written: "たたかう", meaning: "to fight" },
  { written: "ちかう", meaning: "to vow, swear" },
  { written: "つまずく", meaning: "to stumble" },
  { written: "てなづける", meaning: "to tame" },
  { written: "とがる", meaning: "to be pointed" },
  { written: "なでる", meaning: "to stroke, pet" },
  { written: "にぎる", meaning: "to grip" },
  { written: "ぬすむ", meaning: "to steal" },
  { written: "ねじる", meaning: "to twist" },
  { written: "のぞく", meaning: "to remove, peek" },
  { written: "はずむ", meaning: "to bounce" },
  { written: "ひたす", meaning: "to soak" },
  { written: "ふくらむ", meaning: "to swell" },
  { written: "へこむ", meaning: "to dent, be depressed" },
  { written: "ほどく", meaning: "to untie" },
  { written: "まねく", meaning: "to beckon" },
  { written: "みがく", meaning: "to polish, brush" },
  { written: "むしる", meaning: "to pluck" },
  { written: "めくる", meaning: "to turn (page)" },
  { written: "もぐる", meaning: "to dive under" },
  { written: "やぶく", meaning: "to tear" },
  { written: "ゆする", meaning: "to shake" },
  { written: "よける", meaning: "to dodge" },
  { written: "わめく", meaning: "to shout, yell" },
  // More nouns - occupations & roles
  { written: "いしゃ", meaning: "doctor" },
  { written: "かんごし", meaning: "nurse" },
  { written: "けいさつ", meaning: "police" },
  { written: "しょうぼうし", meaning: "firefighter" },
  { written: "うんてんしゅ", meaning: "driver" },
  { written: "りょうし", meaning: "fisherman" },
  { written: "のうか", meaning: "farmer" },
  { written: "パイロット", meaning: "pilot" },
  { written: "コック", meaning: "cook, chef" },
  // More nouns - school & study
  { written: "べんきょう", meaning: "study" },
  { written: "しゅくだい", meaning: "homework" },
  { written: "しけん", meaning: "exam" },
  { written: "じゅぎょう", meaning: "class, lesson" },
  { written: "きょうしつ", meaning: "classroom" },
  { written: "たいいく", meaning: "physical education" },
  { written: "さんすう", meaning: "arithmetic" },
  { written: "れきし", meaning: "history" },
  { written: "かがく", meaning: "science" },
  { written: "おんがくしつ", meaning: "music room" },
  { written: "としょしつ", meaning: "library room" },
  { written: "うんどうじょう", meaning: "playground" },
  // More nouns - colors
  { written: "いろ", meaning: "color" },
  { written: "あか", meaning: "red" },
  { written: "あお", meaning: "blue" },
  { written: "きいろ", meaning: "yellow" },
  { written: "みどり", meaning: "green" },
  { written: "しろ", meaning: "white" },
  { written: "くろ", meaning: "black" },
  { written: "むらさき", meaning: "purple" },
  { written: "ちゃいろ", meaning: "brown" },
  { written: "はいいろ", meaning: "gray" },
  { written: "オレンジ", meaning: "orange" },
  { written: "ピンク", meaning: "pink" },
  // Nouns - directions & positions
  { written: "うえ", meaning: "above" },
  { written: "した", meaning: "below" },
  { written: "みぎ", meaning: "right" },
  { written: "ひだり", meaning: "left" },
  { written: "まえ", meaning: "front" },
  { written: "うしろ", meaning: "behind" },
  { written: "なか", meaning: "inside" },
  { written: "そと", meaning: "outside" },
  { written: "よこ", meaning: "beside" },
  { written: "ちかく", meaning: "nearby" },
  { written: "むこう", meaning: "over there" },
  { written: "あいだ", meaning: "between" },
  // Nouns - numbers / counting
  { written: "かず", meaning: "number" },
  { written: "はんぶん", meaning: "half" },
  { written: "ぜんたい", meaning: "whole, entire" },
  // More onomatopoeia
  { written: "ぱちぱち", meaning: "clapping, crackling" },
  { written: "ざわざわ", meaning: "rustling, noisy" },
  { written: "どんどん", meaning: "rapidly, drumming" },
  { written: "ぱらぱら", meaning: "sprinkling, flipping" },
  { written: "ごくごく", meaning: "gulping" },
  { written: "もぞもぞ", meaning: "squirming" },
  { written: "ぞろぞろ", meaning: "in a line, one after another" },
  { written: "がやがや", meaning: "noisily (crowd)" },
  { written: "ぺこぺこ", meaning: "hungry, bowing" },
  { written: "どたばた", meaning: "noisy, slapstick" },
  { written: "ぶるぶる", meaning: "trembling, shivering" },
  { written: "がんがん", meaning: "pounding, clanging" },
  { written: "きょろきょろ", meaning: "looking around" },
  { written: "うきうき", meaning: "cheerful, buoyant" },
  { written: "めらめら", meaning: "blazing" },
  { written: "ぐずる", meaning: "to whine, fuss" },
  { written: "たじたじ", meaning: "overwhelmed" },
  { written: "びくびく", meaning: "nervously, timidly" },
  { written: "へろへろ", meaning: "wobbly, exhausted" },
  { written: "よぼよぼ", meaning: "tottering (elderly)" },
  // More daily life nouns
  { written: "あいさつ", meaning: "greeting" },
  { written: "おじぎ", meaning: "bow (greeting)" },
  { written: "おれい", meaning: "thanks, gratitude" },
  { written: "おわび", meaning: "apology" },
  { written: "おねがい", meaning: "request, please" },
  { written: "やくそくごと", meaning: "appointment" },
  { written: "しごと", meaning: "work, job" },
  { written: "きゅうけい", meaning: "break, rest" },
  { written: "さんぽ", meaning: "walk, stroll" },
  { written: "たび", meaning: "trip, journey" },
  { written: "りょこう", meaning: "travel" },
  { written: "かいもの", meaning: "shopping" },
  { written: "そうじ", meaning: "cleaning" },
  { written: "せんたく", meaning: "laundry" },
  { written: "りょうり", meaning: "cooking" },
  { written: "しゅうり", meaning: "repair" },
  { written: "ひっこし", meaning: "moving (house)" },
  { written: "けっこん", meaning: "marriage" },
  { written: "おいわい", meaning: "celebration" },
  { written: "おそうしき", meaning: "funeral" },
  // Nouns - materials
  { written: "き", meaning: "tree, wood" },
  { written: "かね", meaning: "metal, money" },
  { written: "ぬの", meaning: "cloth" },
  { written: "いと", meaning: "thread" },
  { written: "かわ", meaning: "leather, skin" },
  { written: "ガラス", meaning: "glass" },
  { written: "ゴム", meaning: "rubber" },
  { written: "プラスチック", meaning: "plastic" },
  // Nouns - actions (verbal nouns)
  { written: "うんどう", meaning: "exercise" },
  { written: "れんしゅう", meaning: "practice" },
  { written: "じゅんび", meaning: "preparation" },
  { written: "けいかく", meaning: "plan" },
  { written: "せつめい", meaning: "explanation" },
  { written: "しょうかい", meaning: "introduction" },
  { written: "そうだん", meaning: "consultation" },
  { written: "けんか", meaning: "quarrel, fight" },
  { written: "あそび", meaning: "play, amusement" },
  { written: "やすみ", meaning: "rest, holiday" },
  // More adjectives (na-adjectives in hiragana)
  { written: "しずか", meaning: "quiet" },
  { written: "にぎやか", meaning: "lively, bustling" },
  { written: "きれい", meaning: "beautiful, clean" },
  { written: "げんき", meaning: "energetic, healthy" },
  { written: "じょうぶ", meaning: "sturdy, healthy" },
  { written: "じゅうぶん", meaning: "sufficient" },
  { written: "ていねい", meaning: "polite, careful" },
  { written: "ふべん", meaning: "inconvenient" },
  { written: "べんり", meaning: "convenient" },
  { written: "ひつよう", meaning: "necessary" },
  { written: "だいじ", meaning: "important" },
  { written: "むだ", meaning: "wasteful, useless" },
  { written: "ふしぎ", meaning: "mysterious" },
  { written: "すてき", meaning: "wonderful" },
  { written: "りっぱ", meaning: "splendid" },
  { written: "へん", meaning: "strange" },
  { written: "いや", meaning: "unpleasant" },
  { written: "らく", meaning: "comfortable, easy" },
  // More nouns - body/health
  { written: "びょうき", meaning: "illness" },
  { written: "けが", meaning: "injury" },
  { written: "ねつ", meaning: "fever" },
  { written: "せき", meaning: "cough" },
  { written: "くすり", meaning: "medicine" },
  { written: "ちゅうしゃ", meaning: "injection" },
  { written: "てあて", meaning: "treatment" },
  { written: "たいおん", meaning: "body temperature" },
  // More nouns - misc
  { written: "なまえ", meaning: "name" },
  { written: "ことば", meaning: "word, language" },
  { written: "こえ", meaning: "voice" },
  { written: "おと", meaning: "sound" },
  { written: "におい", meaning: "smell" },
  { written: "あじ", meaning: "taste, flavor" },
  { written: "かたち", meaning: "shape" },
  { written: "おおきさ", meaning: "size" },
  { written: "ながさ", meaning: "length" },
  { written: "おもさ", meaning: "weight" },
  { written: "たかさ", meaning: "height" },
  { written: "ふかさ", meaning: "depth" },
  { written: "ひろさ", meaning: "width, area" },
  { written: "はやさ", meaning: "speed" },
  { written: "あたい", meaning: "value" },
  { written: "ねだん", meaning: "price" },
  // Greetings & expressions
  { written: "おはよう", meaning: "good morning" },
  { written: "こんにちは", meaning: "hello" },
  { written: "こんばんは", meaning: "good evening" },
  { written: "さようなら", meaning: "goodbye" },
  { written: "ありがとう", meaning: "thank you" },
  { written: "すみません", meaning: "excuse me" },
  { written: "ごめんなさい", meaning: "I'm sorry" },
  { written: "いただきます", meaning: "bon appetit" },
  { written: "ごちそうさま", meaning: "thanks for the meal" },
  { written: "おやすみなさい", meaning: "good night" },
  // More verbs (te-form friendly)
  { written: "あげる", meaning: "to give, raise" },
  { written: "いう", meaning: "to say" },
  { written: "おく", meaning: "to put, place" },
  { written: "おもう", meaning: "to think" },
  { written: "かりる", meaning: "to borrow" },
  { written: "きる", meaning: "to wear" },
  { written: "くる", meaning: "to come" },
  { written: "しる", meaning: "to know" },
  { written: "だす", meaning: "to take out, send" },
  { written: "つくす", meaning: "to exhaust, devote" },
  { written: "なく", meaning: "to cry, weep" },
  { written: "はる", meaning: "to paste, stretch" },
  { written: "まげる", meaning: "to bend" },
  { written: "よせる", meaning: "to gather, approach" },
  // Nature - more
  { written: "たね", meaning: "seed" },
  { written: "はっぱ", meaning: "leaf" },
  { written: "えだ", meaning: "branch" },
  { written: "ね", meaning: "root" },
  { written: "くさ", meaning: "grass" },
  { written: "はな", meaning: "flower" },
  { written: "つぼみ", meaning: "bud" },
  { written: "みき", meaning: "trunk (tree)" },
  // Sports & hobbies
  { written: "サッカー", meaning: "soccer" },
  { written: "やきゅう", meaning: "baseball" },
  { written: "テニス", meaning: "tennis" },
  { written: "バスケ", meaning: "basketball" },
  { written: "すいえい", meaning: "swimming" },
  { written: "じゅうどう", meaning: "judo" },
  { written: "けんどう", meaning: "kendo" },
  { written: "からて", meaning: "karate" },
  { written: "つり", meaning: "fishing" },
  { written: "キャンプ", meaning: "camping" },
  { written: "ハイキング", meaning: "hiking" },
  { written: "スキー", meaning: "skiing" },
  { written: "ダンス", meaning: "dance" },
  // Technology
  { written: "パソコン", meaning: "personal computer" },
  { written: "スマホ", meaning: "smartphone" },
  { written: "インターネット", meaning: "internet" },
  { written: "メール", meaning: "email" },
  { written: "データ", meaning: "data" },
  { written: "アプリ", meaning: "app" },
  { written: "プリンター", meaning: "printer" },
  { written: "マウス", meaning: "mouse (computer)" },
  { written: "カメラ", meaning: "camera" },
  { written: "テレビ", meaning: "television" },
  { written: "ラジオ", meaning: "radio" },
  { written: "リモコン", meaning: "remote control" },
  // More nouns
  { written: "せかい", meaning: "world" },
  { written: "くに", meaning: "country" },
  { written: "しぜん", meaning: "nature" },
  { written: "かんきょう", meaning: "environment" },
  { written: "ぶんか", meaning: "culture" },
  { written: "でんとう", meaning: "tradition" },
  { written: "しゅうかん", meaning: "custom, habit" },
  { written: "ルール", meaning: "rule" },
  { written: "マナー", meaning: "manners" },
  { written: "ニュース", meaning: "news" },
  { written: "じけん", meaning: "incident" },
  { written: "じこ", meaning: "accident" },
  { written: "もんだい", meaning: "problem" },
  { written: "こたえ", meaning: "answer" },
  { written: "りゆう", meaning: "reason" },
  { written: "いみ", meaning: "meaning" },
  { written: "もくてき", meaning: "purpose" },
  { written: "けっか", meaning: "result" },
  { written: "えいきょう", meaning: "influence" },
  { written: "かんけい", meaning: "relationship" },
  { written: "きかい", meaning: "opportunity" },
  { written: "へんか", meaning: "change" },
  { written: "せいちょう", meaning: "growth" },
  { written: "はったつ", meaning: "development" },
  { written: "しんぽ", meaning: "progress" },
  // Katakana loanwords
  { written: "エネルギー", meaning: "energy" },
  { written: "ボランティア", meaning: "volunteer" },
  { written: "サービス", meaning: "service" },
  { written: "チャンス", meaning: "chance" },
  { written: "トラブル", meaning: "trouble" },
  { written: "ストレス", meaning: "stress" },
  { written: "バランス", meaning: "balance" },
  { written: "レベル", meaning: "level" },
  { written: "タイプ", meaning: "type" },
  { written: "パターン", meaning: "pattern" },
  { written: "ポイント", meaning: "point" },
  { written: "テーマ", meaning: "theme" },
  { written: "イメージ", meaning: "image" },
  { written: "アイデア", meaning: "idea" },
  { written: "メッセージ", meaning: "message" },
  { written: "プレゼント", meaning: "present, gift" },
  { written: "アドバイス", meaning: "advice" },
  { written: "コミュニケーション", meaning: "communication" },
  { written: "トレーニング", meaning: "training" },
  { written: "リラックス", meaning: "relax" },
  { written: "シンプル", meaning: "simple" },
  { written: "ユニーク", meaning: "unique" },
  { written: "スタイル", meaning: "style" },
  { written: "デザイン", meaning: "design" },
  { written: "ファッション", meaning: "fashion" },
  { written: "レストラン", meaning: "restaurant" },
  { written: "ホテル", meaning: "hotel" },
  { written: "エレベーター", meaning: "elevator" },
  { written: "エスカレーター", meaning: "escalator" },
  { written: "トンネル", meaning: "tunnel" },
  { written: "ビル", meaning: "building" },
  { written: "マンション", meaning: "apartment" },
  { written: "アパート", meaning: "apartment (small)" },
  { written: "ガソリン", meaning: "gasoline" },
  { written: "タイヤ", meaning: "tire" },
  { written: "エンジン", meaning: "engine" },
  { written: "ブレーキ", meaning: "brake" },
  { written: "ハンドル", meaning: "handle, steering wheel" },
  { written: "シートベルト", meaning: "seatbelt" },
  { written: "ミルク", meaning: "milk" },
  { written: "ジュース", meaning: "juice" },
  { written: "ビール", meaning: "beer" },
  { written: "ワイン", meaning: "wine" },
  { written: "コーヒー", meaning: "coffee" },
  { written: "ココア", meaning: "cocoa" },
  { written: "サラダ", meaning: "salad" },
  { written: "スープ", meaning: "soup" },
  { written: "ステーキ", meaning: "steak" },
  { written: "ハンバーグ", meaning: "hamburger steak" },
  { written: "サンドイッチ", meaning: "sandwich" },
  { written: "ケーキ", meaning: "cake" },
  { written: "チョコレート", meaning: "chocolate" },
  { written: "アイスクリーム", meaning: "ice cream" },
  { written: "クッキー", meaning: "cookie" },
  { written: "ドーナツ", meaning: "donut" },
  { written: "プリン", meaning: "pudding" },
  { written: "ヨーグルト", meaning: "yogurt" },
  { written: "チーズ", meaning: "cheese" },
  { written: "バター", meaning: "butter" },
  { written: "ジャム", meaning: "jam" },
  { written: "ソース", meaning: "sauce" },
  { written: "ケチャップ", meaning: "ketchup" },
  { written: "マヨネーズ", meaning: "mayonnaise" },
  // More miscellaneous
  { written: "おまもり", meaning: "charm, amulet" },
  { written: "おみくじ", meaning: "fortune slip" },
  { written: "えま", meaning: "prayer plaque" },
  { written: "せんす", meaning: "folding fan" },
  { written: "うちわ", meaning: "flat fan" },
  { written: "ちょうちん", meaning: "paper lantern" },
  { written: "のれん", meaning: "shop curtain" },
  { written: "はなび", meaning: "fireworks" },
  { written: "おりがみ", meaning: "origami" },
  { written: "いけばな", meaning: "flower arrangement" },
  { written: "しょどう", meaning: "calligraphy" },
  { written: "ちゃどう", meaning: "tea ceremony" },
  { written: "きもの", meaning: "kimono" },
  { written: "おび", meaning: "sash, belt" },
  { written: "げた", meaning: "wooden clogs" },
  { written: "たび", meaning: "split-toed socks" },
  { written: "はかま", meaning: "traditional pants" },
  { written: "はおり", meaning: "short coat" },
  { written: "ふろしき", meaning: "wrapping cloth (furoshiki)" },
  { written: "てぬぐい", meaning: "hand towel" },
  { written: "ざぶとん", meaning: "floor cushion" },
  { written: "こたつ", meaning: "heated table" },
  { written: "ふとん", meaning: "futon" },
  { written: "しきぶとん", meaning: "mattress futon" },
  { written: "かけぶとん", meaning: "comforter" },
  // Nouns - feelings & states
  { written: "つかれ", meaning: "fatigue" },
  { written: "ねむけ", meaning: "sleepiness" },
  { written: "いたみ", meaning: "pain" },
  { written: "かゆみ", meaning: "itchiness" },
  { written: "のどかわき", meaning: "thirst" },
  { written: "おなかすき", meaning: "hunger" },
  { written: "たいくつ", meaning: "boredom" },
  { written: "さびしさ", meaning: "loneliness" },
  { written: "なやみ", meaning: "worry, trouble" },
  { written: "おそれ", meaning: "fear" },
  { written: "あせり", meaning: "impatience" },
  // More useful words
  { written: "にもつ", meaning: "luggage" },
  { written: "きっぷ", meaning: "ticket" },
  { written: "おつり", meaning: "change (money)" },
  { written: "レシート", meaning: "receipt" },
  { written: "クレジットカード", meaning: "credit card" },
  { written: "パスポート", meaning: "passport" },
  { written: "ビザ", meaning: "visa" },
  { written: "スーツケース", meaning: "suitcase" },
  { written: "ガイドブック", meaning: "guidebook" },
  // Verbs - more
  { written: "いのる", meaning: "to pray" },
  { written: "うたがう", meaning: "to doubt" },
  { written: "おそれる", meaning: "to fear" },
  { written: "かがむ", meaning: "to crouch" },
  { written: "くぐる", meaning: "to pass through" },
  { written: "さまよう", meaning: "to wander" },
  { written: "しのぶ", meaning: "to endure" },
  { written: "つぐなう", meaning: "to atone" },
  { written: "ねぎらう", meaning: "to thank for efforts" },
  { written: "はげむ", meaning: "to strive" },
  { written: "ひるむ", meaning: "to flinch" },
  { written: "ふるまう", meaning: "to behave" },
  { written: "ほこる", meaning: "to be proud" },
  { written: "まなぶ", meaning: "to study" },
  { written: "むくいる", meaning: "to reward, repay" },
  { written: "もてなす", meaning: "to entertain" },
  { written: "やしなう", meaning: "to nurture" },
  { written: "ゆだねる", meaning: "to entrust" },
  { written: "わびる", meaning: "to apologize" },
  { written: "かざる", meaning: "to decorate" },
  { written: "くだく", meaning: "to crush" },
  { written: "さとる", meaning: "to realize" },
  { written: "すかす", meaning: "to coax" },
  { written: "たずさえる", meaning: "to carry, be involved" },
  { written: "ちぎる", meaning: "to tear off" },
  { written: "つのる", meaning: "to recruit, intensify" },
  { written: "とがめる", meaning: "to blame" },
  { written: "なだめる", meaning: "to soothe" },
  { written: "にじむ", meaning: "to blur, seep" },
  { written: "はなつ", meaning: "to release" },
  { written: "ひきうける", meaning: "to undertake" },
  { written: "ふるえる", meaning: "to tremble" },
  { written: "ほほえむ", meaning: "to smile" },
  { written: "みちびく", meaning: "to guide" },
  { written: "めざめる", meaning: "to awaken" },
  { written: "もうしこむ", meaning: "to apply" },
  { written: "よりそう", meaning: "to snuggle" },
  // --- Batch 3: additional words to fill remaining gap ---
  { written: "あかとんぼ", meaning: "red dragonfly" },
  { written: "あきかぜ", meaning: "autumn breeze" },
  { written: "あさひ", meaning: "morning sun" },
  { written: "あまぐも", meaning: "rain cloud" },
  { written: "いろは", meaning: "basics, ABCs" },
  { written: "うわさ", meaning: "rumor" },
  { written: "うわぎ", meaning: "jacket, coat" },
  { written: "えのぐ", meaning: "paint (art)" },
  { written: "おかし", meaning: "sweets, snacks" },
  { written: "おしいれ", meaning: "closet" },
  { written: "おちば", meaning: "fallen leaves" },
  { written: "おてつだい", meaning: "helping, helper" },
  { written: "おとし", meaning: "dropping" },
  { written: "おひるね", meaning: "afternoon nap" },
  { written: "おぼん", meaning: "tray, Obon festival" },
  { written: "おまわりさん", meaning: "police officer" },
  { written: "おもいで", meaning: "memories" },
  { written: "おやつ", meaning: "snack" },
  { written: "かいがら", meaning: "seashell" },
  { written: "かけっこ", meaning: "running race" },
  { written: "かたづけ", meaning: "tidying up" },
  { written: "かみなり", meaning: "lightning, thunder" },
  { written: "からだ", meaning: "body" },
  { written: "きせつ", meaning: "season" },
  { written: "きたかぜ", meaning: "north wind" },
  { written: "きっさてん", meaning: "coffee shop" },
  { written: "くちびる", meaning: "lips" },
  { written: "くちぶえ", meaning: "whistling" },
  { written: "くつべら", meaning: "shoehorn" },
  { written: "くもり", meaning: "cloudiness" },
  { written: "けしごむ", meaning: "eraser" },
  { written: "けむし", meaning: "caterpillar" },
  { written: "こうもり", meaning: "bat (animal)" },
  { written: "こがらし", meaning: "cold wintry wind" },
  { written: "こぶし", meaning: "fist" },
  { written: "ごみ", meaning: "garbage, trash" },
  { written: "ごみばこ", meaning: "trash can" },
  { written: "さかみち", meaning: "slope, hill road" },
  { written: "さざなみ", meaning: "ripple" },
  { written: "さとやま", meaning: "village mountain" },
  { written: "しっぽ", meaning: "tail" },
  { written: "しゃっくり", meaning: "hiccup" },
  { written: "じゃんけん", meaning: "rock paper scissors" },
  { written: "すいとう", meaning: "water bottle" },
  { written: "すずしい", meaning: "cool (weather)" },
  { written: "すなば", meaning: "sandbox" },
  { written: "そうがんきょう", meaning: "binoculars" },
  { written: "そうめん", meaning: "thin noodles" },
  { written: "そでぐち", meaning: "cuff, sleeve opening" },
  { written: "たいこ", meaning: "drum" },
  { written: "たきび", meaning: "bonfire" },
  { written: "たまねぎ", meaning: "onion (vegetable)" },
  { written: "だるま", meaning: "daruma doll" },
  { written: "ちゃわん", meaning: "rice bowl" },
  { written: "つきみ", meaning: "moon viewing" },
  { written: "つむじかぜ", meaning: "whirlwind" },
  { written: "てぶくろ", meaning: "gloves" },
  { written: "でんちゅう", meaning: "utility pole" },
  { written: "とうげ", meaning: "mountain pass" },
  { written: "とびばこ", meaning: "vaulting box" },
  { written: "なわとび", meaning: "jump rope" },
  { written: "にしかぜ", meaning: "west wind" },
  { written: "ぬいもの", meaning: "sewing" },
  { written: "ねこじた", meaning: "cat tongue (heat sensitive)" },
  { written: "のきした", meaning: "under the eaves" },
  { written: "はしおき", meaning: "chopstick rest" },
  { written: "はしわたし", meaning: "mediation" },
  { written: "はちみつ", meaning: "honey" },
  { written: "はなたば", meaning: "bouquet" },
  { written: "はなみ", meaning: "cherry blossom viewing" },
  { written: "ばんごはん", meaning: "dinner" },
  { written: "ひがし", meaning: "east" },
  { written: "ひとりごと", meaning: "talking to oneself" },
  { written: "ひなまつり", meaning: "Doll Festival" },
  { written: "ひるごはん", meaning: "lunch" },
  { written: "ふうりん", meaning: "wind chime" },
  { written: "ふきん", meaning: "dish cloth" },
  { written: "ふくびき", meaning: "lottery, raffle" },
  { written: "ふだん", meaning: "usually, normally" },
  { written: "ふで", meaning: "brush (writing)" },
  { written: "ふでばこ", meaning: "pencil case" },
  { written: "ほおずき", meaning: "ground cherry" },
  { written: "ほこり", meaning: "dust" },
  { written: "まきば", meaning: "pasture" },
  { written: "まくらもと", meaning: "bedside" },
  { written: "まちあわせ", meaning: "meeting up" },
  { written: "まないた", meaning: "cutting board" },
  { written: "みずあび", meaning: "splashing in water" },
  { written: "みずうみ", meaning: "lake" },
  { written: "みずたまり", meaning: "puddle" },
  { written: "みずぎ", meaning: "swimsuit" },
  { written: "みそしる", meaning: "miso soup" },
  { written: "むかしばなし", meaning: "old tale" },
  { written: "むぎわらぼうし", meaning: "straw hat" },
  { written: "めがねばし", meaning: "spectacles bridge" },
  { written: "もぐらたたき", meaning: "whack-a-mole" },
  { written: "もみじがり", meaning: "autumn leaf viewing" },
  { written: "やきいも", meaning: "roasted sweet potato" },
  { written: "やきにく", meaning: "grilled meat" },
  { written: "やじるし", meaning: "arrow mark" },
  { written: "やまびこ", meaning: "echo" },
  { written: "ゆうやけ", meaning: "sunset glow" },
  { written: "ゆきだるま", meaning: "snowman" },
  { written: "ゆびきり", meaning: "pinky promise" },
  { written: "よこみち", meaning: "side road" },
  { written: "わたあめ", meaning: "cotton candy" },
  { written: "わたぼうし", meaning: "dandelion puff" },
  { written: "あいことば", meaning: "password, watchword" },
  { written: "あおぞら", meaning: "blue sky" },
  { written: "あしあと", meaning: "footprint" },
  { written: "あしもと", meaning: "at one's feet" },
  { written: "あまがさ", meaning: "umbrella (rain)" },
  { written: "あまざけ", meaning: "sweet sake" },
  { written: "いしだたみ", meaning: "stone pavement" },
  { written: "いちにち", meaning: "one day" },
  { written: "うぐいす", meaning: "bush warbler" },
  { written: "うすぐもり", meaning: "thin overcast" },
  { written: "うちわけ", meaning: "breakdown, details" },
  { written: "えんがわ", meaning: "veranda" },
  { written: "おきもの", meaning: "ornament" },
  { written: "おくりもの", meaning: "gift" },
  { written: "おちつき", meaning: "calmness" },
  { written: "おひさま", meaning: "sun (familiar)" },
  { written: "おべんとう", meaning: "lunch box" },
  { written: "おめん", meaning: "mask" },
  { written: "おりもの", meaning: "textile" },
  { written: "かかし", meaning: "scarecrow" },
  { written: "かたぐるま", meaning: "piggyback ride" },
  { written: "かわら", meaning: "roof tile" },
  { written: "きつつき", meaning: "woodpecker" },
  { written: "くさもち", meaning: "grass mochi" },
  { written: "こいのぼり", meaning: "carp streamer" },
  { written: "こもれび", meaning: "sunlight through leaves" },
  { written: "さかさま", meaning: "upside down" },
  { written: "さくらもち", meaning: "cherry blossom mochi" },
  { written: "しおかぜ", meaning: "sea breeze" },
  { written: "しおひがり", meaning: "shell gathering" },
  { written: "しめなわ", meaning: "sacred rope" },
  { written: "すずかぜ", meaning: "cool breeze" },
  { written: "そとあそび", meaning: "outdoor play" },
  { written: "たけうま", meaning: "stilts" },
  { written: "たなばた", meaning: "Star Festival" },
  { written: "ちゃつみ", meaning: "tea picking" },
  { written: "てまり", meaning: "hand ball" },
  { written: "てんとうむし", meaning: "ladybug" },
  { written: "なつまつり", meaning: "summer festival" },
  { written: "なつやすみ", meaning: "summer vacation" },
  { written: "にちようび", meaning: "Sunday" },
  { written: "はこにわ", meaning: "miniature garden" },
  { written: "はつゆき", meaning: "first snow" },
  { written: "はつゆめ", meaning: "first dream of year" },
  { written: "はなびら", meaning: "petal" },
  { written: "はるかぜ", meaning: "spring breeze" },
  { written: "ひがんばな", meaning: "spider lily" },
  { written: "ひだまり", meaning: "sunny spot" },
  { written: "ひまわり", meaning: "sunflower (bloom)" },
  { written: "ふうせん", meaning: "balloon" },
  { written: "ふくわらい", meaning: "lucky laugh game" },
  { written: "ふゆやすみ", meaning: "winter vacation" },
  { written: "ほしぞら", meaning: "starry sky" },
  { written: "まめまき", meaning: "bean throwing" },
  { written: "みちくさ", meaning: "dawdling on the way" },
  { written: "みなと", meaning: "port, harbor" },
  { written: "ものがたり", meaning: "story, tale" },
  { written: "ゆうだち", meaning: "evening shower" },
  { written: "ゆきげしき", meaning: "snowy scenery" },
  { written: "よそおい", meaning: "appearance, attire" },
  { written: "わらべうた", meaning: "children's song" },
  { written: "あさごはん", meaning: "breakfast" },
  { written: "あさつゆ", meaning: "morning dew" },
  { written: "いろどり", meaning: "coloring" },
  { written: "うわばき", meaning: "indoor shoes" },
  { written: "おしぼり", meaning: "wet towel" },
  { written: "おそなえ", meaning: "offering" },
  { written: "おたから", meaning: "treasure" },
  { written: "おとしだま", meaning: "New Year money" },
  { written: "おはじき", meaning: "marbles game" },
  { written: "かげぼうし", meaning: "shadow figure" },
  { written: "かさぶた", meaning: "scab" },
  { written: "かぜひき", meaning: "catching a cold" },
  { written: "きりたんぽ", meaning: "grilled rice stick" },
  { written: "こうすい", meaning: "perfume" },
  { written: "こおりみず", meaning: "ice water" },
  { written: "こころざし", meaning: "aspiration" },
  { written: "さしいれ", meaning: "gift (to someone)" },
  { written: "さむけ", meaning: "chill, shiver" },
  { written: "しおり", meaning: "bookmark" },
  { written: "したごころ", meaning: "hidden motive" },
  { written: "すきとおる", meaning: "to be transparent" },
  { written: "たかなり", meaning: "pounding (heart)" },
  { written: "たきつぼ", meaning: "waterfall basin" },
  { written: "だがし", meaning: "cheap sweets" },
  { written: "ちくりん", meaning: "bamboo grove" },
  { written: "つきあかり", meaning: "moonlight" },
  { written: "てさぐり", meaning: "fumbling" },
  { written: "とおまわり", meaning: "detour" },
  { written: "なみだ", meaning: "tears" },
  { written: "はいく", meaning: "haiku" },
  { written: "はだし", meaning: "barefoot" },
]

// Now fill gaps in each file
const idRanges: [number, number][] = [
  [5000, 5999],
  [6000, 6999],
  [7000, 7999],
  [8000, 8999],
  [9000, 9999],
]
const freqRanges: [number, number][] = [
  [1, 1000],
  [1001, 2000],
  [2001, 3000],
  [3001, 4000],
  [4001, 5000],
]

let replacementIdx = 0

for (let fi = 0; fi < cleanedEntries.length; fi++) {
  const [idStart] = idRanges[fi]
  const [freqStart] = freqRanges[fi]
  const entries = cleanedEntries[fi]

  // Fill up to 1000 entries
  while (entries.length < 1000 && replacementIdx < replacementWords.length) {
    const replacement = replacementWords[replacementIdx++]
    if (globalSeen.has(replacement.written)) continue
    if (PARTICLES.has(replacement.written)) continue

    const components = decompose(replacement.written)
    if (!components || components.length === 0) continue

    globalSeen.add(replacement.written)
    entries.push({
      id: 0, // Will be reassigned
      written: replacement.written,
      meaning: replacement.meaning,
      components,
      frequency: 0, // Will be reassigned
      file: files[fi],
    })
  }

  // Reassign IDs and frequencies
  for (let i = 0; i < entries.length; i++) {
    entries[i].id = idStart + i
    entries[i].frequency = freqStart + i
  }

  // Truncate to 1000 if needed
  cleanedEntries[fi] = entries.slice(0, 1000)
}

console.log(`After fill, entries per file: ${cleanedEntries.map((e) => e.length).join(", ")}`)

// --- Write output files ---

for (let fi = 0; fi < cleanedEntries.length; fi++) {
  const entries = cleanedEntries[fi]
  const varName = `freq${String(fi + 1).padStart(2, "0")}`

  let output = `import type { WordElement } from "../linguistic-element.js"\nimport { w } from "./helpers.js"\n\nexport const ${varName}: ReadonlyArray<WordElement> = [\n`

  for (const entry of entries) {
    const escapedMeaning = entry.meaning.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
    output += `  w(${entry.id}, "${entry.written}", "${escapedMeaning}", [${entry.components.join(", ")}], ${entry.frequency}),\n`
  }

  output += "]\n"

  const outPath = path.join(
    __dirname,
    `../src/word-data/freq-${String(fi + 1).padStart(2, "0")}.ts`,
  )
  fs.writeFileSync(outPath, output)
  console.log(`Wrote ${outPath}: ${entries.length} entries`)
}

// --- Verify ---
let allOk = true

// Check total count
const totalFinal = cleanedEntries.reduce((sum, e) => sum + e.length, 0)
if (totalFinal !== 5000) {
  console.error(`ERROR: Total count is ${totalFinal}, expected 5000`)
  allOk = false
}

// Check unique written
const allWrittens = cleanedEntries.flat().map((e) => e.written)
const uniqueWrittens = new Set(allWrittens)
if (uniqueWrittens.size !== 5000) {
  console.error(`ERROR: Only ${uniqueWrittens.size} unique writtens`)
  allOk = false
}

// Check ID continuity
const finalIds = cleanedEntries
  .flat()
  .map((e) => e.id)
  .sort((a, b) => a - b)
for (let i = 0; i < 5000; i++) {
  if (finalIds[i] !== 5000 + i) {
    console.error(`ERROR: ID gap at position ${i}: expected ${5000 + i}, got ${finalIds[i]}`)
    allOk = false
    break
  }
}

// Check components
let compErrors = 0
for (const entries of cleanedEntries) {
  for (const entry of entries) {
    const reconstructed = entry.components.map((id) => idToChar.get(id) ?? "?").join("")
    if (reconstructed !== entry.written) {
      compErrors++
      if (compErrors <= 5) {
        console.error(`Component error: ${entry.written} → ${reconstructed}`)
      }
    }
  }
}
if (compErrors > 0) {
  console.error(`ERROR: ${compErrors} entries with incorrect components`)
  allOk = false
}

if (allOk) {
  console.log("\n✅ All checks passed!")
} else {
  console.log("\n❌ Some checks failed")
}
