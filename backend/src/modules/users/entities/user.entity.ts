import {
  Entity,
  Column,
  OneToMany,
  Index,
} from 'typeorm';
import { BaseEntity } from '@/common/interfaces/base.entity';
import { Store } from '@/modules/stores/entities/store.entity';
import { Order } from '@/modules/orders/entities/order.entity';

export enum UserRole {
  CUSTOMER = 'customer',
  STORE_OWNER = 'store_owner',
  ADMIN = 'admin',
}

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  APPLE = 'apple',
}

@Entity('users')
@Index('idx_users_email', ['email'], { unique: true })
@Index('idx_users_phone', ['phone'], { unique: true })
@Index('idx_users_role', ['role'])
export class User extends BaseEntity {
  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ name: 'first_name_ar', length: 100, nullable: true })
  firstNameAr: string | null;

  @Column({ name: 'last_name_ar', length: 100, nullable: true })
  lastNameAr: string | null;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ unique: true, length: 20 })
  phone: string;

  @Column({ name: 'password_hash', length: 255, select: false })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @Column({ name: 'auth_provider', type: 'enum', enum: AuthProvider, default: AuthProvider.LOCAL })
  authProvider: AuthProvider;

  @Column({ name: 'auth_provider_id', length: 255, nullable: true })
  authProviderId: string | null;

  @Column({ name: 'avatar_url', length: 500, nullable: true })
  avatarUrl: string | null;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'preferred_language', length: 5, default: 'ar' })
  preferredLanguage: string;

  @Column({ name: 'notification_token', length: 500, nullable: true })
  notificationToken: string | null;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  // Addresses stored as JSONB for flexibility
  @Column({ type: 'jsonb', default: [] })
  addresses: {
    id: string;
    label: string;
    labelAr: string;
    street: string;
    area: string;
    city: string;
    governorate: string;
    postalCode?: string;
    lat?: number;
    lng?: number;
    isDefault: boolean;
  }[];

  @OneToMany(() => Store, (store) => store.owner)
  stores: Store[];

  @OneToMany(() => Order, (order) => order.customer)
  orders: Order[];
}
