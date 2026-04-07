import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommissionTransaction } from './entities/commission-transaction.entity';
import { StoreWalletTransaction } from './entities/store-wallet-transaction.entity';
import { Order } from '@/modules/orders/entities/order.entity';
import { Store } from '@/modules/stores/entities/store.entity';
import { CommissionController } from './commission.controller';
import { CommissionService } from './commission.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CommissionTransaction,
      StoreWalletTransaction,
      Order,
      Store,
    ]),
  ],
  controllers: [CommissionController],
  providers: [CommissionService],
  exports: [CommissionService],
})
export class CommissionModule {}
