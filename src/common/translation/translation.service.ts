import { TranslationObject } from './../../types/translation.types';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { TranslationDto, TranslationResponse } from './translation.dto';
import { SuccessResponse } from '@/types';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { env } from '@/env';
import { Translate } from '@google-cloud/translate/build/src/v2';
import { successResponse } from '@/utils';
import { SQL, sql } from 'drizzle-orm';
import { AnyPgColumn } from 'drizzle-orm/pg-core';
import { Credentials, Translator } from '@translated/lara';

export type TranslationArgs = Record<string, string | number | boolean | null | undefined>;

/**
 * Like {@link TranslationArgs} but an interpolation arg may itself be a bilingual
 * TranslationObject (e.g. an offer name that is user content). Each language
 * render then embeds the matching variant — see {@link TranslationService.buildTranslationObject}.
 */
export type LocalizableArg = string | number | boolean | null | undefined | TranslationObject;
export type LocalizableArgs = Record<string, LocalizableArg>;

const SUPPORTED_LANGUAGES = ['en', 'ar'];

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);
  private translate: Translate;

  private credentials: Credentials;
  private lara: Translator;

  constructor(private readonly i18nService: I18nService) {
    this.translate = new Translate({
      projectId: env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: env.GOOGLE_CLOUD_KEY_FILE,
    });

    this.credentials = new Credentials(env.LARA_ACCESS_KEY_ID, env.LARA_ACCESS_KEY_SECRET);
    this.lara = new Translator(this.credentials);
  }

  staticTranslate(key: string, lang?: string, args?: TranslationArgs): string {
    const context = I18nContext.current();
    return this.i18nService.t(key, {
      lang: lang ?? context?.lang ?? 'en',
      args,
    });
  }

  /**
   * Builds a fully bilingual { en, ar } object from a STATIC i18n catalogue key,
   * rendering both languages locally with ZERO machine-translation calls. This is
   * the path for templated, system-generated copy such as notification
   * titles/bodies — reserve the paid translator ({@link getTranslationObject})
   * for free-text user/admin content only.
   *
   * Interpolation args may themselves be bilingual TranslationObjects (e.g. an
   * offer name that is user content); each language render then embeds the
   * matching variant, so the Arabic body gets the Arabic name and the English
   * body the English one.
   */
  buildTranslationObject(key: string, args?: LocalizableArgs): TranslationObject {
    return {
      en: this.renderStatic(key, 'en', args),
      ar: this.renderStatic(key, 'ar', args),
    };
  }

  private renderStatic(key: string, lang: 'en' | 'ar', args?: LocalizableArgs): string {
    const resolvedArgs: TranslationArgs = {};
    if (args) {
      for (const [name, value] of Object.entries(args)) {
        resolvedArgs[name] = this.isTranslationObject(value)
          ? value[lang] || value.en || ''
          : value;
      }
    }
    // Keys live in messages.json under the `messages` namespace, matching the
    // response interceptor/filter convention (`messages.<key>`).
    return this.i18nService.t(`messages.${key}`, { lang, args: resolvedArgs, defaultValue: key });
  }

  private isTranslationObject(value: LocalizableArg): value is TranslationObject {
    return typeof value === 'object' && value !== null && 'en' in value && 'ar' in value;
  }

  // async dynamicTranslate(dto: TranslationDto): Promise<SuccessResponse<TranslationResponse>> {
  //   const { text, targetLang, sourceLang } = dto;

  //   try {

  //     if (!targetLang || !sourceLang) {
  //       throw new Error('Unsupported language');
  //     }

  //     const [res] = await this.translate.translate(text, {
  //       from: sourceLang,
  //       to: targetLang,
  //     });

  //     return successResponse({ result: res }, 'routes.common.translation_successful');
  //   } catch (error) {
  //     if (error instanceof Error) {
  //       this.logger.error(`Translation failed for text: ${text}`, error.stack);
  //       throw new InternalServerErrorException(error.message);
  //     }
  //     this.logger.error(`Translation failed for text: ${text}`);
  //     throw new InternalServerErrorException('Translation failed');
  //   }
  // }

  /**
   * Calls the MT provider, retrying once on failure with a longer timeout.
   * The retry is deliberately small: it covers a dropped connection or a
   * momentary rate limit without turning a real outage into a slow request.
   */
  private async translateWithRetry(
    text: string,
    sourceLang: string,
    targetLang: string,
  ): Promise<string> {
    const attempts = [8000, 15000];
    let lastError: unknown;

    for (let i = 0; i < attempts.length; i++) {
      try {
        const res = await this.lara.translate(text, sourceLang, targetLang, {
          contentType: 'text/plain',
          style: 'fluid',
          timeoutInMillis: attempts[i],
          priority: 'normal',
        });
        if (i > 0) {
          this.logger.log(`Translation succeeded on retry for text "${text}"`);
        }
        return res.translation;
      } catch (error) {
        lastError = error;
        const errMsg = error instanceof Error ? error.message : String(error);
        if (i < attempts.length - 1) {
          this.logger.warn(`Translation attempt ${i + 1} failed ("${text}"): ${errMsg} — retrying`);
        }
      }
    }

    throw lastError;
  }

  async dynamicTranslate(dto: TranslationDto): Promise<SuccessResponse<TranslationResponse>> {
    const { text, targetLang, sourceLang } = dto;

    try {
      // Retried because callers translate title and body as two independent
      // parallel calls: a single transient failure (timeout, rate limit) makes
      // only one of them fall back to source text, so a notification is stored
      // half-translated. One cheap retry turns the common transient case into
      // a success instead of a permanently wrong row.
      const res = await this.translateWithRetry(text, sourceLang, targetLang);

      return successResponse({ result: res }, 'Translation successful', 200);
    } catch (error) {
      if (error instanceof Error) {
        // Log the provider's own message (rate limit, timeout, bad key…) — it
        // is what tells you why a translation fell back, and it is lost if we
        // only propagate a generic wrapper.
        this.logger.error(
          `Translation failed (${sourceLang}->${targetLang}) for text "${text}": ${error.message}`,
          error.stack,
        );
        throw new InternalServerErrorException(error.message);
      }
      this.logger.error(`Translation failed for text: ${text}`);
      throw new InternalServerErrorException('Translation failed');
    }
  }

  /**
   * Machine-translates free text into a bilingual { en, ar } object.
   *
   * The source language decides the direction: whichever language the text was
   * written in is stored verbatim, and only the *other* side is translated. Get
   * this wrong and the admin's own words get round-tripped through the
   * translator — e.g. English copy stored under `ar` and re-translated into
   * garbage English. Falls back to the request's I18n language, then 'en'.
   */
  async getTranslationObject(text, lang?: string): Promise<TranslationObject> {
    const context = I18nContext.current();
    const sourceLang = lang ? lang : context?.lang || 'en';

    if (!SUPPORTED_LANGUAGES.includes(sourceLang)) {
      throw new Error('Unsupported language');
    }

    const targetLang = sourceLang === 'ar' ? 'en' : 'ar';

    try {
      const tr = await this.dynamicTranslate({ text, targetLang, sourceLang });
      return {
        [sourceLang]: text,
        [targetLang]: tr.data.result,
      } as TranslationObject;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Translation failed for text: ${text}`, error.stack);
        throw new InternalServerErrorException(error.message);
      }
      this.logger.error(`Translation failed for text: ${text}`);
      throw new InternalServerErrorException('Translation failed');
    }
  }

  flattenTranslationObject(translationObject: TranslationObject): string {
    const context = I18nContext.current();
    const lang = context?.lang || 'en';
    if (lang !== 'en' && lang !== 'ar') {
      return translationObject['en'] || '';
    }
    return translationObject[lang] || translationObject['en'] || '';
  }

  getLanguage(): string {
    const context = I18nContext.current();
    return context?.lang || 'en';
  }

  // Overload 1: If an alias (string) is provided, tell TS it returns an Aliased<string> (for SELECT)
  getLocalized(
    column: AnyPgColumn,
    alias: string,
    lang?: string,
    fallback?: string,
  ): SQL.Aliased<string>;

  // Overload 2: If alias is null or omitted, tell TS it returns an SQL<string> (for WHERE)
  getLocalized(column: AnyPgColumn, alias?: null, lang?: string, fallback?: string): SQL<string>;

  // The actual implementation
  getLocalized(
    column: AnyPgColumn,
    alias?: string | null,
    lang?: string,
    fallback: string = 'en',
  ): SQL<string> | SQL.Aliased<string> {
    const locale = lang || this.getLanguage();

    const queryChunk = sql<string>`COALESCE(${column}->>${locale}, ${column}->>${fallback})`;

    return alias ? queryChunk.as(alias) : queryChunk;
  }
}
