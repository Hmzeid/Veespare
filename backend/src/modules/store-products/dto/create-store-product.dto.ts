import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  IsInt,
  Min,
  MaxLength,
  ValidateNested,
  IsUrl,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartCondition } from '../entities/store-product.entity';

export class CompatibleCarDto {
  @ApiProperty({ example: 'Toyota', description: 'Car manufacturer' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  make: string;

  @ApiProperty({ example: 'Camry', description: 'Car model' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  model: string;

  @ApiProperty({ example: 2018, description: 'Compatible from year' })
  @IsInt()
  @Min(1950)
  @Max(2030)
  yearFrom: number;

  @ApiProperty({ example: 2024, description: 'Compatible to year' })
  @IsInt()
  @Min(1950)
  @Max(2030)
  yearTo: number;

  @ApiPropertyOptional({ example: '2.5L 4-Cylinder', description: 'Engine specification' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  engine?: string;
}

export class CreateStoreProductDto {
  @ApiProperty({ description: 'Store ID (UUID)', example: 'b3d7c8e0-1234-4abc-9def-567890abcdef' })
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @ApiProperty({ description: 'Reference to MongoDB part catalog _id', example: '64a1b2c3d4e5f6a7b8c9d0e1' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  partId: string;

  @ApiPropertyOptional({ description: 'OEM part number', example: '04465-33471' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  oemNumber?: string;

  @ApiProperty({ description: 'Product name in English', example: 'Front Brake Pad Set' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  nameEn: string;

  @ApiProperty({ description: 'اسم المنتج بالعربية', example: 'طقم تيل فرامل أمامي' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  nameAr: string;

  @ApiPropertyOptional({ description: 'Product description in English' })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional({ description: 'وصف المنتج بالعربية' })
  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @ApiPropertyOptional({ description: 'Product category', example: 'Brakes' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ description: 'Brand name', example: 'Bosch' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @ApiProperty({ description: 'Price in specified currency', example: 450.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'Original price before discount', example: 550.00 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  originalPrice?: number;

  @ApiPropertyOptional({ description: 'Currency code (ISO 4217)', example: 'EGP', default: 'EGP' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiProperty({ description: 'Stock quantity', example: 25 })
  @IsInt()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({ description: 'Minimum stock level to trigger alert', example: 5, default: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minStockAlert?: number;

  @ApiProperty({
    description: 'Part condition',
    enum: PartCondition,
    example: PartCondition.NEW,
  })
  @IsEnum(PartCondition)
  condition: PartCondition;

  @ApiPropertyOptional({
    description: 'Product image URLs',
    example: ['https://cdn.veeparts.com/img1.jpg'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];

  @ApiPropertyOptional({
    description: 'Compatible car specifications',
    type: [CompatibleCarDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompatibleCarDto)
  compatibleCars?: CompatibleCarDto[];

  @ApiPropertyOptional({ description: 'Warranty duration in months', example: 12 })
  @IsOptional()
  @IsInt()
  @Min(0)
  warrantyMonths?: number;

  @ApiPropertyOptional({ description: 'Product weight in kilograms', example: 1.5 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  weightKg?: number;
}
