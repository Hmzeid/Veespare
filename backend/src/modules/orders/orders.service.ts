import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  Order,
  OrderStatus,
  PaymentStatus,
} from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto, CancelOrderDto, RefundOrderDto } from './dto/update-order-status.dto';
import { OrdersGateway } from './orders.gateway';

/** Commission rate: 6% of subtotal */
const COMMISSION_RATE = 0.06;

/** Auto-cancel deadline: 2 hours in milliseconds */
const AUTO_CANCEL_MS = 2 * 60 * 60 * 1000;

/** Commission hold period after delivery: 48 hours in milliseconds */
const COMMISSION_HOLD_MS = 48 * 60 * 60 * 1000;

/**
 * Valid status transitions. Each key maps to the set of statuses
 * reachable from that key.
 */
const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [
    OrderStatus.CONFIRMED,
    OrderStatus.PAYMENT_PENDING,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.CONFIRMED]: [
    OrderStatus.PAYMENT_PENDING,
    OrderStatus.PAID,
    OrderStatus.PREPARING,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.PAYMENT_PENDING]: [
    OrderStatus.PAID,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.PAID]: [
    OrderStatus.PREPARING,
    OrderStatus.CANCELLED,
    OrderStatus.REFUNDED,
  ],
  [OrderStatus.PREPARING]: [
    OrderStatus.READY_FOR_PICKUP,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.READY_FOR_PICKUP]: [
    OrderStatus.ON_THE_WAY,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.ON_THE_WAY]: [
    OrderStatus.DELIVERED,
  ],
  [OrderStatus.DELIVERED]: [
    OrderStatus.COMPLETED,
    OrderStatus.DISPUTED,
    OrderStatus.REFUNDED,
  ],
  [OrderStatus.COMPLETED]: [
    OrderStatus.DISPUTED,
    OrderStatus.REFUNDED,
  ],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
  [OrderStatus.DISPUTED]: [
    OrderStatus.REFUNDED,
    OrderStatus.COMPLETED,
  ],
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly itemsRepo: Repository<OrderItem>,
    @InjectRepository(OrderStatusHistory)
    private readonly historyRepo: Repository<OrderStatusHistory>,
    private readonly dataSource: DataSource,
    private readonly ordersGateway: OrdersGateway,
  ) {}

  // ---------------------------------------------------------------
  // Order number generation: VP-YYMMDD-XXXX
  // ---------------------------------------------------------------
  private async generateOrderNumber(): Promise<string> {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const prefix = `VP-${yy}${mm}${dd}`;

    // Get the count of orders created today to derive the sequence
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const count = await this.ordersRepo
      .createQueryBuilder('o')
      .where('o.createdAt >= :todayStart', { todayStart })
      .getCount();

    const seq = String(count + 1).padStart(4, '0');
    return `${prefix}-${seq}`;
  }

  // ---------------------------------------------------------------
  // Create Order
  // ---------------------------------------------------------------
  async createOrder(
    customerId: string,
    dto: CreateOrderDto,
  ): Promise<Order> {
    // Idempotency check
    if (dto.idempotencyKey) {
      const existing = await this.ordersRepo.findOne({
        where: { idempotencyKey: dto.idempotencyKey },
        relations: ['items'],
      });
      if (existing) {
        return existing;
      }
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    return this.dataSource.transaction(async (manager) => {
      const orderNumber = await this.generateOrderNumber();

      // Calculate totals
      const subtotal = dto.items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      );
      const deliveryFee = dto.deliveryFee ?? 0;
      const total = subtotal + deliveryFee;

      // Commission: 6% of subtotal (excluding delivery)
      const commissionAmount = parseFloat((subtotal * COMMISSION_RATE).toFixed(2));
      const storePayout = parseFloat((subtotal - commissionAmount).toFixed(2));

      // Auto-cancel deadline: 2 hours from now
      const confirmDeadline = new Date(Date.now() + AUTO_CANCEL_MS);

      const order = manager.create(Order, {
        orderNumber,
        customerId,
        storeId: dto.storeId,
        status: OrderStatus.PENDING,
        paymentMethod: dto.paymentMethod,
        paymentStatus: PaymentStatus.PENDING,
        subtotal,
        deliveryFee,
        discount: 0,
        total,
        commissionAmount,
        commissionRate: COMMISSION_RATE,
        storePayout,
        commissionCleared: false,
        currency: 'EGP',
        deliveryMethod: dto.deliveryMethod,
        deliveryAddress: dto.deliveryAddress ?? null,
        customerNotes: dto.customerNotes ?? null,
        idempotencyKey: dto.idempotencyKey ?? null,
        confirmDeadline,
        createdBy: customerId,
      });

      const savedOrder = await manager.save(Order, order);

      // Create order items
      const orderItems = dto.items.map((item) =>
        manager.create(OrderItem, {
          orderId: savedOrder.id,
          storeProductId: item.storeProductId,
          productNameEn: item.productNameEn,
          productNameAr: item.productNameAr,
          oemNumber: item.oemNumber ?? null,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          totalPrice: parseFloat((item.unitPrice * item.quantity).toFixed(2)),
          condition: item.condition ?? null,
          productImage: item.productImage ?? null,
          warrantyMonths: item.warrantyMonths ?? null,
        }),
      );
      await manager.save(OrderItem, orderItems);

      // Record initial status history
      const history = manager.create(OrderStatusHistory, {
        orderId: savedOrder.id,
        fromStatus: null,
        toStatus: OrderStatus.PENDING,
        changedBy: customerId,
        changeReason: 'Order created',
      });
      await manager.save(OrderStatusHistory, history);

      savedOrder.items = orderItems;

      // Notify via WebSocket
      this.ordersGateway.notifyOrderCreated(savedOrder);

      return savedOrder;
    });
  }

  // ---------------------------------------------------------------
  // Update Order Status
  // ---------------------------------------------------------------
  async updateStatus(
    orderId: string,
    dto: UpdateOrderStatusDto,
    changedBy: string,
  ): Promise<Order> {
    const order = await this.ordersRepo.findOne({
      where: { id: orderId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    this.validateTransition(order.status, dto.status);

    return this.dataSource.transaction(async (manager) => {
      const previousStatus = order.status;
      order.status = dto.status;
      order.updatedBy = changedBy;

      // Side-effects per status
      if (dto.status === OrderStatus.DELIVERED) {
        order.deliveredAt = new Date();
      }

      if (dto.status === OrderStatus.COMPLETED) {
        // Schedule commission clearing 48 hours after delivery
        if (order.deliveredAt) {
          const clearAt = new Date(order.deliveredAt.getTime() + COMMISSION_HOLD_MS);
          if (new Date() >= clearAt) {
            order.commissionCleared = true;
            order.commissionClearedAt = new Date();
          }
          // Otherwise a scheduled job will clear it later
        }
      }

      if (dto.status === OrderStatus.PAID) {
        order.paymentStatus = PaymentStatus.PAID;
        order.paidAt = new Date();
      }

      await manager.save(Order, order);

      // Record history
      const history = manager.create(OrderStatusHistory, {
        orderId: order.id,
        fromStatus: previousStatus,
        toStatus: dto.status,
        changedBy,
        changeReason: dto.reason ?? null,
      });
      await manager.save(OrderStatusHistory, history);

      // Notify via WebSocket
      this.ordersGateway.notifyStatusChange(order, previousStatus);

      return order;
    });
  }

  // ---------------------------------------------------------------
  // Cancel Order
  // ---------------------------------------------------------------
  async cancelOrder(
    orderId: string,
    dto: CancelOrderDto,
    cancelledBy: string,
  ): Promise<Order> {
    const order = await this.ordersRepo.findOne({
      where: { id: orderId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    this.validateTransition(order.status, OrderStatus.CANCELLED);

    return this.dataSource.transaction(async (manager) => {
      const previousStatus = order.status;
      order.status = OrderStatus.CANCELLED;
      order.cancelledAt = new Date();
      order.cancelReason = dto.cancelReason;
      order.updatedBy = cancelledBy;

      await manager.save(Order, order);

      const history = manager.create(OrderStatusHistory, {
        orderId: order.id,
        fromStatus: previousStatus,
        toStatus: OrderStatus.CANCELLED,
        changedBy: cancelledBy,
        changeReason: dto.cancelReason,
      });
      await manager.save(OrderStatusHistory, history);

      this.ordersGateway.notifyStatusChange(order, previousStatus);

      return order;
    });
  }

  // ---------------------------------------------------------------
  // Refund Order
  // ---------------------------------------------------------------
  async refundOrder(
    orderId: string,
    dto: RefundOrderDto,
    refundedBy: string,
  ): Promise<Order> {
    const order = await this.ordersRepo.findOne({
      where: { id: orderId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    this.validateTransition(order.status, OrderStatus.REFUNDED);

    if (dto.refundAmount > Number(order.total)) {
      throw new BadRequestException('Refund amount cannot exceed order total');
    }

    return this.dataSource.transaction(async (manager) => {
      const previousStatus = order.status;
      order.status = OrderStatus.REFUNDED;
      order.refundAmount = dto.refundAmount;
      order.refundedAt = new Date();
      order.paymentStatus =
        dto.refundAmount >= Number(order.total)
          ? PaymentStatus.REFUNDED
          : PaymentStatus.PARTIALLY_REFUNDED;
      order.updatedBy = refundedBy;

      await manager.save(Order, order);

      const history = manager.create(OrderStatusHistory, {
        orderId: order.id,
        fromStatus: previousStatus,
        toStatus: OrderStatus.REFUNDED,
        changedBy: refundedBy,
        changeReason: dto.reason ?? 'Refund processed',
        metadata: { refundAmount: dto.refundAmount },
      });
      await manager.save(OrderStatusHistory, history);

      this.ordersGateway.notifyStatusChange(order, previousStatus);

      return order;
    });
  }

  // ---------------------------------------------------------------
  // Get single order
  // ---------------------------------------------------------------
  async getOrder(orderId: string): Promise<Order> {
    const order = await this.ordersRepo.findOne({
      where: { id: orderId },
      relations: ['items', 'statusHistory', 'customer', 'store'],
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    return order;
  }

  // ---------------------------------------------------------------
  // List orders (with basic filters + pagination)
  // ---------------------------------------------------------------
  async listOrders(filters: {
    customerId?: string;
    storeId?: string;
    status?: OrderStatus;
    page?: number;
    limit?: number;
  }): Promise<{ data: Order[]; total: number; page: number; limit: number }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const qb = this.ordersRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .orderBy('order.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filters.customerId) {
      qb.andWhere('order.customerId = :customerId', {
        customerId: filters.customerId,
      });
    }

    if (filters.storeId) {
      qb.andWhere('order.storeId = :storeId', {
        storeId: filters.storeId,
      });
    }

    if (filters.status) {
      qb.andWhere('order.status = :status', { status: filters.status });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  // ---------------------------------------------------------------
  // Auto-cancel expired pending orders (called by a cron / scheduler)
  // ---------------------------------------------------------------
  async autoCancelExpiredOrders(): Promise<number> {
    const now = new Date();
    const expired = await this.ordersRepo
      .createQueryBuilder('order')
      .where('order.status = :status', { status: OrderStatus.PENDING })
      .andWhere('order.confirmDeadline <= :now', { now })
      .getMany();

    let cancelled = 0;

    for (const order of expired) {
      try {
        await this.cancelOrder(
          order.id,
          { cancelReason: 'Auto-cancelled: store did not confirm within 2 hours' },
          'system',
        );
        cancelled++;
      } catch (err) {
        this.logger.error(
          `Failed to auto-cancel order ${order.orderNumber}: ${err.message}`,
        );
      }
    }

    this.logger.log(`Auto-cancelled ${cancelled} expired orders`);
    return cancelled;
  }

  // ---------------------------------------------------------------
  // Clear matured commissions (called by a cron / scheduler)
  // ---------------------------------------------------------------
  async clearMaturedCommissions(): Promise<number> {
    const cutoff = new Date(Date.now() - COMMISSION_HOLD_MS);
    const result = await this.ordersRepo
      .createQueryBuilder()
      .update(Order)
      .set({
        commissionCleared: true,
        commissionClearedAt: new Date(),
      })
      .where('status IN (:...statuses)', {
        statuses: [OrderStatus.DELIVERED, OrderStatus.COMPLETED],
      })
      .andWhere('commissionCleared = false')
      .andWhere('deliveredAt <= :cutoff', { cutoff })
      .execute();

    const affected = result.affected ?? 0;
    this.logger.log(`Cleared commission for ${affected} orders`);
    return affected;
  }

  // ---------------------------------------------------------------
  // Validation helpers
  // ---------------------------------------------------------------
  private validateTransition(
    currentStatus: OrderStatus,
    targetStatus: OrderStatus,
  ): void {
    const allowed = STATUS_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(targetStatus)) {
      throw new BadRequestException(
        `Cannot transition from "${currentStatus}" to "${targetStatus}"`,
      );
    }
  }
}
