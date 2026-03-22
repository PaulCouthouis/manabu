import type { WordElement } from "./linguistic-element.js"
import { w } from "./word-data/helpers.js"

// --- Numbers (10) — written in kanji ---
// IDs 10000-10009, frequency = sequential

const numbers: ReadonlyArray<WordElement> = [
  w(10000, "一", "one", [1001], 1),
  w(10001, "二", "two", [1016], 2),
  w(10002, "三", "three", [1027], 3),
  w(10003, "四", "four", [1076], 4),
  w(10004, "五", "five", [1054], 5),
  w(10005, "六", "six", [1139], 6),
  w(10006, "七", "seven", [1158], 7),
  w(10007, "八", "eight", [1107], 8),
  w(10008, "九", "nine", [1224], 9),
  w(10009, "億", "hundred million", [2878], 10),
]

// --- Counter combinations (42) — written with arabic numerals ---
// IDs 10010-10051, frequency = sequential continuing from numbers
// Components contain only KanjiId (no arabic numeral representation)

const counterCombinations: ReadonlyArray<WordElement> = [
  // 人 (people) — KanjiId 1000
  w(10010, "1人", "one person", [1000], 11),
  w(10011, "2人", "two people", [1000], 12),
  w(10012, "3人", "three people", [1000], 13),

  // 本 (long thin objects) — KanjiId 1035
  w(10013, "1本", "one (long object)", [1035], 14),
  w(10014, "2本", "two (long objects)", [1035], 15),
  w(10015, "3本", "three (long objects)", [1035], 16),

  // 匹 (small animals) — KanjiId 2325
  w(10016, "1匹", "one (small animal)", [2325], 17),
  w(10017, "3匹", "three (small animals)", [2325], 18),

  // 杯 (cups/glasses) — KanjiId 1847
  w(10018, "1杯", "one cup", [1847], 19),
  w(10019, "3杯", "three cups", [1847], 20),

  // 冊 (books) — KanjiId 2507
  w(10020, "1冊", "one book", [2507], 21),

  // 回 (times) — KanjiId 1612
  w(10021, "1回", "one time", [1612], 22),

  // 階 (floors) — KanjiId 1374
  w(10022, "1階", "first floor", [1374], 23),

  // 個 (pieces) — KanjiId 1677
  w(10023, "1個", "one piece", [1677], 24),

  // 枚 (flat objects) — KanjiId 1723
  w(10024, "1枚", "one (flat object)", [1723], 25),

  // 時 (hours) — KanjiId 1013
  w(10025, "1時", "one o'clock", [1013], 26),
  w(10026, "4時", "four o'clock", [1013], 27),
  w(10027, "7時", "seven o'clock", [1013], 28),
  w(10028, "9時", "nine o'clock", [1013], 29),

  // 分 (minutes) — KanjiId 1009
  w(10029, "1分", "one minute", [1009], 30),
  w(10030, "3分", "three minutes", [1009], 31),

  // 月 (months) — KanjiId 1075
  w(10031, "1月", "January", [1075], 32),
  w(10032, "4月", "April", [1075], 33),
  w(10033, "7月", "July", [1075], 34),
  w(10034, "9月", "September", [1075], 35),

  // 日 (days of month) — KanjiId 1007
  w(10035, "1日", "first day", [1007], 36),
  w(10036, "2日", "second day", [1007], 37),
  w(10037, "3日", "third day", [1007], 38),
  w(10038, "4日", "fourth day", [1007], 39),
  w(10039, "5日", "fifth day", [1007], 40),
  w(10040, "6日", "sixth day", [1007], 41),
  w(10041, "7日", "seventh day", [1007], 42),
  w(10042, "8日", "eighth day", [1007], 43),
  w(10043, "9日", "ninth day", [1007], 44),
  w(10044, "10日", "tenth day", [1007], 45),

  // 歳 (age) — KanjiId 1584
  w(10045, "20歳", "twenty years old", [1584], 46),

  // 足 (footwear) — KanjiId 1120
  w(10046, "1足", "one pair (shoes)", [1120], 47),

  // 軒 (buildings) — KanjiId 1784
  w(10047, "1軒", "one house", [1784], 48),
  w(10048, "3軒", "three houses", [1784], 49),

  // 羽 (birds) — KanjiId 1623
  w(10049, "1羽", "one bird", [1623], 50),
  w(10050, "3羽", "three birds", [1623], 51),
  w(10051, "6羽", "six birds", [1623], 52),
]

export const counterWordData: ReadonlyArray<WordElement> = [...numbers, ...counterCombinations]
