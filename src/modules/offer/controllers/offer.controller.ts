import { Public } from '@/common';
import { Body, Controller, Param, Get, Post, Patch, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OfferService } from '../services/offer.service';
import { CreateOfferDto, UpdateOfferDto, ToggleItemOfferDto } from '../dto';
import {
  CreateOfferDecorator,
  DeleteOfferDecorator,
  GetAllOffersDecorator,
  GetOfferItemsDecorator,
  GetOneOfferDecorator,
  ToggleItemOfferDecorator,
  ToggleOfferStatusDecorator,
  UpdateOfferDecorator,
} from '../decorators';
import { AdminRolesGuard, JwtWithAdminGuard, AdminRoles } from '@/common/guards';
import { UseGuards } from '@nestjs/common';

@Controller('offer')
@ApiTags('offer')
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  @Post()
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'branch_manager')
  @CreateOfferDecorator()
  async create(@Body() createDto: CreateOfferDto) {
    return this.offerService.create(createDto);
  }

  @Get()
  @Public()
  @GetAllOffersDecorator()
  async getAll() {
    return this.offerService.getAll();
  }

  @Get(':id')
  @Public()
  @GetOneOfferDecorator()
  async getOne(@Param('id') id: string) {
    return this.offerService.getOne(id);
  }

  @Get(':id/items')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'branch_manager')
  @GetOfferItemsDecorator()
  async getItems(@Param('id') id: string) {
    return this.offerService.getItems(id);
  }

  @Patch('toggle-item')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'branch_manager')
  @ToggleItemOfferDecorator()
  async toggleItemOffer(@Body() toggleItemOfferDto: ToggleItemOfferDto) {
    return this.offerService.toggleItemOffer(toggleItemOfferDto);
  }

  @Patch(':id')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'branch_manager')
  @UpdateOfferDecorator()
  async update(@Param('id') id: string, @Body() updateDto: UpdateOfferDto) {
    return this.offerService.update(id, updateDto);
  }

  @Patch(':id/toggle-status')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'branch_manager')
  @ToggleOfferStatusDecorator()
  async toggleStatus(@Param('id') id: string) {
    return this.offerService.toggleStatus(id);
  }

  @Delete(':id')
  @UseGuards(JwtWithAdminGuard, AdminRolesGuard)
  @AdminRoles('super_admin', 'branch_manager')
  @DeleteOfferDecorator()
  async delete(@Param('id') id: string) {
    return this.offerService.delete(id);
  }
}
