import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreProduct } from './entities/store-product.entity';
import { PriceAuditLog } from './entities/price-audit-log.entity';
import { StoreProductsController } from './store-products.controller';
import { StoreProductsService, AI_SERVICE } from './store-products.service';

@Module({
  imports: [TypeOrmModule.forFeature([StoreProduct, PriceAuditLog])],
  controllers: [StoreProductsController],
  providers: [
    StoreProductsService,
    // AI_SERVICE is optional; provide it from an AiModule when available.
    // Example:
    // { provide: AI_SERVICE, useClass: AiClassificationService },
  ],
  exports: [StoreProductsService],
})
export class StoreProductsModule {}
