import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentResultDto } from '../dto/initiate-payment.dto';
import { Order } from '@/modules/orders/entities/order.entity';
import * as crypto from 'crypto';

export interface FawryConfig {
  merchantCode: string;
  securityKey: string;
  baseUrl: string;
}

@Injectable()
export class FawryProvider {
  private readonly logger = new Logger(FawryProvider.name);
  private readonly config: FawryConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      merchantCode: this.configService.get<string>('FAWRY_MERCHANT_CODE', ''),
      securityKey: this.configService.get<string>('FAWRY_SECURITY_KEY', ''),
      baseUrl: this.configService.get<string>(
        'FAWRY_BASE_URL',
        'https://atfawry.fawrystaging.com/ECommerceWeb/Fawry',
      ),
    };
  }

  /**
   * Generate a unique payment reference number
   */
  generateReferenceNumber(orderNumber: string): string {
    const timestamp = Date.now().toString(36);
    return `VP-${orderNumber}-${timestamp}`.toUpperCase();
  }

  /**
   * Create charge request signature
   */
  private createSignature(params: {
    merchantCode: string;
    merchantRefNum: string;
    customerProfileId: string;
    paymentAmount: string;
    currencyCode: string;
    expiryDate?: string;
  }): string {
    const signatureString = [
      params.merchantCode,
      params.merchantRefNum,
      params.customerProfileId,
      params.paymentAmount,
      params.currencyCode,
      this.config.securityKey,
    ].join('');

    return crypto
      .createHash('sha256')
      .update(signatureString)
      .digest('hex');
  }

  /**
   * Create a Fawry charge request
   */
  async createChargeRequest(order: Order): Promise<PaymentResultDto> {
    const referenceNumber = this.generateReferenceNumber(order.orderNumber);
    const paymentAmount = Number(order.total).toFixed(2);

    const chargeItems = order.items?.map((item) => ({
      itemId: item.storeProductId || item.id,
      description: item.productNameAr || item.productNameEn || 'قطعة غيار',
      price: Number(item.unitPrice).toFixed(2),
      quantity: item.quantity,
    })) || [{
      itemId: order.orderNumber,
      description: 'طلب قطع غيار',
      price: paymentAmount,
      quantity: 1,
    }];

    const signature = this.createSignature({
      merchantCode: this.config.merchantCode,
      merchantRefNum: referenceNumber,
      customerProfileId: order.customerId,
      paymentAmount,
      currencyCode: order.currency || 'EGP',
    });

    const requestBody = {
      merchantCode: this.config.merchantCode,
      merchantRefNum: referenceNumber,
      customerMobile: order.deliveryAddress?.phone || '',
      customerEmail: 'customer@veeparts.com',
      customerProfileId: order.customerId,
      paymentMethod: 'PAYATFAWRY',
      chargeItems,
      currencyCode: order.currency || 'EGP',
      amount: paymentAmount,
      description: `VeeParts Order ${order.orderNumber}`,
      paymentExpiry: this.getExpiryTimestamp(),
      signature,
    };

    try {
      const response = await fetch(`${this.config.baseUrl}/payments/charge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json() as any;

      if (data.statusCode === 200 || data.type === 'ChargeResponse') {
        return {
          success: true,
          paymentReference: data.referenceNumber || referenceNumber,
          transactionId: String(data.fawryRefNumber || ''),
          message: `Fawry reference: ${data.referenceNumber || referenceNumber}. Pay at any Fawry outlet.`,
          messageAr: `رقم مرجع فوري: ${data.referenceNumber || referenceNumber}. يمكنك الدفع في أي منفذ فوري.`,
        };
      }

      this.logger.error(`Fawry charge failed: ${JSON.stringify(data)}`);
      return {
        success: false,
        message: data.statusDescription || 'Payment creation failed',
        messageAr: 'فشل في إنشاء طلب الدفع عبر فوري. يرجى المحاولة مرة أخرى.',
      };
    } catch (error) {
      this.logger.error(`Fawry API error: ${error.message}`, error.stack);
      return {
        success: false,
        message: 'Failed to connect to Fawry',
        messageAr: 'فشل في الاتصال بخدمة فوري. يرجى المحاولة لاحقًا.',
      };
    }
  }

  /**
   * Poll Fawry for payment status
   */
  async pollPaymentStatus(referenceNumber: string): Promise<{
    status: 'PAID' | 'UNPAID' | 'EXPIRED' | 'REFUNDED' | 'FAILED';
    amountPaid?: number;
    paymentMethod?: string;
    transactionId?: string;
  }> {
    const signature = crypto
      .createHash('sha256')
      .update(`${this.config.merchantCode}${referenceNumber}${this.config.securityKey}`)
      .digest('hex');

    try {
      const url = `${this.config.baseUrl}/payments/status/v2?merchantCode=${this.config.merchantCode}&merchantRefNumber=${referenceNumber}&signature=${signature}`;
      const response = await fetch(url);
      const data = await response.json() as any;

      return {
        status: data.paymentStatus || 'UNPAID',
        amountPaid: data.paymentAmount ? Number(data.paymentAmount) : undefined,
        paymentMethod: data.paymentMethod,
        transactionId: data.fawryRefNumber,
      };
    } catch (error) {
      this.logger.error(`Fawry status poll error: ${error.message}`);
      throw new Error('فشل في الاستعلام عن حالة الدفع - Failed to poll payment status');
    }
  }

  /**
   * Verify Fawry callback/webhook signature
   */
  verifyPaymentSignature(payload: Record<string, any>): boolean {
    const signatureString = [
      payload.fawryRefNumber,
      payload.merchantRefNum,
      payload.paymentAmount,
      payload.orderAmount,
      payload.orderStatus,
      payload.paymentMethod,
      payload.paymentRefrenceNumber,
      this.config.securityKey,
    ].join('');

    const calculatedSignature = crypto
      .createHash('sha256')
      .update(signatureString)
      .digest('hex');

    return calculatedSignature === payload.messageSignature;
  }

  /**
   * Process refund via Fawry
   */
  async processRefund(
    referenceNumber: string,
    refundAmount: number,
    reason?: string,
  ): Promise<{ success: boolean; refundId: string }> {
    const signature = crypto
      .createHash('sha256')
      .update(
        `${this.config.merchantCode}${referenceNumber}${refundAmount.toFixed(2)}${this.config.securityKey}`,
      )
      .digest('hex');

    try {
      const response = await fetch(`${this.config.baseUrl}/payments/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantCode: this.config.merchantCode,
          referenceNumber,
          refundAmount: refundAmount.toFixed(2),
          reason: reason || 'Customer refund',
          signature,
        }),
      });

      const data = await response.json() as any;
      return {
        success: data.statusCode === 200,
        refundId: data.fawryRefNumber || '',
      };
    } catch (error) {
      this.logger.error(`Fawry refund error: ${error.message}`);
      throw new Error('فشل في عملية الاسترداد عبر فوري - Fawry refund failed');
    }
  }

  private getExpiryTimestamp(): number {
    // 48 hours from now
    return Date.now() + 48 * 60 * 60 * 1000;
  }
}
