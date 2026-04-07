import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '@/modules/orders/entities/order.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymobProvider } from './providers/paymob.provider';
import { FawryProvider } from './providers/fawry.provider';
import { VodafoneCashProvider } from './providers/vodafone-cash.provider';
import { InstapayProvider } from './providers/instapay.provider';
import { CodProvider } from './providers/cod.provider';
import { CommissionModule } from '@/modules/commission/commission.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    forwardRef(() => CommissionModule),
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymobProvider,
    FawryProvider,
    VodafoneCashProvider,
    InstapayProvider,
    CodProvider,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
