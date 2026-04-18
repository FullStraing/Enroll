import type { Locale } from "@/lib/i18n";

export type SettingsCopy = {
  title: string;
  subtitle: string;
  account: string;
  accountHint: string;
  displayName: string;
  email: string;
  emailLoginReady: string;
  emailLoginMissing: string;
  editProfile: string;
  preferences: string;
  preferencesHint: string;
  theme: string;
  themeHint: string;
  themeLight: string;
  themeDark: string;
  language: string;
  languageHint: string;
  languageRussian: string;
  languageEnglish: string;
  security: string;
  securityHint: string;
  currentPassword: string;
  currentPasswordHint: string;
  createPasswordHint: string;
  newPassword: string;
  confirmPassword: string;
  confirmPasswordHint: string;
  passwordMismatch: string;
  changePassword: string;
  changingPassword: string;
  passwordUpdated: string;
  changePasswordFailed: string;
  session: string;
  sessionHint: string;
  logout: string;
};

const SETTINGS_COPY: Record<Locale, SettingsCopy> = {
  ru: {
    title: "Настройки",
    subtitle: "Язык, тема и безопасность аккаунта в одном месте.",
    account: "Аккаунт",
    accountHint: "Базовая информация аккаунта. Детали профиля редактируются отдельно.",
    displayName: "Имя в аккаунте",
    email: "Email",
    emailLoginReady: "Вход по email уже доступен.",
    emailLoginMissing: "Сейчас вход идёт только через Google. Ниже можно создать пароль для входа по email.",
    editProfile: "Открыть Edit Profile",
    preferences: "Интерфейс",
    preferencesHint: "Язык и тема вынесены сюда, чтобы верхняя панель оставалась чище.",
    theme: "Тема",
    themeHint: "Светлая или тёмная тема для всего workspace.",
    themeLight: "Светлая",
    themeDark: "Тёмная",
    language: "Язык",
    languageHint: "Язык интерфейса применяется сразу во всём продукте.",
    languageRussian: "Русский",
    languageEnglish: "English",
    security: "Пароль",
    securityHint: "Меняй пароль здесь. Для Google-only аккаунта можно создать пароль с нуля.",
    currentPassword: "Текущий пароль",
    currentPasswordHint: "Нужен для подтверждения смены пароля.",
    createPasswordHint: "Текущий пароль не нужен, потому что у аккаунта его ещё нет.",
    newPassword: "Новый пароль",
    confirmPassword: "Повторите новый пароль",
    confirmPasswordHint: "Используй минимум 8 символов и неочевидную комбинацию.",
    passwordMismatch: "Новый пароль и повтор пароля не совпадают.",
    changePassword: "Обновить пароль",
    changingPassword: "Обновляем...",
    passwordUpdated: "Пароль обновлён.",
    changePasswordFailed: "Не удалось обновить пароль.",
    session: "Сессия",
    sessionHint: "Выход очистит локальные токены и вернёт тебя на главную.",
    logout: "Выйти из аккаунта",
  },
  en: {
    title: "Settings",
    subtitle: "Language, theme, and account security in one place.",
    account: "Account",
    accountHint: "Basic account details. Profile data is edited separately.",
    displayName: "Display name",
    email: "Email",
    emailLoginReady: "Email login is already enabled for this account.",
    emailLoginMissing: "This account currently signs in through Google only. You can create an email password below.",
    editProfile: "Open Edit Profile",
    preferences: "Preferences",
    preferencesHint: "Theme and language live here now so the top bar stays cleaner.",
    theme: "Theme",
    themeHint: "Light or dark mode for the whole workspace.",
    themeLight: "Light",
    themeDark: "Dark",
    language: "Language",
    languageHint: "The interface language updates across the product immediately.",
    languageRussian: "Russian",
    languageEnglish: "English",
    security: "Password",
    securityHint: "Change your password here. Google-only accounts can create one from scratch.",
    currentPassword: "Current password",
    currentPasswordHint: "Required to confirm a password change.",
    createPasswordHint: "No current password is needed because this account does not have one yet.",
    newPassword: "New password",
    confirmPassword: "Confirm new password",
    confirmPasswordHint: "Use at least 8 characters and a non-obvious combination.",
    passwordMismatch: "New password and confirmation do not match.",
    changePassword: "Update password",
    changingPassword: "Updating...",
    passwordUpdated: "Password updated.",
    changePasswordFailed: "Failed to update password.",
    session: "Session",
    sessionHint: "Logging out clears local tokens and sends you back home.",
    logout: "Log out",
  },
};

export function getSettingsCopy(locale: Locale): SettingsCopy {
  return SETTINGS_COPY[locale];
}
