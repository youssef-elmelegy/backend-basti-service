import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { LocationService } from '../services/location.service';
import { CreateLocationDto, UpdateLocationDto } from '../dto';
import {
  CreateLocationDecorator,
  GetAllLocationsDecorator,
  GetLocationByIdDecorator,
  UpdateLocationDecorator,
  DeleteLocationDecorator,
} from '../decorators';

@ApiTags('locations')
@Controller('locations')
@UseGuards(JwtAuthGuard)
export class LocationController {
  private readonly logger = new Logger(LocationController.name);

  constructor(private readonly locationService: LocationService) {}

  @Post()
  @CreateLocationDecorator()
  async create(@Body() createLocationDto: CreateLocationDto, @CurrentUser('sub') userId: string) {
    this.logger.debug(`Creating location for user: ${userId}`);
    const result = await this.locationService.create(userId, createLocationDto);
    this.logger.log(`Location created for user: ${userId}`);
    return result;
  }

  @Get()
  @GetAllLocationsDecorator()
  async findAll(@CurrentUser('sub') userId: string) {
    this.logger.debug(`Fetching all locations for user: ${userId}`);
    return this.locationService.findAll(userId);
  }

  @Get(':id')
  @GetLocationByIdDecorator()
  async findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    this.logger.debug(`Fetching location: ${id} for user: ${userId}`);
    return this.locationService.findOne(id, userId);
  }

  @Patch(':id')
  @UpdateLocationDecorator()
  async update(
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
    @CurrentUser('sub') userId: string,
  ) {
    this.logger.debug(`Updating location: ${id} for user: ${userId}`);
    const result = await this.locationService.update(id, userId, updateLocationDto);
    this.logger.log(`Location updated: ${id}`);
    return result;
  }

  @Delete(':id')
  @DeleteLocationDecorator()
  async remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    this.logger.debug(`Deleting location: ${id} for user: ${userId}`);
    const result = await this.locationService.remove(id, userId);
    this.logger.log(`Location deleted: ${id}`);
    return result;
  }
}
