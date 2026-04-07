import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentResultDto } from '../dto/initiate-payment.dto';
import { Order } from '@/modules/orders/entities/order.entity';
import * as crypto from 'crypto';

export interface VodafoneCashConfig {
  merchantId: string;
  merchantPassword: string;
  apiKey: string;
  baseUrl: string;
  callbackUrl: string;
}

@Injectable()
export class VodafoneCashProvider {
  private readonly logger = new Logger(VodafoneCashProvider.name);
  private readonly config: VodafoneCashConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      merchantId: this.configService.get<string>('VODAFONE_CASH_MERCHANT_ID', ''),
      merchantPassword: this.configService.get<string>('VODAFONE_CASH_MERCHANT_PASSWORD', ''),
      apiKey: this.configService.get<string>('VODAFONE_CASH_API_KEY', ''),
      baseUrl: this.configService.get<string>(
        'VODAFONE_CASH_BASE_URL',
        'https://api.vodafone.com.eg/vfcash',
      ),
      callbackUrl: this.configService.get<string>(
        'VODAFONE_CASH_CALLBACK_URL',
        'https://api.veeparts.com/payments/webhook/vodafone-cash',
      ),
    };
  }

  /**
   * Generate deep link URL for Vodafone Cash app
   */
  generateDeepLink(referenceNumber: string, amount: number, phone?: string): string {
    const params = new URLSearchParams({
      merchant_id: this.config.merchantId,
      ref: referenceNumber,
      amount: amount.toFixed(2),
      currency: 'EGP',
    });

    if (phone) {
      params.set('phone', phone);
    }

    return `vodafonecash://pay?${params.toString()}`;
  }

  /**
   * Create payment request on Vodafone Cash API
   */
  async createPaymentRequest(order: Order): Promise<PaymentResultDto> {
    const referenceNumber = `VP-VC-${order.orderNumber}-${Date.now().toString(36)}`.toUpperCase();
    const amount = Number(order.total);
    const phone = order.deliveryAddress?.phone || '';

    const requestBody = {
      merchant_id: this.config.merchantId,
      merchant_password: this.config.merchantPassword,
      reference_number: referenceNumber,
      amount: amount.toFixed(2),
      currency: 'EGP',
      customer_mobile: phone,
      description: `VeeParts Order ${order.orderNumber}`,
      callback_url: this.config.callbackUrl,
      expiry_minutes: 30,
    };

    const signature = this.createRequestSignature(requestBody);

    try {
      const response = await fetch(`${this.config.baseUrl}/payment/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey,
          'X-Signature': signature,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json() as any;

      if (data.success || data.status === 'CREATED') {
        const deepLinkUrl = this.generateDeepLink(referenceNumber, amount, phone);

        return {
          success: true,
          paymentReference: referenceNumber,
          deepLinkUrl,
          transactionId: data.transaction_id || referenceNumber,
          message: `Pay ${amount.toFixed(2)} EGP via Vodafone Cash. Open your Vodafone Cash app.`,
          messageAr: `ادفع ${amount.toFixed(2)} جنيه عبر فودافون كاش. افتح تطبيق فودافون كاش.`,
        };
      }

      return {
        success: false,
        message: data.message || 'Vodafone Cash payment creation failed',
        messageAr: 'فشل في إنشاء طلب الدفع عبر فودافون كاش. يرجى المحاولة مرة أخرى.',
      };
    } catch (error) {
      this.logger.error(`Vodafone Cash API error: ${error.message}`, error.stack);
      return {
        success: false,
        message: 'Failed to connect to Vodafone Cash',
        messageAr: 'فشل في الاتصال بخدمة فودافون كاش. يرجى المحاولة لاحقًا.',
      };
    }
  }

  /**
   * Handle Vodafone Cash callback
   */
  async handleCallback(payload: Record<string, any>): Promise<{
    success: boolean;
    referenceNumber: string;
    transactionId: string;
    amount: number;
  }> {
    if (!this.verifyCallbackSignature(payload)) {
      this.logger.warn('Invalid Vodafone Cash callback signature');
      throw new Error('توقيع غير صالح - Invalid callback signature');
    }

    return {
      success: payload.status === 'PAID' || payload.status === 'SUCCESS',
      referenceNumber: payload.reference_number || payload.ref,
      transactionId: payload.transaction_id || '',
      amount: Number(payload.amount) || 0,
    };
  }

  /**
   * Create request signature
   */
  private createRequestSignature(body: Record<string, any>): string {
    const sortedKeys = Object.keys(body).sort();
    const signatureString = sortedKeys.map((key) => `${key}=${body[key]}`).join('&');

    return crypto
      .createHmac('sha256', this.config.apiKey)
      .update(signatureString)
      .digest('hex');
  }

  /**
   * Verify callback signature
   */
  private verifyCallbackSignature(payload: Record<string, any>): boolean {
    const receivedSignature = payload.signature || payload.hmac;
    if (!receivedSignature) return false;

    const { signature, hmac, ...rest } = payload;
    const sortedKeys = Object.keys(rest).sort();
    const signatureString = sortedKeys.map((key) => `${key}=${rest[key]}`).join('&');

    const calculatedSignature = crypto
      .createHmac('sha256', this.config.apiKey)
      .update(signatureString)
      .digest('hex');

    return calculatedSignature === receivedSignature;
  }
}
