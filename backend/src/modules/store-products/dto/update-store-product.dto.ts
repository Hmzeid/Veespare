import { PartialType, OmitType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsEnum } from 'class-validator';
import { CreateStoreProductDto } from './create-store-product.dto';
import { ProductStatus } from '../entities/store-product.entity';

export class UpdateStoreProductDto extends PartialType(
  OmitType(CreateStoreProductDto, ['storeId', 'partId'] as const),
) {
  @ApiPropertyOptional({
    description: 'Product status',
    enum: ProductStatus,
    example: ProductStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({
    description: 'Reason for the price or stock change (stored in audit log)',
    example: 'Supplier price increase',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  changeReason?: string;

  @ApiPropertyOptional({
    description: 'Source of the change',
    example: 'manual',
    default: 'manual',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  changeSource?: string;
}
