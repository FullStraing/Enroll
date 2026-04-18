import type { Locale } from "@/lib/i18n";
import type { IntroQuizAnswers } from "@/lib/intro-quiz";

type OptionGroupKey =
  | "countryOptions"
  | "schoolLevelOptions"
  | "intakeOptions"
  | "majorOptions"
  | "gpaScaleOptions"
  | "testOptions"
  | "shortlistOptions";

type IntroQuizStep = {
  title: string;
  subtitle?: string;
};

type IntroQuizContent = {
  back: string;
  next: string;
  saveError: string;
  saving: string;
  goToDashboard: string;
  createAccount: string;
  login: string;
  profileReady: string;
  step: string;
  of: string;
  enterValue: string;
  gpaDeferredHint: string;
  gpaInputHint: string;
  valuePercentExample: string;
  valueGpaExample: string;
  completeTitle: string;
  completeSubtitle: string;
  summaryCountry: string;
  summaryLevel: string;
  summaryMajor: string;
  summaryPlan: string;
  summaryShortlist: string;
  unknownValue: string;
  countryOptions: string[];
  schoolLevelOptions: string[];
  intakeOptions: string[];
  majorOptions: string[];
  gpaScaleOptions: string[];
  testOptions: string[];
  shortlistOptions: string[];
  noTestsOption: string;
  steps: IntroQuizStep[];
};

const INTRO_QUIZ_CONTENT: Record<Locale, IntroQuizContent> = {
  ru: {
    back: "Назад",
    next: "Далее",
    saveError: "Не удалось сохранить ответы в профиль.",
    saving: "Сохраняем...",
    goToDashboard: "Перейти в Dashboard",
    createAccount: "Создать аккаунт",
    login: "Войти",
    profileReady: "Профиль собран",
    step: "Шаг",
    of: "из",
    enterValue: "Текущее значение",
    gpaDeferredHint: "Если точный GPA ещё не готов, это можно посчитать позже.",
    gpaInputHint: "Мы сохраним шкалу и значение отдельно, чтобы дальше считать профиль корректно.",
    valuePercentExample: "Например: 87",
    valueGpaExample: "Например: 3.7",
    completeTitle: "Готово! Стартовый профиль собран.",
    completeSubtitle: "Дальше покажем персональный стартовый план подачи.",
    summaryCountry: "Страна",
    summaryLevel: "Класс",
    summaryMajor: "Направление",
    summaryPlan: "Старт",
    summaryShortlist: "Шортлист",
    unknownValue: "N/A",
    countryOptions: ["Кыргызстан", "Казахстан", "Узбекистан", "Россия", "Украина", "Турция", "Индия", "Другая страна"],
    schoolLevelOptions: ["9 класс", "10 класс", "11 класс", "12 класс", "Gap year", "Уже в колледже"],
    intakeOptions: ["2027", "2028", "2029+", "Ещё не решил"],
    majorOptions: [
      "Computer Science",
      "Business / Economics",
      "Engineering",
      "Biology / Medicine",
      "Social Sciences",
      "Arts / Design",
      "Ещё не определился",
    ],
    gpaScaleOptions: ["GPA 4.0 (unweighted)", "GPA 5.0 / локальная шкала", "Проценты", "Ещё не знаю"],
    testOptions: ["SAT", "ACT", "TOEFL", "IELTS", "Duolingo English Test", "Пока без тестов"],
    shortlistOptions: ["3", "5", "8", "10+", "Не знаю"],
    noTestsOption: "Пока без тестов",
    steps: [
      { title: "В какой стране ты учишься сейчас?" },
      { title: "В каком ты сейчас классе?" },
      { title: "Когда планируешь начать учёбу в США?" },
      { title: "Какое направление тебе интересно?" },
      {
        title: "Какой у тебя текущий GPA / средний балл?",
        subtitle: "Если точный GPA ещё не готов, это можно посчитать позже.",
      },
      { title: "Какие тесты уже есть или планируешь сдавать?", subtitle: "Можно выбрать несколько вариантов." },
      { title: "Сколько университетов добавить в стартовый шортлист?" },
    ],
  },
  en: {
    back: "Back",
    next: "Continue",
    saveError: "Failed to save answers to your profile.",
    saving: "Saving...",
    goToDashboard: "Go to Dashboard",
    createAccount: "Create account",
    login: "Log in",
    profileReady: "Profile ready",
    step: "Step",
    of: "of",
    enterValue: "Current value",
    gpaDeferredHint: "If you do not know the exact GPA yet, you can calculate it later.",
    gpaInputHint: "We keep the scale and raw value separately so your profile stays comparable later.",
    valuePercentExample: "For example: 87",
    valueGpaExample: "For example: 3.7",
    completeTitle: "Done! Your starting profile is ready.",
    completeSubtitle: "Next we will show your personalized admissions starting plan.",
    summaryCountry: "Country",
    summaryLevel: "Level",
    summaryMajor: "Major",
    summaryPlan: "Intake",
    summaryShortlist: "Shortlist",
    unknownValue: "N/A",
    countryOptions: ["Kyrgyzstan", "Kazakhstan", "Uzbekistan", "Russia", "Ukraine", "Turkey", "India", "Another country"],
    schoolLevelOptions: ["9th grade", "10th grade", "11th grade", "12th grade", "Gap year", "Already in college"],
    intakeOptions: ["2027", "2028", "2029+", "Not sure yet"],
    majorOptions: [
      "Computer Science",
      "Business / Economics",
      "Engineering",
      "Biology / Medicine",
      "Social Sciences",
      "Arts / Design",
      "Not decided yet",
    ],
    gpaScaleOptions: ["GPA 4.0 (unweighted)", "GPA 5.0 / local scale", "Percentage", "Not sure yet"],
    testOptions: ["SAT", "ACT", "TOEFL", "IELTS", "Duolingo English Test", "No tests yet"],
    shortlistOptions: ["3", "5", "8", "10+", "Not sure"],
    noTestsOption: "No tests yet",
    steps: [
      { title: "Which country are you studying in right now?" },
      { title: "What school year are you in now?" },
      { title: "When do you plan to start studying in the US?" },
      { title: "Which major are you interested in?" },
      {
        title: "What is your current GPA / average grade?",
        subtitle: "If you do not know the exact GPA yet, you can calculate it later.",
      },
      { title: "Which tests do you already have or plan to take?", subtitle: "You can choose multiple options." },
      { title: "How many universities should we add to your initial shortlist?" },
    ],
  },
};

function getAlternateLocale(locale: Locale): Locale {
  return locale === "ru" ? "en" : "ru";
}

function localizeSingleOption(group: OptionGroupKey, value: string, locale: Locale) {
  if (!value) return value;

  const targetOptions = INTRO_QUIZ_CONTENT[locale][group];
  if (targetOptions.includes(value)) {
    return value;
  }

  const alternateOptions = INTRO_QUIZ_CONTENT[getAlternateLocale(locale)][group];
  const alternateIndex = alternateOptions.indexOf(value);
  if (alternateIndex >= 0) {
    return targetOptions[alternateIndex] ?? value;
  }

  return value;
}

export function getIntroQuizContent(locale: Locale) {
  return INTRO_QUIZ_CONTENT[locale];
}

export function localizeIntroQuizAnswers(answers: IntroQuizAnswers, locale: Locale): IntroQuizAnswers {
  return {
    ...answers,
    country: answers.country ? localizeSingleOption("countryOptions", answers.country, locale) : answers.country,
    schoolLevel: answers.schoolLevel ? localizeSingleOption("schoolLevelOptions", answers.schoolLevel, locale) : answers.schoolLevel,
    intakeYear: answers.intakeYear ? localizeSingleOption("intakeOptions", answers.intakeYear, locale) : answers.intakeYear,
    major: answers.major ? localizeSingleOption("majorOptions", answers.major, locale) : answers.major,
    gpaScale: answers.gpaScale ? localizeSingleOption("gpaScaleOptions", answers.gpaScale, locale) : answers.gpaScale,
    tests: Array.isArray(answers.tests)
      ? answers.tests.map((value) => localizeSingleOption("testOptions", value, locale))
      : answers.tests,
    shortlistSize: answers.shortlistSize
      ? localizeSingleOption("shortlistOptions", answers.shortlistSize, locale)
      : answers.shortlistSize,
  };
}

export function getGpaScaleDetails(scale: string | undefined, locale: Locale) {
  const options = INTRO_QUIZ_CONTENT[locale].gpaScaleOptions;
  const resolvedScale = localizeSingleOption("gpaScaleOptions", scale || "", locale);
  const scaleIndex = options.indexOf(resolvedScale);

  switch (scaleIndex) {
    case 0:
      return { kind: "gpa4", max: 4, step: "0.01", placeholder: INTRO_QUIZ_CONTENT[locale].valueGpaExample, requiresValue: true };
    case 1:
      return { kind: "gpa5", max: 5, step: "0.01", placeholder: INTRO_QUIZ_CONTENT[locale].valueGpaExample, requiresValue: true };
    case 2:
      return { kind: "percentage", max: 100, step: "0.1", placeholder: INTRO_QUIZ_CONTENT[locale].valuePercentExample, requiresValue: true };
    case 3:
      return { kind: "unknown", max: 0, step: "0", placeholder: "", requiresValue: false };
    default:
      return null;
  }
}
