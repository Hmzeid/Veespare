import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum CarPartCategory {
  ENGINE_PARTS = 'engine_parts',
  BRAKE_SYSTEM = 'brake_system',
  ELECTRICAL = 'electrical',
  BODY_PARTS = 'body_parts',
  FILTERS = 'filters',
  SUSPENSION = 'suspension',
  COOLING = 'cooling',
  TRANSMISSION = 'transmission',
  EXHAUST = 'exhaust',
  STEERING = 'steering',
  FUEL_SYSTEM = 'fuel_system',
  INTERIOR = 'interior',
  LIGHTING = 'lighting',
  OTHER = 'other',
}

export class CompatibleCarDto {
  @ApiProperty({ example: 'Toyota' })
  @IsString()
  @IsNotEmpty()
  make: string;

  @ApiProperty({ example: 'Corolla' })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiProperty({ example: 2015 })
  @IsInt()
  @Min(1960)
  @Max(2030)
  yearFrom: number;

  @ApiProperty({ example: 2020 })
  @IsInt()
  @Min(1960)
  @Max(2030)
  yearTo: number;

  @ApiPropertyOptional({ example: '1.6L' })
  @IsOptional()
  @IsString()
  engine?: string;

  @ApiPropertyOptional({ example: 'SE' })
  @IsOptional()
  @IsString()
  trim?: string;
}

export class CreateCarPartDto {
  @ApiProperty({ example: '04152-YZZA1', description: 'OEM part number' })
  @IsString()
  @IsNotEmpty()
  oemNumber: string;

  @ApiProperty({ example: 'فلتر زيت', description: 'Part name in Arabic' })
  @IsString()
  @IsNotEmpty()
  nameAr: string;

  @ApiProperty({ example: 'Oil Filter', description: 'Part name in English' })
  @IsString()
  @IsNotEmpty()
  nameEn: string;

  @ApiPropertyOptional({ example: 'فلتر زيت أصلي لتويوتا', description: 'Description in Arabic' })
  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @ApiPropertyOptional({ example: 'Genuine oil filter for Toyota', description: 'Description in English' })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiProperty({ enum: CarPartCategory, example: CarPartCategory.FILTERS })
  @IsEnum(CarPartCategory)
  category: CarPartCategory;

  @ApiPropertyOptional({ example: 'oil_filters' })
  @IsOptional()
  @IsString()
  subcategory?: string;

  @ApiPropertyOptional({ example: 'Denso' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ type: [String], example: ['04152-YZZA2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  alternativeOemNumbers?: string[];

  @ApiPropertyOptional({ type: [String], example: ['HU7010z'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  crossReferenceNumbers?: string[];

  @ApiPropertyOptional({ type: [CompatibleCarDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompatibleCarDto)
  compatibleCars?: CompatibleCarDto[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ type: [String], example: ['oil filter', 'filter'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ type: [String], example: ['فلتر', 'زيت'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagsAr?: string[];

  @ApiPropertyOptional({ example: 150.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  marketMedianPrice?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCarPartDto extends PartialType(CreateCarPartDto) {}

export class GetCompatiblePartsDto {
  @ApiProperty({ example: 'Toyota' })
  @IsString()
  @IsNotEmpty()
  make: string;

  @ApiProperty({ example: 'Corolla' })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiProperty({ example: 2020 })
  @Type(() => Number)
  @IsInt()
  @Min(1960)
  @Max(2030)
  year: number;

  @ApiPropertyOptional({ enum: CarPartCategory })
  @IsOptional()
  @IsEnum(CarPartCategory)
  category?: CarPartCategory;

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
