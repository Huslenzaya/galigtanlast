# Монгол Бичиг — Next.js App

6–12-р ангийн монгол бичгийн сурах систем.

## Stack

- **Next.js 14** (App Router)
- **TypeScript** (strict mode)
- **Tailwind CSS** (custom color tokens)
- **Zustand** (global state + localStorage persist)
- **Framer Motion** (animations)
- **Lucide React** (icons)

## Суурь бүтэц

```
src/
├── app/
│   ├── layout.tsx          # Root layout, fonts
│   ├── page.tsx            # SPA router
│   └── globals.css         # Tailwind + custom CSS
├── components/
│   ├── auth/
│   │   ├── AuthPage.tsx        # Login / Register
│   │   ├── HomePage.tsx        # Landing after login
│   │   └── OnboardingPage.tsx  # 4-step onboarding
│   ├── dict/
│   │   └── DictPage.tsx        # Dictionary (letters + words)
│   ├── flashcard/
│   │   └── FlashcardPage.tsx   # 3D flip flashcards
│   ├── games/
│   │   └── GamesPage.tsx       # All 6 games hub + inline games
│   ├── layout/
│   │   └── Navbar.tsx          # Fixed top navbar
│   ├── lessons/
│   │   ├── LessonsPage.tsx     # Sidebar + lesson content
│   │   ├── LevelSelectPage.tsx # Level picker
│   │   ├── PlacementPage.tsx   # 12Q placement test
│   │   ├── ProfilePage.tsx     # User stats + badges
│   │   ├── QuizPage.tsx        # Quiz engine
│   │   └── ReadingPage.tsx     # Bilingual reading
│   └── ui/
│       ├── MongolianText.tsx   # Vertical Mongolian script
│       ├── ProgressBar.tsx     # Animated progress
│       └── Toast.tsx           # Toast notification system
├── lib/
│   ├── data.ts             # All static content
│   ├── store.ts            # Zustand state (persisted)
│   └── utils.ts            # cn(), shuffle(), clamp()
└── types/
    └── index.ts            # All TypeScript types
```

## Өнгөний систем (Tailwind tokens)

| Token    | Hex       | Хэрэглэгдэх газар             |
|----------|-----------|-------------------------------|
| `sky`    | `#1a6bbd` | Навигаци, товч, эгшиг          |
| `sand`   | `#c97b2a` | Монгол бичгийн текст, дүрэм   |
| `grass`  | `#2a9a52` | Зөв хариулт, явц, streak      |
| `ember`  | `#c83030` | Буруу хариулт, амь, анхааруулга |

## Тоглоомууд

1. 🃏 **Тааруулах** — монгол үсэг ↔ латин хариуг нийлүүлэх
2. ⚡ **Хурдны тест** — таймертэй үсэг таних
3. ✍️ **Зурах** — canvas дээр монгол үсэг зурах
4. 🔀 **Өгүүлбэр нийлүүлэх** — үгийг дарааллаар байрлуулах
5. 🎈 **Баллон дэлбэлэх** — зөв үсэгтэй баллоныг дэлбэлэх
6. 🔤 **Хоосон нөхөх** — өгүүлбэрийн хоосон зайг нөхөх

## Суулгах

```bash
npm install
npm run dev
```

```bash
npm run build       # Production build
npm run type-check  # TypeScript check
```

## .env.local (шаардлагатай бол)

```env
# Өгөгдлийн сан, auth холболт нэмэхэд хэрэгтэй
# NEXT_PUBLIC_API_URL=https://...
```
