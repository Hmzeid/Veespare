import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '@/common/interfaces/base.entity';
import { Store } from '@/modules/stores/entities/store.entity';
import { PriceAuditLog } from './price-audit-log.entity';

export enum PartCondition {
  NEW = 'new',
  USED = 'used',
  REFURBISHED = 'refurbished',
}

export enum ProductStatus {
  ACTIVE = 'active',
  OUT_OF_STOCK = 'out_of_stock',
  PENDING_REVIEW = 'pending_review',
  REJECTED = 'rejected',
  DRAFT = 'draft',
}

@Entity('store_products')
@Index('idx_store_products_store', ['storeId'])
@Index('idx_store_products_part', ['partId'])
@Index('idx_store_products_price', ['price'])
@Index('idx_store_products_condition', ['condition'])
@Index('idx_store_products_status', ['status'])
@Index('idx_store_products_oem', ['oemNumber'])
@Index('idx_store_products_store_part', ['storeId', 'partId', 'condition'], { unique: true })
@Index('idx_store_products_category', ['category'])
export class StoreProduct extends BaseEntity {
  @Column({ name: 'store_id', type: 'uuid' })
  storeId: string;

  @ManyToOne(() => Store, (store) => store.products)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  // References MongoDB part catalog _id
  @Column({ name: 'part_id', length: 50 })
  partId: string;

  @Column({ name: 'oem_number', length: 100, nullable: true })
  oemNumber: string | null;

  @Column({ name: 'name_en', length: 300 })
  nameEn: string;

  @Column({ name: 'name_ar', length: 300 })
  nameAr: string;

  @Column({ name: 'description_en', type: 'text', nullable: true })
  descriptionEn: string | null;

  @Column({ name: 'description_ar', type: 'text', nullable: true })
  descriptionAr: string | null;

  @Column({ length: 100, nullable: true })
  category: string | null;

  @Column({ length: 100, nullable: true })
  brand: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'original_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  originalPrice: number | null;

  @Column({ length: 3, default: 'EGP' })
  currency: string;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ name: 'min_stock_alert', type: 'int', default: 5 })
  minStockAlert: number;

  @Column({ type: 'enum', enum: PartCondition })
  condition: PartCondition;

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.PENDING_REVIEW })
  status: ProductStatus;

  @Column({ name: 'images', type: 'jsonb', default: [] })
  images: string[];

  @Column({ name: 'compatible_cars', type: 'jsonb', default: [] })
  compatibleCars: {
    make: string;
    model: string;
    yearFrom: number;
    yearTo: number;
    engine?: string;
  }[];

  @Column({ name: 'warranty_months', type: 'int', nullable: true })
  warrantyMonths: number | null;

  @Column({ name: 'weight_kg', type: 'decimal', precision: 8, scale: 3, nullable: true })
  weightKg: number | null;

  // AI classification scores
  @Column({ name: 'ai_category_confidence', type: 'decimal', precision: 3, scale: 2, nullable: true })
  aiCategoryConfidence: number | null;

  @Column({ name: 'ai_authenticity_score', type: 'decimal', precision: 3, scale: 2, nullable: true })
  aiAuthenticityScore: number | null;

  @Column({ name: 'ai_risk_level', length: 20, nullable: true })
  aiRiskLevel: string | null;

  // Stats
  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  @Column({ name: 'order_count', default: 0 })
  orderCount: number;

  @Column({ name: 'avg_rating', type: 'decimal', precision: 3, scale: 2, default: 0 })
  avgRating: number;

  @Column({ name: 'total_ratings', default: 0 })
  totalRatings: number;

  @OneToMany(() => PriceAuditLog, (log) => log.storeProduct)
  priceAuditLogs: PriceAuditLog[];
}
