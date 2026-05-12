import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import {
  CREATE_OFFER_EXAMPLE,
  OFFER_LIST_RESPONSE_EXAMPLE,
  OFFER_RESPONSE_EXAMPLE,
  TOGGLE_ITEM_OFFER_EXAMPLE,
  UPDATE_OFFER_EXAMPLE,
} from '@/constants/examples';
import { CreateOfferDto, UpdateOfferDto, ToggleItemOfferDto } from '../dto';

export function CreateOfferDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Create a new offer' }),
    ApiBody({
      type: CreateOfferDto,
      schema: {
        example: CREATE_OFFER_EXAMPLE,
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Offer successfully created.',
      schema: {
        example: {
          message: 'routes.offers.created',
          success: true,
          data: OFFER_RESPONSE_EXAMPLE,
          status: 201,
        },
      },
    }),
  );
}

export function GetAllOffersDecorator() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all offers' }),
    ApiResponse({
      status: 200,
      description: 'Offers successfully retrieved.',
      schema: {
        example: {
          message: 'routes.offers.list_retrieved',
          success: true,
          data: OFFER_LIST_RESPONSE_EXAMPLE,
          status: 200,
        },
      },
    }),
  );
}

export function GetOfferItemsDecorator() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all items connected to a specific offer' }),
    ApiParam({ name: 'id', description: 'Offer ID' }),
    ApiResponse({
      status: 200,
      description: 'Connected items successfully retrieved.',
    }),
  );
}

export function GetOneOfferDecorator() {
  return applyDecorators(
    ApiOperation({ summary: 'Get one offer by ID' }),
    ApiParam({ name: 'id', description: 'Offer ID' }),
    ApiResponse({
      status: 200,
      description: 'Offer successfully retrieved.',
      schema: {
        example: {
          message: 'routes.offers.retrieved',
          success: true,
          data: OFFER_RESPONSE_EXAMPLE,
          status: 200,
        },
      },
    }),
  );
}

export function UpdateOfferDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Update an offer' }),
    ApiParam({ name: 'id', description: 'Offer ID' }),
    ApiBody({
      type: UpdateOfferDto,
      schema: {
        example: UPDATE_OFFER_EXAMPLE,
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Offer successfully updated.',
      schema: {
        example: {
          message: 'routes.offers.updated',
          success: true,
          data: OFFER_RESPONSE_EXAMPLE,
          status: 200,
        },
      },
    }),
  );
}

export function ToggleOfferStatusDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Toggle an offer active status' }),
    ApiParam({ name: 'id', description: 'Offer ID' }),
    ApiResponse({
      status: 200,
      description: 'Offer status successfully toggled.',
      schema: {
        example: {
          message: 'routes.offers.toggled',
          success: true,
          data: OFFER_RESPONSE_EXAMPLE,
          status: 200,
        },
      },
    }),
  );
}

export function DeleteOfferDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Delete an offer by ID' }),
    ApiParam({ name: 'id', description: 'Offer ID' }),
    ApiResponse({
      status: 200,
      description: 'Offer successfully deleted.',
      schema: {
        example: {
          message: 'routes.offers.deleted',
          success: true,
          data: {
            message: 'routes.offers.deleted',
          },
          status: 200,
        },
      },
    }),
  );
}

export function ToggleItemOfferDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Toggle an item offer' }),
    ApiBody({
      type: ToggleItemOfferDto,
      schema: {
        example: TOGGLE_ITEM_OFFER_EXAMPLE,
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Item offer toggled successfully.',
      schema: {
        example: {
          message: 'routes.offers.item_toggled',
          success: true,
          data: { message: 'routes.offers.item_toggled' },
          status: 200,
        },
      },
    }),
  );
}
