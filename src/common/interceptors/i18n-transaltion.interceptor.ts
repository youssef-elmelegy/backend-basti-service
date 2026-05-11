import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { I18nContext } from 'nestjs-i18n';

const SUPPORTED_LANGS = ['en', 'ar'] as const;
type SupportedLang = (typeof SUPPORTED_LANGS)[number];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  if (Array.isArray(value)) return false;
  if (value instanceof Date) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function isTranslationObject(value: Record<string, unknown>): boolean {
  const keys = Object.keys(value);
  if (keys.length !== 2) return false;
  if (!('en' in value) || !('ar' in value)) return false;
  const { en, ar } = value;
  const isStringOrNullish = (v: unknown): boolean =>
    typeof v === 'string' || v === null || v === undefined;
  return isStringOrNullish(en) && isStringOrNullish(ar);
}

function pickLang(obj: Record<string, unknown>, lang: SupportedLang): string {
  const primary = obj[lang];
  if (typeof primary === 'string' && primary.length > 0) return primary;
  // Fall back to the other language if the requested one is empty
  const fallbackKey: SupportedLang = lang === 'en' ? 'ar' : 'en';
  const fallback = obj[fallbackKey];
  if (typeof fallback === 'string') return fallback;
  return '';
}

function localizeDeep(value: unknown, lang: SupportedLang): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => localizeDeep(item, lang));
  }
  if (isPlainObject(value)) {
    if (isTranslationObject(value)) {
      return pickLang(value, lang);
    }
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = localizeDeep(v, lang);
    }
    return result;
  }
  return value;
}

interface LocalizedResponse {
  message?: string;
  args?: Record<string, unknown>;
  data?: unknown;
  [key: string]: unknown;
}

function isLocalizedResponse(value: unknown): value is LocalizedResponse {
  return typeof value === 'object' && value !== null;
}

@Injectable()
export class I18nResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data: unknown) => {
        const i18n = I18nContext.current();
        const rawLang = i18n?.lang;
        const lang: SupportedLang = SUPPORTED_LANGS.includes(rawLang as SupportedLang)
          ? (rawLang as SupportedLang)
          : 'en';

        if (!isLocalizedResponse(data)) {
          return data;
        }

        if (typeof data.message === 'string' && i18n) {
          // Pass data.args to the translation function
          data.message = i18n.t('messages.' + data.message, {
            args: data.args || {},
            defaultValue: data.message,
          });

          if (isLocalizedResponse(data.data) && typeof data.data.message === 'string') {
            data.data.message = i18n.t('messages.' + data.data.message, {
              args: data.args || {},
              defaultValue: data.data.message,
            });
          }

          // Clean up the response so the user doesn't see the raw args object
          delete data.args;
        }

        // Walk the payload and flatten any { en, ar } TranslationObject
        // fields into a single localized string.
        if ('data' in data) {
          data.data = localizeDeep(data.data, lang);
        }

        return data;
      }),
    );
  }
}
