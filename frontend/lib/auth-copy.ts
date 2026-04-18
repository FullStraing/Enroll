import type { Locale } from "@/lib/i18n";

type AuthFlowCopy = {
  verifyTitle: string;
  verificationCode: string;
  verificationCodePlaceholder: string;
  sendVerificationCode: string;
  verifyEmail: string;
  editRegistrationDetails: string;
  resendCode: string;
  verifyFailed: string;
  verificationSent: string;
  verificationRestore: string;
  verificationExpiresIn: string;
  resendAvailableIn: string;
  verifyEmailBeforeLogin: string;
  emailSentTo: string;
};

const authFlowCopy: Record<Locale, AuthFlowCopy> = {
  ru: {
    verifyTitle: "Подтверди почту",
    verificationCode: "Код из письма",
    verificationCodePlaceholder: "123456",
    sendVerificationCode: "Отправить код",
    verifyEmail: "Подтвердить почту",
    editRegistrationDetails: "Изменить данные",
    resendCode: "Отправить код ещё раз",
    verifyFailed: "Не удалось подтвердить почту.",
    verificationSent: "Мы отправили 6-значный код на эту почту.",
    verificationRestore: "Черновик подтверждения восстановлен. Введи код из письма.",
    verificationExpiresIn: "Код действует ещё",
    resendAvailableIn: "Повторная отправка будет доступна через",
    verifyEmailBeforeLogin: "Сначала подтверди почту кодом из письма.",
    emailSentTo: "Письмо отправлено на",
  },
  en: {
    verifyTitle: "Verify your email",
    verificationCode: "Email code",
    verificationCodePlaceholder: "123456",
    sendVerificationCode: "Send code",
    verifyEmail: "Verify email",
    editRegistrationDetails: "Edit details",
    resendCode: "Resend code",
    verifyFailed: "Email verification failed.",
    verificationSent: "We sent a 6-digit verification code to this email.",
    verificationRestore: "Your verification step was restored. Enter the code from the email.",
    verificationExpiresIn: "Code expires in",
    resendAvailableIn: "Resend available in",
    verifyEmailBeforeLogin: "Verify your email before logging in.",
    emailSentTo: "Email sent to",
  },
};

export function getAuthFlowCopy(locale: Locale): AuthFlowCopy {
  return authFlowCopy[locale];
}
