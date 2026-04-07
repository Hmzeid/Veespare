import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  PaymentMethod,
  DeliveryMethod,
} from '../entities/order.entity';

export class DeliveryAddressDto {
  @ApiProperty({ example: '15 Tahrir Street' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ example: 'Downtown' })
  @IsString()
  @IsNotEmpty()
  area: string;

  @ApiProperty({ example: 'Cairo' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Cairo' })
  @IsString()
  @IsNotEmpty()
  governorate: string;

  @ApiPropertyOptional({ example: 30.0444 })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ example: 31.2357 })
  @IsOptional()
  @IsNumber()
  lng?: number;

  @ApiProperty({ example: '+201234567890' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ example: 'Ring the doorbell twice' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class OrderItemDto {
  @ApiProperty({ description: 'Store product ID (UUID)' })
  @IsUUID()
  storeProductId: string;

  @ApiProperty({ example: 'Brake Pad Set' })
  @IsString()
  @IsNotEmpty()
  productNameEn: string;

  @ApiProperty({ example: 'طقم تيل فرامل' })
  @IsString()
  @IsNotEmpty()
  productNameAr: string;

  @ApiPropertyOptional({ example: '04465-33450' })
  @IsOptional()
  @IsString()
  oemNumber?: string;

  @ApiProperty({ example: 350.0 })
  @IsNumber()
  @Min(0.01)
  unitPrice: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  @Max(999)
  quantity: number;

  @ApiPropertyOptional({ example: 'new' })
  @IsOptional()
  @IsString()
  condition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productImage?: string;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsInt()
  @Min(0)
  warrantyMonths?: number;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Store ID (UUID)' })
  @IsUUID()
  storeId: string;

  @ApiProperty({ type: [OrderItemDto], minItems: 1 })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.VODAFONE_CASH })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ enum: DeliveryMethod, example: DeliveryMethod.DELIVERY })
  @IsEnum(DeliveryMethod)
  deliveryMethod: DeliveryMethod;

  @ApiPropertyOptional({ type: DeliveryAddressDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  deliveryAddress?: DeliveryAddressDto;

  @ApiPropertyOptional({ example: 25.0, description: 'Delivery fee' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryFee?: number;

  @ApiPropertyOptional({ example: 'Please double-check the OEM number' })
  @IsOptional()
  @IsString()
  customerNotes?: string;

  @ApiPropertyOptional({
    description: 'Idempotency key to prevent duplicate orders',
    example: 'ord-abc123-xyz',
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
