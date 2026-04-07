import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, LessThanOrEqual, Between } from 'typeorm';
import { Order } from '@/modules/orders/entities/order.entity';
import { Store } from '@/modules/stores/entities/store.entity';
import {
  CommissionTransaction,
  CommissionStatus,
  CommissionType,
} from './entities/commission-transaction.entity';
import {
  StoreWalletTransaction,
  WalletTransactionType,
  WalletTransactionStatus,
} from './entities/store-wallet-transaction.entity';

@Injectable()
export class CommissionService {
  private readonly logger = new Logger(CommissionService.name);
  private readonly COMMISSION_RATE = 0.06; // 6%
  private readonly CLEARANCE_HOURS = 48;

  constructor(
    @InjectRepository(CommissionTransaction)
    private readonly commissionRepo: Repository<CommissionTransaction>,
    @InjectRepository(StoreWalletTransaction)
    private readonly walletTxRepo: Repository<StoreWalletTransaction>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Store)
    private readonly storeRepo: Repository<Store>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Calculate commission: 6% of subtotal (excluding delivery fee)
   */
  calculateCommission(orderSubtotal: number): {
    commissionRate: number;
    commissionAmount: number;
    storePayout: number;
  } {
    const subtotal = Number(orderSubtotal);
    const commissionAmount = Math.round(subtotal * this.COMMISSION_RATE * 100) / 100;
    const storePayout = Math.round((subtotal - commissionAmount) * 100) / 100;

    return {
      commissionRate: this.COMMISSION_RATE,
      commissionAmount,
      storePayout,
    };
  }

  /**
   * Hold commission for 48 hours after delivery.
   * Can accept an external EntityManager for transactional use.
   */
  async holdCommission(orderId: string, manager?: EntityManager): Promise<CommissionTransaction> {
    const em = manager || this.dataSource.manager;
    const idempotencyKey = `commission-hold-${orderId}`;

    // Idempotency check
    const existing = await em.findOne(CommissionTransaction, {
      where: { idempotencyKey },
    });
    if (existing) {
      this.logger.log(`Commission already held for order ${orderId}`);
      return existing;
    }

    const order = await em.findOne(Order, { where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('الطلب غير موجود - Order not found');
    }

    const { commissionRate, commissionAmount, storePayout } = this.calculateCommission(
      Number(order.subtotal),
    );

    const now = new Date();
    const clearanceAt = new Date(now.getTime() + this.CLEARANCE_HOURS * 60 * 60 * 1000);

    const commission = em.create(CommissionTransaction, {
      storeId: order.storeId,
      orderId: order.id,
      type: CommissionType.ORDER_COMMISSION,
      status: CommissionStatus.HELD,
      orderSubtotal: Number(order.subtotal),
      commissionRate,
      commissionAmount,
      storePayout,
      heldAt: now,
      clearanceAt,
      idempotencyKey,
      currency: order.currency || 'EGP',
    });

    const saved = await em.save(CommissionTransaction, commission);

    // Update order with commission info
    await em.update(Order, order.id, {
      commissionAmount,
      commissionRate,
      storePayout,
    });

    // Update store pending balance
    await em.increment(Store, { id: order.storeId }, 'pendingBalance', storePayout);

    this.logger.log(
      `Commission held for order ${order.orderNumber}: ${commissionAmount} EGP commission, ${storePayout} EGP store payout, clears at ${clearanceAt.toISOString()}`,
    );

    return saved;
  }

  /**
   * Clear commission after 48hr hold period - transfer to store wallet
   */
  async clearCommission(orderId: string, manager?: EntityManager): Promise<void> {
    const em = manager || this.dataSource.manager;
    const idempotencyKey = `commission-clear-${orderId}`;

    // Idempotency check
    const existingWalletTx = await em.findOne(StoreWalletTransaction, {
      where: { idempotencyKey },
    });
    if (existingWalletTx) {
      this.logger.log(`Commission already cleared for order ${orderId}`);
      return;
    }

    const commission = await em.findOne(CommissionTransaction, {
      where: { orderId, type: CommissionType.ORDER_COMMISSION },
    });

    if (!commission) {
      throw new NotFoundException('سجل العمولة غير موجود - Commission record not found');
    }

    if (commission.status === CommissionStatus.CLEARED) {
      return;
    }

    if (commission.status === CommissionStatus.REVERSED) {
      throw new BadRequestException('لا يمكن تصفية عمولة مستردة - Cannot clear reversed commission');
    }

    const now = new Date();
    if (now < commission.clearanceAt) {
      throw new BadRequestException(
        `فترة الانتظار لم تنتهِ بعد. يمكن التصفية بعد ${commission.clearanceAt.toISOString()} - Clearance period not yet elapsed`,
      );
    }

    const store = await em.findOne(Store, { where: { id: commission.storeId } });
    if (!store) {
      throw new NotFoundException('المتجر غير موجود - Store not found');
    }

    const balanceBefore = Number(store.walletBalance);
    const balanceAfter = balanceBefore + Number(commission.storePayout);

    // Create wallet transaction
    const walletTx = em.create(StoreWalletTransaction, {
      storeId: commission.storeId,
      type: WalletTransactionType.COMMISSION_CREDIT,
      status: WalletTransactionStatus.COMPLETED,
      amount: Number(commission.storePayout),
      balanceBefore,
      balanceAfter,
      referenceId: orderId,
      referenceType: 'order',
      currency: commission.currency,
      description: `Commission payout for order`,
      descriptionAr: `تحويل عمولة عن طلب`,
      idempotencyKey,
    });

    await em.save(StoreWalletTransaction, walletTx);

    // Update commission status
    await em.update(CommissionTransaction, commission.id, {
      status: CommissionStatus.CLEARED,
      clearedAt: now,
    });

    // Update store balances: move from pending to wallet
    await em.update(Store, store.id, {
      walletBalance: balanceAfter,
      pendingBalance: Math.max(0, Number(store.pendingBalance) - Number(commission.storePayout)),
    });

    // Mark order commission as cleared
    await em.update(Order, orderId, {
      commissionCleared: true,
      commissionClearedAt: now,
    });

    this.logger.log(
      `Commission cleared for order ${orderId}: ${commission.storePayout} EGP credited to store ${commission.storeId}`,
    );
  }

  /**
   * Auto-clear all eligible commissions (called by cron/scheduled task)
   */
  async clearPendingCommissions(): Promise<{ cleared: number; failed: number }> {
    const now = new Date();
    const eligibleCommissions = await this.commissionRepo.find({
      where: {
        status: CommissionStatus.HELD,
        clearanceAt: LessThanOrEqual(now),
      },
    });

    let cleared = 0;
    let failed = 0;

    for (const commission of eligibleCommissions) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        await this.clearCommission(commission.orderId, queryRunner.manager);
        await queryRunner.commitTransaction();
        cleared++;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        this.logger.error(
          `Failed to clear commission for order ${commission.orderId}: ${error.message}`,
        );
        failed++;
      } finally {
        await queryRunner.release();
      }
    }

    this.logger.log(`Commission clearance completed: ${cleared} cleared, ${failed} failed`);
    return { cleared, failed };
  }

  /**
   * Reverse commission on refund (full or partial)
   */
  async reverseCommission(
    orderId: string,
    refundAmount: number,
    manager?: EntityManager,
  ): Promise<void> {
    const em = manager || this.dataSource.manager;
    const idempotencyKey = `commission-reverse-${orderId}-${refundAmount}`;

    // Idempotency check
    const existingReversal = await em.findOne(CommissionTransaction, {
      where: { idempotencyKey },
    });
    if (existingReversal) {
      this.logger.log(`Commission reversal already processed for order ${orderId}`);
      return;
    }

    const commission = await em.findOne(CommissionTransaction, {
      where: { orderId, type: CommissionType.ORDER_COMMISSION },
    });

    if (!commission) {
      this.logger.warn(`No commission found to reverse for order ${orderId}`);
      return;
    }

    const order = await em.findOne(Order, { where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('الطلب غير موجود - Order not found');
    }

    const orderTotal = Number(order.total);
    const refundRatio = Math.min(refundAmount / orderTotal, 1);
    const reversedCommission = Math.round(Number(commission.commissionAmount) * refundRatio * 100) / 100;
    const reversedPayout = Math.round(Number(commission.storePayout) * refundRatio * 100) / 100;

    const isFullRefund = refundAmount >= orderTotal;

    // Create reversal record
    const reversal = em.create(CommissionTransaction, {
      storeId: commission.storeId,
      orderId,
      type: CommissionType.REFUND_REVERSAL,
      status: CommissionStatus.REVERSED,
      orderSubtotal: Number(commission.orderSubtotal),
      commissionRate: commission.commissionRate,
      commissionAmount: -reversedCommission,
      storePayout: -reversedPayout,
      refundAmount,
      reversedCommission,
      heldAt: commission.heldAt,
      clearanceAt: commission.clearanceAt,
      reversedAt: new Date(),
      idempotencyKey,
      currency: commission.currency,
      notes: `Refund reversal: ${refundAmount} EGP`,
    });

    await em.save(CommissionTransaction, reversal);

    // Update original commission status
    await em.update(CommissionTransaction, commission.id, {
      status: isFullRefund ? CommissionStatus.REVERSED : CommissionStatus.PARTIALLY_REVERSED,
      refundAmount,
      reversedCommission,
      reversedAt: new Date(),
    });

    // If commission was already cleared, debit from wallet
    if (commission.status === CommissionStatus.CLEARED) {
      const store = await em.findOne(Store, { where: { id: commission.storeId } });
      if (store) {
        const balanceBefore = Number(store.walletBalance);
        const balanceAfter = balanceBefore - reversedPayout;

        const walletTx = em.create(StoreWalletTransaction, {
          storeId: commission.storeId,
          type: WalletTransactionType.REFUND_DEBIT,
          status: WalletTransactionStatus.COMPLETED,
          amount: -reversedPayout,
          balanceBefore,
          balanceAfter,
          referenceId: orderId,
          referenceType: 'refund',
          currency: commission.currency,
          description: `Commission reversal for refund`,
          descriptionAr: `استرداد عمولة بسبب استرجاع`,
          idempotencyKey: `wallet-refund-${orderId}-${refundAmount}`,
        });

        await em.save(StoreWalletTransaction, walletTx);
        await em.update(Store, store.id, { walletBalance: balanceAfter });
      }
    } else {
      // If still held, reduce pending balance
      await em.decrement(Store, { id: commission.storeId }, 'pendingBalance', reversedPayout);
    }

    this.logger.log(
      `Commission reversed for order ${orderId}: ${reversedCommission} EGP commission, ${reversedPayout} EGP payout reversed`,
    );
  }

  /**
   * Get store wallet balance
   */
  async getStoreBalance(storeId: string): Promise<{
    walletBalance: number;
    pendingBalance: number;
    availableBalance: number;
    currency: string;
  }> {
    const store = await this.storeRepo.findOne({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundException('المتجر غير موجود - Store not found');
    }

    return {
      walletBalance: Number(store.walletBalance),
      pendingBalance: Number(store.pendingBalance),
      availableBalance: Number(store.walletBalance),
      currency: 'EGP',
    };
  }

  /**
   * Get transaction history for a store
   */
  async getTransactionHistory(
    storeId: string,
    page: number = 1,
    limit: number = 20,
    type?: string,
  ): Promise<{
    transactions: StoreWalletTransaction[];
    total: number;
    page: number;
    pages: number;
  }> {
    const where: any = { storeId };
    if (type) {
      where.type = type;
    }

    const [transactions, total] = await this.walletTxRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      transactions,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Generate monthly Arabic tax-compliant invoice
   */
  async generateMonthlyInvoice(
    storeId: string,
    month: string, // Format: YYYY-MM
  ): Promise<{
    invoice: {
      storeId: string;
      storeNameAr: string;
      storeNameEn: string;
      taxRegistrationNumber: string | null;
      commercialRegister: string | null;
      period: string;
      generatedAt: string;
      currency: string;
      items: Array<{
        date: string;
        orderNumber: string;
        orderSubtotal: number;
        commissionRate: number;
        commissionAmount: number;
        storePayout: number;
        status: string;
      }>;
      summary: {
        totalOrders: number;
        totalSubtotal: number;
        totalCommission: number;
        totalPayout: number;
        totalReversals: number;
        netCommission: number;
        netPayout: number;
      };
      invoiceNumber: string;
      // Arabic labels for invoice rendering
      labels: Record<string, string>;
    };
  }> {
    const store = await this.storeRepo.findOne({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundException('المتجر غير موجود - Store not found');
    }

    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

    const commissions = await this.commissionRepo.find({
      where: {
        storeId,
        heldAt: Between(startDate, endDate),
      },
      relations: ['order'],
      order: { heldAt: 'ASC' },
    });

    const items = commissions.map((c) => ({
      date: c.heldAt.toISOString().split('T')[0],
      orderNumber: c.order?.orderNumber || '',
      orderSubtotal: Number(c.orderSubtotal),
      commissionRate: Number(c.commissionRate),
      commissionAmount: Number(c.commissionAmount),
      storePayout: Number(c.storePayout),
      status: c.status,
    }));

    const orderCommissions = commissions.filter((c) => c.type === CommissionType.ORDER_COMMISSION);
    const reversals = commissions.filter((c) => c.type === CommissionType.REFUND_REVERSAL);

    const totalSubtotal = orderCommissions.reduce((sum, c) => sum + Number(c.orderSubtotal), 0);
    const totalCommission = orderCommissions.reduce((sum, c) => sum + Number(c.commissionAmount), 0);
    const totalPayout = orderCommissions.reduce((sum, c) => sum + Number(c.storePayout), 0);
    const totalReversals = reversals.reduce((sum, c) => sum + Math.abs(Number(c.commissionAmount)), 0);

    const invoiceNumber = `VP-INV-${store.id.slice(0, 8)}-${month}`.toUpperCase();

    return {
      invoice: {
        storeId,
        storeNameAr: store.nameAr,
        storeNameEn: store.nameEn,
        taxRegistrationNumber: store.taxRegistrationNumber,
        commercialRegister: store.commercialRegister,
        period: month,
        generatedAt: new Date().toISOString(),
        currency: 'EGP',
        items,
        summary: {
          totalOrders: orderCommissions.length,
          totalSubtotal: Math.round(totalSubtotal * 100) / 100,
          totalCommission: Math.round(totalCommission * 100) / 100,
          totalPayout: Math.round(totalPayout * 100) / 100,
          totalReversals: Math.round(totalReversals * 100) / 100,
          netCommission: Math.round((totalCommission - totalReversals) * 100) / 100,
          netPayout: Math.round((totalPayout + totalReversals) * 100) / 100,
        },
        invoiceNumber,
        labels: {
          title: 'فاتورة عمولات شهرية',
          invoiceNumber: 'رقم الفاتورة',
          storeName: 'اسم المتجر',
          taxRegNumber: 'رقم التسجيل الضريبي',
          commercialReg: 'السجل التجاري',
          period: 'الفترة',
          date: 'التاريخ',
          orderNumber: 'رقم الطلب',
          subtotal: 'المبلغ الفرعي',
          commissionRate: 'نسبة العمولة',
          commission: 'العمولة',
          payout: 'المبلغ المستحق للمتجر',
          status: 'الحالة',
          totalOrders: 'إجمالي الطلبات',
          totalSubtotal: 'إجمالي المبيعات',
          totalCommission: 'إجمالي العمولات',
          totalPayout: 'إجمالي المستحق',
          totalReversals: 'إجمالي المستردات',
          netCommission: 'صافي العمولات',
          netPayout: 'صافي المستحق',
          currency: 'العملة',
          generatedAt: 'تاريخ الإصدار',
          held: 'محتجز',
          cleared: 'تمت التصفية',
          reversed: 'مسترد',
          partiallyReversed: 'مسترد جزئيًا',
        },
      },
    };
  }
}
