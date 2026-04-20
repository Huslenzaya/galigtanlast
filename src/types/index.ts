// ── Letter / Word ──────────────────────────────────────────
export type LetterType = "vowel" | "consonant";

export interface Letter {
  mg: string;       // Mongolian script character
  r: string;        // Romanization
  t: LetterType;
  x: string;        // Example word (Cyrillic)
}

export interface Word {
  mg: string;
  r: string;        // Romanization / transliteration
  mn: string;       // Mongolian Cyrillic meaning
  cat: string;      // Category
}

// ── Quiz ────────────────────────────────────────────────────
export interface QuizQuestion {
  q: string;
  mg: string | null;
  opts: string[];
  c: number;         // correct index
  lvl?: number;
  cat?: string;
}

// ── Lesson ──────────────────────────────────────────────────
export type LessonId =
  | "vowels"
  | "consonants"
  | "writing"
  | "harmony"
  | "cases"
  | "verbtense"
  | "numbers"
  | "l1" | "l2" | "l3" | "l4";

export interface LessonItem {
  id: LessonId;
  name: string;
  done: boolean;
}

export interface LessonCategory {
  cat: string;
  icon: string;
  color: "sky" | "grass" | "sand" | "ember";
  items: LessonItem[];
}

// ── Level ───────────────────────────────────────────────────
export interface PlacementLevel {
  score: number;
  n: number;
  emoji: string;
  name: string;
  grade: string;
}

export interface LevelOption {
  n: number;
  grade: string;
  name: string;
  desc: string;
  color: string;
}

// ── Article ─────────────────────────────────────────────────
export interface Article {
  t: string;         // title
  l: string;         // level label
  mg: string;        // Mongolian script text
  mn: string;        // Cyrillic translation
}

// ── Game ─────────────────────────────────────────────────────
export interface SortSentence {
  p: string[];       // shuffled pool
  a: string[];       // correct answer order
  tr: string;        // translation
}

export interface FillBlankQuestion {
  before: string;
  blank: string;
  after: string;
  choices: string[];
  c: number;
  tr: string;
}

export interface BalloonQuestion {
  q: string;
  correct: string;
  wrong: string[];
}

// ── Flashcard ────────────────────────────────────────────────
export type FlashRating = "known" | "unknown" | null;

export interface FlashState {
  set: Letter[];
  idx: number;
  flipped: boolean;
  results: FlashRating[];
}

// ── Auth / User ───────────────────────────────────────────────
export interface User {
  name: string;
  email: string;
  level: number;     // 1–6
  xp: number;
  streak: number;
  lives: number;
  learnedLetters: Set<number>;
}

// ── App-wide page routing ─────────────────────────────────────
export type PageId =
  | "auth"
  | "home"
  | "onboard"
  | "lvlsel"
  | "placement"
  | "lessons"
  | "quiz"
  | "flash"
  | "games"
  | "match"
  | "speed"
  | "write"
  | "sort"
  | "balloon"
  | "fillblank"
  | "reading"
  | "dict"
  | "profile"
  | "admin"
  | "writepractice";
