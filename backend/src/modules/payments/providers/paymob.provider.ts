import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentResultDto } from '../dto/initiate-payment.dto';
import { Order } from '@/modules/orders/entities/order.entity';
import * as crypto from 'crypto';

export interface PaymobConfig {
  apiKey: string;
  integrationId: string;
  iframeId: string;
  hmacSecret: string;
  baseUrl: string;
}

interface PaymobAuthResponse {
  token: string;
}

interface PaymobOrderResponse {
  id: number;
}

interface PaymobPaymentKeyResponse {
  token: string;
}

@Injectable()
export class PaymobProvider {
  private readonly logger = new Logger(PaymobProvider.name);
  private readonly config: PaymobConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      apiKey: this.configService.get<string>('PAYMOB_API_KEY', ''),
      integrationId: this.configService.get<string>('PAYMOB_INTEGRATION_ID', ''),
      iframeId: this.configService.get<string>('PAYMOB_IFRAME_ID', ''),
      hmacSecret: this.configService.get<string>('PAYMOB_HMAC_SECRET', ''),
      baseUrl: this.configService.get<string>('PAYMOB_BASE_URL', 'https://accept.paymob.com/api'),
    };
  }

  /**
   * Step 1: Authenticate and get token
   */
  async authenticate(): Promise<string> {
    const response = await this.httpPost<PaymobAuthResponse>(
      `${this.config.baseUrl}/auth/tokens`,
      { api_key: this.config.apiKey },
    );
    return response.token;
  }

  /**
   * Step 2: Create order on Paymob
   */
  async createOrder(authToken: string, order: Order): Promise<number> {
    const items = order.items?.map((item) => ({
      name: item.productNameEn || 'Product',
      amount_cents: Math.round(Number(item.unitPrice) * 100),
      quantity: item.quantity,
      description: item.productNameAr || '',
    })) || [];

    const response = await this.httpPost<PaymobOrderResponse>(
      `${this.config.baseUrl}/ecommerce/orders`,
      {
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: Math.round(Number(order.total) * 100),
        currency: order.currency || 'EGP',
        merchant_order_id: order.orderNumber,
        items,
      },
    );
    return response.id;
  }

  /**
   * Step 3: Generate payment key for iframe
   */
  async generatePaymentKey(
    authToken: string,
    paymobOrderId: number,
    order: Order,
  ): Promise<string> {
    const billingData = {
      first_name: 'Customer',
      last_name: order.customerId,
      email: 'customer@veeparts.com',
      phone_number: order.deliveryAddress?.phone || '01000000000',
      street: order.deliveryAddress?.street || 'N/A',
      city: order.deliveryAddress?.city || 'Cairo',
      state: order.deliveryAddress?.governorate || 'Cairo',
      country: 'EG',
      postal_code: '00000',
      apartment: 'N/A',
      floor: 'N/A',
      building: 'N/A',
      shipping_method: 'N/A',
    };

    const response = await this.httpPost<PaymobPaymentKeyResponse>(
      `${this.config.baseUrl}/acceptance/payment_keys`,
      {
        auth_token: authToken,
        amount_cents: Math.round(Number(order.total) * 100),
        expiration: 3600,
        order_id: paymobOrderId,
        billing_data: billingData,
        currency: order.currency || 'EGP',
        integration_id: parseInt(this.config.integrationId, 10),
        lock_order_when_paid: true,
      },
    );
    return response.token;
  }

  /**
   * Full payment initiation flow
   */
  async initiatePayment(order: Order): Promise<PaymentResultDto> {
    try {
      const authToken = await this.authenticate();
      const paymobOrderId = await this.createOrder(authToken, order);
      const paymentKey = await this.generatePaymentKey(authToken, paymobOrderId, order);

      const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${this.config.iframeId}?payment_token=${paymentKey}`;

      return {
        success: true,
        paymentReference: String(paymobOrderId),
        redirectUrl: iframeUrl,
        transactionId: String(paymobOrderId),
        message: 'Redirect to Paymob payment page',
        messageAr: 'سيتم تحويلك لصفحة الدفع عبر باي موب',
      };
    } catch (error) {
      this.logger.error(`Paymob payment initiation failed: ${error.message}`, error.stack);
      return {
        success: false,
        message: 'Payment initiation failed. Please try again.',
        messageAr: 'فشل في بدء عملية الدفع. يرجى المحاولة مرة أخرى.',
      };
    }
  }

  /**
   * Process 3DS callback from Paymob
   */
  async processCallback(payload: Record<string, any>): Promise<{
    success: boolean;
    transactionId: string;
    orderId: string;
    amountCents: number;
  }> {
    const isValid = this.verifyHmac(payload);
    if (!isValid) {
      this.logger.warn('Invalid HMAC signature on Paymob callback');
      throw new Error('توقيع غير صالح - Invalid HMAC signature');
    }

    const obj = payload.obj || payload;
    return {
      success: obj.success === true || obj.success === 'true',
      transactionId: String(obj.id),
      orderId: String(obj.order?.merchant_order_id || obj.merchant_order_id || ''),
      amountCents: obj.amount_cents || 0,
    };
  }

  /**
   * Handle transaction processed webhook
   */
  async handleTransactionWebhook(payload: Record<string, any>): Promise<{
    success: boolean;
    transactionId: string;
    orderNumber: string;
    amountCents: number;
    isPending: boolean;
  }> {
    const isValid = this.verifyHmac(payload);
    if (!isValid) {
      this.logger.warn('Invalid HMAC on Paymob transaction webhook');
      throw new Error('توقيع غير صالح - Invalid webhook signature');
    }

    const obj = payload.obj || payload;
    return {
      success: obj.success === true || obj.success === 'true',
      transactionId: String(obj.id),
      orderNumber: String(obj.order?.merchant_order_id || ''),
      amountCents: obj.amount_cents || 0,
      isPending: obj.pending === true,
    };
  }

  /**
   * Process refund via Paymob
   */
  async processRefund(transactionId: string, amountCents: number): Promise<{ success: boolean; refundId: string }> {
    try {
      const authToken = await this.authenticate();
      const response = await this.httpPost<any>(
        `${this.config.baseUrl}/acceptance/void_refund/refund`,
        {
          auth_token: authToken,
          transaction_id: transactionId,
          amount_cents: amountCents,
        },
      );
      return {
        success: response.success || false,
        refundId: String(response.id || ''),
      };
    } catch (error) {
      this.logger.error(`Paymob refund failed: ${error.message}`);
      throw new Error('فشل في عملية الاسترداد - Refund failed');
    }
  }

  /**
   * Verify HMAC signature from Paymob webhooks
   */
  verifyHmac(payload: Record<string, any>): boolean {
    const obj = payload.obj || payload;
    const hmacFields = [
      obj.amount_cents,
      obj.created_at,
      obj.currency,
      obj.error_occured,
      obj.has_parent_transaction,
      obj.id,
      obj.integration_id,
      obj.is_3d_secure,
      obj.is_auth,
      obj.is_capture,
      obj.is_refunded,
      obj.is_standalone_payment,
      obj.is_voided,
      obj.order?.id,
      obj.owner,
      obj.pending,
      obj.source_data?.pan,
      obj.source_data?.sub_type,
      obj.source_data?.type,
      obj.success,
    ];

    const concatenated = hmacFields.join('');
    const calculatedHmac = crypto
      .createHmac('sha512', this.config.hmacSecret)
      .update(concatenated)
      .digest('hex');

    return calculatedHmac === payload.hmac;
  }

  private async httpPost<T>(url: string, body: any): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Paymob API error ${response.status}: ${errorBody}`);
    }

    return response.json() as Promise<T>;
  }
}
