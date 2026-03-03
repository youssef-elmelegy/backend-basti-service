import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BlockAdminDto {
  @ApiProperty({
    description: 'Whether to block or unblock the admin',
    example: true,
  })
  @IsBoolean({ message: 'isBlocked must be a boolean value' })
  isBlocked: boolean;
}
