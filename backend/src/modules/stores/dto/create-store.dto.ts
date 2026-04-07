import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsNumber,
  IsArray,
  MaxLength,
  MinLength,
  Matches,
  ValidateNested,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WorkingHoursEntryDto {
  @ApiProperty({ example: '09:00', description: 'Opening time in HH:mm format' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'open must be in HH:mm format' })
  open: string;

  @ApiProperty({ example: '22:00', description: 'Closing time in HH:mm format' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'close must be in HH:mm format' })
  close: string;

  @ApiProperty({ example: false, description: 'Whether the store is closed on this day' })
  @IsBoolean()
  closed: boolean;
}

export class DeliveryZoneDto {
  @ApiProperty({ example: 'Zamalek', description: 'Area name for delivery' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  area: string;

  @ApiProperty({ example: 'Cairo', description: 'Governorate for delivery zone' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  governorate: string;

  @ApiProperty({ example: 15.0, description: 'Delivery fee in EGP' })
  @IsNumber()
  @Min(0)
  deliveryFee: number;

  @ApiProperty({ example: 45, description: 'Estimated delivery time in minutes' })
  @IsNumber()
  @Min(1)
  estimatedMinutes: number;
}

export class CreateStoreDto {
  @ApiProperty({ example: 'VeeParts Cairo', description: 'Store name in English' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  nameEn: string;

  @ApiProperty({ example: 'في بارتس القاهرة', description: 'Store name in Arabic' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  nameAr: string;

  @ApiPropertyOptional({ example: 'Quality car parts store', description: 'Description in English' })
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional({ example: 'متجر قطع غيار سيارات عالية الجودة', description: 'Description in Arabic' })
  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @ApiProperty({ example: '+201234567890', description: 'Primary phone number' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^\+?[0-9]{10,15}$/, { message: 'phonePrimary must be a valid phone number' })
  phonePrimary: string;

  @ApiPropertyOptional({ example: '+201234567891', description: 'Secondary phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^\+?[0-9]{10,15}$/, { message: 'phoneSecondary must be a valid phone number' })
  phoneSecondary?: string;

  @ApiPropertyOptional({ example: 'store@veeparts.com', description: 'Store email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '15 Tahrir St, Downtown', description: 'Store address in English' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  address: string;

  @ApiProperty({ example: '١٥ شارع التحرير، وسط البلد', description: 'Store address in Arabic' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  addressAr: string;

  @ApiProperty({ example: 'Downtown', description: 'Area name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  area: string;

  @ApiProperty({ example: 'Cairo', description: 'City name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @ApiProperty({ example: 'Cairo', description: 'Governorate name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  governorate: string;

  @ApiPropertyOptional({ example: 30.0444, description: 'Latitude coordinate' })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiPropertyOptional({ example: 31.2357, description: 'Longitude coordinate' })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;

  @ApiPropertyOptional({ example: '123-456-789', description: 'Tax registration number' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxRegistrationNumber?: string;

  @ApiPropertyOptional({ example: 'CR-2024-001', description: 'Commercial register number' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  commercialRegister?: string;

  @ApiPropertyOptional({
    description: 'Working hours per day of week',
    example: {
      sunday: { open: '09:00', close: '22:00', closed: false },
      monday: { open: '09:00', close: '22:00', closed: false },
      tuesday: { open: '09:00', close: '22:00', closed: false },
      wednesday: { open: '09:00', close: '22:00', closed: false },
      thursday: { open: '09:00', close: '22:00', closed: false },
      friday: { open: '12:00', close: '22:00', closed: false },
      saturday: { open: '00:00', close: '00:00', closed: true },
    },
  })
  @IsOptional()
  @IsObject()
  workingHours?: Record<string, WorkingHoursEntryDto>;

  @ApiPropertyOptional({
    description: 'Delivery zones with fees',
    type: [DeliveryZoneDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryZoneDto)
  deliveryZones?: DeliveryZoneDto[];

  @ApiPropertyOptional({ example: true, description: 'Whether the store supports pickup' })
  @IsOptional()
  @IsBoolean()
  supportsPickup?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Whether the store supports delivery' })
  @IsOptional()
  @IsBoolean()
  supportsDelivery?: boolean;
}
