import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../entities/order.entity';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, example: OrderStatus.CONFIRMED })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiPropertyOptional({ example: 'Store confirmed the order' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CancelOrderDto {
  @ApiProperty({ example: 'Customer changed their mind' })
  @IsString()
  cancelReason: string;
}

export class RefundOrderDto {
  @ApiProperty({ example: 350.0, description: 'Amount to refund' })
  refundAmount: number;

  @ApiPropertyOptional({ example: 'Product was damaged on arrival' })
  @IsOptional()
  @IsString()
  reason?: string;
}
