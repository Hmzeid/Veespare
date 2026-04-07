import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  UpdateOrderStatusDto,
  CancelOrderDto,
  RefundOrderDto,
} from './dto/update-order-status.dto';
import { OrderStatus } from './entities/order.entity';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ---------------------------------------------------------------
  // Create order
  // ---------------------------------------------------------------
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Duplicate idempotency key' })
  async createOrder(
    @Body() dto: CreateOrderDto,
    // In production, extract customerId from the JWT via a guard/decorator.
    // For now we accept it as a query param for testability.
    @Query('customerId') customerId: string,
  ) {
    return this.ordersService.createOrder(customerId, dto);
  }

  // ---------------------------------------------------------------
  // Get single order
  // ---------------------------------------------------------------
  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Order found' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrder(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.getOrder(id);
  }

  // ---------------------------------------------------------------
  // List orders
  // ---------------------------------------------------------------
  @Get()
  @ApiOperation({ summary: 'List orders with filters and pagination' })
  @ApiQuery({ name: 'customerId', required: false, type: 'string' })
  @ApiQuery({ name: 'storeId', required: false, type: 'string' })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'page', required: false, type: 'number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: 'number', example: 20 })
  @ApiResponse({ status: 200, description: 'Paginated list of orders' })
  async listOrders(
    @Query('customerId') customerId?: string,
    @Query('storeId') storeId?: string,
    @Query('status') status?: OrderStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ordersService.listOrders({
      customerId,
      storeId,
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  // ---------------------------------------------------------------
  // Update order status
  // ---------------------------------------------------------------
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
    // In production, extract from JWT
    @Query('changedBy') changedBy: string,
  ) {
    return this.ordersService.updateStatus(id, dto, changedBy);
  }

  // ---------------------------------------------------------------
  // Cancel order
  // ---------------------------------------------------------------
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Order cancelled' })
  @ApiResponse({ status: 400, description: 'Order cannot be cancelled in current status' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async cancelOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelOrderDto,
    @Query('cancelledBy') cancelledBy: string,
  ) {
    return this.ordersService.cancelOrder(id, dto, cancelledBy);
  }

  // ---------------------------------------------------------------
  // Refund order
  // ---------------------------------------------------------------
  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refund an order (full or partial)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Refund processed' })
  @ApiResponse({ status: 400, description: 'Invalid refund or transition' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async refundOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RefundOrderDto,
    @Query('refundedBy') refundedBy: string,
  ) {
    return this.ordersService.refundOrder(id, dto, refundedBy);
  }
}
