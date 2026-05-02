import { I18nContext, I18nService } from 'nestjs-i18n';
import { TranslationDto, TranslationResponse } from './translation.dto';
import { SuccessResponse } from '@/types';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { env } from '@/env';
import { Translate } from '@google-cloud/translate/build/src/v2';
import { successResponse } from '@/utils';

type TranslationArgs = Record<string, string | number | boolean | null | undefined>;

const languageMap: Record<string, string> = {
  en: 'en',
  ar: 'ar',
};

@Injectable()
export class TranslationService {
  private readonly logger = new Logger(TranslationService.name);
  private translate: Translate;

  constructor(
    private readonly i18nService: I18nService,
  ) {
    this.translate = new Translate({
      projectId: env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: env.GOOGLE_CLOUD_KEY_FILE,
    })
  }

  staticTranslate(key: string, lang?: string, args?: TranslationArgs): string {
    const context = I18nContext.current();
    return this.i18nService.t(key, {
      lang: lang ?? context?.lang ?? 'en',
      args,
    });
  }

  async dynamicTranslate(dto: TranslationDto): Promise<SuccessResponse<TranslationResponse>> {
    const { text, targetLang, sourceLang } = dto;

    try {
      const targetLanguage = languageMap[targetLang];
      const sourceLanguage = languageMap[sourceLang];

      if (!targetLanguage || !sourceLanguage) {
        throw new Error('Unsupported language');
      }

      const [res] = await this.translate.translate(text, {
        from: sourceLanguage,
        to: targetLanguage,
      });

      return successResponse({ result: res }, 'routes.common.translation_successful');
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Translation failed for text: ${text}`, error.stack);
        throw new InternalServerErrorException(error.message);
      }
      this.logger.error(`Translation failed for text: ${text}`);
      throw new InternalServerErrorException('Translation failed');
    }
  }

  
}
