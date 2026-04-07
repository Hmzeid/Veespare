import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';
import databaseConfig from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { StoresModule } from './modules/stores/stores.module';
import { StoreProductsModule } from './modules/store-products/store-products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { SearchModule } from './modules/search/search.module';
import { CarPartsModule } from './modules/car-parts/car-parts.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CommissionModule } from './modules/commission/commission.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),

    // PostgreSQL
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('database.postgres.host'),
        port: config.get('database.postgres.port'),
        username: config.get('database.postgres.username'),
        password: config.get('database.postgres.password'),
        database: config.get('database.postgres.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),

    // MongoDB
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get('database.mongodb.uri'),
      }),
    }),

    // Redis Cache
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        store: 'memory',
        ttl: 300,
      }),
    }),

    // Bull Queue
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get('database.redis.host'),
          port: config.get('database.redis.port'),
          password: config.get('database.redis.password'),
        },
      }),
    }),

    // Feature modules
    AuthModule,
    UsersModule,
    StoresModule,
    StoreProductsModule,
    OrdersModule,
    SearchModule,
    CarPartsModule,
    PaymentsModule,
    CommissionModule,
  ],
})
export class AppModule {}
