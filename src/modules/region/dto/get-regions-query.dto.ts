import { IntersectionType } from '@nestjs/swagger';
import { SortDto } from '@/common/dto';
import { FilterDto } from './filter.dto';

export class GetRegionsQueryDto extends IntersectionType(SortDto, FilterDto) {}
