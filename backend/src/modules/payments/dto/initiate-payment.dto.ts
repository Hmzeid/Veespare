import { IsEnum, IsUUID, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@/modules/orders/entities/order.entity';

export class InitiatePaymentDto {
  @ApiProperty({ description: 'Order ID', example: 'uuid-here' })
  @IsUUID()
  orderId: string;

  @ApiProperty({ enum: PaymentMethod, description: 'Payment method' })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiPropertyOptional({ description: 'Idempotency key to prevent duplicate payments' })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @ApiPropertyOptional({ description: 'COD deposit amount (for cash on delivery)', example: 50.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  codDepositAmount?: number;
}

export class RefundPaymentDto {
  @ApiProperty({ description: 'Order ID' })
  @IsUUID()
  orderId: string;

  @ApiPropertyOptional({ description: 'Partial refund amount. If omitted, full refund.' })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional({ description: 'Reason for refund' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Idempotency key' })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

export class PaymentResultDto {
  success: boolean;
  paymentReference?: string;
  redirectUrl?: string;
  deepLinkUrl?: string;
  transactionId?: string;
  message?: string;
  messageAr?: string;
}
