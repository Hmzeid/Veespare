import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '@/common/interfaces/base.entity';
import { User } from '@/modules/users/entities/user.entity';
import { StoreProduct } from '@/modules/store-products/entities/store-product.entity';
import { Order } from '@/modules/orders/entities/order.entity';

export enum SubscriptionTier {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

export enum StoreStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CLOSED = 'closed',
}

@Entity('stores')
@Index('idx_stores_owner', ['ownerId'])
@Index('idx_stores_status', ['status'])
@Index('idx_stores_governorate', ['governorate'])
@Index('idx_stores_verified', ['isVerified'])
@Index('idx_stores_location', ['lat', 'lng'])
@Index('idx_stores_subscription', ['subscriptionTier'])
export class Store extends BaseEntity {
  @Column({ name: 'name_en', length: 200 })
  nameEn: string;

  @Column({ name: 'name_ar', length: 200 })
  nameAr: string;

  @Column({ length: 100, unique: true })
  slug: string;

  @Column({ name: 'description_en', type: 'text', nullable: true })
  descriptionEn: string | null;

  @Column({ name: 'description_ar', type: 'text', nullable: true })
  descriptionAr: string | null;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => User, (user) => user.stores)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'logo_url', length: 500, nullable: true })
  logoUrl: string | null;

  @Column({ name: 'cover_url', length: 500, nullable: true })
  coverUrl: string | null;

  @Column({ name: 'phone_primary', length: 20 })
  phonePrimary: string;

  @Column({ name: 'phone_secondary', length: 20, nullable: true })
  phoneSecondary: string | null;

  @Column({ length: 255, nullable: true })
  email: string | null;

  // Location
  @Column({ length: 500 })
  address: string;

  @Column({ name: 'address_ar', length: 500 })
  addressAr: string;

  @Column({ length: 100 })
  area: string;

  @Column({ length: 100 })
  city: string;

  @Column({ length: 100 })
  governorate: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lat: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lng: number | null;

  // Business info
  @Column({ name: 'tax_registration_number', length: 50, nullable: true })
  taxRegistrationNumber: string | null;

  @Column({ name: 'commercial_register', length: 50, nullable: true })
  commercialRegister: string | null;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ type: 'enum', enum: StoreStatus, default: StoreStatus.PENDING })
  status: StoreStatus;

  @Column({
    name: 'subscription_tier',
    type: 'enum',
    enum: SubscriptionTier,
    default: SubscriptionTier.FREE,
  })
  subscriptionTier: SubscriptionTier;

  @Column({ name: 'subscription_expires_at', type: 'timestamptz', nullable: true })
  subscriptionExpiresAt: Date | null;

  // Rating
  @Column({ name: 'avg_rating', type: 'decimal', precision: 3, scale: 2, default: 0 })
  avgRating: number;

  @Column({ name: 'total_ratings', default: 0 })
  totalRatings: number;

  @Column({ name: 'total_orders', default: 0 })
  totalOrders: number;

  // Working hours stored as JSONB
  @Column({ name: 'working_hours', type: 'jsonb', default: {} })
  workingHours: Record<string, { open: string; close: string; closed: boolean }>;

  // Delivery zones
  @Column({ name: 'delivery_zones', type: 'jsonb', default: [] })
  deliveryZones: {
    area: string;
    governorate: string;
    deliveryFee: number;
    estimatedMinutes: number;
  }[];

  @Column({ name: 'supports_pickup', default: true })
  supportsPickup: boolean;

  @Column({ name: 'supports_delivery', default: false })
  supportsDelivery: boolean;

  // Wallet
  @Column({ name: 'wallet_balance', type: 'decimal', precision: 12, scale: 2, default: 0 })
  walletBalance: number;

  @Column({ name: 'pending_balance', type: 'decimal', precision: 12, scale: 2, default: 0 })
  pendingBalance: number;

  @OneToMany(() => StoreProduct, (sp) => sp.store)
  products: StoreProduct[];

  @OneToMany(() => Order, (order) => order.store)
  orders: Order[];
}
