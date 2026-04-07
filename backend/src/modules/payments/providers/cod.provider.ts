import { Injectable, Logger } from '@nestjs/common';
import { PaymentResultDto } from '../dto/initiate-payment.dto';
import { Order } from '@/modules/orders/entities/order.entity';

@Injectable()
export class CodProvider {
  private readonly logger = new Logger(CodProvider.name);

  /**
   * Default deposit percentage for COD orders
   */
  private readonly DEFAULT_DEPOSIT_PERCENTAGE = 0.2; // 20%
  private readonly MIN_DEPOSIT_AMOUNT = 50; // 50 EGP

  /**
   * Create a COD order with optional deposit requirement
   */
  async createCodOrder(order: Order, depositAmount?: number): Promise<PaymentResultDto> {
    const total = Number(order.total);
    const calculatedDeposit = depositAmount ?? this.calculateDeposit(total);

    const referenceNumber = `VP-COD-${order.orderNumber}`;

    if (calculatedDeposit > 0) {
      return {
        success: true,
        paymentReference: referenceNumber,
        transactionId: referenceNumber,
        message: `COD order created. Deposit of ${calculatedDeposit.toFixed(2)} EGP required. Remaining ${(total - calculatedDeposit).toFixed(2)} EGP on delivery.`,
        messageAr: `تم إنشاء طلب الدفع عند الاستلام. مطلوب عربون ${calculatedDeposit.toFixed(2)} جنيه. المتبقي ${(total - calculatedDeposit).toFixed(2)} جنيه عند الاستلام.`,
      };
    }

    return {
      success: true,
      paymentReference: referenceNumber,
      transactionId: referenceNumber,
      message: `COD order created. Total ${total.toFixed(2)} EGP to be paid on delivery.`,
      messageAr: `تم إنشاء طلب الدفع عند الاستلام. المبلغ الإجمالي ${total.toFixed(2)} جنيه يُدفع عند الاستلام.`,
    };
  }

  /**
   * Calculate deposit amount based on order total
   */
  calculateDeposit(orderTotal: number): number {
    const deposit = orderTotal * this.DEFAULT_DEPOSIT_PERCENTAGE;
    // Only require deposit for orders above a threshold
    if (orderTotal < 200) {
      return 0;
    }
    return Math.max(deposit, this.MIN_DEPOSIT_AMOUNT);
  }

  /**
   * Validate that deposit has been marked as paid (by admin or payment gateway)
   */
  validateDepositPaid(order: Order): {
    isPaid: boolean;
    depositAmount: number;
    remainingAmount: number;
  } {
    const depositAmount = Number(order.codDepositAmount || 0);
    const total = Number(order.total);

    return {
      isPaid: order.codDepositPaid,
      depositAmount,
      remainingAmount: total - depositAmount,
    };
  }

  /**
   * Mark COD deposit as paid
   */
  markDepositPaid(order: Order): {
    success: boolean;
    message: string;
    messageAr: string;
  } {
    if (order.codDepositPaid) {
      return {
        success: false,
        message: 'Deposit already marked as paid',
        messageAr: 'تم تسجيل دفع العربون مسبقًا',
      };
    }

    return {
      success: true,
      message: 'Deposit marked as paid successfully',
      messageAr: 'تم تسجيل دفع العربون بنجاح',
    };
  }

  /**
   * Mark full payment received on delivery
   */
  markFullPaymentReceived(order: Order): {
    success: boolean;
    totalCollected: number;
    message: string;
    messageAr: string;
  } {
    const total = Number(order.total);
    const depositPaid = order.codDepositPaid ? Number(order.codDepositAmount || 0) : 0;
    const remainingCollected = total - depositPaid;

    return {
      success: true,
      totalCollected: total,
      message: `Full payment collected. Deposit: ${depositPaid.toFixed(2)} EGP, On delivery: ${remainingCollected.toFixed(2)} EGP`,
      messageAr: `تم تحصيل المبلغ بالكامل. العربون: ${depositPaid.toFixed(2)} جنيه، عند الاستلام: ${remainingCollected.toFixed(2)} جنيه`,
    };
  }
}
