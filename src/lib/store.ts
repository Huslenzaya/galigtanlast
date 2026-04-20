import type { LessonId, PageId } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface StartQuizOptions {
  lessonSlug?: string;
  requireDatabase?: boolean;
}

const MAX_LIVES = 5;
const LIFE_RECOVER_MS = 60 * 60 * 1000;

function clampLives(value: number) {
  if (!Number.isFinite(value)) return MAX_LIVES;
  return Math.max(0, Math.min(MAX_LIVES, Math.round(value)));
}

interface AppState {
  userId: string;
  userEmail: string;
  userName: string;
  userAvatar: string;
  isLoggedIn: boolean;
  isAdmin: boolean;

  setUser: (
    name: string,
    isAdmin?: boolean,
    email?: string,
    id?: string,
  ) => void;
  setUserAvatar: (avatar: string) => void;
  logout: () => void;

  authModalOpen: boolean;
  authModalTab: "in" | "up";
  openAuthModal: (tab?: "in" | "up") => void;
  closeAuthModal: () => void;

  currentPage: PageId;
  goTo: (page: PageId) => void;

  lives: number;
  lastLifeLostAt: number | null;
  streak: number;
  xp: number;
  level: number;
  learnedLetters: number[];

  setLives: (lives: number) => void;
  addLife: (count?: number) => void;
  fillLives: () => void;
  loseLife: () => void;
  resetLives: () => void;
  recoverLives: () => void;
  addXp: (amount: number) => void;
  setXp: (amount: number) => void;
  markLetterLearned: (idx: number) => void;

  currentLesson: LessonId;
  setLesson: (id: LessonId) => void;

  quizTopic: string;
  quizFromLesson: boolean;
  quizLessonSlug: string;
  quizRequireDatabase: boolean;
  startQuiz: (
    topic: string,
    fromLesson?: boolean,
    options?: StartQuizOptions,
  ) => void;

  placementLevel: number;
  setPlacementLevel: (n: number) => void;

  flashSetType: "all" | "vowels" | "consonants";
  setFlashSetType: (t: "all" | "vowels" | "consonants") => void;

  dictTab: "letters" | "words";
  setDictTab: (t: "letters" | "words") => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      userId: "",
      userEmail: "",
      userName: "",
      userAvatar: "",
      isLoggedIn: false,
      isAdmin: false,

      setUser: (name, isAdmin = false, email = "", id = "") =>
        set({
          userId: id,
          userEmail: email,
          userName: name,
          userAvatar: "",
          isLoggedIn: true,
          isAdmin,
          authModalOpen: false,
          authModalTab: "in",
          currentPage: "home",
        }),

      setUserAvatar: (avatar) =>
        set({
          userAvatar: avatar,
        }),

      logout: () =>
        set({
          userId: "",
          userEmail: "",
          userName: "",
          userAvatar: "",
          isLoggedIn: false,
          isAdmin: false,
          authModalOpen: false,
          authModalTab: "in",
          currentPage: "home",
          quizTopic: "default",
          quizFromLesson: false,
          quizLessonSlug: "",
          quizRequireDatabase: false,
        }),

      authModalOpen: false,
      authModalTab: "in",
      openAuthModal: (tab = "in") =>
        set({ authModalOpen: true, authModalTab: tab }),
      closeAuthModal: () => set({ authModalOpen: false }),

      currentPage: "home",
      goTo: (page) => set({ currentPage: page }),

      lives: MAX_LIVES,
      lastLifeLostAt: null,
      streak: 7,
      xp: 1240,
      level: 2,
      learnedLetters: [0, 1, 2, 3, 4],

      setLives: (lives) =>
        set((s) => {
          const nextLives = clampLives(lives);

          return {
            lives: nextLives,
            lastLifeLostAt: nextLives >= MAX_LIVES ? null : s.lastLifeLostAt,
          };
        }),

      addLife: (count = 1) =>
        set((s) => {
          const safeCount = Math.max(0, Math.round(count));
          const nextLives = clampLives(s.lives + safeCount);

          return {
            lives: nextLives,
            lastLifeLostAt: nextLives >= MAX_LIVES ? null : s.lastLifeLostAt,
          };
        }),

      fillLives: () =>
        set({
          lives: MAX_LIVES,
          lastLifeLostAt: null,
        }),

      loseLife: () =>
        set((s) => {
          const nextLives = Math.max(0, s.lives - 1);

          return {
            lives: nextLives,
            lastLifeLostAt: nextLives < MAX_LIVES ? Date.now() : null,
          };
        }),

      resetLives: () =>
        set({
          lives: MAX_LIVES,
          lastLifeLostAt: null,
        }),

      recoverLives: () => {
        const { lives, lastLifeLostAt } = get();

        if (lives >= MAX_LIVES || !lastLifeLostAt) return;

        const elapsed = Date.now() - lastLifeLostAt;

        if (elapsed >= LIFE_RECOVER_MS) {
          set({
            lives: MAX_LIVES,
            lastLifeLostAt: null,
          });
        }
      },

      addXp: (amount) => set((s) => ({ xp: s.xp + amount })),
      setXp: (amount) => set({ xp: amount }),

      markLetterLearned: (idx) =>
        set((s) => ({
          learnedLetters: s.learnedLetters.includes(idx)
            ? s.learnedLetters
            : [...s.learnedLetters, idx],
        })),

      currentLesson: "vowels",
      setLesson: (id) => set({ currentLesson: id }),

      quizTopic: "default",
      quizFromLesson: false,
      quizLessonSlug: "",
      quizRequireDatabase: false,

      startQuiz: (topic, fromLesson = false, options = {}) =>
        set({
          quizTopic: topic,
          quizFromLesson: fromLesson,
          quizLessonSlug: options.lessonSlug ?? "",
          quizRequireDatabase: options.requireDatabase ?? false,
          currentPage: "quiz",
        }),

      placementLevel: 1,
      setPlacementLevel: (n) => set({ placementLevel: n }),

      flashSetType: "all",
      setFlashSetType: (t) => set({ flashSetType: t }),

      dictTab: "letters",
      setDictTab: (t) => set({ dictTab: t }),
    }),
    {
      name: "mongolian-app-store",
      partialize: (s) => ({
        userId: s.userId,
        userEmail: s.userEmail,
        userName: s.userName,
        userAvatar: s.userAvatar,
        isLoggedIn: s.isLoggedIn,
        isAdmin: s.isAdmin,
        lives: s.lives,
        lastLifeLostAt: s.lastLifeLostAt,
        streak: s.streak,
        xp: s.xp,
        level: s.level,
        learnedLetters: s.learnedLetters,
        currentLesson: s.currentLesson,
        placementLevel: s.placementLevel,

        quizTopic: s.quizTopic,
        quizFromLesson: s.quizFromLesson,
        quizLessonSlug: s.quizLessonSlug,
        quizRequireDatabase: s.quizRequireDatabase,
      }),
    },
  ),
);
