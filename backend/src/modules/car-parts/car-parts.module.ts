import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CarPart, CarPartSchema } from '@/schemas/car-part.schema';
import {
  CarCompatibility,
  CarCompatibilitySchema,
} from '@/schemas/car-compatibility.schema';
import { CarPartsController } from './car-parts.controller';
import { CarPartsService } from './car-parts.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CarPart.name, schema: CarPartSchema },
      { name: CarCompatibility.name, schema: CarCompatibilitySchema },
    ]),
  ],
  controllers: [CarPartsController],
  providers: [CarPartsService],
  exports: [CarPartsService],
})
export class CarPartsModule {}
