import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, ValidateIf } from 'class-validator';

export class AssignDriverDto {
  @ApiProperty({
    description: 'Driver admin ID (UUID). Send null to unassign.',
    example: '990e8400-e29b-41d4-a716-446655440005',
    required: false,
    nullable: true,
  })
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsUUID('4', { message: 'driverId must be a valid UUID' })
  driverId?: string | null;
}
