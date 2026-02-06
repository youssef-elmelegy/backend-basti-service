import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TagsService } from '../services/tags.service';
import { GetTagsDecorator } from '../decorators';
import { Public } from '@/common';
import { SuccessResponse } from '@/utils';

@Public()
@ApiTags('tags')
@Controller('tags')
export class TagsController {
  private readonly logger = new Logger(TagsController.name);

  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @GetTagsDecorator()
  async findAll(): Promise<SuccessResponse<string[]>> {
    this.logger.debug('Retrieving all tags');
    return this.tagsService.findAll();
  }
}
