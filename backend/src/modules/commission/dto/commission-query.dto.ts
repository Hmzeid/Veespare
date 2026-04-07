import { IsUUID, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CommissionBalanceDto {
  walletBalance: number;
  pendingBalance: number;
  availableBalance: number;
  currency: string;
}

export class TransactionHistoryQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filter by type' })
  @IsOptional()
  @IsString()
  type?: string;
}

export class ClearCommissionsDto {
  @ApiProperty({ description: 'Admin idempotency key' })
  @IsString()
  idempotencyKey: string;
}

export class MonthlyInvoiceParamsDto {
  @ApiProperty({ description: 'Store ID' })
  @IsUUID()
  storeId: string;

  @ApiProperty({ description: 'Month in YYYY-MM format', example: '2026-03' })
  @IsString()
  month: string;
}
