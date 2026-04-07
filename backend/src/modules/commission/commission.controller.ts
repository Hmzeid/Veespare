import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CommissionService } from './commission.service';
import {
  TransactionHistoryQueryDto,
  ClearCommissionsDto,
} from './dto/commission-query.dto';

@ApiTags('Commission')
@Controller('commission')
export class CommissionController {
  constructor(private readonly commissionService: CommissionService) {}

  @Get('store/:storeId/balance')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get store wallet balance',
    description: 'Returns wallet balance, pending balance, and available balance for a store',
  })
  @ApiParam({ name: 'storeId', description: 'Store UUID' })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async getStoreBalance(@Param('storeId') storeId: string) {
    return this.commissionService.getStoreBalance(storeId);
  }

  @Get('store/:storeId/transactions')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get transaction history',
    description: 'Returns paginated wallet transaction history for a store',
  })
  @ApiParam({ name: 'storeId', description: 'Store UUID' })
  @ApiResponse({ status: 200, description: 'Transaction history retrieved' })
  async getTransactionHistory(
    @Param('storeId') storeId: string,
    @Query() query: TransactionHistoryQueryDto,
  ) {
    return this.commissionService.getTransactionHistory(
      storeId,
      query.page,
      query.limit,
      query.type,
    );
  }

  @Get('store/:storeId/invoice/:month')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get monthly invoice',
    description: 'Generate Arabic tax-compliant monthly commission invoice for a store',
  })
  @ApiParam({ name: 'storeId', description: 'Store UUID' })
  @ApiParam({ name: 'month', description: 'Month in YYYY-MM format', example: '2026-03' })
  @ApiResponse({ status: 200, description: 'Invoice generated successfully' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async getMonthlyInvoice(
    @Param('storeId') storeId: string,
    @Param('month') month: string,
  ) {
    return this.commissionService.generateMonthlyInvoice(storeId, month);
  }

  @Post('clear')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clear pending commissions',
    description: 'Admin endpoint: clear all commissions that have passed the 48-hour hold period',
  })
  @ApiResponse({ status: 200, description: 'Commissions cleared' })
  async clearPendingCommissions(@Body() dto: ClearCommissionsDto) {
    return this.commissionService.clearPendingCommissions();
  }
}
