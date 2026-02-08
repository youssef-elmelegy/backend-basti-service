import { IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetupProfileDto {
  @ApiProperty({
    description: 'User phone number',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({
    description: 'User profile image URL',
    example: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'profileImage must be a valid URL' })
  profileImage?: string;
}
