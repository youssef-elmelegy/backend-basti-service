import { OmitType } from '@nestjs/swagger';
import { UpdateAdminDto } from '@/modules/admin-auth/dto';

export class UpdateDriverDto extends OmitType(UpdateAdminDto, ['role'] as const) {}
