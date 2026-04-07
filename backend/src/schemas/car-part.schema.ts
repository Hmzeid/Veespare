import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CarPartDocument = CarPart & Document;

@Schema({
  collection: 'car_parts',
  timestamps: true,
  toJSON: { virtuals: true },
})
export class CarPart {
  @Prop({ required: true, index: true, unique: true })
  oemNumber: string;

  @Prop({ required: true, index: 'text' })
  nameAr: string;

  @Prop({ required: true, index: 'text' })
  nameEn: string;

  @Prop({ index: 'text' })
  descriptionAr: string;

  @Prop()
  descriptionEn: string;

  @Prop({
    required: true,
    enum: [
      'engine_parts',
      'brake_system',
      'electrical',
      'body_parts',
      'filters',
      'suspension',
      'cooling',
      'transmission',
      'exhaust',
      'steering',
      'fuel_system',
      'interior',
      'lighting',
      'other',
    ],
    index: true,
  })
  category: string;

  @Prop()
  subcategory: string;

  @Prop({ index: true })
  brand: string;

  @Prop([String])
  alternativeOemNumbers: string[];

  @Prop([String])
  crossReferenceNumbers: string[];

  @Prop({
    type: [
      {
        make: { type: String, required: true },
        model: { type: String, required: true },
        yearFrom: { type: Number, required: true },
        yearTo: { type: Number, required: true },
        engine: String,
        trim: String,
      },
    ],
    index: true,
  })
  compatibleCars: {
    make: string;
    model: string;
    yearFrom: number;
    yearTo: number;
    engine?: string;
    trim?: string;
  }[];

  @Prop([String])
  images: string[];

  @Prop({
    type: {
      weight: Number,
      weightUnit: { type: String, default: 'kg' },
      length: Number,
      width: Number,
      height: Number,
      dimensionUnit: { type: String, default: 'cm' },
    },
  })
  specifications: {
    weight?: number;
    weightUnit?: string;
    length?: number;
    width?: number;
    height?: number;
    dimensionUnit?: string;
  };

  @Prop({ type: Map, of: String })
  additionalAttributes: Map<string, string>;

  @Prop([String])
  tags: string[];

  @Prop([String])
  tagsAr: string[];

  @Prop({ type: Number, index: true })
  marketMedianPrice: number;

  @Prop({ type: Number })
  marketMinPrice: number;

  @Prop({ type: Number })
  marketMaxPrice: number;

  @Prop({ type: Number, default: 0 })
  totalListings: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date })
  deletedAt: Date;
}

export const CarPartSchema = SchemaFactory.createForClass(CarPart);

// Compound indexes for search
CarPartSchema.index({ nameAr: 'text', nameEn: 'text', descriptionAr: 'text', tags: 'text', tagsAr: 'text' }, {
  weights: { nameAr: 10, nameEn: 8, tagsAr: 5, tags: 5, descriptionAr: 2 },
  name: 'text_search_index',
  default_language: 'arabic',
});
CarPartSchema.index({ 'compatibleCars.make': 1, 'compatibleCars.model': 1, 'compatibleCars.yearFrom': 1, 'compatibleCars.yearTo': 1 });
CarPartSchema.index({ category: 1, brand: 1 });
CarPartSchema.index({ oemNumber: 1, alternativeOemNumbers: 1 });
CarPartSchema.index({ isActive: 1, deletedAt: 1 });
