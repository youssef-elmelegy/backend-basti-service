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

type TranslationArgs = Record<string, string | number | boolean | null | undefined>;

const SUPPORTED_LANGUAGES = ['en', 'ar'];

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);
  private translate: Translate;

  private credentials: Credentials;
  private lara: Translator;

  constructor(
    private readonly i18nService: I18nService,
  ) {
    this.translate = new Translate({
      projectId: env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: env.GOOGLE_CLOUD_KEY_FILE,
    })

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

  async dynamicTranslate(dto: TranslationDto): Promise<SuccessResponse<TranslationResponse>> {
    const { text, targetLang, sourceLang } = dto;

    try {
      const res = await this.lara.translate(
        text,
        sourceLang,
        targetLang,
        {
          contentType: 'text/plain',
          style: 'fluid',
          timeoutInMillis: 8000,
          priority: 'normal',
        },
      );

      return successResponse({ result: res.translation }, 'Translation successful', 200);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Translation failed for text: ${text}`, error.stack);
        throw new InternalServerErrorException(error.stack);
      }
      this.logger.error(`Translation failed for text: ${text}`);
      throw new InternalServerErrorException('Translation failed');
    }
  }

  async getTranslationObject(text, lang?: string): Promise<TranslationObject> {
    const context = I18nContext.current();
    const sourceLang = lang ? lang : context?.lang || 'en';

    if (!SUPPORTED_LANGUAGES.includes(sourceLang)) {
      throw new Error('Unsupported language');
    }

    let translationObject: TranslationObject;

    try {
      if (sourceLang === 'en') {
        const tr = await this.dynamicTranslate({ text, targetLang: 'ar', sourceLang: 'en' });
        translationObject = {
          en: text,
          ar: tr.data.result,
        };
      }
      else {
        const tr = await this.dynamicTranslate({ text, targetLang: 'en', sourceLang: 'ar' });
        translationObject = {
          en: tr.data.result,
          ar: text,
        };
      }
      return translationObject;
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
    if(lang !== 'en' && lang !== 'ar') {
      return translationObject['en'] || '';
    }
    return translationObject[lang] || translationObject['en'] || '';
  }

  getLanguage(): string {
    const context = I18nContext.current();
    return context?.lang || 'en';
  }

  // Overload 1: If an alias (string) is provided, tell TS it returns an Aliased<string> (for SELECT)
  getLocalized(column: AnyPgColumn, alias: string, lang?: string, fallback?: string): SQL.Aliased<string>;
  
  // Overload 2: If alias is null or omitted, tell TS it returns an SQL<string> (for WHERE)
  getLocalized(column: AnyPgColumn, alias?: null, lang?: string, fallback?: string): SQL<string>;
  
  // The actual implementation
  getLocalized(
    column: AnyPgColumn, 
    alias?: string | null, 
    lang?: string,
    fallback: string = 'en'
  ): SQL<string> | SQL.Aliased<string> {
    const locale = lang || this.getLanguage();
    
    const queryChunk = sql<string>`COALESCE(${column}->>${locale}, ${column}->>${fallback})`;
    
    return alias ? queryChunk.as(alias) : queryChunk;
  }
}
