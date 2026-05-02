import fs from "node:fs";
import { Client } from "pg";

const envText = fs.readFileSync(new URL("../.env", import.meta.url), "utf8");
const connectionString = envText.match(/DATABASE_URL="([^"]+)"/)?.[1];

if (!connectionString) {
  throw new Error("DATABASE_URL not found in .env");
}

const client = new Client({ connectionString });

const lessonContent = JSON.stringify(
  {
    version: 1,
    intro:
      "Энэ хичээлээр монгол бичгийн 7 эгшгийг танихаас гадна нэг үсэг үгийн эхэнд, дунд, адагт орохдоо дүрс нь өөр харагддагийг бодит үг дээр ажиглаж сурна.",
    keyPoints: [
      "Монгол бичигт эхний шатанд таних 7 эгшиг бий: ᠠ, ᠡ, ᠢ, ᠣ, ᠤ, ᠥ, ᠦ.",
      "ᠠ нь кирилл “а”, ᠡ нь “э”, ᠢ нь “и” авиатай ойролцоо уншигдана.",
      "ᠣ нь “о”, ᠤ нь “у”, ᠥ нь “ө”, ᠦ нь “ү” авиатай ойролцоо уншигдана.",
      "Монгол бичгийн үсэг ганцаараа байхдаа, үгийн эхэнд байхдаа, дунд байхдаа, төгсгөлд байхдаа өөр хэлбэртэй харагдаж болно.",
      "Үгийн эхэнд орсон үсэг дараагийн үсэгтэйгээ холбогдож эхэлнэ. Жишээ: ᠠᠪᠤ, ᠡᠵᠢ, ᠤᠰᠤ.",
      "Үгийн дунд орсон үсэг өмнөх ба дараах үсэгтэйгээ холбогдоно. Жишээ: ᠨᠠᠷ, ᠭᠡᠷ, ᠮᠣᠷᠢ.",
      "Үгийн адагт орсон үсэг өмнөх үсэгтэйгээ холбогдоод үгийг дуусгана. Жишээ: ᠮᠣᠷᠢ, ᠤᠰᠤ, ᠦᠷ᠎ᠡ.",
      "Эхлээд тухайн эгшиг ямар авиа болохыг нэрлээд, дараа нь үг дотор хаана орсныг нь ажиглана.",
    ],
    examples: [
      { script: "ᠠ", cyrillic: "а", note: "Ганцаар байгаа ᠠ эгшиг" },
      { script: "ᠠᠪᠤ", cyrillic: "аав", note: "ᠠ үгийн эхэнд орсон" },
      { script: "ᠨᠠᠷ", cyrillic: "нар", note: "ᠠ үгийн дунд орсон" },
      { script: "ᠡ", cyrillic: "э", note: "Ганцаар байгаа ᠡ эгшиг" },
      { script: "ᠡᠵᠢ", cyrillic: "ээж", note: "ᠡ үгийн эхэнд орсон" },
      { script: "ᠭᠡᠷ", cyrillic: "гэр", note: "ᠡ үгийн дунд орсон" },
      { script: "ᠢ", cyrillic: "и", note: "Ганцаар байгаа ᠢ эгшиг" },
      { script: "ᠮᠣᠷᠢ", cyrillic: "морь", note: "ᠢ үгийн адагт орсон" },
      { script: "ᠣ", cyrillic: "о", note: "Ганцаар байгаа ᠣ эгшиг" },
      { script: "ᠣᠷᠣᠨ", cyrillic: "орон", note: "ᠣ үгийн эхэнд ба дунд орсон" },
      { script: "ᠮᠣᠷᠢ", cyrillic: "морь", note: "ᠣ үгийн дунд орсон" },
      { script: "ᠤ", cyrillic: "у", note: "Ганцаар байгаа ᠤ эгшиг" },
      { script: "ᠤᠰᠤ", cyrillic: "ус", note: "ᠤ үгийн эхэнд ба адагт орсон" },
      { script: "ᠰᠤᠷᠤᠭᠴᠢ", cyrillic: "сурагч", note: "ᠤ үгийн дунд орсон" },
      { script: "ᠥ", cyrillic: "ө", note: "Ганцаар байгаа ᠥ эгшиг" },
      { script: "ᠥᠨᠳᠦᠷ", cyrillic: "өндөр", note: "ᠥ үгийн эхэнд орсон" },
      { script: "ᠦ", cyrillic: "ү", note: "Ганцаар байгаа ᠦ эгшиг" },
      { script: "ᠦᠷ᠎ᠡ", cyrillic: "үр", note: "ᠦ үгийн эхэнд, ᠡ адагт орсон" },
      { script: "ᠬᠦᠮᠦᠨ", cyrillic: "хүн", note: "ᠦ үгийн дунд орсон" },
    ],
    tasks: [
      {
        prompt: "Доорх ᠠ эгшгийг дагаж бич.",
        answer: "ᠠ",
        hint: "аав гэдэг үгийн эхний авиа",
      },
      {
        prompt: "Доорх ᠡ эгшгийг дагаж бич.",
        answer: "ᠡ",
        hint: "эрдэм гэдэг үгийн эхний авиа",
      },
      {
        prompt: "Доорх ᠢ эгшгийг дагаж бич.",
        answer: "ᠢ",
        hint: "инээх гэдэг үгийн эхний авиа",
      },
      {
        prompt: "Доорх ᠣ эгшгийг дагаж бич.",
        answer: "ᠣ",
        hint: "олон гэдэг үгийн эхний авиа",
      },
      {
        prompt: "Доорх ᠤ эгшгийг дагаж бич.",
        answer: "ᠤ",
        hint: "ус гэдэг үгийн эхний авиа",
      },
      {
        prompt: "Доорх ᠥ эгшгийг дагаж бич.",
        answer: "ᠥ",
        hint: "өндөр гэдэг үгийн эхний авиа",
      },
      {
        prompt: "Доорх ᠦ эгшгийг дагаж бич.",
        answer: "ᠦ",
        hint: "үр гэдэг үгийн эхний авиа",
      },
      {
        prompt: "ᠭᠡᠷ гэдэг үгийг дагаж бич.",
        answer: "ᠭᠡᠷ",
        hint: "ᠡ эгшиг орсон үг",
      },
      {
        prompt: "ᠤᠰᠤ гэдэг үгийг дагаж бич.",
        answer: "ᠤᠰᠤ",
        hint: "ᠤ эгшиг давтагдсан үг",
      },
      {
        prompt: "ᠨᠠᠷ гэдэг үгийг дагаж бич.",
        answer: "ᠨᠠᠷ",
        hint: "ᠠ эгшиг үгийн дунд орсон",
      },
    ],
    wrapUp:
      "Сайн байна. Одоо чи 7 эгшгийг нэрлэхээс гадна үсэг үгийн эхэнд, дунд, адагт орохоор дүрс нь өөр харагддагийг ажиглаж чадна. Дараагийн хичээлээр гийгүүлэгчтэй нийлсэн үе уншина.",
    activities: {
      matchGame: false,
      fillGame: false,
      sortGame: false,
      copyPractice: false,
      writeCheck: true,
      matchTitle: "Бичгийг утгатай нь тааруул",
      matchInstruction: "Босоо бичгийг хараад зөв кирилл утгыг сонгоорой.",
      fillTitle: "Хоосон зай нөхөх",
      fillInstruction: "Кирилл утгыг уншаад зөв бичгийг сонго.",
      sortTitle: "Үгсийг дарааллаар өрөх",
      sortInstruction: "Доорх үгсийг дарааллаар нь сонгож мөр бүтээ.",
      copyTitle: "Хуулж бичээд шалга",
      copyInstruction: "Загварыг хараад keyboard-оор өөрөө хуулж бичнэ.",
      matchItems: [],
      fillItems: [],
      sortItems: [],
      copyItems: [],
      exerciseItems: [
        {
          type: "chooseMeaning",
          prompt: "Энэ монгол бичгийн кирилл утгыг сонго.",
          script: "ᠠ",
          answer: "а",
          options: ["а", "э", "и", "о"],
          note: "Ганцаар байгаа ᠠ эгшиг",
        },
        {
          type: "chooseMeaning",
          prompt: "Энэ монгол бичгийн кирилл утгыг сонго.",
          script: "ᠡ",
          answer: "э",
          options: ["а", "э", "ү", "у"],
          note: "Ганцаар байгаа ᠡ эгшиг",
        },
        {
          type: "chooseScript",
          prompt: "\"нар\" гэсэн утгатай монгол бичгийг сонго.",
          script: "ᠨᠠᠷ",
          answer: "ᠨᠠᠷ",
          options: ["ᠨᠠᠷ", "ᠭᠡᠷ", "ᠤᠰᠤ", "ᠮᠣᠷᠢ"],
          note: "ᠠ үгийн дунд орсон",
        },
        {
          type: "chooseScript",
          prompt: "\"гэр\" гэсэн утгатай монгол бичгийг сонго.",
          script: "ᠭᠡᠷ",
          answer: "ᠭᠡᠷ",
          options: ["ᠠᠪᠤ", "ᠭᠡᠷ", "ᠤᠰᠤ", "ᠦᠷ᠎ᠡ"],
          note: "ᠡ үгийн дунд орсон",
        },
        {
          type: "trueFalse",
          prompt: "Энэ бичиг \"ус\" гэсэн утгатай юу?",
          script: "ᠤᠰᠤ",
          answer: "Тийм",
          options: ["Тийм", "Үгүй"],
          note: "ус",
        },
        {
          type: "trueFalse",
          prompt: "Энэ бичиг \"морь\" гэсэн утгатай юу?",
          script: "ᠭᠡᠷ",
          answer: "Үгүй",
          options: ["Тийм", "Үгүй"],
          note: "морь",
        },
        {
          type: "chooseNote",
          prompt: "Энэ жишээнд ᠠ эгшиг хаана орсон бэ?",
          script: "ᠠᠪᠤ",
          answer: "ᠠ үгийн эхэнд орсон",
          options: ["ᠠ үгийн эхэнд орсон", "ᠠ үгийн дунд орсон", "ᠢ үгийн адагт орсон", "ᠤ давтагдсан"],
          note: "аав",
        },
        {
          type: "chooseNote",
          prompt: "Энэ жишээнд ᠢ эгшиг хаана орсон бэ?",
          script: "ᠮᠣᠷᠢ",
          answer: "ᠢ үгийн адагт орсон",
          options: ["ᠠ үгийн эхэнд орсон", "ᠡ үгийн дунд орсон", "ᠢ үгийн адагт орсон", "ᠤ үгийн эхэнд орсон"],
          note: "морь",
        },
      ],
    },
  },
  null,
  2,
);

const questions = [
  ["ᠠ үсэг аль авиаг илэрхийлэх вэ?", ["а", "э", "и", "о"], 0, "vowel", 1],
  ["ᠡ үсэг аль авиаг илэрхийлэх вэ?", ["у", "э", "а", "ө"], 1, "vowel", 1],
  ["ᠢ үсэг аль авиаг илэрхийлэх вэ?", ["и", "о", "у", "а"], 0, "vowel", 1],
  ["ᠣ үсэг аль авиаг илэрхийлэх вэ?", ["ө", "ү", "о", "э"], 2, "vowel", 1],
  ["ᠤ үсэг аль авиаг илэрхийлэх вэ?", ["у", "и", "а", "э"], 0, "vowel", 1],
  ["ᠥ үсэг аль авиаг илэрхийлэх вэ?", ["о", "ө", "у", "а"], 1, "vowel", 1],
  ["ᠦ үсэг аль авиаг илэрхийлэх вэ?", ["э", "ө", "ү", "и"], 2, "vowel", 1],
  [
    "ᠭᠡᠷ гэдэг үгийг кириллээр сонго.",
    ["гэр", "морь", "ус", "нар"],
    0,
    "reading",
    1,
  ],
  [
    "ᠤᠰᠤ гэдэг үгийг кириллээр сонго.",
    ["морь", "гэр", "ус", "нар"],
    2,
    "reading",
    1,
  ],
  [
    "Доорх кирилл үгийг монгол бичгээр бич: гэр",
    ["ᠭᠡᠷ", "ᠮᠣᠷᠢ", "ᠤᠰᠤ", "ᠨᠠᠷ"],
    0,
    "typing_mongol",
    1,
  ],
  [
    "Монгол бичгийн үсэг үгийн эхэнд, дунд, адагт орохдоо яадаг вэ?",
    [
      "Хэлбэр нь өөрчлөгдөж болно",
      "Үргэлж яг адилхан байна",
      "Зөвхөн кириллээр бичигдэнэ",
      "Дуудагдахгүй болно",
    ],
    0,
    "letter_position",
    1,
  ],
  [
    "ᠠᠪᠤ гэдэг үгэнд ᠠ эгшиг хаана орсон бэ?",
    ["Үгийн эхэнд", "Үгийн дунд", "Үгийн адагт", "Ороогүй"],
    0,
    "letter_position",
    1,
  ],
  [
    "ᠨᠠᠷ гэдэг үгэнд ᠠ эгшиг хаана орсон бэ?",
    ["Үгийн эхэнд", "Үгийн дунд", "Үгийн адагт", "Ороогүй"],
    1,
    "letter_position",
    1,
  ],
];

try {
  await client.connect();
  await client.query("begin");

  const lesson = await client.query(
    `
      insert into "Lesson" (
        id, title, slug, description, grade, level, "sortOrder",
        content, status, "createdAt", "updatedAt"
      )
      values (
        gen_random_uuid()::text, $2, $3, $4, 6, 1, 1,
        $1, 'PUBLISHED', now(), now()
      )
      on conflict (slug) do update set
        content = excluded.content,
        description = excluded.description,
        status = 'PUBLISHED',
        "updatedAt" = now()
      returning id
    `,
    [
      lessonContent,
      "Эгшиг үсэг",
      "vowels",
      "Монгол бичгийн 7 эгшгийг кирилл дуудлагатай нь холбож, богино үг дээр уншиж сурна.",
    ],
  );

  const lessonId = lesson.rows[0].id;

  const quiz = await client.query(
    `
      insert into "Quiz" (
        id, title, "lessonId", "isPlacement", "createdAt", "updatedAt"
      )
      values (gen_random_uuid()::text, $2, $1, false, now(), now())
      on conflict ("lessonId") do update set
        title = excluded.title,
        "updatedAt" = now()
      returning id
    `,
    [lessonId, "Эгшиг үсгийн төгсгөлийн шалгалт"],
  );

  const quizId = quiz.rows[0].id;
  await client.query(`delete from "QuizQuestion" where "quizId" = $1`, [
    quizId,
  ]);

  for (const [question, opts, correct, category, difficulty] of questions) {
    await client.query(
      `
        insert into "QuizQuestion" (
          id, "quizId", question, "optionsJson", "correctIndex",
          category, difficulty, "createdAt", "updatedAt"
        )
        values (
          gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, now(), now()
        )
      `,
      [quizId, question, JSON.stringify(opts), correct, category, difficulty],
    );
  }

  await client.query("commit");
  console.log({ lessonId, quizId, questions: questions.length });
} catch (error) {
  await client.query("rollback").catch(() => {});
  throw error;
} finally {
  await client.end().catch(() => {});
}
