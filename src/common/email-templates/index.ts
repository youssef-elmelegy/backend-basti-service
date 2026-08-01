import { verifyOtpTemplate } from './verify-otp.template';
import { verifyOtpArTemplate } from './verify-otp.ar.template';
import { welcomeTemplate } from './welcome.template';
import { welcomeArTemplate } from './welcome.ar.template';
import { passwordResetOtpTemplate } from './password-reset-otp.template';
import { passwordResetOtpArTemplate } from './password-reset-otp.ar.template';
import { adminPasswordResetOtpTemplate } from './admin-password-reset-otp.template';
import { adminPasswordResetOtpArTemplate } from './admin-password-reset-otp.ar.template';

export { verifyOtpTemplate } from './verify-otp.template';
export { verifyOtpArTemplate } from './verify-otp.ar.template';
export { welcomeTemplate } from './welcome.template';
export { welcomeArTemplate } from './welcome.ar.template';
export { passwordResetOtpTemplate } from './password-reset-otp.template';
export { passwordResetOtpArTemplate } from './password-reset-otp.ar.template';
export { adminPasswordResetOtpTemplate } from './admin-password-reset-otp.template';
export { adminPasswordResetOtpArTemplate } from './admin-password-reset-otp.ar.template';

/** Languages that have a hand-written template set. */
export type EmailLanguage = 'en' | 'ar';

/**
 * Subject lines per language. Kept beside the templates so a new language is
 * one entry here plus one template file — the subject can't be forgotten,
 * which would otherwise ship an Arabic body under an English subject.
 */
const SUBJECTS = {
  verifyOtp: {
    en: 'Verify Your Email - Basti',
    ar: 'تأكيد بريدك الإلكتروني - Basti',
  },
  welcome: {
    en: 'Welcome to Basti!',
    ar: 'مرحبًا بك في Basti!',
  },
  passwordReset: {
    en: 'Reset Your Password - Basti',
    ar: 'إعادة تعيين كلمة المرور - Basti',
  },
  adminPasswordReset: {
    en: 'Admin Password Reset - Basti',
    ar: 'إعادة تعيين كلمة مرور المشرف - Basti',
  },
} as const;

export interface RenderedEmail {
  subject: string;
  html: string;
}

export function renderVerifyOtpEmail(
  lang: EmailLanguage,
  otp: string,
  userName: string,
): RenderedEmail {
  return {
    subject: SUBJECTS.verifyOtp[lang],
    html: lang === 'ar' ? verifyOtpArTemplate(otp, userName) : verifyOtpTemplate(otp, userName),
  };
}

export function renderWelcomeEmail(lang: EmailLanguage, firstName: string): RenderedEmail {
  return {
    subject: SUBJECTS.welcome[lang],
    html: lang === 'ar' ? welcomeArTemplate(firstName) : welcomeTemplate(firstName),
  };
}

export function renderPasswordResetOtpEmail(
  lang: EmailLanguage,
  otp: string,
  userName: string,
): RenderedEmail {
  return {
    subject: SUBJECTS.passwordReset[lang],
    html:
      lang === 'ar'
        ? passwordResetOtpArTemplate(otp, userName)
        : passwordResetOtpTemplate(otp, userName),
  };
}

export function renderAdminPasswordResetOtpEmail(
  lang: EmailLanguage,
  otp: string,
  adminName?: string,
): RenderedEmail {
  return {
    subject: SUBJECTS.adminPasswordReset[lang],
    html:
      lang === 'ar'
        ? adminPasswordResetOtpArTemplate(otp, adminName)
        : adminPasswordResetOtpTemplate(otp, adminName),
  };
}
