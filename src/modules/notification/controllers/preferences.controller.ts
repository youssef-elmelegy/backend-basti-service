import {
  BadRequestException,
  Body,
  Controller,
  HttpStatus,
  Logger,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotificationService, RecipientKind } from '../services/notification.service';
import { UpdateLanguageDto } from '../dto';
import { UpdateLanguageDecorator } from '../decorators';
import { FlexibleJwtGuard } from '@/common/guards';
import { CurrentUser, JwtPayload } from '@/common/decorators';
import { errorResponse } from '@/utils';

/**
 * Preferences that belong to the authenticated principal rather than to any one
 * feature. Deliberately mounted at `/me` (not under `/notifications`) because
 * language is a general account property — it currently drives push language,
 * but is not notification-specific.
 *
 * One route serves both users and admins: the guard resolves which kind the
 * caller is, exactly as the FCM token routes already do.
 */
@ApiTags('me')
@Controller('me')
export class PreferencesController {
  private readonly logger = new Logger(PreferencesController.name);

  constructor(private readonly notificationService: NotificationService) {}

  @Patch('language')
  @UseGuards(FlexibleJwtGuard)
  @UpdateLanguageDecorator()
  async updateLanguage(@CurrentUser() user: JwtPayload, @Body() dto: UpdateLanguageDto) {
    const { kind, id } = this.resolveRecipient(user);
    this.logger.debug(`Updating language to "${dto.language}" for ${kind} ${id}`);
    return this.notificationService.updateLanguage(kind, id, dto.language);
  }

  private resolveRecipient(user: JwtPayload): { kind: RecipientKind; id: string } {
    const id = user?.sub ?? user?.id;
    if (!id) {
      throw new BadRequestException(
        errorResponse(
          'Authenticated subject ID is missing from JWT',
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
        ),
      );
    }
    return { kind: user.role ? 'admin' : 'user', id };
  }
}
