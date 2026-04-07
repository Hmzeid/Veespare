import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CarPart, CarPartDocument } from '@/schemas/car-part.schema';
import {
  CarCompatibility,
  CarCompatibilityDocument,
} from '@/schemas/car-compatibility.schema';
import {
  CreateCarPartDto,
  GetCompatiblePartsDto,
  UpdateCarPartDto,
} from './dto/car-part.dto';

@Injectable()
export class CarPartsService {
  private readonly logger = new Logger(CarPartsService.name);

  constructor(
    @InjectModel(CarPart.name)
    private readonly carPartModel: Model<CarPartDocument>,
    @InjectModel(CarCompatibility.name)
    private readonly carCompatibilityModel: Model<CarCompatibilityDocument>,
  ) {}

  // ---------------------------------------------------------------------------
  // CRUD Operations
  // ---------------------------------------------------------------------------

  async create(dto: CreateCarPartDto): Promise<CarPartDocument> {
    const carPart = new this.carPartModel(dto);
    return carPart.save();
  }

  async findAll(page = 1, limit = 20, category?: string): Promise<{
    items: CarPartDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const filter: Record<string, any> = { isActive: true, deletedAt: null };
    if (category) {
      filter.category = category;
    }

    const [items, total] = await Promise.all([
      this.carPartModel.find(filter).skip(skip).limit(limit).lean().exec(),
      this.carPartModel.countDocuments(filter).exec(),
    ]);

    return {
      items: items as CarPartDocument[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<CarPartDocument> {
    const part = await this.carPartModel.findById(id).lean().exec();
    if (!part) {
      throw new NotFoundException(`Car part with id ${id} not found`);
    }
    return part as CarPartDocument;
  }

  async findByOem(oemNumber: string): Promise<CarPartDocument> {
    const part = await this.carPartModel
      .findOne({
        $or: [
          { oemNumber: { $regex: new RegExp(`^${oemNumber}$`, 'i') } },
          { alternativeOemNumbers: { $regex: new RegExp(`^${oemNumber}$`, 'i') } },
        ],
        isActive: true,
        deletedAt: null,
      })
      .lean()
      .exec();

    if (!part) {
      throw new NotFoundException(`Car part with OEM number ${oemNumber} not found`);
    }
    return part as CarPartDocument;
  }

  async update(id: string, dto: UpdateCarPartDto): Promise<CarPartDocument> {
    const updated = await this.carPartModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .lean()
      .exec();

    if (!updated) {
      throw new NotFoundException(`Car part with id ${id} not found`);
    }
    return updated as CarPartDocument;
  }

  async softDelete(id: string): Promise<void> {
    const result = await this.carPartModel
      .findByIdAndUpdate(id, { isActive: false, deletedAt: new Date() })
      .exec();

    if (!result) {
      throw new NotFoundException(`Car part with id ${id} not found`);
    }
  }

  // ---------------------------------------------------------------------------
  // Car Compatibility Lookups
  // ---------------------------------------------------------------------------

  /**
   * Get all distinct car makes (for dropdown).
   */
  async getMakes(): Promise<string[]> {
    const makes = await this.carCompatibilityModel
      .distinct('make', { isActive: true })
      .exec();
    return (makes as string[]).sort();
  }

  /**
   * Get models for a given make (for dropdown).
   */
  async getModelsByMake(make: string): Promise<string[]> {
    const models = await this.carCompatibilityModel
      .distinct('model', {
        make: { $regex: new RegExp(`^${make}$`, 'i') },
        isActive: true,
      })
      .exec();
    return (models as string[]).sort();
  }

  /**
   * Get available years for a given make + model.
   * Returns an array of individual years derived from yearFrom/yearTo ranges.
   */
  async getYearsByMakeModel(make: string, model: string): Promise<number[]> {
    const entries = await this.carCompatibilityModel
      .find(
        {
          make: { $regex: new RegExp(`^${make}$`, 'i') },
          model: { $regex: new RegExp(`^${model}$`, 'i') },
          isActive: true,
        },
        { yearFrom: 1, yearTo: 1 },
      )
      .lean()
      .exec();

    const yearsSet = new Set<number>();
    for (const entry of entries) {
      for (let y = entry.yearFrom; y <= entry.yearTo; y++) {
        yearsSet.add(y);
      }
    }

    return Array.from(yearsSet).sort((a, b) => b - a); // descending
  }

  /**
   * Get car compatibility details for a specific make/model/year.
   */
  async getCarDetails(
    make: string,
    model: string,
    year: number,
  ): Promise<CarCompatibilityDocument[]> {
    return this.carCompatibilityModel
      .find({
        make: { $regex: new RegExp(`^${make}$`, 'i') },
        model: { $regex: new RegExp(`^${model}$`, 'i') },
        yearFrom: { $lte: year },
        yearTo: { $gte: year },
        isActive: true,
      })
      .lean()
      .exec() as Promise<CarCompatibilityDocument[]>;
  }

  /**
   * Get compatible parts for a specific car (make + model + year),
   * optionally filtered by category.
   */
  async getCompatibleParts(dto: GetCompatiblePartsDto): Promise<{
    items: CarPartDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      isActive: true,
      deletedAt: null,
      'compatibleCars.make': { $regex: new RegExp(`^${dto.make}$`, 'i') },
      'compatibleCars.model': { $regex: new RegExp(`^${dto.model}$`, 'i') },
      'compatibleCars.yearFrom': { $lte: dto.year },
      'compatibleCars.yearTo': { $gte: dto.year },
    };

    if (dto.category) {
      filter.category = dto.category;
    }

    const [items, total] = await Promise.all([
      this.carPartModel.find(filter).skip(skip).limit(limit).lean().exec(),
      this.carPartModel.countDocuments(filter).exec(),
    ]);

    return {
      items: items as CarPartDocument[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
