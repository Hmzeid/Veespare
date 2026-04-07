import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum SearchSortBy {
  RELEVANCE = 'relevance',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  RATING = 'rating',
  NEWEST = 'newest',
}

export enum SearchEntityType {
  PRODUCTS = 'products',
  PARTS = 'parts',
  STORES = 'stores',
}

export class SearchQueryDto {
  @ApiProperty({ example: 'فلتر زيت', description: 'Search query (Arabic or English)' })
  @IsString()
  q: string;

  @ApiPropertyOptional({ enum: SearchEntityType, default: SearchEntityType.PRODUCTS })
  @IsOptional()
  @IsEnum(SearchEntityType)
  type?: SearchEntityType;

  @ApiPropertyOptional({ example: 'Toyota', description: 'Filter by car make' })
  @IsOptional()
  @IsString()
  make?: string;

  @ApiPropertyOptional({ example: 'Corolla', description: 'Filter by car model' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 2020, description: 'Filter by car year' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1960)
  @Max(2030)
  year?: number;

  @ApiPropertyOptional({ example: 'engine_parts', description: 'Filter by category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'new', description: 'Filter by condition (new, used, refurbished)' })
  @IsOptional()
  @IsString()
  condition?: string;

  @ApiPropertyOptional({ example: 0, description: 'Minimum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ example: 10000, description: 'Maximum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ example: 'Cairo', description: 'Filter by store location/city' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'Denso', description: 'Filter by brand' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ enum: SearchSortBy, default: SearchSortBy.RELEVANCE })
  @IsOptional()
  @IsEnum(SearchSortBy)
  sortBy?: SearchSortBy;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class AutocompleteQueryDto {
  @ApiProperty({ example: 'فلتر', description: 'Partial search query for autocomplete' })
  @IsString()
  q: string;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;
}
