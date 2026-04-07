import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store, StoreStatus, SubscriptionTier } from './entities/store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

  /**
   * Create a new store for an owner.
   */
  async create(ownerId: string, dto: CreateStoreDto): Promise<Store> {
    const slug = await this.generateUniqueSlug(dto.nameEn);

    if (dto.workingHours) {
      this.validateWorkingHours(dto.workingHours);
    }

    const store = this.storeRepository.create({
      ...dto,
      slug,
      ownerId,
      status: StoreStatus.PENDING,
      createdBy: ownerId,
      updatedBy: ownerId,
    });

    return this.storeRepository.save(store);
  }

  /**
   * Update an existing store. Only the owner or admin can update.
   */
  async update(
    storeId: string,
    dto: UpdateStoreDto,
    userId: string,
    isAdmin: boolean,
  ): Promise<Store> {
    const store = await this.findOneOrFail(storeId);

    if (!isAdmin && store.ownerId !== userId) {
      throw new ForbiddenException('You can only update your own store');
    }

    if (dto.workingHours) {
      this.validateWorkingHours(dto.workingHours);
    }

    // If nameEn changes, regenerate slug
    if (dto.nameEn && dto.nameEn !== store.nameEn) {
      store.slug = await this.generateUniqueSlug(dto.nameEn);
    }

    Object.assign(store, dto, { updatedBy: userId });

    return this.storeRepository.save(store);
  }

  /**
   * Find a store by its ID.
   */
  async findOne(id: string): Promise<Store | null> {
    return this.storeRepository.findOne({
      where: { id },
      relations: ['owner'],
    });
  }

  /**
   * Find a store by its ID; throw if not found.
   */
  async findOneOrFail(id: string): Promise<Store> {
    const store = await this.findOne(id);
    if (!store) {
      throw new NotFoundException(`Store with id "${id}" not found`);
    }
    return store;
  }

  /**
   * Find a store by its slug.
   */
  async findBySlug(slug: string): Promise<Store> {
    const store = await this.storeRepository.findOne({
      where: { slug },
      relations: ['owner'],
    });
    if (!store) {
      throw new NotFoundException(`Store with slug "${slug}" not found`);
    }
    return store;
  }

  /**
   * List stores with pagination and optional filtering.
   */
  async list(options: {
    page?: number;
    limit?: number;
    governorate?: string;
    status?: StoreStatus;
    isVerified?: boolean;
    search?: string;
  }): Promise<{ data: Store[]; total: number; page: number; limit: number }> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.storeRepository
      .createQueryBuilder('store')
      .leftJoinAndSelect('store.owner', 'owner');

    if (options.governorate) {
      qb.andWhere('store.governorate = :governorate', {
        governorate: options.governorate,
      });
    }

    if (options.status) {
      qb.andWhere('store.status = :status', { status: options.status });
    }

    if (options.isVerified !== undefined) {
      qb.andWhere('store.isVerified = :isVerified', {
        isVerified: options.isVerified,
      });
    }

    if (options.search) {
      qb.andWhere(
        '(store.nameEn ILIKE :search OR store.nameAr ILIKE :search OR store.area ILIKE :search)',
        { search: `%${options.search}%` },
      );
    }

    qb.orderBy('store.createdAt', 'DESC').skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  /**
   * List stores filtered by governorate.
   */
  async listByGovernorate(
    governorate: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: Store[]; total: number; page: number; limit: number }> {
    return this.list({ governorate, page, limit, status: StoreStatus.ACTIVE });
  }

  /**
   * Verify a store (admin only).
   */
  async verifyStore(storeId: string, adminId: string): Promise<Store> {
    const store = await this.findOneOrFail(storeId);

    if (store.isVerified) {
      throw new ConflictException('Store is already verified');
    }

    store.isVerified = true;
    store.status = StoreStatus.ACTIVE;
    store.updatedBy = adminId;

    return this.storeRepository.save(store);
  }

  /**
   * Update store status (admin only).
   */
  async updateStatus(
    storeId: string,
    status: StoreStatus,
    adminId: string,
  ): Promise<Store> {
    const store = await this.findOneOrFail(storeId);
    store.status = status;
    store.updatedBy = adminId;
    return this.storeRepository.save(store);
  }

  /**
   * Update wallet balance (add or subtract).
   */
  async updateWalletBalance(
    storeId: string,
    amount: number,
    type: 'credit' | 'debit',
  ): Promise<Store> {
    const store = await this.findOneOrFail(storeId);

    if (type === 'credit') {
      store.walletBalance = Number(store.walletBalance) + amount;
    } else {
      const currentBalance = Number(store.walletBalance);
      if (currentBalance < amount) {
        throw new BadRequestException('Insufficient wallet balance');
      }
      store.walletBalance = currentBalance - amount;
    }

    return this.storeRepository.save(store);
  }

  /**
   * Update pending balance.
   */
  async updatePendingBalance(
    storeId: string,
    amount: number,
    type: 'add' | 'release',
  ): Promise<Store> {
    const store = await this.findOneOrFail(storeId);

    if (type === 'add') {
      store.pendingBalance = Number(store.pendingBalance) + amount;
    } else {
      store.pendingBalance = Math.max(
        0,
        Number(store.pendingBalance) - amount,
      );
      store.walletBalance = Number(store.walletBalance) + amount;
    }

    return this.storeRepository.save(store);
  }

  /**
   * Get analytics data for a store.
   */
  async getAnalytics(storeId: string, ownerId: string, isAdmin: boolean) {
    const store = await this.findOneOrFail(storeId);

    if (!isAdmin && store.ownerId !== ownerId) {
      throw new ForbiddenException('You can only view analytics for your own store');
    }

    const productCount = await this.storeRepository
      .createQueryBuilder('store')
      .leftJoin('store.products', 'product')
      .where('store.id = :storeId', { storeId })
      .select('COUNT(product.id)', 'count')
      .getRawOne();

    return {
      storeId: store.id,
      storeName: store.nameEn,
      status: store.status,
      isVerified: store.isVerified,
      subscriptionTier: store.subscriptionTier,
      avgRating: Number(store.avgRating),
      totalRatings: store.totalRatings,
      totalOrders: store.totalOrders,
      totalProducts: Number(productCount?.count ?? 0),
      walletBalance: Number(store.walletBalance),
      pendingBalance: Number(store.pendingBalance),
      supportsDelivery: store.supportsDelivery,
      supportsPickup: store.supportsPickup,
      deliveryZonesCount: store.deliveryZones?.length ?? 0,
    };
  }

  /**
   * Get all stores owned by a specific user.
   */
  async findByOwner(ownerId: string): Promise<Store[]> {
    return this.storeRepository.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Soft-delete a store.
   */
  async remove(storeId: string, userId: string, isAdmin: boolean): Promise<void> {
    const store = await this.findOneOrFail(storeId);

    if (!isAdmin && store.ownerId !== userId) {
      throw new ForbiddenException('You can only delete your own store');
    }

    await this.storeRepository.softRemove(store);
  }

  // ── Private helpers ──────────────────────────────────────────────────

  /**
   * Generate a URL-safe slug from a store name, ensuring uniqueness.
   */
  private async generateUniqueSlug(name: string): Promise<string> {
    let slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!slug) {
      slug = 'store';
    }

    const existing = await this.storeRepository.findOne({ where: { slug } });
    if (!existing) {
      return slug;
    }

    // Append a numeric suffix to ensure uniqueness
    let suffix = 2;
    while (true) {
      const candidate = `${slug}-${suffix}`;
      const found = await this.storeRepository.findOne({
        where: { slug: candidate },
      });
      if (!found) {
        return candidate;
      }
      suffix++;
    }
  }

  /**
   * Validate working hours JSONB structure.
   */
  private validateWorkingHours(
    hours: Record<string, { open: string; close: string; closed: boolean }>,
  ): void {
    const validDays = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

    for (const [day, entry] of Object.entries(hours)) {
      if (!validDays.includes(day)) {
        throw new BadRequestException(
          `Invalid day "${day}" in workingHours. Valid days: ${validDays.join(', ')}`,
        );
      }

      if (!entry || typeof entry !== 'object') {
        throw new BadRequestException(
          `Working hours entry for "${day}" must be an object with open, close, and closed fields`,
        );
      }

      if (!entry.closed) {
        if (!timeRegex.test(entry.open)) {
          throw new BadRequestException(
            `Invalid open time "${entry.open}" for ${day}. Must be in HH:mm format`,
          );
        }
        if (!timeRegex.test(entry.close)) {
          throw new BadRequestException(
            `Invalid close time "${entry.close}" for ${day}. Must be in HH:mm format`,
          );
        }
      }
    }
  }
}
