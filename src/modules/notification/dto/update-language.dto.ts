import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NOTIFICATION_LANGUAGES, NotificationLanguage } from './send-notification.dto';

export class UpdateLanguageDto {
  @ApiProperty({
    description:
      'Preferred language of the authenticated user/admin. Determines which side of a bilingual notification is delivered as the FCM push.',
    enum: NOTIFICATION_LANGUAGES,
    example: 'ar',
  })
  @IsIn(NOTIFICATION_LANGUAGES, { message: 'language must be either "en" or "ar"' })
  language: NotificationLanguage;
}
