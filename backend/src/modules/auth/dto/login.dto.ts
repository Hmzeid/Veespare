import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  IsEmail,
  ValidateIf,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiPropertyOptional({
    example: 'ahmed@example.com',
    description: 'Email address (provide either email or phone)',
  })
  @ValidateIf((o) => !o.phone)
  @IsEmail()
  @IsNotEmpty({ message: 'email is required when phone is not provided' })
  email?: string;

  @ApiPropertyOptional({
    example: '+201234567890',
    description: 'Egyptian phone number (provide either email or phone)',
  })
  @ValidateIf((o) => !o.email)
  @IsString()
  @IsNotEmpty({ message: 'phone is required when email is not provided' })
  @Matches(/^\+20[0-9]{10}$/, {
    message: 'phone must be a valid Egyptian phone number in format +20XXXXXXXXXX',
  })
  phone?: string;

  @ApiProperty({ example: 'P@ssw0rd123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
