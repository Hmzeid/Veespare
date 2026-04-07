import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto, RefundPaymentDto } from './dto/initiate-payment.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initiate')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Initiate payment',
    description: 'Start a payment with the selected method (Paymob, Fawry, Vodafone Cash, InstaPay, COD)',
  })
  @ApiResponse({ status: 200, description: 'Payment initiated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or unsupported payment method' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 409, description: 'Order already paid' })
  async initiatePayment(@Body() dto: InitiatePaymentDto) {
    return this.paymentsService.initiatePayment(dto);
  }

  @Post('webhook/paymob')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Paymob webhook handler',
    description: 'Handles transaction processed callbacks from Paymob',
  })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handlePaymobWebhook(@Body() payload: Record<string, any>) {
    this.logger.log('Received Paymob webhook');
    try {
      const result = await this.paymentsService.processWebhook('paymob', payload);
      return { success: result.success, received: true };
    } catch (error) {
      this.logger.error(`Paymob webhook error: ${error.message}`);
      // Return 200 to prevent Paymob from retrying (we handle retries internally)
      return { success: false, received: true, error: error.message };
    }
  }

  @Post('webhook/fawry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fawry callback handler',
    description: 'Handles payment status callbacks from Fawry',
  })
  @ApiResponse({ status: 200, description: 'Callback processed' })
  async handleFawryWebhook(@Body() payload: Record<string, any>) {
    this.logger.log('Received Fawry callback');
    try {
      const result = await this.paymentsService.processWebhook('fawry', payload);
      return { success: result.success, received: true };
    } catch (error) {
      this.logger.error(`Fawry callback error: ${error.message}`);
      return { success: false, received: true, error: error.message };
    }
  }

  @Post('webhook/instapay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'InstaPay IPN handler',
    description: 'Handles Instant Payment Notification from InstaPay',
  })
  @ApiResponse({ status: 200, description: 'IPN processed' })
  async handleInstapayWebhook(@Body() payload: Record<string, any>) {
    this.logger.log('Received InstaPay IPN');
    try {
      const result = await this.paymentsService.processWebhook('instapay', payload);
      return { success: result.success, received: true };
    } catch (error) {
      this.logger.error(`InstaPay IPN error: ${error.message}`);
      return { success: false, received: true, error: error.message };
    }
  }

  @Post('webhook/vodafone-cash')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Vodafone Cash callback handler',
    description: 'Handles payment callbacks from Vodafone Cash',
  })
  @ApiResponse({ status: 200, description: 'Callback processed' })
  async handleVodafoneCashWebhook(@Body() payload: Record<string, any>) {
    this.logger.log('Received Vodafone Cash callback');
    try {
      const result = await this.paymentsService.processWebhook('vodafone-cash', payload);
      return { success: result.success, received: true };
    } catch (error) {
      this.logger.error(`Vodafone Cash callback error: ${error.message}`);
      return { success: false, received: true, error: error.message };
    }
  }

  @Get('fawry/status/:reference')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Poll Fawry payment status',
    description: 'Check the current payment status of a Fawry reference number',
  })
  @ApiParam({ name: 'reference', description: 'Fawry payment reference number' })
  @ApiResponse({ status: 200, description: 'Payment status retrieved' })
  async pollFawryStatus(@Param('reference') reference: string) {
    return this.paymentsService.pollFawryStatus(reference);
  }

  @Post('refund')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Process refund',
    description: 'Process a full or partial refund for a paid order',
  })
  @ApiResponse({ status: 200, description: 'Refund processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid refund request' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async processRefund(@Body() dto: RefundPaymentDto) {
    return this.paymentsService.processRefund(dto);
  }
}
