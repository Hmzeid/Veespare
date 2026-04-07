import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CarCompatibilityDocument = CarCompatibility & Document;

@Schema({
  collection: 'car_compatibility',
  timestamps: true,
})
export class CarCompatibility {
  @Prop({ required: true, index: true })
  make: string;

  @Prop({ index: true })
  makeAr: string;

  @Prop({ required: true, index: true })
  model: string;

  @Prop({ index: true })
  modelAr: string;

  @Prop({ required: true, type: Number, index: true })
  yearFrom: number;

  @Prop({ required: true, type: Number, index: true })
  yearTo: number;

  @Prop()
  engine: string;

  @Prop()
  engineCapacity: string;

  @Prop()
  fuelType: string;

  @Prop()
  transmission: string;

  @Prop()
  bodyType: string;

  @Prop({ type: [String], index: true })
  partIds: string[];

  @Prop({ type: Map, of: [String] })
  partsByCategory: Map<string, string[]>;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  imageUrl: string;
}

export const CarCompatibilitySchema = SchemaFactory.createForClass(CarCompatibility);

CarCompatibilitySchema.index({ make: 1, model: 1, yearFrom: 1, yearTo: 1 }, { unique: true });
CarCompatibilitySchema.index({ make: 1, model: 1 });
