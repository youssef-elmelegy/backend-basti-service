import { PartialType } from '@nestjs/swagger';
import { CreateSweetDto } from './create-sweet.dto';

export class UpdateSweetDto extends PartialType(CreateSweetDto) {}
