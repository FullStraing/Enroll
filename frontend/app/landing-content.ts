import type { Locale } from "@/lib/i18n";

export const landingTheme = {
  bg: "#FCFAF5",
  black: "#000000",
  white: "#FFFFFF",
  primary: "#FFDB58",
  orange: "#F8D6B3",
  cyan: "#DAF5F0",
  sand: "#F3EDE2",
  yellowSoft: "#FFF4CC",
  line: "rgba(0, 0, 0, 0.12)",
};

const content = {
  ru: {
    home: {
      hero: {
        badge: "Admissions OS",
        title: ["Вся подача в США", "в одной системе"],
        description:
          "Enroll собирает вузы, дедлайны, эссе и документы в одну рабочую систему. Вместо таблиц, чатов и ста вкладок ты видишь один понятный следующий шаг.",
        secondaryCta: "Как это работает",
        footer: "Без карты · Настроишь за вечер",
      },
      problem: {
        eyebrow: "Зачем менять привычки",
        title: "Ты уже знаешь этот хаос",
        description:
          "Новый инструмент нужен не ради красивого интерфейса. Он нужен, когда старый способ уже мешает двигаться дальше.",
      },
      modules: {
        eyebrow: "Продукт",
        title: "Шесть модулей — ноль лишнего",
        description: "Не ещё один todo-app, а связанный admissions workflow для реальной подачи.",
      },
      process: {
        eyebrow: "Процесс",
        title: "Настроишь за вечер",
        description: "Сначала собираешь основу, потом Enroll удерживает контекст и один следующий шаг.",
      },
      trust: {
        eyebrow: "Почему доверяют",
        title: "Не обещаем магию. Делаем систему.",
        description: "Пока без выдуманных цифр и громких обещаний — только честный продуктовый слой перед бетой.",
      },
      faq: {
        eyebrow: "FAQ",
        title: "Частые вопросы",
        description: "Короткие ответы на то, что чаще всего важно понять до начала.",
      },
      final: {
        title: ["Один вечер вместо", "месяца хаоса"],
        description:
          "Собери shortlist, добавь дедлайны и начни работать по одному следующему шагу. Бесплатно, без карты и без лишнего шума.",
        secondaryCta: "Тарифы",
        note: "Intro quiz остаётся частью входного пути для новых пользователей.",
      },
      comparisons: [
        {
          pain: "Информация разбросана по вкладкам, чатам и заметкам.",
          relief: "Все в одном месте: от shortlist до документов.",
          tone: "yellow" as const,
        },
        {
          pain: "Дедлайны теряются между типами подач и университетами.",
          relief: "Каждый дедлайн привязан к вузу, статусу и следующему шагу.",
          tone: "cyan" as const,
        },
        {
          pain: "Эссе, документы и формы живут отдельно друг от друга.",
          relief: "Один workflow: написал, сохранил, прикрепил, отправил.",
          tone: "sand" as const,
        },
        {
          pain: "Непонятно, что делать сегодня, чтобы не сорвать подачу позже.",
          relief: "Dashboard и задачи показывают один следующий шаг вместо хаоса.",
          tone: "orange" as const,
        },
      ],
      modulesList: [
        {
          title: "Shortlist",
          body: "Все университеты в одном списке. Категории, приоритеты и статусы рядом.",
          tone: "yellow" as const,
        },
        {
          title: "Дедлайны",
          body: "Подачи, решения и важные даты собраны в одну читаемую систему.",
          tone: "cyan" as const,
        },
        {
          title: "Essay workspace",
          body: "Один редактор для всех эссе. Версии, AI-помощь и связь с вузом.",
          tone: "sand" as const,
        },
        {
          title: "Dashboard",
          body: "Статус поступления и следующий шаг видны сразу после входа.",
          tone: "yellow" as const,
        },
        {
          title: "Document vault",
          body: "Транскрипты, рекомендации и файлы лежат в структурированном хранилище.",
          tone: "cyan" as const,
        },
        {
          title: "Common App",
          body: "Каждый раздел заполняется как задача. Ничего не теряется по пути.",
          tone: "sand" as const,
        },
      ],
      steps: [
        {
          number: "01",
          title: "Добавь университеты",
          body: "Собери shortlist, а Enroll подтянет дедлайны, статусы и ориентиры по подаче.",
          tone: "yellow" as const,
        },
        {
          number: "02",
          title: "Работай по задачам",
          body: "Dashboard показывает, что важно сегодня. Никаких забытых шагов и потерянных форм.",
          tone: "cyan" as const,
        },
        {
          number: "03",
          title: "Собери подачу",
          body: "Эссе, документы и профиль лежат рядом, поэтому финальная подача не превращается в хаос.",
          tone: "sand" as const,
        },
      ],
      trustReasons: [
        "Сначала доводим стабильный workflow до ума, а не обещаем магию на словах.",
        "Без выдуманных гарантий поступления. Enroll помогает держать процесс под контролем.",
        "Universities, tasks, documents, essays и Common App уже работают как одна система.",
      ],
      faqItems: [
        {
          question: "Это подписка или разовый платёж?",
          answer:
            "Основной платный формат сейчас — доступ на длинный цикл подачи. На странице тарифов отдельно видно, как меняется цена между monthly и annual.",
        },
        {
          question: "Можно начать бесплатно?",
          answer:
            "Да. Вход в продукт начинается с intro quiz, после которого можно пройти onboarding и посмотреть базовый workflow до оплаты.",
        },
        {
          question: "Для кого Enroll?",
          answer:
            "Для школьников и студентов, которые готовят подачу в зарубежные университеты и хотят держать shortlist, дедлайны, эссе и документы в одной системе.",
        },
        {
          question: "Гарантируете поступление?",
          answer:
            "Нет. Enroll не обещает admission outcome. Продукт помогает структурировать подачу и не терять ключевые шаги по пути.",
        },
        {
          question: "Что будет с моими данными?",
          answer:
            "Документы, эссе и профильные данные хранятся внутри твоего аккаунта и используются для работы продукта. Перед публичным масштабированием мы отдельно усиливаем privacy и security controls.",
        },
      ],
    },
    product: {
      hero: {
        badge: "Product",
        title: ["Один продукт", "для всей подачи"],
        description:
          "Enroll связывает shortlist, дедлайны, задачи, эссе, документы и Common App в один рабочий процесс. Ты не собираешь подачу из разрозненных инструментов.",
      },
      workflow: {
        eyebrow: "Workflow",
        title: "Как это складывается в одну систему",
        description:
          "Главная цель Enroll — убрать разрывы между планированием, задачами, эссе, документами и реальной подачей.",
      },
      modules: {
        eyebrow: "Modules",
        title: "Что уже собрано внутри",
        description: "Каждый модуль решает одну понятную часть подачи, но работает в связке с остальными.",
      },
      final: {
        title: ["Понимаешь систему", "быстрее, чем входишь в хаос"],
        description: "Начни с intro quiz, собери основу и посмотри, как Enroll превращает подачу в один процесс.",
        secondaryCta: "Тарифы",
        note: "Для новых пользователей входной путь начинается с intro quiz.",
      },
      workflowList: [
        "Сначала ты собираешь shortlist и закрепляешь реальные дедлайны.",
        "Потом работаешь по приоритетам через dashboard и today-first задачи.",
        "Дальше подключаешь эссе, документы и профиль без ручного склеивания контекста.",
        "В итоге подача выглядит как один понятный процесс, а не как десять разрозненных инструментов.",
      ],
      sections: [
        {
          eyebrow: "Что внутри",
          title: "Dashboard собирает всю картину в один экран.",
          body:
            "Ты видишь shortlist, задачи, профиль, дедлайны и следующие действия в одном месте, а не по разным сервисам и заметкам.",
          tone: "cyan" as const,
          preview: {
            label: "Dashboard",
            title: "Один экран для всего процесса",
            rows: [
              { label: "Следующие шаги", value: "3 активны" },
              { label: "Университеты", value: "6 в списке" },
              { label: "Документы", value: "4 загружены" },
            ],
          },
        },
        {
          eyebrow: "Планирование",
          title: "Universities и дедлайны больше не живут отдельно.",
          body:
            "Каждый вуз связан со статусом, шансом, дедлайнами и подачей. Ты не теряешь контекст между исследованием и действием.",
          tone: "yellow" as const,
          preview: {
            label: "Universities",
            title: "Shortlist с реальным статусом",
            rows: [
              { label: "Harvard", value: "Planning" },
              { label: "Auburn", value: "Applying" },
              { label: "Asbury", value: "Likely" },
            ],
          },
        },
        {
          eyebrow: "Рабочий цикл",
          title: "Эссе, документы и Common App не выпадают из процесса.",
          body:
            "Редактор эссе, document vault и профильные формы встроены в одну систему, поэтому финальная подача не собирается из случайных файлов.",
          tone: "orange" as const,
          preview: {
            label: "Application workflow",
            title: "От черновика до готовности к подаче",
            rows: [
              { label: "Essay draft", value: "v3" },
              { label: "Documents", value: "Ready" },
              { label: "Common App", value: "In progress" },
            ],
          },
        },
      ],
    },
  },
  en: {
    home: {
      hero: {
        badge: "Admissions OS",
        title: ["Your full US application", "in one system"],
        description:
          "Enroll brings universities, deadlines, essays, and documents into one working system. Instead of tables, chats, and a hundred tabs, you see one clear next step.",
        secondaryCta: "How it works",
        footer: "No card · Set up in one evening",
      },
      problem: {
        eyebrow: "Why switch",
        title: "You already know this chaos",
        description:
          "A better tool is not about looking nicer. It matters when the old way already slows everything down.",
      },
      modules: {
        eyebrow: "Product",
        title: "Six modules — nothing extra",
        description: "Not another todo app, but one connected admissions workflow for a real application cycle.",
      },
      process: {
        eyebrow: "Process",
        title: "Set it up in one evening",
        description: "First you build the base, then Enroll keeps the context and the next step clear.",
      },
      trust: {
        eyebrow: "Why trust it",
        title: "No magic promises. Just a real system.",
        description: "No fake counters and no hype — just a product layer that makes the application cycle easier to control.",
      },
      faq: {
        eyebrow: "FAQ",
        title: "Common questions",
        description: "Short answers to what most people want to understand before starting.",
      },
      final: {
        title: ["One evening instead of", "a month of chaos"],
        description:
          "Build your shortlist, add deadlines, and start working from one clear next step. Free to start, no card, no extra noise.",
        secondaryCta: "Pricing",
        note: "Intro quiz stays part of the new-user entry flow.",
      },
      comparisons: [
        {
          pain: "Your application info is spread across tabs, chats, and notes.",
          relief: "Everything in one place: from shortlist to documents.",
          tone: "yellow" as const,
        },
        {
          pain: "Deadlines get lost between application rounds and universities.",
          relief: "Every deadline is tied to the university, status, and next step.",
          tone: "cyan" as const,
        },
        {
          pain: "Essays, documents, and forms live separately from each other.",
          relief: "One workflow: draft, save, attach, submit.",
          tone: "sand" as const,
        },
        {
          pain: "It is hard to know what to do today to avoid problems later.",
          relief: "Dashboard and tasks show one next step instead of more chaos.",
          tone: "orange" as const,
        },
      ],
      modulesList: [
        {
          title: "Shortlist",
          body: "All universities in one list. Categories, priorities, and status sit together.",
          tone: "yellow" as const,
        },
        {
          title: "Deadlines",
          body: "Applications, decision dates, and important milestones in one readable system.",
          tone: "cyan" as const,
        },
        {
          title: "Essay workspace",
          body: "One editor for every essay. Versions, AI help, and university context.",
          tone: "sand" as const,
        },
        {
          title: "Dashboard",
          body: "Application status and the next step are visible right after you log in.",
          tone: "yellow" as const,
        },
        {
          title: "Document vault",
          body: "Transcripts, recommendations, and files stay in one structured vault.",
          tone: "cyan" as const,
        },
        {
          title: "Common App",
          body: "Each section becomes a task, so nothing gets lost on the way.",
          tone: "sand" as const,
        },
      ],
      steps: [
        {
          number: "01",
          title: "Add universities",
          body: "Build your shortlist, and Enroll pulls in deadlines, statuses, and application context.",
          tone: "yellow" as const,
        },
        {
          number: "02",
          title: "Work through tasks",
          body: "Dashboard shows what matters today. No forgotten steps, no lost forms.",
          tone: "cyan" as const,
        },
        {
          number: "03",
          title: "Assemble the application",
          body: "Essays, documents, and profile data stay together, so final submission does not turn into chaos.",
          tone: "sand" as const,
        },
      ],
      trustReasons: [
        "We focus on making the workflow stable first, not on making big promises.",
        "No fake admission guarantees. Enroll helps you keep the process under control.",
        "Universities, tasks, documents, essays, and Common App already work as one system.",
      ],
      faqItems: [
        {
          question: "Is this a subscription or a one-time payment?",
          answer: "The paid setup currently focuses on the full application cycle. The pricing page shows the difference between monthly and annual billing clearly.",
        },
        {
          question: "Can I start for free?",
          answer: "Yes. The product flow starts with the intro quiz, then you can go through onboarding and see the basic workflow before paying.",
        },
        {
          question: "Who is Enroll for?",
          answer: "For students applying abroad who want their shortlist, deadlines, essays, and documents in one system.",
        },
        {
          question: "Do you guarantee admission?",
          answer: "No. Enroll does not promise admission outcomes. It helps structure the process and avoid missing important steps.",
        },
        {
          question: "What happens to my data?",
          answer: "Documents, essays, and profile data stay inside your account and are used to power the workflow. We are still tightening privacy and security controls before broader rollout.",
        },
      ],
    },
    product: {
      hero: {
        badge: "Product",
        title: ["One product", "for the full application"],
        description:
          "Enroll connects shortlist, deadlines, tasks, essays, documents, and Common App into one working process. You are not stitching the application together from disconnected tools.",
      },
      workflow: {
        eyebrow: "Workflow",
        title: "How it becomes one system",
        description: "The main goal of Enroll is to remove breaks between planning, tasks, essays, documents, and real submission work.",
      },
      modules: {
        eyebrow: "Modules",
        title: "What is already inside",
        description: "Each module solves one clear part of the process, but works together with the rest.",
      },
      final: {
        title: ["Understand the system", "before the chaos starts"],
        description: "Start with the intro quiz, build the base, and see how Enroll turns the application cycle into one process.",
        secondaryCta: "Pricing",
        note: "For new users, the entry flow still starts with the intro quiz.",
      },
      workflowList: [
        "First you build the shortlist and attach real deadlines.",
        "Then you work through priorities from the dashboard and today-first task list.",
        "Next you connect essays, documents, and profile data without manually rebuilding context.",
        "The result is one clear process instead of ten disconnected tools.",
      ],
      sections: [
        {
          eyebrow: "What is inside",
          title: "Dashboard brings the whole picture into one screen.",
          body:
            "You can see shortlist, tasks, profile, deadlines, and next actions in one place instead of across separate services and notes.",
          tone: "cyan" as const,
          preview: {
            label: "Dashboard",
            title: "One screen for the full process",
            rows: [
              { label: "Next steps", value: "3 active" },
              { label: "Universities", value: "6 in list" },
              { label: "Documents", value: "4 uploaded" },
            ],
          },
        },
        {
          eyebrow: "Planning",
          title: "Universities and deadlines no longer live separately.",
          body:
            "Every university is connected to status, chance, deadlines, and application context. You do not lose the link between research and action.",
          tone: "yellow" as const,
          preview: {
            label: "Universities",
            title: "A shortlist with real status",
            rows: [
              { label: "Harvard", value: "Planning" },
              { label: "Auburn", value: "Applying" },
              { label: "Asbury", value: "Likely" },
            ],
          },
        },
        {
          eyebrow: "Work cycle",
          title: "Essays, documents, and Common App stay in the same flow.",
          body:
            "The essay editor, document vault, and profile forms all live inside one system, so final submission is not assembled from random files.",
          tone: "orange" as const,
          preview: {
            label: "Application workflow",
            title: "From draft to ready-to-submit",
            rows: [
              { label: "Essay draft", value: "v3" },
              { label: "Documents", value: "Ready" },
              { label: "Common App", value: "In progress" },
            ],
          },
        },
      ],
    },
  },
} as const;

export function getLandingContent(locale: Locale) {
  return content[locale];
}
