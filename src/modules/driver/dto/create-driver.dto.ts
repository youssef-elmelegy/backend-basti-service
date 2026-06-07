import { OmitType } from '@nestjs/swagger';
import { CreateAdminDto } from '@/modules/admin-auth/dto';

export class CreateDriverDto extends OmitType(CreateAdminDto, ['role'] as const) {}
