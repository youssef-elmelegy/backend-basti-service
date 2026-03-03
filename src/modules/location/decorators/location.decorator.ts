import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import {
  CreateLocationDto,
  UpdateLocationDto,
  SuccessLocationResponseDto,
  SuccessLocationsResponseDto,
  SuccessDeleteLocationResponseDto,
} from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { LocationExamples } from '@/constants/examples';

export function CreateLocationDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a new location',
      description: "Add a new saved location to the authenticated user's account",
    }),
    ApiBody({
      type: CreateLocationDto,
      description:
        'Required: label, latitude, longitude, street. Optional: buildingNo, description',
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Location created successfully',
      type: SuccessLocationResponseDto,
      example: LocationExamples.create.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data (validation failed)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to create location',
      type: ErrorResponseDto,
    }),
  );
}

export function GetAllLocationsDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all locations',
      description: 'Retrieve all saved locations for the authenticated user',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Locations retrieved successfully',
      type: SuccessLocationsResponseDto,
      example: LocationExamples.getAll.response.success,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve locations',
      type: ErrorResponseDto,
    }),
  );
}

export function GetLocationByIdDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get location by ID',
      description: 'Retrieve a specific saved location by its ID',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'The UUID of the location',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Location retrieved successfully',
      type: SuccessLocationResponseDto,
      example: LocationExamples.getById.response.success,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Location not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve location',
      type: ErrorResponseDto,
    }),
  );
}

export function UpdateLocationDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a location',
      description: 'Update an existing saved location by its ID',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'The UUID of the location to update',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiBody({
      type: UpdateLocationDto,
      description:
        'All fields are optional: label, latitude, longitude, buildingNo, street, description',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Location updated successfully',
      type: SuccessLocationResponseDto,
      example: LocationExamples.update.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data (validation failed)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Location not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to update location',
      type: ErrorResponseDto,
    }),
  );
}

export function DeleteLocationDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete a location',
      description: 'Remove a saved location by its ID',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'The UUID of the location to delete',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Location deleted successfully',
      type: SuccessDeleteLocationResponseDto,
      example: LocationExamples.delete.response.success,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Location not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to delete location',
      type: ErrorResponseDto,
    }),
  );
}
