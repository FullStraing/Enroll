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
  "Непонятно, что делать сегодня, чтобы не сорвать подачу позже",
];

export const proofPoints = [
  "Один admissions workflow вместо заметок, таблиц, писем и случайных чеклистов",
  "Сделано под поступление в университеты США, а не под абстрактный todo-app",
  "Universities, tasks, documents, essays и Common App работают как одна система",
];

export const storySections = [
  {
    eyebrow: "Проблема",
    title: "Поступление ломается не из-за мотивации. Оно ломается из-за хаоса.",
    body:
      "Студент теряет темп, когда shortlist, дедлайны, документы и essays живут отдельно друг от друга. Enroll убирает этот разрыв и делает следующий шаг очевидным.",
    tone: "orange" as const,
    preview: {
      label: "Без системы",
      title: "Хаос между вкладками, дедлайнами и файлами",
      rows: [
        { label: "Черновик Common App", value: "Заполнен частично" },
        { label: "Дедлайны", value: "Разбросаны" },
        { label: "Черновики эссе", value: "В разных местах" },
      ],
    },
  },
  {
    eyebrow: "Решение",
    title: "Enroll превращает поступление в один управляемый workflow.",
    body:
      "Ты видишь shortlist, задачи, документы и Common App в одном продукте. Не нужно держать всё в голове: система сама удерживает контекст и подсказывает, что улучшать дальше.",
    tone: "cyan" as const,
    preview: {
      label: "Dashboard",
      title: "Что требует внимания прямо сейчас",
      rows: [
        { label: "Профиль", value: "71%" },
        { label: "Документы", value: "20%" },
        { label: "Applications", value: "33%" },
      ],
    },
  },
  {
    eyebrow: "Как это выглядит",
    title: "Пользователь скроллит и сразу понимает: проблема знакомая, решение конкретное.",
    body:
      "Сначала боль. Затем экран продукта. Затем конкретный призыв к действию. Это и есть правильная история для первого визита: не перечень функций, а понятный переход от хаоса к контролю.",
    tone: "yellow" as const,
    preview: {
      label: "Tasks",
      title: "Today-first planning без перегруза календарём",
      rows: [
        { label: "Сегодня", value: "2 задачи" },
        { label: "Дальше", value: "3 задачи" },
        { label: "Готово", value: "8 задач" },
      ],
    },
  },
];

export const productShowcase = [
  {
    title: "Universities + deadlines",
    body: "Shortlist университетов, категории, статусы и ключевые дедлайны в одном месте.",
    preview: {
      label: "Universities",
      title: "Отслеживай, где ты стоишь",
      rows: [
        { label: "Brown", value: "High Reach" },
        { label: "Boston College", value: "Reach" },
        { label: "Arizona State", value: "Safety" },
      ],
    },
  },
  {
    title: "Tasks for today",
    body: "Один чистый список того, что важно сегодня, без перегруза календарём.",
    preview: {
      label: "Tasks",
      title: "Планирование от сегодняшнего дня",
      rows: [
        { label: "Черновик personal essay", value: "Сегодня" },
        { label: "Загрузить transcript", value: "Завтра" },
        { label: "Попросить recommendation", value: "Без даты" },
      ],
    },
  },
  {
    title: "Documents vault",
    body: "Transcript, resume, ID и recommendation letters внутри единого admissions workflow.",
    preview: {
      label: "Documents",
      title: "Простое хранилище admission-файлов",
      rows: [
        { label: "Transcript", value: "Загружен" },
        { label: "Resume", value: "Загружен" },
        { label: "Passport", value: "Missing" },
      ],
    },
  },
];
