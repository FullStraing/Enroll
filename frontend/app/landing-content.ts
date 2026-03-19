export const landingTheme = {
  bg: "#F9F5F6",
  black: "#000000",
  cyan: "#DAF5F0",
  orange: "#F8D6B3",
  white: "#FFFFFF",
  primary: "#FFDB58",
  yellowSoft: "#FFF4CC",
  limeSoft: "#E8F4CF",
};

export const painPoints = [
  "10+ дедлайнов на разные типы подачи и разные университеты",
  "Документы, эссе, рекомендации и формы лежат в разных местах",
  "Common App и реальные шаги по поступлению не связаны между собой",
  "Ты не понимаешь, что делать сегодня, чтобы не сорвать подачу позже",
];

export const proofPoints = [
  "Один workflow вместо заметок, таблиц, писем и случайных чеклистов",
  "Сделано под поступление в университеты США, а не под абстрактный todo-app",
  "Universities, tasks, documents, essays и Common App работают как одна система",
];

export const storySections = [
  {
    eyebrow: "Проблема",
    title: "Поступление ломается не из-за мотивации. Оно ломается из-за хаоса.",
    body:
      "Студент теряет темп, когда shortlist, дедлайны, документы и essays существуют отдельно друг от друга. Enroll убирает этот разрыв и делает следующий шаг очевидным.",
    tone: "orange" as const,
    preview: {
      label: "Without a system",
      title: "Chaos between tabs, docs and deadlines",
      rows: [
        { label: "Common App draft", value: "Half filled" },
        { label: "Deadlines", value: "Scattered" },
        { label: "Essay drafts", value: "Different places" },
      ],
    },
  },
  {
    eyebrow: "Решение",
    title: "Enroll превращает поступление в один управляемый workflow.",
    body:
      "Ты видишь shortlist, задачи, документы и Common App в одном продукте. Не нужно помнить всё в голове: система сама удерживает контекст.",
    tone: "cyan" as const,
    preview: {
      label: "Dashboard",
      title: "What needs attention right now",
      rows: [
        { label: "Profile", value: "71%" },
        { label: "Documents", value: "20%" },
        { label: "Applications", value: "33%" },
      ],
    },
  },
  {
    eyebrow: "Как это выглядит",
    title: "Пользователь скроллит и сразу понимает: проблема знакомая, решение конкретное.",
    body:
      "Сначала боль. Затем экран продукта. Затем конкретный призыв к действию. Это и есть правильная история для первого визита: не перечисление функций, а понятный переход от хаоса к контролю.",
    tone: "yellow" as const,
    preview: {
      label: "Task flow",
      title: "Add a task for today and move forward",
      rows: [
        { label: "Today", value: "2 tasks" },
        { label: "Upcoming", value: "3 tasks" },
        { label: "Completed", value: "8 tasks" },
      ],
    },
  },
];

export const productShowcase = [
  {
    title: "Universities + deadlines",
    body: "Shortlist universities, see your category, status and important dates in one place.",
    preview: {
      label: "Universities",
      title: "Track where you stand",
      rows: [
        { label: "Brown", value: "High Reach" },
        { label: "Boston College", value: "Reach" },
        { label: "Arizona State", value: "Safety" },
      ],
    },
  },
  {
    title: "Tasks for today",
    body: "One clean list for what matters today, without calendar overload.",
    preview: {
      label: "Tasks",
      title: "Today-first planning",
      rows: [
        { label: "Draft personal essay", value: "Today" },
        { label: "Upload transcript", value: "Tomorrow" },
        { label: "Ask for recommendation", value: "No date" },
      ],
    },
  },
  {
    title: "Documents vault",
    body: "Keep transcript, resume, ID and recommendation letters inside the admissions workflow.",
    preview: {
      label: "Documents",
      title: "Simple admissions file locker",
      rows: [
        { label: "Transcript", value: "Uploaded" },
        { label: "Resume", value: "Uploaded" },
        { label: "Passport", value: "Missing" },
      ],
    },
  },
];
