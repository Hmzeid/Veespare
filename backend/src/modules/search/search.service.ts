import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CarPart, CarPartDocument } from '@/schemas/car-part.schema';
import {
  AutocompleteQueryDto,
  SearchEntityType,
  SearchQueryDto,
  SearchSortBy,
} from './dto/search-query.dto';

export interface SearchResult<T = any> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  query: string;
  filters: Record<string, any>;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private static readonly CACHE_TTL = 300; // 5 minutes
  private static readonly CACHE_PREFIX = 'search:';

  constructor(
    @InjectModel(CarPart.name)
    private readonly carPartModel: Model<CarPartDocument>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /**
   * Normalize Arabic text for search:
   * - Remove tashkeel (diacritical marks)
   * - Normalize hamza variants to bare alef
   * - Normalize taa marbuta to haa
   * - Normalize alef maksura to yaa
   */
  normalizeArabic(text: string): string {
    if (!text) return text;

    return (
      text
        // Remove tashkeel (Arabic diacritical marks): fathah, dammah, kasrah, sukun, shadda, tanwin
        .replace(/[\u064B-\u065F\u0670]/g, '')
        // Normalize hamza forms to bare alef
        .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')
        // Normalize alef maksura to yaa
        .replace(/\u0649/g, '\u064A')
        // Normalize taa marbuta to haa
        .replace(/\u0629/g, '\u0647')
        // Collapse whitespace
        .replace(/\s+/g, ' ')
        .trim()
    );
  }

  /**
   * Build a cache key from the search query parameters.
   */
  private buildCacheKey(dto: SearchQueryDto | AutocompleteQueryDto, prefix: string): string {
    const sorted = Object.keys(dto)
      .sort()
      .reduce((acc, key) => {
        if (dto[key] !== undefined && dto[key] !== null) {
          acc[key] = dto[key];
        }
        return acc;
      }, {} as Record<string, any>);

    return `${SearchService.CACHE_PREFIX}${prefix}:${JSON.stringify(sorted)}`;
  }

  /**
   * Main search endpoint - dispatches to the correct entity search.
   */
  async search(dto: SearchQueryDto): Promise<SearchResult> {
    const cacheKey = this.buildCacheKey(dto, 'main');
    const cached = await this.cacheManager.get<SearchResult>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for search: ${dto.q}`);
      return cached;
    }

    const type = dto.type || SearchEntityType.PRODUCTS;
    let result: SearchResult;

    switch (type) {
      case SearchEntityType.PARTS:
        result = await this.searchParts(dto);
        break;
      case SearchEntityType.STORES:
        result = await this.searchStores(dto);
        break;
      case SearchEntityType.PRODUCTS:
      default:
        result = await this.searchProducts(dto);
        break;
    }

    await this.cacheManager.set(cacheKey, result, SearchService.CACHE_TTL);
    return result;
  }

  /**
   * Search products (store_products + car_parts combined).
   * Uses MongoDB text search on the car_parts collection with filters.
   */
  async searchProducts(dto: SearchQueryDto): Promise<SearchResult> {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;
    const normalizedQuery = this.normalizeArabic(dto.q);

    const filter = this.buildCarPartFilter(dto, normalizedQuery);
    const sort = this.buildSortOptions(dto.sortBy);

    const [items, total] = await Promise.all([
      this.carPartModel
        .find(filter, { score: { $meta: 'textScore' } })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.carPartModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      query: dto.q,
      filters: this.extractActiveFilters(dto),
    };
  }

  /**
   * Search car parts catalog by text, OEM number, or filters.
   */
  async searchParts(dto: SearchQueryDto): Promise<SearchResult> {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;
    const normalizedQuery = this.normalizeArabic(dto.q);

    const filter = this.buildCarPartFilter(dto, normalizedQuery);
    const sort = this.buildSortOptions(dto.sortBy);

    const [items, total] = await Promise.all([
      this.carPartModel
        .find(filter, { score: { $meta: 'textScore' } })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.carPartModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      query: dto.q,
      filters: this.extractActiveFilters(dto),
    };
  }

  /**
   * Search stores - placeholder that queries parts by location proxy.
   * In a full implementation, this would query the PostgreSQL stores table
   * via a TypeORM repository. For now, returns an empty result set.
   */
  async searchStores(dto: SearchQueryDto): Promise<SearchResult> {
    const page = dto.page || 1;
    const limit = dto.limit || 20;

    // Store search would be implemented via TypeORM against the stores table.
    // This is a placeholder returning the correct shape.
    this.logger.warn('Store search is not yet fully implemented; returning empty results.');

    return {
      items: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
      query: dto.q,
      filters: this.extractActiveFilters(dto),
    };
  }

  /**
   * Autocomplete suggestions based on partial query.
   * Returns matching part names, OEM numbers, and categories.
   */
  async autocomplete(dto: AutocompleteQueryDto): Promise<{ suggestions: any[] }> {
    const cacheKey = this.buildCacheKey(dto, 'autocomplete');
    const cached = await this.cacheManager.get<{ suggestions: any[] }>(cacheKey);
    if (cached) return cached;

    const limit = dto.limit || 10;
    const normalizedQuery = this.normalizeArabic(dto.q);
    const escapedQuery = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQuery, 'i');

    const [nameMatches, oemMatches] = await Promise.all([
      this.carPartModel
        .find(
          {
            isActive: true,
            $or: [{ nameAr: regex }, { nameEn: regex }, { tagsAr: regex }, { tags: regex }],
          },
          { nameAr: 1, nameEn: 1, category: 1, oemNumber: 1 },
        )
        .limit(limit)
        .lean()
        .exec(),
      this.carPartModel
        .find(
          {
            isActive: true,
            $or: [{ oemNumber: regex }, { alternativeOemNumbers: regex }],
          },
          { nameAr: 1, nameEn: 1, oemNumber: 1 },
        )
        .limit(Math.min(limit, 5))
        .lean()
        .exec(),
    ]);

    const suggestions = [
      ...oemMatches.map((m) => ({
        type: 'oem' as const,
        text: m.oemNumber,
        nameAr: m.nameAr,
        nameEn: m.nameEn,
      })),
      ...nameMatches.map((m) => ({
        type: 'part' as const,
        text: m.nameAr || m.nameEn,
        nameAr: m.nameAr,
        nameEn: m.nameEn,
        category: m.category,
      })),
    ];

    // Deduplicate by text
    const seen = new Set<string>();
    const uniqueSuggestions = suggestions.filter((s) => {
      if (seen.has(s.text)) return false;
      seen.add(s.text);
      return true;
    });

    const result = { suggestions: uniqueSuggestions.slice(0, limit) };
    await this.cacheManager.set(cacheKey, result, SearchService.CACHE_TTL);
    return result;
  }

  /**
   * Build MongoDB filter for car parts queries.
   */
  private buildCarPartFilter(dto: SearchQueryDto, normalizedQuery: string): Record<string, any> {
    const filter: Record<string, any> = {
      isActive: true,
      deletedAt: null,
    };

    // Check if query looks like an OEM number (alphanumeric with possible hyphens)
    const isOemQuery = /^[A-Za-z0-9\-]+$/.test(dto.q.trim());

    if (isOemQuery) {
      filter.$or = [
        { oemNumber: { $regex: dto.q.trim(), $options: 'i' } },
        { alternativeOemNumbers: { $regex: dto.q.trim(), $options: 'i' } },
        { crossReferenceNumbers: { $regex: dto.q.trim(), $options: 'i' } },
        { $text: { $search: normalizedQuery } },
      ];
    } else {
      filter.$text = { $search: normalizedQuery };
    }

    // Car compatibility filters
    if (dto.make || dto.model || dto.year) {
      const carFilter: Record<string, any> = {};
      if (dto.make) {
        carFilter['compatibleCars.make'] = { $regex: new RegExp(`^${dto.make}$`, 'i') };
      }
      if (dto.model) {
        carFilter['compatibleCars.model'] = { $regex: new RegExp(`^${dto.model}$`, 'i') };
      }
      if (dto.year) {
        carFilter['compatibleCars.yearFrom'] = { $lte: dto.year };
        carFilter['compatibleCars.yearTo'] = { $gte: dto.year };
      }
      Object.assign(filter, carFilter);
    }

    // Category filter
    if (dto.category) {
      filter.category = dto.category;
    }

    // Brand filter
    if (dto.brand) {
      filter.brand = { $regex: new RegExp(`^${dto.brand}$`, 'i') };
    }

    // Price range filter
    if (dto.minPrice !== undefined || dto.maxPrice !== undefined) {
      filter.marketMedianPrice = {};
      if (dto.minPrice !== undefined) {
        filter.marketMedianPrice.$gte = dto.minPrice;
      }
      if (dto.maxPrice !== undefined) {
        filter.marketMedianPrice.$lte = dto.maxPrice;
      }
    }

    return filter;
  }

  /**
   * Build MongoDB sort options from the sortBy enum.
   */
  private buildSortOptions(sortBy?: SearchSortBy): Record<string, any> {
    switch (sortBy) {
      case SearchSortBy.PRICE_ASC:
        return { marketMedianPrice: 1 };
      case SearchSortBy.PRICE_DESC:
        return { marketMedianPrice: -1 };
      case SearchSortBy.RATING:
        return { totalListings: -1 }; // proxy for popularity
      case SearchSortBy.NEWEST:
        return { createdAt: -1 };
      case SearchSortBy.RELEVANCE:
      default:
        return { score: { $meta: 'textScore' } };
    }
  }

  /**
   * Extract the active filters from the DTO for the response.
   */
  private extractActiveFilters(dto: SearchQueryDto): Record<string, any> {
    const filters: Record<string, any> = {};
    if (dto.make) filters.make = dto.make;
    if (dto.model) filters.model = dto.model;
    if (dto.year) filters.year = dto.year;
    if (dto.category) filters.category = dto.category;
    if (dto.condition) filters.condition = dto.condition;
    if (dto.brand) filters.brand = dto.brand;
    if (dto.location) filters.location = dto.location;
    if (dto.minPrice !== undefined) filters.minPrice = dto.minPrice;
    if (dto.maxPrice !== undefined) filters.maxPrice = dto.maxPrice;
    return filters;
  }
}
