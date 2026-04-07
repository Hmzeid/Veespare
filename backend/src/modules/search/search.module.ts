import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CarPart, CarPartSchema } from '@/schemas/car-part.schema';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CarPart.name, schema: CarPartSchema }]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
