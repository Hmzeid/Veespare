import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * All 27 Egyptian governorates.
 */
export enum EgyptianGovernorate {
  CAIRO = 'Cairo',
  GIZA = 'Giza',
  ALEXANDRIA = 'Alexandria',
  DAKAHLIA = 'Dakahlia',
  RED_SEA = 'Red Sea',
  BEHEIRA = 'Beheira',
  FAYOUM = 'Fayoum',
  GHARBIA = 'Gharbia',
  ISMAILIA = 'Ismailia',
  MENOFIA = 'Menofia',
  MINYA = 'Minya',
  QALYUBIA = 'Qalyubia',
  NEW_VALLEY = 'New Valley',
  SUEZ = 'Suez',
  ASWAN = 'Aswan',
  ASYUT = 'Asyut',
  BENI_SUEF = 'Beni Suef',
  PORT_SAID = 'Port Said',
  DAMIETTA = 'Damietta',
  SHARQIA = 'Sharqia',
  SOUTH_SINAI = 'South Sinai',
  KAFR_EL_SHEIKH = 'Kafr El Sheikh',
  MATROUH = 'Matrouh',
  LUXOR = 'Luxor',
  QENA = 'Qena',
  NORTH_SINAI = 'North Sinai',
  SOHAG = 'Sohag',
}

export class CreateAddressDto {
  @ApiProperty({ example: 'Home', description: 'Address label in English' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  label: string;

  @ApiProperty({ example: 'المنزل', description: 'Address label in Arabic' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(/^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\s\d]+$/, {
    message: 'labelAr must contain Arabic characters',
  })
  labelAr: string;

  @ApiProperty({ example: '15 Tahrir Street' })
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  street: string;

  @ApiProperty({ example: 'Downtown' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  area: string;

  @ApiProperty({ example: 'Cairo' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city: string;

  @ApiProperty({
    example: EgyptianGovernorate.CAIRO,
    enum: EgyptianGovernorate,
    description: 'Egyptian governorate',
  })
  @IsEnum(EgyptianGovernorate, {
    message: `governorate must be a valid Egyptian governorate`,
  })
  governorate: EgyptianGovernorate;

  @ApiPropertyOptional({ example: '11511' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  postalCode?: string;

  @ApiPropertyOptional({ example: 30.0444, description: 'Latitude' })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ example: 31.2357, description: 'Longitude' })
  @IsOptional()
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({ example: true, description: 'Set as default address' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
