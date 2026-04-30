import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

export const ALLOWED_LANGUAGES = ['en', 'ar'];

export class TranslationDto {
  @ApiProperty({
    description: 'The source language',
    required: true,
    enum: ALLOWED_LANGUAGES,
  })
  @IsEnum(ALLOWED_LANGUAGES)
  sourceLang: string = 'en';

  @ApiProperty({
    description: 'The target language',
    required: true,
    enum: ALLOWED_LANGUAGES,
  })
  @IsEnum(ALLOWED_LANGUAGES)
  targetLang: string = 'ar';

  @ApiProperty({
    description: 'The text to translate',
    required: true,
  })
  @IsString()
  text: string = '';
}

export class TranslationResponse {
  @ApiProperty({
    description: 'The translated text',
  })
  result: string = '';
}
