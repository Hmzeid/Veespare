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
import { Store } from '@/modules/stores/entities/store.entity';
import { OrderItem } from './order-item.entity';
import { OrderStatusHistory } from './order-status-history.entity';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PAYMENT_PENDING = 'payment_pending',
  PAID = 'paid',
  PREPARING = 'preparing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  ON_THE_WAY = 'on_the_way',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  DISPUTED = 'disputed',
}

export enum PaymentMethod {
  FAWRY = 'fawry',
  VODAFONE_CASH = 'vodafone_cash',
  PAYMOB = 'paymob',
  COD = 'cod',
  INSTAPAY = 'instapay',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum DeliveryMethod {
  DELIVERY = 'delivery',
  PICKUP = 'pickup',
}

@Entity('orders')
@Index('idx_orders_customer', ['customerId'])
@Index('idx_orders_store', ['storeId'])
@Index('idx_orders_status', ['status'])
@Index('idx_orders_payment_status', ['paymentStatus'])
@Index('idx_orders_created', ['createdAt'])
@Index('idx_orders_order_number', ['orderNumber'], { unique: true })
export class Order extends BaseEntity {
  @Column({ name: 'order_number', length: 20, unique: true })
  orderNumber: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @Column({ name: 'store_id', type: 'uuid' })
  storeId: string;

  @ManyToOne(() => Store, (store) => store.orders)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  // Payment
  @Column({ name: 'payment_method', type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Column({ name: 'payment_status', type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Column({ name: 'payment_reference', length: 255, nullable: true })
  paymentReference: string | null;

  @Column({ name: 'payment_transaction_id', length: 255, nullable: true })
  paymentTransactionId: string | null;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  // Amounts
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ name: 'delivery_fee', type: 'decimal', precision: 10, scale: 2, default: 0 })
  deliveryFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ name: 'commission_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  commissionAmount: number;

  @Column({ name: 'commission_rate', type: 'decimal', precision: 5, scale: 4, default: 0.06 })
  commissionRate: number;

  @Column({ name: 'store_payout', type: 'decimal', precision: 10, scale: 2, default: 0 })
  storePayout: number;

  @Column({ name: 'commission_cleared', default: false })
  commissionCleared: boolean;

  @Column({ name: 'commission_cleared_at', type: 'timestamptz', nullable: true })
  commissionClearedAt: Date | null;

  @Column({ length: 3, default: 'EGP' })
  currency: string;

  // Delivery
  @Column({ name: 'delivery_method', type: 'enum', enum: DeliveryMethod })
  deliveryMethod: DeliveryMethod;

  @Column({ name: 'delivery_address', type: 'jsonb', nullable: true })
  deliveryAddress: {
    street: string;
    area: string;
    city: string;
    governorate: string;
    lat?: number;
    lng?: number;
    phone: string;
    notes?: string;
  } | null;

  @Column({ name: 'estimated_delivery_at', type: 'timestamptz', nullable: true })
  estimatedDeliveryAt: Date | null;

  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt: Date | null;

  // COD deposit
  @Column({ name: 'cod_deposit_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  codDepositAmount: number | null;

  @Column({ name: 'cod_deposit_paid', default: false })
  codDepositPaid: boolean;

  // Customer feedback
  @Column({ type: 'int', nullable: true })
  rating: number | null;

  @Column({ name: 'review_text', type: 'text', nullable: true })
  reviewText: string | null;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  // Notes
  @Column({ name: 'customer_notes', type: 'text', nullable: true })
  customerNotes: string | null;

  @Column({ name: 'store_notes', type: 'text', nullable: true })
  storeNotes: string | null;

  @Column({ name: 'admin_notes', type: 'text', nullable: true })
  adminNotes: string | null;

  // Idempotency
  @Column({ name: 'idempotency_key', length: 255, nullable: true, unique: true })
  idempotencyKey: string | null;

  // Cancellation / Refund
  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @Column({ name: 'cancel_reason', type: 'text', nullable: true })
  cancelReason: string | null;

  @Column({ name: 'refund_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  refundAmount: number | null;

  @Column({ name: 'refunded_at', type: 'timestamptz', nullable: true })
  refundedAt: Date | null;

  // Auto-confirm deadline
  @Column({ name: 'confirm_deadline', type: 'timestamptz', nullable: true })
  confirmDeadline: Date | null;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @OneToMany(() => OrderStatusHistory, (h) => h.order, { cascade: true })
  statusHistory: OrderStatusHistory[];
}
