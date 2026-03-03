import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, ArrayNotEmpty } from 'class-validator';

export class BulkDeleteDto {
  @ApiProperty({
    description: 'Array of cart item UUIDs to be deleted',
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'The ids array cannot be empty' })
  @IsUUID('4', { each: true, message: 'Each ID must be a valid UUID' })
  ids: string[];

  @ApiProperty({
    name: 'regionId',
    description: 'region ID',
  })
  @IsUUID()
  regionId: string;
}

export class DeleteOneDto {
  @ApiProperty({
    name: 'regionId',
    description: 'region ID',
  })
  @IsUUID()
  regionId: string;
}
