import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentResultDto } from '../dto/initiate-payment.dto';
import { Order } from '@/modules/orders/entities/order.entity';
import * as crypto from 'crypto';

export interface InstapayConfig {
  merchantId: string;
  apiKey: string;
  secretKey: string;
  baseUrl: string;
  ipnUrl: string;
}

@Injectable()
export class InstapayProvider {
  private readonly logger = new Logger(InstapayProvider.name);
  private readonly config: InstapayConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      merchantId: this.configService.get<string>('INSTAPAY_MERCHANT_ID', ''),
      apiKey: this.configService.get<string>('INSTAPAY_API_KEY', ''),
      secretKey: this.configService.get<string>('INSTAPAY_SECRET_KEY', ''),
      baseUrl: this.configService.get<string>(
        'INSTAPAY_BASE_URL',
        'https://api.instapay.eg/v1',
      ),
      ipnUrl: this.configService.get<string>(
        'INSTAPAY_IPN_URL',
        'https://api.veeparts.com/payments/webhook/instapay',
      ),
    };
  }

  /**
   * Create InstaPay payment request
   */
  async createPaymentRequest(order: Order): Promise<PaymentResultDto> {
    const referenceNumber = `VP-IP-${order.orderNumber}-${Date.now().toString(36)}`.toUpperCase();
    const amount = Number(order.total);

    const requestBody = {
      merchant_id: this.config.merchantId,
      reference: referenceNumber,
      amount: amount.toFixed(2),
      currency: 'EGP',
      description: `VeeParts Order ${order.orderNumber}`,
      customer_name: order.customerId,
      customer_mobile: order.deliveryAddress?.phone || '',
      ipn_url: this.config.ipnUrl,
      expiry_minutes: 60,
    };

    const signature = this.createSignature(requestBody);

    try {
      const response = await fetch(`${this.config.baseUrl}/payments`, {
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
        return {
          success: true,
          paymentReference: referenceNumber,
          redirectUrl: data.payment_url || undefined,
          transactionId: data.transaction_id || referenceNumber,
          message: `Pay via InstaPay. Transfer ${amount.toFixed(2)} EGP to VeeParts account.`,
          messageAr: `ادفع عبر إنستاباي. حول ${amount.toFixed(2)} جنيه لحساب VeeParts.`,
        };
      }

      return {
        success: false,
        message: data.message || 'InstaPay payment creation failed',
        messageAr: 'فشل في إنشاء طلب الدفع عبر إنستاباي. يرجى المحاولة مرة أخرى.',
      };
    } catch (error) {
      this.logger.error(`InstaPay API error: ${error.message}`, error.stack);
      return {
        success: false,
        message: 'Failed to connect to InstaPay',
        messageAr: 'فشل في الاتصال بخدمة إنستاباي. يرجى المحاولة لاحقًا.',
      };
    }
  }

  /**
   * Handle InstaPay IPN (Instant Payment Notification) webhook
   */
  async handleIpnWebhook(payload: Record<string, any>): Promise<{
    success: boolean;
    referenceNumber: string;
    transactionId: string;
    amount: number;
    senderName?: string;
    senderIban?: string;
  }> {
    if (!this.verifyIpnSignature(payload)) {
      this.logger.warn('Invalid InstaPay IPN signature');
      throw new Error('توقيع غير صالح - Invalid IPN signature');
    }

    return {
      success: payload.status === 'COMPLETED' || payload.status === 'SUCCESS',
      referenceNumber: payload.reference || payload.merchant_reference || '',
      transactionId: payload.transaction_id || '',
      amount: Number(payload.amount) || 0,
      senderName: payload.sender_name,
      senderIban: payload.sender_iban,
    };
  }

  /**
   * Verify a payment by transaction ID (manual verification)
   */
  async verifyPayment(transactionId: string): Promise<{
    verified: boolean;
    status: string;
    amount?: number;
    reference?: string;
  }> {
    const signature = crypto
      .createHmac('sha256', this.config.secretKey)
      .update(`${this.config.merchantId}${transactionId}`)
      .digest('hex');

    try {
      const response = await fetch(
        `${this.config.baseUrl}/payments/${transactionId}/verify`,
        {
          headers: {
            'X-API-Key': this.config.apiKey,
            'X-Signature': signature,
          },
        },
      );

      const data = await response.json() as any;
      return {
        verified: data.status === 'COMPLETED',
        status: data.status || 'UNKNOWN',
        amount: data.amount ? Number(data.amount) : undefined,
        reference: data.reference,
      };
    } catch (error) {
      this.logger.error(`InstaPay verify error: ${error.message}`);
      throw new Error('فشل في التحقق من الدفع عبر إنستاباي - Verification failed');
    }
  }

  /**
   * Create request signature
   */
  private createSignature(body: Record<string, any>): string {
    const sortedKeys = Object.keys(body).sort();
    const signatureString = sortedKeys.map((key) => `${key}=${body[key]}`).join('&');

    return crypto
      .createHmac('sha256', this.config.secretKey)
      .update(signatureString)
      .digest('hex');
  }

  /**
   * Verify IPN callback signature
   */
  private verifyIpnSignature(payload: Record<string, any>): boolean {
    const receivedSignature = payload.signature || payload.hmac;
    if (!receivedSignature) return false;

    const { signature, hmac, ...rest } = payload;
    const sortedKeys = Object.keys(rest).sort();
    const signatureString = sortedKeys.map((key) => `${key}=${rest[key]}`).join('&');

    const calculated = crypto
      .createHmac('sha256', this.config.secretKey)
      .update(signatureString)
      .digest('hex');

    return calculated === receivedSignature;
  }
}
