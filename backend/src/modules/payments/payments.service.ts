import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus, PaymentMethod, PaymentStatus } from '@/modules/orders/entities/order.entity';
import { PaymobProvider } from './providers/paymob.provider';
import { FawryProvider } from './providers/fawry.provider';
import { VodafoneCashProvider } from './providers/vodafone-cash.provider';
import { InstapayProvider } from './providers/instapay.provider';
import { CodProvider } from './providers/cod.provider';
import { InitiatePaymentDto, RefundPaymentDto, PaymentResultDto } from './dto/initiate-payment.dto';
import { CommissionService } from '@/modules/commission/commission.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly MAX_WEBHOOK_RETRIES = 3;

  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly dataSource: DataSource,
    private readonly paymobProvider: PaymobProvider,
    private readonly fawryProvider: FawryProvider,
    private readonly vodafoneCashProvider: VodafoneCashProvider,
    private readonly instapayProvider: InstapayProvider,
    private readonly codProvider: CodProvider,
    private readonly commissionService: CommissionService,
  ) {}

  /**
   * Initiate payment by routing to the correct provider
   */
  async initiatePayment(dto: InitiatePaymentDto): Promise<PaymentResultDto> {
    // Idempotency check
    if (dto.idempotencyKey) {
      const existing = await this.orderRepo.findOne({
        where: { id: dto.orderId, idempotencyKey: dto.idempotencyKey },
      });
      if (existing && existing.paymentReference) {
        return {
          success: true,
          paymentReference: existing.paymentReference,
          message: 'Payment already initiated',
          messageAr: 'تم بدء عملية الدفع مسبقًا',
        };
      }
    }

    const order = await this.orderRepo.findOne({
      where: { id: dto.orderId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException('الطلب غير موجود - Order not found');
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new ConflictException('تم دفع هذا الطلب مسبقًا - Order already paid');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('لا يمكن الدفع لطلب ملغي - Cannot pay for cancelled order');
    }

    let result: PaymentResultDto;

    switch (dto.method) {
      case PaymentMethod.PAYMOB:
        result = await this.paymobProvider.initiatePayment(order);
        break;

      case PaymentMethod.FAWRY:
        result = await this.fawryProvider.createChargeRequest(order);
        break;

      case PaymentMethod.VODAFONE_CASH:
        result = await this.vodafoneCashProvider.createPaymentRequest(order);
        break;

      case PaymentMethod.INSTAPAY:
        result = await this.instapayProvider.createPaymentRequest(order);
        break;

      case PaymentMethod.COD:
        result = await this.codProvider.createCodOrder(order, dto.codDepositAmount);
        break;

      default:
        throw new BadRequestException('طريقة دفع غير مدعومة - Unsupported payment method');
    }

    if (result.success) {
      await this.orderRepo.update(order.id, {
        paymentMethod: dto.method,
        paymentReference: result.paymentReference || null,
        paymentTransactionId: result.transactionId || null,
        status: dto.method === PaymentMethod.COD ? OrderStatus.CONFIRMED : OrderStatus.PAYMENT_PENDING,
        idempotencyKey: dto.idempotencyKey || null,
        ...(dto.method === PaymentMethod.COD && dto.codDepositAmount
          ? {
              codDepositAmount: dto.codDepositAmount,
              codDepositPaid: false,
            }
          : {}),
      });
    }

    return result;
  }

  /**
   * Process incoming webhook from any payment provider
   */
  async processWebhook(
    provider: 'paymob' | 'fawry' | 'instapay' | 'vodafone-cash',
    payload: Record<string, any>,
    retryCount = 0,
  ): Promise<{ success: boolean; orderNumber?: string }> {
    try {
      switch (provider) {
        case 'paymob':
          return await this.handlePaymobWebhook(payload);

        case 'fawry':
          return await this.handleFawryWebhook(payload);

        case 'instapay':
          return await this.handleInstapayWebhook(payload);

        case 'vodafone-cash':
          return await this.handleVodafoneCashWebhook(payload);

        default:
          throw new BadRequestException('مزود دفع غير معروف - Unknown payment provider');
      }
    } catch (error) {
      this.logger.error(
        `Webhook processing failed for ${provider} (attempt ${retryCount + 1}): ${error.message}`,
        error.stack,
      );

      if (retryCount < this.MAX_WEBHOOK_RETRIES) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.processWebhook(provider, payload, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Handle Paymob transaction webhook
   */
  private async handlePaymobWebhook(payload: Record<string, any>): Promise<{ success: boolean; orderNumber?: string }> {
    const result = await this.paymobProvider.handleTransactionWebhook(payload);

    if (!result.orderNumber) {
      this.logger.warn('Paymob webhook missing order number');
      return { success: false };
    }

    const order = await this.orderRepo.findOne({
      where: { orderNumber: result.orderNumber },
    });

    if (!order) {
      this.logger.warn(`Order not found for Paymob webhook: ${result.orderNumber}`);
      return { success: false };
    }

    // Idempotency: skip if already paid
    if (order.paymentStatus === PaymentStatus.PAID) {
      return { success: true, orderNumber: order.orderNumber };
    }

    if (result.success && !result.isPending) {
      await this.markOrderPaid(order, result.transactionId);
    }

    return { success: result.success, orderNumber: order.orderNumber };
  }

  /**
   * Handle Fawry callback
   */
  private async handleFawryWebhook(payload: Record<string, any>): Promise<{ success: boolean; orderNumber?: string }> {
    if (!this.fawryProvider.verifyPaymentSignature(payload)) {
      throw new BadRequestException('توقيع فوري غير صالح - Invalid Fawry signature');
    }

    const merchantRefNum = payload.merchantRefNum || '';
    // Extract order number from reference: VP-{orderNumber}-{timestamp}
    const parts = merchantRefNum.split('-');
    const orderNumber = parts.length >= 3 ? parts.slice(1, -1).join('-') : merchantRefNum;

    const order = await this.orderRepo.findOne({
      where: [
        { paymentReference: merchantRefNum },
        { orderNumber },
      ],
    });

    if (!order) {
      this.logger.warn(`Order not found for Fawry callback: ${merchantRefNum}`);
      return { success: false };
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      return { success: true, orderNumber: order.orderNumber };
    }

    if (payload.orderStatus === 'PAID') {
      await this.markOrderPaid(order, payload.fawryRefNumber || merchantRefNum);
    }

    return { success: payload.orderStatus === 'PAID', orderNumber: order.orderNumber };
  }

  /**
   * Handle InstaPay IPN
   */
  private async handleInstapayWebhook(payload: Record<string, any>): Promise<{ success: boolean; orderNumber?: string }> {
    const result = await this.instapayProvider.handleIpnWebhook(payload);

    // Extract order number from reference: VP-IP-{orderNumber}-{timestamp}
    const parts = result.referenceNumber.split('-');
    const orderNumber = parts.length >= 4 ? parts.slice(2, -1).join('-') : result.referenceNumber;

    const order = await this.orderRepo.findOne({
      where: [
        { paymentReference: result.referenceNumber },
        { orderNumber },
      ],
    });

    if (!order) {
      this.logger.warn(`Order not found for InstaPay IPN: ${result.referenceNumber}`);
      return { success: false };
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      return { success: true, orderNumber: order.orderNumber };
    }

    if (result.success) {
      await this.markOrderPaid(order, result.transactionId);
    }

    return { success: result.success, orderNumber: order.orderNumber };
  }

  /**
   * Handle Vodafone Cash callback
   */
  private async handleVodafoneCashWebhook(payload: Record<string, any>): Promise<{ success: boolean; orderNumber?: string }> {
    const result = await this.vodafoneCashProvider.handleCallback(payload);

    const parts = result.referenceNumber.split('-');
    const orderNumber = parts.length >= 4 ? parts.slice(2, -1).join('-') : result.referenceNumber;

    const order = await this.orderRepo.findOne({
      where: [
        { paymentReference: result.referenceNumber },
        { orderNumber },
      ],
    });

    if (!order) {
      this.logger.warn(`Order not found for Vodafone Cash callback: ${result.referenceNumber}`);
      return { success: false };
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      return { success: true, orderNumber: order.orderNumber };
    }

    if (result.success) {
      await this.markOrderPaid(order, result.transactionId);
    }

    return { success: result.success, orderNumber: order.orderNumber };
  }

  /**
   * Mark order as paid within a transaction and hold commission
   */
  private async markOrderPaid(order: Order, transactionId: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(Order, order.id, {
        paymentStatus: PaymentStatus.PAID,
        paymentTransactionId: transactionId,
        paidAt: new Date(),
        status: OrderStatus.PAID,
      });

      // Hold commission for this order
      await this.commissionService.holdCommission(order.id, queryRunner.manager);

      await queryRunner.commitTransaction();
      this.logger.log(`Order ${order.orderNumber} marked as paid, commission held`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to mark order ${order.orderNumber} as paid: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Process full or partial refund
   */
  async processRefund(dto: RefundPaymentDto): Promise<{
    success: boolean;
    refundAmount: number;
    message: string;
    messageAr: string;
  }> {
    // Idempotency check
    if (dto.idempotencyKey) {
      const existing = await this.orderRepo.findOne({
        where: { id: dto.orderId },
      });
      if (existing?.refundedAt && existing?.refundAmount) {
        return {
          success: true,
          refundAmount: Number(existing.refundAmount),
          message: 'Refund already processed',
          messageAr: 'تم معالجة الاسترداد مسبقًا',
        };
      }
    }

    const order = await this.orderRepo.findOne({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException('الطلب غير موجود - Order not found');
    }

    if (order.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException('لا يمكن استرداد طلب لم يتم دفعه - Cannot refund unpaid order');
    }

    const refundAmount = dto.amount || Number(order.total);
    if (refundAmount > Number(order.total)) {
      throw new BadRequestException('مبلغ الاسترداد أكبر من إجمالي الطلب - Refund amount exceeds order total');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Process refund with payment provider
      if (order.paymentMethod !== PaymentMethod.COD) {
        await this.processProviderRefund(order, refundAmount);
      }

      const isFullRefund = refundAmount >= Number(order.total);
      const newPaymentStatus = isFullRefund
        ? PaymentStatus.REFUNDED
        : PaymentStatus.PARTIALLY_REFUNDED;

      await queryRunner.manager.update(Order, order.id, {
        paymentStatus: newPaymentStatus,
        refundAmount,
        refundedAt: new Date(),
        status: isFullRefund ? OrderStatus.REFUNDED : order.status,
      });

      // Reverse commission
      await this.commissionService.reverseCommission(
        order.id,
        refundAmount,
        queryRunner.manager,
      );

      await queryRunner.commitTransaction();

      return {
        success: true,
        refundAmount,
        message: `Refund of ${refundAmount.toFixed(2)} EGP processed successfully`,
        messageAr: `تم استرداد مبلغ ${refundAmount.toFixed(2)} جنيه بنجاح`,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Refund failed for order ${order.orderNumber}: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Route refund to the correct payment provider
   */
  private async processProviderRefund(order: Order, amount: number): Promise<void> {
    const transactionId = order.paymentTransactionId || '';

    switch (order.paymentMethod) {
      case PaymentMethod.PAYMOB:
        await this.paymobProvider.processRefund(transactionId, Math.round(amount * 100));
        break;

      case PaymentMethod.FAWRY:
        await this.fawryProvider.processRefund(
          order.paymentReference || '',
          amount,
        );
        break;

      case PaymentMethod.VODAFONE_CASH:
      case PaymentMethod.INSTAPAY:
        // Manual refund process for mobile wallets
        this.logger.log(
          `Manual refund required for ${order.paymentMethod}: Order ${order.orderNumber}, Amount: ${amount}`,
        );
        break;

      default:
        break;
    }
  }

  /**
   * Poll Fawry payment status
   */
  async pollFawryStatus(referenceNumber: string): Promise<{
    status: string;
    amountPaid?: number;
    message: string;
    messageAr: string;
  }> {
    const result = await this.fawryProvider.pollPaymentStatus(referenceNumber);

    const statusMessages: Record<string, { en: string; ar: string }> = {
      PAID: { en: 'Payment received', ar: 'تم استلام الدفع' },
      UNPAID: { en: 'Awaiting payment', ar: 'في انتظار الدفع' },
      EXPIRED: { en: 'Payment expired', ar: 'انتهت صلاحية الدفع' },
      REFUNDED: { en: 'Payment refunded', ar: 'تم استرداد المبلغ' },
      FAILED: { en: 'Payment failed', ar: 'فشل الدفع' },
    };

    const msg = statusMessages[result.status] || { en: 'Unknown status', ar: 'حالة غير معروفة' };

    // If paid, update the order
    if (result.status === 'PAID') {
      const order = await this.orderRepo.findOne({
        where: { paymentReference: referenceNumber },
      });
      if (order && order.paymentStatus !== PaymentStatus.PAID) {
        await this.markOrderPaid(order, result.transactionId || referenceNumber);
      }
    }

    return {
      status: result.status,
      amountPaid: result.amountPaid,
      message: msg.en,
      messageAr: msg.ar,
    };
  }
}
