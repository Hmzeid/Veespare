import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '@/common/interfaces/base.entity';
import { Store } from '@/modules/stores/entities/store.entity';
import { Order } from '@/modules/orders/entities/order.entity';

export enum CommissionStatus {
  HELD = 'held',
  CLEARED = 'cleared',
  REVERSED = 'reversed',
  PARTIALLY_REVERSED = 'partially_reversed',
}

export enum CommissionType {
  ORDER_COMMISSION = 'order_commission',
  REFUND_REVERSAL = 'refund_reversal',
  ADJUSTMENT = 'adjustment',
}

@Entity('commission_transactions')
@Index('idx_commission_store', ['storeId'])
@Index('idx_commission_order', ['orderId'])
@Index('idx_commission_status', ['status'])
@Index('idx_commission_clearance', ['clearanceAt'])
@Index('idx_commission_idempotency', ['idempotencyKey'], { unique: true })
export class CommissionTransaction extends BaseEntity {
  @Column({ name: 'store_id', type: 'uuid' })
  storeId: string;

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'enum', enum: CommissionType, default: CommissionType.ORDER_COMMISSION })
  type: CommissionType;

  @Column({ type: 'enum', enum: CommissionStatus, default: CommissionStatus.HELD })
  status: CommissionStatus;

  @Column({ name: 'order_subtotal', type: 'decimal', precision: 10, scale: 2 })
  orderSubtotal: number;

  @Column({ name: 'commission_rate', type: 'decimal', precision: 5, scale: 4, default: 0.06 })
  commissionRate: number;

  @Column({ name: 'commission_amount', type: 'decimal', precision: 10, scale: 2 })
  commissionAmount: number;

  @Column({ name: 'store_payout', type: 'decimal', precision: 10, scale: 2 })
  storePayout: number;

  @Column({ name: 'refund_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  refundAmount: number | null;

  @Column({ name: 'reversed_commission', type: 'decimal', precision: 10, scale: 2, nullable: true })
  reversedCommission: number | null;

  @Column({ name: 'held_at', type: 'timestamptz' })
  heldAt: Date;

  @Column({ name: 'clearance_at', type: 'timestamptz' })
  clearanceAt: Date;

  @Column({ name: 'cleared_at', type: 'timestamptz', nullable: true })
  clearedAt: Date | null;

  @Column({ name: 'reversed_at', type: 'timestamptz', nullable: true })
  reversedAt: Date | null;

  @Column({ length: 3, default: 'EGP' })
  currency: string;

  @Column({ name: 'idempotency_key', length: 255, unique: true })
  idempotencyKey: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
