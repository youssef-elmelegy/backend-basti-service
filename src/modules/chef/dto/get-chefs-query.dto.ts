import { IntersectionType } from '@nestjs/swagger';
import { SortDto, PaginationDto } from '@/common/dto';
import { FilterDto } from './filter.dto';

export class GetChefsQueryDto extends IntersectionType(
  PaginationDto,
  IntersectionType(SortDto, FilterDto),
) {}
