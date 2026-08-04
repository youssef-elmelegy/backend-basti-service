import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotificationService, RecipientKind } from '../services/notification.service';
import {
  RegisterFcmTokenDto,
  SendNotificationDto,
  BroadcastNotificationDto,
  PaginationDto,
  NOTIFICATION_TYPES,
  NotificationType,
  ACTION_REQUIRED_NOTIFICATION_TYPES,
} from '../dto';
import {
  RegisterFcmTokenDecorator,
  ClearFcmTokenDecorator,
  GetAllNotificationsDecorator,
  UnreadCountDecorator,
  MarkNotificationReadDecorator,
  MarkAllReadDecorator,
  DeleteNotificationDecorator,
  SendNotificationDecorator,
  SendBroadcastNotificationDecorator,
  PaginationDecorator,
} from '../decorators';
import { AdminRoles, AdminRolesGuard, FlexibleJwtGuard, JwtWithAdminGuard } from '@/common/guards';
import { CurrentUser, JwtPayload } from '@/common/decorators';
import { errorResponse } from '@/utils';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(private readonly notificationService: NotificationService) {}

  @Post('register-token')
  @UseGuards(FlexibleJwtGuard)
  @RegisterFcmTokenDecorator()
  async registerToken(@CurrentUser() user: JwtPayload, @Body() dto: RegisterFcmTokenDto) {
    const { kind, id } = this.resolveRecipient(user);
    this.logger.debug(`Registering FCM token for ${kind} ${id}`);
    return this.notificationService.registerFcmToken(kind, id, dto.fcmToken);
  }

  @Delete('register-token')
  @UseGuards(FlexibleJwtGuard)
  @ClearFcmTokenDecorator()
  async clearToken(@CurrentUser() user: JwtPayload) {
    const { kind, id } = this.resolveRecipient(user);
    this.logger.debug(`Clearing FCM token for ${kind} ${id}`);
    return this.notificationService.clearFcmToken(kind, id);
  }

  // Sending notifications is an admin operation: it pushes arbitrary titles and
  // bodies to other people's devices, so it is restricted to the roles that
  // manage the platform rather than any authenticated admin (a bakery manager
  // has no reason to message users outside their own bakery).
  @Post('send')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @SendNotificationDecorator()
  async send(@Body() dto: SendNotificationDto) {
    this.logger.debug(
      `Sending notification (type=${dto.type}) to ${dto.recipientType} ${dto.recipientEmail}`,
    );
    return this.notificationService.sendNotification(dto);
  }

  @Post('send-broadcast')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'admin')
  @SendBroadcastNotificationDecorator()
  async sendBroadcast(@Body() dto: BroadcastNotificationDto) {
    this.logger.debug(
      `Broadcasting notification (type=${dto.type}) to audience=${dto.audience ?? 'all'}`,
    );
    return this.notificationService.sendBroadcastNotification(dto);
  }

  @Get()
  @UseGuards(FlexibleJwtGuard)
  @GetAllNotificationsDecorator()
  @PaginationDecorator()
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('isRead') isRead?: string,
    @Query('type') type?: string,
    @Query('actionRequired') actionRequired?: string,
  ) {
    const { kind, id } = this.resolveRecipient(user);

    const pagination: PaginationDto = {
      page: Math.max(1, parseInt(page, 10) || 1),
      limit: Math.max(1, parseInt(limit, 10) || 10),
    };

    let isReadFilter: boolean | undefined;
    if (isRead === 'true') isReadFilter = true;
    else if (isRead === 'false') isReadFilter = false;

    // `actionRequired=true` restricts the list to notifications that need
    // admin action and takes precedence over a single `type` filter.
    let typesFilter: NotificationType[] | undefined;
    if (actionRequired === 'true') {
      typesFilter = [...ACTION_REQUIRED_NOTIFICATION_TYPES];
    } else if (type !== undefined) {
      if (!(NOTIFICATION_TYPES as readonly string[]).includes(type)) {
        throw new BadRequestException(
          errorResponse(
            `type must be one of: ${NOTIFICATION_TYPES.join(', ')}`,
            HttpStatus.BAD_REQUEST,
            'BadRequestException',
          ),
        );
      }
      typesFilter = [type as NotificationType];
    }

    this.logger.debug(`Listing notifications for ${kind} ${id}`);
    return this.notificationService.findAllForRecipient(kind, id, pagination, {
      isRead: isReadFilter,
      types: typesFilter,
    });
  }

  @Get('unread-count')
  @UseGuards(FlexibleJwtGuard)
  @UnreadCountDecorator()
  async unreadCount(@CurrentUser() user: JwtPayload) {
    const { kind, id } = this.resolveRecipient(user);
    return this.notificationService.unreadCount(kind, id);
  }

  @Patch('read-all')
  @UseGuards(FlexibleJwtGuard)
  @MarkAllReadDecorator()
  async markAllAsRead(@CurrentUser() user: JwtPayload) {
    const { kind, id } = this.resolveRecipient(user);
    return this.notificationService.markAllAsRead(kind, id);
  }

  @Patch(':id/read')
  @UseGuards(FlexibleJwtGuard)
  @MarkNotificationReadDecorator()
  async markAsRead(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const { kind, id: recipientId } = this.resolveRecipient(user);
    this.logger.debug(`Marking notification ${id} as read by ${kind} ${recipientId}`);
    return this.notificationService.markAsRead(id, kind, recipientId);
  }

  @Delete(':id')
  @UseGuards(FlexibleJwtGuard)
  @DeleteNotificationDecorator()
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    const { kind, id: recipientId } = this.resolveRecipient(user);
    this.logger.debug(`Deleting notification ${id} by ${kind} ${recipientId}`);
    return this.notificationService.remove(id, kind, recipientId);
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
