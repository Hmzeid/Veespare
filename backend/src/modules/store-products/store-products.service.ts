import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
  Inject,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Brackets } from 'typeorm';
import { StoreProduct, ProductStatus } from './entities/store-product.entity';
import { PriceAuditLog } from './entities/price-audit-log.entity';
import { CreateStoreProductDto } from './dto/create-store-product.dto';
import { UpdateStoreProductDto } from './dto/update-store-product.dto';
import {
  ProductQueryDto,
  PriceComparisonQueryDto,
  StockAlertQueryDto,
} from './dto/product-query.dto';

export interface AiClassificationResult {
  category: string;
  categoryConfidence: number;
  authenticityScore: number;
  riskLevel: string;
}

export interface AiServiceInterface {
  classifyProduct(product: {
    nameEn: string;
    nameAr: string;
    descriptionEn?: string;
    images?: string[];
    oemNumber?: string;
    brand?: string;
  }): Promise<AiClassificationResult>;
}

export const AI_SERVICE = 'AI_SERVICE';

export interface BulkImportRow {
  partId: string;
  oemNumber?: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  category?: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  currency?: string;
  stock: number;
  minStockAlert?: number;
  condition: string;
  images?: string;
  warrantyMonths?: number;
  weightKg?: number;
  compatibleCars?: string; // JSON string for CSV
}

export interface BulkImportResult {
  total: number;
  created: number;
  updated: number;
  errors: { row: number; message: string }[];
}

@Injectable()
export class StoreProductsService {
  private readonly logger = new Logger(StoreProductsService.name);

  constructor(
    @InjectRepository(StoreProduct)
    private readonly productRepo: Repository<StoreProduct>,
    @InjectRepository(PriceAuditLog)
    private readonly auditRepo: Repository<PriceAuditLog>,
    private readonly dataSource: DataSource,
    @Optional()
    @Inject(AI_SERVICE)
    private readonly aiService?: AiServiceInterface,
  ) {}

  // ─── CREATE ────────────────────────────────────────────────────────────────

  async create(
    dto: CreateStoreProductDto,
    userId: string,
  ): Promise<StoreProduct> {
    // Check for duplicate store + part + condition
    const existing = await this.productRepo.findOne({
      where: {
        storeId: dto.storeId,
        partId: dto.partId,
        condition: dto.condition,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Product with partId "${dto.partId}" and condition "${dto.condition}" already exists in this store`,
      );
    }

    const product = this.productRepo.create({
      ...dto,
      images: dto.images ?? [],
      compatibleCars: dto.compatibleCars ?? [],
      currency: dto.currency ?? 'EGP',
      minStockAlert: dto.minStockAlert ?? 5,
      status: ProductStatus.PENDING_REVIEW,
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await this.productRepo.save(product);

    // Create initial price audit entry
    await this.createPriceAudit({
      storeProductId: saved.id,
      oldPrice: 0,
      newPrice: saved.price,
      oldStock: null,
      newStock: saved.stock,
      changedBy: userId,
      changeReason: 'Initial product creation',
      changeSource: 'manual',
    });

    this.logger.log(`Product created: ${saved.id} by user ${userId}`);
    return saved;
  }

  // ─── UPDATE (with price audit) ─────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateStoreProductDto,
    userId: string,
  ): Promise<StoreProduct> {
    const product = await this.productRepo.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }

    const priceChanged =
      dto.price !== undefined && Number(dto.price) !== Number(product.price);
    const stockChanged =
      dto.stock !== undefined && dto.stock !== product.stock;

    // Extract audit-only fields
    const { changeReason, changeSource, ...updateFields } = dto;

    // Log price/stock changes
    if (priceChanged || stockChanged) {
      await this.createPriceAudit({
        storeProductId: product.id,
        oldPrice: Number(product.price),
        newPrice: dto.price !== undefined ? dto.price : Number(product.price),
        oldStock: product.stock,
        newStock: dto.stock !== undefined ? dto.stock : product.stock,
        changedBy: userId,
        changeReason: changeReason ?? null,
        changeSource: changeSource ?? 'manual',
      });
    }

    // Check stock alert
    if (stockChanged && dto.stock! <= product.minStockAlert) {
      this.logger.warn(
        `Stock alert: Product ${id} stock (${dto.stock}) at or below minimum (${product.minStockAlert})`,
      );
    }

    Object.assign(product, updateFields, { updatedBy: userId });
    return this.productRepo.save(product);
  }

  // ─── FIND BY ID ────────────────────────────────────────────────────────────

  async findOne(id: string): Promise<StoreProduct> {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['store', 'priceAuditLogs'],
    });

    if (!product) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }

    return product;
  }

  // ─── FIND BY STORE ─────────────────────────────────────────────────────────

  async findByStore(
    storeId: string,
    query: ProductQueryDto,
  ): Promise<{ data: StoreProduct[]; total: number; page: number; limit: number }> {
    const qb = this.buildQueryBuilder(query);
    qb.andWhere('product.storeId = :storeId', { storeId });

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  // ─── FIND BY PART ──────────────────────────────────────────────────────────

  async findByPart(
    partId: string,
    query: ProductQueryDto,
  ): Promise<{ data: StoreProduct[]; total: number; page: number; limit: number }> {
    const qb = this.buildQueryBuilder(query);
    qb.andWhere('product.partId = :partId', { partId });

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  // ─── PRICE COMPARISON ─────────────────────────────────────────────────────

  async getPriceComparison(
    partId: string,
    query: PriceComparisonQueryDto,
  ): Promise<{
    partId: string;
    results: StoreProduct[];
    stats: { min: number; max: number; avg: number; count: number };
  }> {
    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.store', 'store')
      .where('product.partId = :partId', { partId })
      .andWhere('product.status = :status', { status: ProductStatus.ACTIVE })
      .andWhere('product.deletedAt IS NULL');

    if (query.condition) {
      qb.andWhere('product.condition = :condition', {
        condition: query.condition,
      });
    }

    qb.orderBy('product.price', query.sortOrder ?? 'ASC');
    qb.take(query.limit ?? 20);

    const results = await qb.getMany();

    // Compute stats
    const statsQb = this.productRepo
      .createQueryBuilder('product')
      .select('MIN(product.price)', 'min')
      .addSelect('MAX(product.price)', 'max')
      .addSelect('AVG(product.price)', 'avg')
      .addSelect('COUNT(product.id)', 'count')
      .where('product.partId = :partId', { partId })
      .andWhere('product.status = :status', { status: ProductStatus.ACTIVE })
      .andWhere('product.deletedAt IS NULL');

    if (query.condition) {
      statsQb.andWhere('product.condition = :condition', {
        condition: query.condition,
      });
    }

    const stats = await statsQb.getRawOne();

    return {
      partId,
      results,
      stats: {
        min: parseFloat(stats.min) || 0,
        max: parseFloat(stats.max) || 0,
        avg: parseFloat(parseFloat(stats.avg).toFixed(2)) || 0,
        count: parseInt(stats.count, 10) || 0,
      },
    };
  }

  // ─── STOCK ALERTS ──────────────────────────────────────────────────────────

  async getStockAlerts(
    storeId: string,
    query: StockAlertQueryDto,
  ): Promise<{ data: StoreProduct[]; total: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;

    const [data, total] = await this.productRepo
      .createQueryBuilder('product')
      .where('product.storeId = :storeId', { storeId })
      .andWhere('product.stock <= product.minStockAlert')
      .andWhere('product.status = :status', { status: ProductStatus.ACTIVE })
      .andWhere('product.deletedAt IS NULL')
      .orderBy('product.stock', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  // ─── PRICE AUDIT HISTORY ──────────────────────────────────────────────────

  async getPriceHistory(productId: string): Promise<PriceAuditLog[]> {
    return this.auditRepo.find({
      where: { storeProductId: productId },
      order: { createdAt: 'DESC' },
    });
  }

  // ─── AI CLASSIFICATION ────────────────────────────────────────────────────

  async classifyWithAi(id: string, userId: string): Promise<StoreProduct> {
    if (!this.aiService) {
      throw new BadRequestException('AI service is not configured');
    }

    const product = await this.findOne(id);

    const result = await this.aiService.classifyProduct({
      nameEn: product.nameEn,
      nameAr: product.nameAr,
      descriptionEn: product.descriptionEn ?? undefined,
      images: product.images,
      oemNumber: product.oemNumber ?? undefined,
      brand: product.brand ?? undefined,
    });

    product.category = result.category;
    product.aiCategoryConfidence = result.categoryConfidence;
    product.aiAuthenticityScore = result.authenticityScore;
    product.aiRiskLevel = result.riskLevel;
    product.updatedBy = userId;

    return this.productRepo.save(product);
  }

  // ─── BULK IMPORT ───────────────────────────────────────────────────────────

  async bulkImport(
    storeId: string,
    rows: BulkImportRow[],
    userId: string,
  ): Promise<BulkImportResult> {
    const result: BulkImportResult = {
      total: rows.length,
      created: 0,
      updated: 0,
      errors: [],
    };

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          this.validateImportRow(row, i);

          const existing = await queryRunner.manager.findOne(StoreProduct, {
            where: {
              storeId,
              partId: row.partId,
              condition: row.condition as any,
            },
          });

          if (existing) {
            // Update existing
            const priceChanged =
              Number(row.price) !== Number(existing.price);
            const stockChanged = row.stock !== existing.stock;

            if (priceChanged || stockChanged) {
              const audit = queryRunner.manager.create(PriceAuditLog, {
                storeProductId: existing.id,
                oldPrice: Number(existing.price),
                newPrice: Number(row.price),
                oldStock: existing.stock,
                newStock: row.stock,
                changedBy: userId,
                changeReason: 'Bulk CSV import',
                changeSource: 'bulk_import',
              });
              await queryRunner.manager.save(audit);
            }

            Object.assign(existing, this.mapRowToEntity(row), {
              updatedBy: userId,
            });
            await queryRunner.manager.save(existing);
            result.updated++;
          } else {
            // Create new
            const product = queryRunner.manager.create(StoreProduct, {
              storeId,
              ...this.mapRowToEntity(row),
              status: ProductStatus.PENDING_REVIEW,
              createdBy: userId,
              updatedBy: userId,
            });
            const saved = await queryRunner.manager.save(product);

            const audit = queryRunner.manager.create(PriceAuditLog, {
              storeProductId: saved.id,
              oldPrice: 0,
              newPrice: Number(row.price),
              oldStock: null,
              newStock: row.stock,
              changedBy: userId,
              changeReason: 'Bulk CSV import - initial creation',
              changeSource: 'bulk_import',
            });
            await queryRunner.manager.save(audit);
            result.created++;
          }
        } catch (error) {
          result.errors.push({
            row: i + 1,
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // Only commit if no more than 10% of rows failed
      if (result.errors.length > rows.length * 0.1) {
        await queryRunner.rollbackTransaction();
        throw new BadRequestException({
          message: `Too many errors (${result.errors.length}/${rows.length}). Import rolled back.`,
          errors: result.errors,
        });
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      await queryRunner.release();
    }

    this.logger.log(
      `Bulk import for store ${storeId}: ${result.created} created, ${result.updated} updated, ${result.errors.length} errors`,
    );

    return result;
  }

  // ─── SOFT DELETE ───────────────────────────────────────────────────────────

  async remove(id: string, userId: string): Promise<void> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }

    product.updatedBy = userId;
    await this.productRepo.save(product);
    await this.productRepo.softDelete(id);
  }

  // ─── INCREMENT VIEW COUNT ──────────────────────────────────────────────────

  async incrementViewCount(id: string): Promise<void> {
    await this.productRepo.increment({ id }, 'viewCount', 1);
  }

  // ─── PRIVATE HELPERS ──────────────────────────────────────────────────────

  private buildQueryBuilder(query: ProductQueryDto) {
    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.store', 'store')
      .where('product.deletedAt IS NULL');

    if (query.search) {
      qb.andWhere(
        new Brackets((sub) => {
          sub
            .where('product.nameEn ILIKE :search', {
              search: `%${query.search}%`,
            })
            .orWhere('product.nameAr ILIKE :search', {
              search: `%${query.search}%`,
            })
            .orWhere('product.oemNumber ILIKE :search', {
              search: `%${query.search}%`,
            });
        }),
      );
    }

    if (query.category) {
      qb.andWhere('product.category = :category', {
        category: query.category,
      });
    }

    if (query.brand) {
      qb.andWhere('product.brand = :brand', { brand: query.brand });
    }

    if (query.condition) {
      qb.andWhere('product.condition = :condition', {
        condition: query.condition,
      });
    }

    if (query.status) {
      qb.andWhere('product.status = :status', { status: query.status });
    }

    if (query.minPrice !== undefined) {
      qb.andWhere('product.price >= :minPrice', { minPrice: query.minPrice });
    }

    if (query.maxPrice !== undefined) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice: query.maxPrice });
    }

    if (query.inStock) {
      qb.andWhere('product.stock > 0');
    }

    // JSONB car compatibility filters
    if (query.carMake) {
      qb.andWhere(
        `product.compatible_cars @> :carMakeFilter::jsonb`,
        { carMakeFilter: JSON.stringify([{ make: query.carMake }]) },
      );
    }

    if (query.carModel) {
      qb.andWhere(
        `product.compatible_cars @> :carModelFilter::jsonb`,
        { carModelFilter: JSON.stringify([{ model: query.carModel }]) },
      );
    }

    if (query.carYear) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM jsonb_array_elements(product.compatible_cars) AS car
          WHERE (car->>'yearFrom')::int <= :carYear
            AND (car->>'yearTo')::int >= :carYear
        )`,
        { carYear: query.carYear },
      );
    }

    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'DESC';
    qb.orderBy(`product.${sortBy}`, sortOrder);

    return qb;
  }

  private async createPriceAudit(data: {
    storeProductId: string;
    oldPrice: number;
    newPrice: number;
    oldStock: number | null;
    newStock: number | null;
    changedBy: string;
    changeReason: string | null;
    changeSource: string;
  }): Promise<PriceAuditLog> {
    const audit = this.auditRepo.create(data);
    return this.auditRepo.save(audit);
  }

  private validateImportRow(row: BulkImportRow, index: number): void {
    if (!row.partId) {
      throw new Error(`Row ${index + 1}: partId is required`);
    }
    if (!row.nameEn) {
      throw new Error(`Row ${index + 1}: nameEn is required`);
    }
    if (!row.nameAr) {
      throw new Error(`Row ${index + 1}: nameAr is required`);
    }
    if (row.price === undefined || row.price === null || isNaN(Number(row.price))) {
      throw new Error(`Row ${index + 1}: valid price is required`);
    }
    if (row.stock === undefined || row.stock === null || isNaN(Number(row.stock))) {
      throw new Error(`Row ${index + 1}: valid stock is required`);
    }
    if (!['new', 'used', 'refurbished'].includes(row.condition)) {
      throw new Error(
        `Row ${index + 1}: condition must be one of: new, used, refurbished`,
      );
    }
  }

  private mapRowToEntity(
    row: BulkImportRow,
  ): Partial<StoreProduct> {
    let images: string[] = [];
    if (row.images) {
      try {
        images = typeof row.images === 'string' ? row.images.split(';').filter(Boolean) : [];
      } catch {
        images = [];
      }
    }

    let compatibleCars: StoreProduct['compatibleCars'] = [];
    if (row.compatibleCars) {
      try {
        compatibleCars =
          typeof row.compatibleCars === 'string'
            ? JSON.parse(row.compatibleCars)
            : [];
      } catch {
        compatibleCars = [];
      }
    }

    return {
      partId: row.partId,
      oemNumber: row.oemNumber ?? null,
      nameEn: row.nameEn,
      nameAr: row.nameAr,
      descriptionEn: row.descriptionEn ?? null,
      descriptionAr: row.descriptionAr ?? null,
      category: row.category ?? null,
      brand: row.brand ?? null,
      price: Number(row.price),
      originalPrice: row.originalPrice ? Number(row.originalPrice) : null,
      currency: row.currency ?? 'EGP',
      stock: Number(row.stock),
      minStockAlert: row.minStockAlert ?? 5,
      condition: row.condition as any,
      images,
      compatibleCars,
      warrantyMonths: row.warrantyMonths ?? null,
      weightKg: row.weightKg ? Number(row.weightKg) : null,
    };
  }
}
