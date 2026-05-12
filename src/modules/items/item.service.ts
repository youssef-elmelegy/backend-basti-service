import { HttpStatus, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import {
  AddonOptionData,
  AddonData,
  SweetData,
  FeaturedCakeData,
  FlavorData,
  DecorationData,
  ShapeData,
  PredesignedCakeConfigData,
  PredesignedCakeData,
  CustomCakeFlattenData,
  CustomCakeData,
  ExtraLayerData,
} from './items-interface';
import { db } from '@/db';
import { and, eq, getTableColumns, inArray, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import {
  addonOptions,
  addons,
  featuredCakes,
  predesignedCakes,
  regionItemPrices,
  sweets,
  tags,
  designedCakeConfigs,
  flavors,
  decorations,
  shapes,
  shapeVariantImages,
  offers,
} from '@/db/schema/';
import { errorResponse } from '@/utils';
import { TranslationService } from '@/common';
import { isOfferActive } from '@/db/utils/helpers';

@Injectable()
export class ItemService {
  private readonly logger = new Logger(ItemService.name);

  constructor(private readonly translationService: TranslationService) {}

  async getAddonOptions(addonId: string, addonOptionId: string): Promise<AddonOptionData[]> {
    try {
      const optionsData = await db
        .select()
        .from(addonOptions)
        .where(and(eq(addonOptions.addonId, addonId), eq(addonOptions.id, addonOptionId)));

      return optionsData.map((option) => ({
        id: option.id,
        type: option.type,
        label: option.label,
        value: option.value,
        imageUrl: option.imageUrl ?? '',
        createdAt: option.createdAt,
        updatedAt: option.updatedAt,
      }));
    } catch (error) {
      this.logger.error(
        `Failed to retrieve addon options: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException(
        errorResponse(
          'routes.addons.options.failed_list',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async getAddons(
    addonIds: { id: string; option?: string }[],
    regionId?: string,
  ): Promise<AddonData[]> {
    try {
      const res: AddonData[] = [];

      if (!addonIds.length) {
        return res;
      }

      const uniqueAddonIds = Array.from(new Set(addonIds.map((addon) => addon.id)));

      if (regionId) {
        const addonsData = await db
          .select({
            ...getTableColumns(addons),
            name: this.translationService.getLocalized(addons.name, 'name'),
            description: this.translationService.getLocalized(addons.description, 'description'),
            tagName: this.translationService.getLocalized(tags.name, 'name'),
            price: regionItemPrices.price,
            offer: {
              ...getTableColumns(offers),
              name: this.translationService.getLocalized(offers.name, 'name'),
            },
            sizesPrices: regionItemPrices.sizesPrices,
          })
          .from(addons)
          .innerJoin(
            regionItemPrices,
            and(eq(regionItemPrices.addonId, addons.id), eq(regionItemPrices.regionId, regionId)),
          )
          .leftJoin(tags, eq(addons.tagId, tags.id))
          .leftJoin(offers, and(
            eq(regionItemPrices.offerId, offers.id),
            isOfferActive(offers),
          ))
          .where(and(eq(addons.isActive, true), inArray(addons.id, uniqueAddonIds)))
          .limit(uniqueAddonIds.length);

        const addonById = new Map(addonsData.map((addon) => [addon.id, addon]));

        for (const addonRequest of addonIds) {
          const addon = addonById.get(addonRequest.id);

          if (!addon) {
            continue;
          }

          const selectedOptionId = addonRequest.option;
          const options = selectedOptionId
            ? await this.getAddonOptions(addon.id, selectedOptionId)
            : [];

          res.push({
            ...addon,
            description: addon.description ?? '',
            tagId: addon.tagId ?? '',
            tagName: addon.tagName ?? '',
            options,
            price: addon.price,
            offer: addon.offer,
            sizesPrices: addon.sizesPrices ?? undefined,
            selectedOptionId,
          });
        }
      } else {
        const addonsData = await db
          .select({
            ...getTableColumns(addons),
            name: this.translationService.getLocalized(addons.name, 'name'),
            description: this.translationService.getLocalized(addons.description, 'description'),
            tagName: this.translationService.getLocalized(tags.name, 'name'),
          })
          .from(addons)
          .leftJoin(tags, eq(addons.tagId, tags.id))
          .where(and(eq(addons.isActive, true), inArray(addons.id, uniqueAddonIds)))
          .limit(uniqueAddonIds.length);

        const addonById = new Map(addonsData.map((addon) => [addon.id, addon]));

        for (const addonRequest of addonIds) {
          const addon = addonById.get(addonRequest.id);

          if (!addon) {
            continue;
          }

          const selectedOptionId = addonRequest.option;
          const options = selectedOptionId
            ? await this.getAddonOptions(addon.id, selectedOptionId)
            : [];

          res.push({
            ...addon,
            description: addon.description ?? '',
            tagId: addon.tagId ?? '',
            tagName: addon.tagName ?? '',
            options,
            offer: null,
            selectedOptionId,
          });
        }
      }

      return res;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve addons: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException(
        errorResponse(
          'routes.addons.failed_list',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async getSweets(sweetIds: string[], regionId?: string): Promise<SweetData[]> {
    try {
      const res: SweetData[] = [];

      if (!sweetIds.length) {
        return res;
      }

      if (regionId) {
        const sweetsData = await db
          .select({
            ...getTableColumns(sweets),
            name: this.translationService.getLocalized(sweets.name, 'name'),
            description: this.translationService.getLocalized(sweets.description, 'description'),
            tagName: this.translationService.getLocalized(tags.name, 'name'),
            price: regionItemPrices.price,
            offer: {
              ...getTableColumns(offers),
              name: this.translationService.getLocalized(offers.name, 'name'),
            },
            sizesPrices: regionItemPrices.sizesPrices,
          })
          .from(sweets)
          .innerJoin(
            regionItemPrices,
            and(eq(regionItemPrices.sweetId, sweets.id), eq(regionItemPrices.regionId, regionId)),
          )
          .leftJoin(tags, eq(sweets.tagId, tags.id))
          .leftJoin(offers, and(
            eq(regionItemPrices.offerId, offers.id),
            isOfferActive(offers),
          ))
          .where(and(eq(sweets.isActive, true), inArray(sweets.id, sweetIds)))
          .limit(sweetIds.length);

        for (const sweet of sweetsData) {
          res.push({
            ...sweet,
            description: sweet.description ?? '',
            tagId: sweet.tagId ?? '',
            tagName: sweet.tagName ?? '',
            sizesPrices: sweet.sizesPrices ?? undefined,
          });
        }
      } else {
        const sweetsData = await db
          .select({
            ...getTableColumns(sweets),
            name: this.translationService.getLocalized(sweets.name, 'name'),
            description: this.translationService.getLocalized(sweets.description, 'description'),
            tagName: this.translationService.getLocalized(tags.name, 'name'),
          })
          .from(sweets)
          .leftJoin(tags, eq(sweets.tagId, tags.id))
          .where(and(eq(sweets.isActive, true), inArray(sweets.id, sweetIds)))
          .limit(sweetIds.length);

        for (const sweet of sweetsData) {
          res.push({
            ...sweet,
            description: sweet.description ?? '',
            tagId: sweet.tagId ?? '',
            tagName: sweet.tagName ?? '',
            offer: null,
          });
        }
      }

      return res;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve sweets: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException(
        errorResponse(
          'routes.sweet.failed_list',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async getFeaturedCakes(
    featuredCakeIds: string[],
    regionId?: string,
  ): Promise<FeaturedCakeData[]> {
    try {
      const res: FeaturedCakeData[] = [];

      if (!featuredCakeIds.length) {
        return res;
      }

      if (regionId) {
        const featuredCakesData = await db
          .select({
            ...getTableColumns(featuredCakes),
            name: this.translationService.getLocalized(featuredCakes.name, 'name'),
            description: this.translationService.getLocalized(featuredCakes.description, 'description'),
            tagName: this.translationService.getLocalized(tags.name, 'name'),
            price: regionItemPrices.price,
            offer: {
              ...getTableColumns(offers),
              name: this.translationService.getLocalized(offers.name, 'name'),
            },
            sizesPrices: regionItemPrices.sizesPrices,
          })
          .from(featuredCakes)
          .innerJoin(
            regionItemPrices,
            and(
              eq(regionItemPrices.featuredCakeId, featuredCakes.id),
              eq(regionItemPrices.regionId, regionId),
            ),
          )
          .leftJoin(tags, eq(featuredCakes.tagId, tags.id))
          .leftJoin(offers, and(
            eq(regionItemPrices.offerId, offers.id),
            isOfferActive(offers),
          ))
          .where(and(eq(featuredCakes.isActive, true), inArray(featuredCakes.id, featuredCakeIds)))
          .limit(featuredCakeIds.length);

        for (const featuredCake of featuredCakesData) {
          res.push({
            ...featuredCake,
            description: featuredCake.description ?? '',
            tagId: featuredCake.tagId ?? '',
            tagName: featuredCake.tagName ?? '',
            sizesPrices: featuredCake.sizesPrices ?? undefined,
          });
        }
      } else {
        const featuredCakesData = await db
          .select({
            ...getTableColumns(featuredCakes),
            name: this.translationService.getLocalized(featuredCakes.name, 'name'),
            description: this.translationService.getLocalized(featuredCakes.description, 'description'),
            tagName: this.translationService.getLocalized(tags.name, 'name'),
          })
          .from(featuredCakes)
          .leftJoin(tags, eq(featuredCakes.tagId, tags.id))
          .where(and(eq(featuredCakes.isActive, true), inArray(featuredCakes.id, featuredCakeIds)))
          .limit(featuredCakeIds.length);

        for (const featuredCake of featuredCakesData) {
          res.push({
            ...featuredCake,
            description: featuredCake.description ?? '',
            tagId: featuredCake.tagId ?? '',
            tagName: featuredCake.tagName ?? '',
            offer: null,
          });
        }
      }

      return res;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve featured cakes: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException(
        errorResponse(
          'routes.featured_cakes.failed_list',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async getFlavors(flavorIds: string[], regionId?: string): Promise<FlavorData[]> {
    try {
      const res: FlavorData[] = [];

      if (!flavorIds.length) {
        return res;
      }

      if (regionId) {
        const flavorsData = await db
          .select({
            ...getTableColumns(flavors),
            title: this.translationService.getLocalized(flavors.title, 'title'),
            description: this.translationService.getLocalized(flavors.description, 'description'),
            price: regionItemPrices.price,
            offer: {
              ...getTableColumns(offers),
              name: this.translationService.getLocalized(offers.name, 'name'),
            },
          })
          .from(flavors)
          .leftJoin(
            regionItemPrices,
            and(eq(regionItemPrices.flavorId, flavors.id), eq(regionItemPrices.regionId, regionId)),
          )
          .leftJoin(offers, and(
            eq(regionItemPrices.offerId, offers.id),
            isOfferActive(offers),
          ))
          .where(and(eq(flavors.isActive, true), inArray(flavors.id, flavorIds)))
          .limit(flavorIds.length);

        for (const flavor of flavorsData) {
          res.push({
            ...flavor,
            price: flavor.price ?? '0',
            description: flavor.description ?? '',
            shapeVariantImages: [],
          });
        }
      } else {
        const flavorsData = await db
          .select({
            ...getTableColumns(flavors),
            title: this.translationService.getLocalized(flavors.title, 'title'),
            description: this.translationService.getLocalized(flavors.description, 'description'),
          })
          .from(flavors)
          .where(and(eq(flavors.isActive, true), inArray(flavors.id, flavorIds)))
          .limit(flavorIds.length);

        for (const flavor of flavorsData) {
          res.push({
            ...flavor,
            description: flavor.description ?? '',
            shapeVariantImages: [],
            offer: null,
          });
        }
      }

      return res;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve flavors: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException(
        errorResponse(
          'routes.flavors.failed_list',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async getShapes(shapeIds: string[], regionId?: string): Promise<ShapeData[]> {
    try {
      const res: ShapeData[] = [];

      if (!shapeIds.length) {
        return res;
      }

      if (regionId) {
        const shapesData = await db
          .select({
            ...getTableColumns(shapes),
            title: this.translationService.getLocalized(shapes.title, 'title'),
            description: this.translationService.getLocalized(shapes.description, 'description'),
            price: regionItemPrices.price,
            offer: {
              ...getTableColumns(offers),
              name: this.translationService.getLocalized(offers.name, 'name'),
            },
          })
          .from(shapes)
          .leftJoin(
            regionItemPrices,
            and(eq(regionItemPrices.shapeId, shapes.id), eq(regionItemPrices.regionId, regionId)),
          )
          .leftJoin(offers, and(
            eq(regionItemPrices.offerId, offers.id),
            isOfferActive(offers),
          ))
          .where(and(eq(shapes.isActive, true), inArray(shapes.id, shapeIds)))
          .limit(shapeIds.length);

        for (const shape of shapesData) {
          res.push({
            ...shape,
            price: shape.price ?? '0',
            description: shape.description ?? '',
            capacity: shape.capacity ?? 0,
          });
        }
      } else {
        const shapesData = await db
          .select({
            ...getTableColumns(shapes),
            title: this.translationService.getLocalized(shapes.title, 'title'),
            description: this.translationService.getLocalized(shapes.description, 'description'),
          })
          .from(shapes)
          .where(and(eq(shapes.isActive, true), inArray(shapes.id, shapeIds)))
          .limit(shapeIds.length);

        for (const shape of shapesData) {
          res.push({
            ...shape,
            description: shape.description ?? '',
            capacity: shape.capacity ?? 0,
            offer: null,
          });
        }
      }

      return res;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve shapes: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException(
        errorResponse(
          'routes.shapes.failed_list',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async getDecorations(decorationIds: string[], regionId?: string): Promise<DecorationData[]> {
    try {
      const res: DecorationData[] = [];

      if (!decorationIds.length) {
        return res;
      }

      if (regionId) {
        const decorationsData = await db
          .select({
            ...getTableColumns(decorations),
            title: this.translationService.getLocalized(decorations.title, 'title'),
            description: this.translationService.getLocalized(decorations.description, 'description'),
            tagName: this.translationService.getLocalized(tags.name, 'name'),
            price: regionItemPrices.price,
            offer: {
              ...getTableColumns(offers),
              name: this.translationService.getLocalized(offers.name, 'name'),
            },
          })
          .from(decorations)
          .leftJoin(
            regionItemPrices,
            and(
              eq(regionItemPrices.decorationId, decorations.id),
              eq(regionItemPrices.regionId, regionId),
            ),
          )
          .leftJoin(tags, eq(decorations.tagId, tags.id))
          .leftJoin(offers, and(
            eq(regionItemPrices.offerId, offers.id),
            isOfferActive(offers),
          ))
          .where(and(eq(decorations.isActive, true), inArray(decorations.id, decorationIds)))
          .limit(decorationIds.length);

        for (const decoration of decorationsData) {
          res.push({
            ...decoration,
            price: decoration.price ?? '0',
            description: decoration.description ?? '',
            tagId: decoration.tagId ?? '',
            tagName: decoration.tagName ?? '',
            shapeVariantImages: [],
          });
        }
      } else {
        const decorationsData = await db
          .select({
            ...getTableColumns(decorations),
            title: this.translationService.getLocalized(decorations.title, 'title'),
            description: this.translationService.getLocalized(decorations.description, 'description'),
            tagName: this.translationService.getLocalized(tags.name, 'name'),
          })
          .from(decorations)
          .leftJoin(tags, eq(decorations.tagId, tags.id))
          .where(and(eq(decorations.isActive, true), inArray(decorations.id, decorationIds)))
          .limit(decorationIds.length);

        for (const decoration of decorationsData) {
          res.push({
            ...decoration,
            description: decoration.description ?? '',
            tagId: decoration.tagId ?? '',
            tagName: decoration.tagName ?? '',
            shapeVariantImages: [],
            offer: null,
          });
        }
      }

      return res;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve decorations: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException(
        errorResponse(
          'routes.decorations.failed_list',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async getPredesignedCakes(
    predesignedCakeIds: string[],
    regionId?: string,
  ): Promise<PredesignedCakeData[]> {
    try {
      const res: PredesignedCakeData[] = [];

      if (!predesignedCakeIds.length) {
        return res;
      }

      if (regionId) {
        const predesignedCakeData = await db
          .select({
            ...getTableColumns(predesignedCakes),
            name: this.translationService.getLocalized(predesignedCakes.name, 'name'),
            description: this.translationService.getLocalized(predesignedCakes.description, 'description'),
            tagName: this.translationService.getLocalized(tags.name, 'name'),
            price: regionItemPrices.price,
            offer: {
              ...getTableColumns(offers),
              name: this.translationService.getLocalized(offers.name, 'name'),
            },
            sizesPrices: regionItemPrices.sizesPrices,
          })
          .from(predesignedCakes)
          .innerJoin(
            regionItemPrices,
            and(
              eq(regionItemPrices.predesignedCakeId, predesignedCakes.id),
              eq(regionItemPrices.regionId, regionId),
            ),
          )
          .leftJoin(tags, eq(predesignedCakes.tagId, tags.id))
          .leftJoin(offers, and(
            eq(regionItemPrices.offerId, offers.id),
            isOfferActive(offers),
          ))
          .where(
            and(
              eq(predesignedCakes.isActive, true),
              inArray(predesignedCakes.id, predesignedCakeIds),
            ),
          )
          .limit(predesignedCakeIds.length);

        for (const predesignedCake of predesignedCakeData) {
          const configs = await this.getConfigsData(predesignedCake.id);
          const totalCapacity = this.getTotalCapacity(configs);
          const totalMinPrepHours = this.getTotalMinPrepHours(configs);
          const totalPrice = await this.getConfigsPrice(predesignedCake.id, regionId);
          res.push({
            ...predesignedCake,
            configs: configs.map((config) => ({
              id: config.id,
              shape: config.shape,
              flavor: config.flavor,
              decoration: config.decoration,
              frostColorValue: config.frostColorValue,
              createdAt: config.createdAt,
              updatedAt: config.updatedAt,
            })),
            thumbnailUrl: predesignedCake.thumbnailUrl ?? '',
            description: predesignedCake.description ?? '',
            tagId: predesignedCake.tagId ?? '',
            tagName: predesignedCake.tagName ?? '',
            sizesPrices: predesignedCake.sizesPrices ?? undefined,
            totalCapacity: totalCapacity ?? 0,
            totalMinPrepHours: totalMinPrepHours ?? 0,
            price: totalPrice.toFixed(2),
          });
        }
      } else {
        const predesignedCakeData = await db
          .select({
            ...getTableColumns(predesignedCakes),
            name: this.translationService.getLocalized(predesignedCakes.name, 'name'),
            description: this.translationService.getLocalized(predesignedCakes.description, 'description'),
            tagName: this.translationService.getLocalized(tags.name, 'name'),
          })
          .from(predesignedCakes)
          .leftJoin(tags, eq(predesignedCakes.tagId, tags.id))
          .where(
            and(
              eq(predesignedCakes.isActive, true),
              inArray(predesignedCakes.id, predesignedCakeIds),
            ),
          )
          .limit(predesignedCakeIds.length);

        for (const predesignedCake of predesignedCakeData) {
          const configs = await this.getConfigsData(predesignedCake.id);
          const totalCapacity = this.getTotalCapacity(configs);
          const totalMinPrepHours = this.getTotalMinPrepHours(configs);
          res.push({
            ...predesignedCake,
            configs: configs.map((config) => ({
              id: config.id,
              shape: config.shape,
              flavor: config.flavor,
              decoration: config.decoration,
              frostColorValue: config.frostColorValue,
              createdAt: config.createdAt,
              updatedAt: config.updatedAt,
            })),
            thumbnailUrl: predesignedCake.thumbnailUrl ?? '',
            description: predesignedCake.description ?? '',
            tagId: predesignedCake.tagId ?? '',
            tagName: predesignedCake.tagName ?? '',
            totalCapacity: totalCapacity ?? 0,
            totalMinPrepHours: totalMinPrepHours ?? 0,
            offer: null,
          });
        }
      }

      return res;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve featured cakes: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException(
        errorResponse(
          'routes.predesigned_cakes.failed_list',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async getCustomCakes(
    customCakesConfigs: CustomCakeFlattenData[],
    regionId?: string,
  ): Promise<CustomCakeData[]> {
    try {
      const res: CustomCakeData[] = [];

      if (!Array.isArray(customCakesConfigs) || !customCakesConfigs.length) {
        return res;
      }

      for (const [customCakeIndex, customCake] of customCakesConfigs.entries()) {
        if (
          !customCake ||
          !customCake.flavorId ||
          !customCake.decorationId ||
          !customCake.shapeId
        ) {
          this.logger.warn(
            `Invalid custom cake config at index=${customCakeIndex}: missing required ids`,
          );
          continue;
        }

        const [flavor] = await this.getFlavors([customCake.flavorId], regionId);
        const [decoration] = await this.getDecorations([customCake.decorationId], regionId);
        const [shape] = await this.getShapes([customCake.shapeId], regionId);

        if (!flavor || !decoration || !shape) {
          this.logger.warn(
            `Custom cake config has missing base items: flavor=${customCake.flavorId}, decoration=${customCake.decorationId}, shape=${customCake.shapeId}`,
          );
          continue;
        }

        const extraLayers: ExtraLayerData[] = [];
        let totalPrice =
          this.parsePrice(flavor.price) +
          this.parsePrice(decoration.price) +
          this.parsePrice(shape.price);

        const customCakeExtraLayers = Array.isArray(customCake.extraLayers)
          ? customCake.extraLayers
          : [];

        if (customCake.extraLayers && !Array.isArray(customCake.extraLayers)) {
          this.logger.warn(
            `Invalid custom cake extraLayers at index=${customCakeIndex}: expected array`,
          );
        }

        for (const [extraLayerIndex, extraLayer] of customCakeExtraLayers.entries()) {
          if (!extraLayer || !extraLayer.flavorId) {
            this.logger.warn(
              `Invalid custom cake extra layer at customCakeIndex=${customCakeIndex}, extraLayerIndex=${extraLayerIndex}: missing flavorId`,
            );
            continue;
          }

          const [extraLayerFlavor] = await this.getFlavors([extraLayer.flavorId], regionId);

          if (!extraLayerFlavor) {
            this.logger.warn(
              `Custom cake extra layer flavor not found: flavor=${extraLayer.flavorId}`,
            );
            continue;
          }

          extraLayers.push({
            layer: extraLayer.layer ?? 0,
            flavor: extraLayerFlavor,
          });

          totalPrice += this.parsePrice(extraLayerFlavor.price);
        }

        const totalCapacity = shape.capacity ?? 0;
        const totalMinPrepHours = (shape.minPrepHours ?? 0) + (decoration.minPrepHours ?? 0);
        const color = {
          name: customCake.color?.name ?? '',
          hex: customCake.color?.hex ?? '',
        };

        res.push({
          ...customCake,
          flavor,
          decoration,
          shape,
          message: customCake.message ?? '',
          color,
          extraLayers: extraLayers ?? [],
          imageToPrint: customCake.imageToPrint ?? '',
          snapshotFront: customCake.snapshotFront ?? '',
          snapshotTop: customCake.snapshotTop ?? '',
          snapshotSliced: customCake.snapshotSliced ?? '',
          totalCapacity: totalCapacity ?? 0,
          totalMinPrepHours: totalMinPrepHours ?? 0,
          price: regionId ? totalPrice.toFixed(2) : undefined,
          id: this.getCustomCakeId(
            customCake.shapeId,
            customCake.flavorId,
            customCake.decorationId,
            color.hex,
          ),
        });
      }

      return res;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve custom cakes: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException(
        errorResponse(
          'routes.custom_cakes.failed_list',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  getCustomCakeId(shapeId: string, flavorId: string, decorationId: string, hexColor: string) {
    return `CUST-${shapeId || ''}-${flavorId || ''}-${decorationId || ''}-${hexColor || ''}`;
  }

  private parsePrice(value?: string | null): number {
    const parsedPrice = Number.parseFloat(value ?? '0');
    return Number.isFinite(parsedPrice) ? parsedPrice : 0;
  }

  private async getConfigsData(predesignedCakeId: string) {
    try {
      const configsWithImages = await db
        .select({
          id: designedCakeConfigs.id,
          flavorId: designedCakeConfigs.flavorId,
          decorationId: designedCakeConfigs.decorationId,
          shapeId: designedCakeConfigs.shapeId,
          frostColorValue: designedCakeConfigs.frostColorValue,
          createdAt: designedCakeConfigs.createdAt,
          updatedAt: designedCakeConfigs.updatedAt,
          flavor: {
            id: flavors.id,
            title: this.translationService.getLocalized(flavors.title, 'title'),
            description: this.translationService.getLocalized(flavors.description, 'description'),
            flavorUrl: flavors.flavorUrl,
            isActive: flavors.isActive,
            order: flavors.order,
            createdAt: flavors.createdAt,
            updatedAt: flavors.updatedAt,
          },
          decoration: {
            id: decorations.id,
            title: this.translationService.getLocalized(decorations.title, 'title'),
            description: this.translationService.getLocalized(decorations.description, 'description'),
            decorationUrl: decorations.decorationUrl,
            capacity: decorations.capacity,
            tagId: decorations.tagId,
            isActive: decorations.isActive,
            minPrepHours: decorations.minPrepHours,
            createdAt: decorations.createdAt,
            updatedAt: decorations.updatedAt,
          },
          shape: {
            id: shapes.id,
            title: this.translationService.getLocalized(shapes.title, 'title'),
            description: this.translationService.getLocalized(shapes.description, 'description'),
            shapeUrl: shapes.shapeUrl,
            isActive: shapes.isActive,
            order: shapes.order,
            size: shapes.size,
            capacity: shapes.capacity,
            minPrepHours: shapes.minPrepHours,
            createdAt: shapes.createdAt,
            updatedAt: shapes.updatedAt,
          },
          variantImage: {
            id: shapeVariantImages.id,
            flavorId: shapeVariantImages.flavorId,
            decorationId: shapeVariantImages.decorationId,
            slicedViewUrl: shapeVariantImages.slicedViewUrl,
            frontViewUrl: shapeVariantImages.frontViewUrl,
            topViewUrl: shapeVariantImages.topViewUrl,
            createdAt: shapeVariantImages.createdAt,
            updatedAt: shapeVariantImages.updatedAt,
          },
        })
        .from(designedCakeConfigs)
        .innerJoin(flavors, eq(designedCakeConfigs.flavorId, flavors.id))
        .innerJoin(decorations, eq(designedCakeConfigs.decorationId, decorations.id))
        .innerJoin(shapes, eq(designedCakeConfigs.shapeId, shapes.id))
        .leftJoin(
          shapeVariantImages,
          or(
            and(
              eq(shapeVariantImages.shapeId, designedCakeConfigs.shapeId),
              eq(shapeVariantImages.flavorId, designedCakeConfigs.flavorId),
            ),
            and(
              eq(shapeVariantImages.shapeId, designedCakeConfigs.shapeId),
              eq(shapeVariantImages.decorationId, designedCakeConfigs.decorationId),
            ),
          ),
        )
        .where(eq(designedCakeConfigs.predesignedCakeId, predesignedCakeId));

      const configMap = new Map<
        string,
        {
          id: string;
          flavor: FlavorData;
          decoration: DecorationData;
          shape: ShapeData;
          frostColorValue: string;
          createdAt: Date;
          updatedAt: Date;
        }
      >();

      configsWithImages.forEach((row) => {
        if (!configMap.has(row.id)) {
          configMap.set(row.id, {
            id: row.id,
            flavor: {
              ...row.flavor,
              description: row.flavor.description ?? '',
              shapeVariantImages: [],
              offer: null,
            },
            decoration: {
              ...row.decoration,
              description: row.decoration.description ?? '',
              tagId: row.decoration.tagId ?? '',
              minPrepHours: row.decoration.minPrepHours ?? 0,
              tagName: '',
              capacity: row.decoration.capacity ?? 1,
              shapeVariantImages: [],
              offer: null,
            },
            shape: {
              ...row.shape,
              description: row.shape.description ?? '',
              minPrepHours: row.shape.minPrepHours ?? 0,
              capacity: row.shape.capacity ?? 0,
              offer: null,
            },
            frostColorValue: row.frostColorValue,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          });
        }

        const config = configMap.get(row.id);
        if (!config) {
          return;
        }

        if (row.variantImage && row.variantImage.id) {
          // Add to flavor variant images if it matches the flavor
          if (row.variantImage.flavorId === row.flavorId) {
            config.flavor.shapeVariantImages.push(row.variantImage);
          }
          // Add to decoration variant images if it matches the decoration
          if (row.variantImage.decorationId === row.decorationId) {
            config.decoration.shapeVariantImages.push(row.variantImage);
          }
        }
      });

      return Array.from(configMap.values());
    } catch (error) {
      this.logger.error(
        `Failed to retrieve configs for predesigned cake ${predesignedCakeId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException(
        errorResponse(
          'routes.predesigned_cakes.failed_retrieve_configs',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  private getTotalCapacity(configs: PredesignedCakeConfigData[]) {
    let totalCapacity = 0;
    for (const config of configs) {
      totalCapacity += config.shape.capacity;
      totalCapacity += config.decoration.capacity;
    }
    return totalCapacity;
  }

  private getTotalMinPrepHours(configs: PredesignedCakeConfigData[]) {
    let totalMinPrepHours = 0;
    for (const config of configs) {
      totalMinPrepHours += (config.shape.minPrepHours ?? 0) + (config.decoration.minPrepHours ?? 0);
    }
    return totalMinPrepHours;
  }

  private async getConfigsPrice(predesignedCakeId: string, regionId: string): Promise<number> {
    try {
      const flavorPrices = alias(regionItemPrices, 'flavorPrices');
      const decorationPrices = alias(regionItemPrices, 'decorationPrices');
      const shapePrices = alias(regionItemPrices, 'shapePrices');

      const configPrices = await db
        .select({
          configId: designedCakeConfigs.id,
          flavorPrice: flavorPrices.price,
          flavorSizesPrices: flavorPrices.sizesPrices,
          decorationPrice: decorationPrices.price,
          decorationSizesPrices: decorationPrices.sizesPrices,
          shapePrice: shapePrices.price,
          shapeSizesPrices: shapePrices.sizesPrices,
        })
        .from(designedCakeConfigs)
        .leftJoin(
          flavorPrices,
          and(
            eq(flavorPrices.flavorId, designedCakeConfigs.flavorId),
            eq(flavorPrices.regionId, regionId),
          ),
        )
        .leftJoin(
          decorationPrices,
          and(
            eq(decorationPrices.decorationId, designedCakeConfigs.decorationId),
            eq(decorationPrices.regionId, regionId),
          ),
        )
        .leftJoin(
          shapePrices,
          and(
            eq(shapePrices.shapeId, designedCakeConfigs.shapeId),
            eq(shapePrices.regionId, regionId),
          ),
        )
        .where(eq(designedCakeConfigs.predesignedCakeId, predesignedCakeId));

      let totalPrice = 0;
      for (const config of configPrices) {
        totalPrice += parseFloat(config.flavorPrice || '0');
        totalPrice += parseFloat(config.decorationPrice || '0');
        totalPrice += parseFloat(config.shapePrice || '0');
      }

      return totalPrice;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve configs price: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException(
        errorResponse(
          'routes.predesigned_cakes.failed_retrieve_configs_price',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }
}
