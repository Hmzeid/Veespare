import { PartialType } from '@nestjs/swagger';
import { CreateStoreDto } from './create-store.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateStoreDto extends PartialType(CreateStoreDto) {
  @ApiPropertyOptional({ example: 'https://cdn.veeparts.com/logos/store1.png', description: 'Logo URL' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'https://cdn.veeparts.com/covers/store1.png', description: 'Cover image URL' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverUrl?: string;
}
