import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@/modules/users/entities/user.entity';

export class RegisterDto {
  @ApiProperty({ example: 'Ahmed', description: 'First name in English' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Hassan', description: 'Last name in English' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({
    example: 'أحمد',
    description: 'First name in Arabic (supports Arabic characters)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[\u0600-\u06FF\s]+$/, {
    message: 'firstNameAr must contain only Arabic characters',
  })
  firstNameAr?: string;

  @ApiPropertyOptional({
    example: 'حسن',
    description: 'Last name in Arabic (supports Arabic characters)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[\u0600-\u06FF\s]+$/, {
    message: 'lastNameAr must contain only Arabic characters',
  })
  lastNameAr?: string;

  @ApiProperty({ example: 'ahmed@example.com' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    example: '+201234567890',
    description: 'Egyptian phone number in format +20XXXXXXXXXX',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+20[0-9]{10}$/, {
    message: 'phone must be a valid Egyptian phone number in format +20XXXXXXXXXX',
  })
  phone: string;

  @ApiProperty({ example: 'P@ssw0rd123', minLength: 8 })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, {
    message:
      'password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password: string;

  @ApiPropertyOptional({
    enum: UserRole,
    default: UserRole.CUSTOMER,
    description: 'User role (defaults to customer)',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    example: 'ar',
    description: 'Preferred language (ar or en)',
    default: 'ar',
  })
  @IsOptional()
  @IsString()
  @Matches(/^(ar|en)$/, { message: 'preferredLanguage must be ar or en' })
  preferredLanguage?: string;
}
