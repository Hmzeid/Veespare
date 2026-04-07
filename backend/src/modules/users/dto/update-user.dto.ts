import {
  IsString,
  IsOptional,
  IsEnum,
  IsUrl,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Ahmed', description: 'First name (English)' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Hassan', description: 'Last name (English)' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ example: 'أحمد', description: 'First name (Arabic)' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\s]+$/, {
    message: 'firstNameAr must contain only Arabic characters',
  })
  firstNameAr?: string;

  @ApiPropertyOptional({ example: 'حسن', description: 'Last name (Arabic)' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\s]+$/, {
    message: 'lastNameAr must contain only Arabic characters',
  })
  lastNameAr?: string;

  @ApiPropertyOptional({ example: '+201234567890', description: 'Egyptian phone number' })
  @IsOptional()
  @IsString()
  @Matches(/^\+20[0-9]{10}$/, {
    message: 'phone must be a valid Egyptian phone number (e.g. +201234567890)',
  })
  phone?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'ar', enum: ['ar', 'en'] })
  @IsOptional()
  @IsEnum(['ar', 'en'], { message: 'preferredLanguage must be either ar or en' })
  preferredLanguage?: string;

  @ApiPropertyOptional({ description: 'FCM notification token' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notificationToken?: string;
}
