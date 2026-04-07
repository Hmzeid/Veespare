import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsNumber,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartCondition, ProductStatus } from '../entities/store-product.entity';

export class ProductQueryDto {
  @ApiPropertyOptional({ description: 'Search by name (EN or AR) or OEM number' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by category', example: 'Brakes' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by brand', example: 'Bosch' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ description: 'Filter by part condition', enum: PartCondition })
  @IsOptional()
  @IsEnum(PartCondition)
  condition?: PartCondition;

  @ApiPropertyOptional({ description: 'Filter by product status', enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ description: 'Minimum price', example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price', example: 5000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Filter by compatible car make', example: 'Toyota' })
  @IsOptional()
  @IsString()
  carMake?: string;

  @ApiPropertyOptional({ description: 'Filter by compatible car model', example: 'Camry' })
  @IsOptional()
  @IsString()
  carModel?: string;

  @ApiPropertyOptional({ description: 'Filter by compatible car year', example: 2020 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  carYear?: number;

  @ApiPropertyOptional({ description: 'Only show in-stock items', example: true })
  @IsOptional()
  @Type(() => Boolean)
  inStock?: boolean;

  // Pagination
  @ApiPropertyOptional({ description: 'Page number (1-based)', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  // Sorting
  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'price',
    default: 'createdAt',
    enum: ['price', 'createdAt', 'updatedAt', 'stock', 'avgRating', 'orderCount', 'viewCount', 'nameEn'],
  })
  @IsOptional()
  @IsIn(['price', 'createdAt', 'updatedAt', 'stock', 'avgRating', 'orderCount', 'viewCount', 'nameEn'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'DESC',
    default: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class PriceComparisonQueryDto {
  @ApiPropertyOptional({ description: 'Filter by part condition', enum: PartCondition })
  @IsOptional()
  @IsEnum(PartCondition)
  condition?: PartCondition;

  @ApiPropertyOptional({ description: 'Maximum number of results', example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Sort by price order',
    example: 'ASC',
    default: 'ASC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}

export class StockAlertQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}
