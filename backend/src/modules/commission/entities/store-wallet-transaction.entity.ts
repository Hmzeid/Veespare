import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '@/common/interfaces/base.entity';
import { Store } from '@/modules/stores/entities/store.entity';

export enum WalletTransactionType {
  COMMISSION_CREDIT = 'commission_credit',
  COMMISSION_REVERSAL = 'commission_reversal',
  PAYOUT = 'payout',
  ADJUSTMENT = 'adjustment',
  REFUND_DEBIT = 'refund_debit',
}

export enum WalletTransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REVERSED = 'reversed',
}

@Entity('store_wallet_transactions')
@Index('idx_wallet_tx_store', ['storeId'])
@Index('idx_wallet_tx_type', ['type'])
@Index('idx_wallet_tx_status', ['status'])
@Index('idx_wallet_tx_created', ['createdAt'])
@Index('idx_wallet_tx_idempotency', ['idempotencyKey'], { unique: true })
export class StoreWalletTransaction extends BaseEntity {
  @Column({ name: 'store_id', type: 'uuid' })
  storeId: string;

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ type: 'enum', enum: WalletTransactionType })
  type: WalletTransactionType;

  @Column({ type: 'enum', enum: WalletTransactionStatus, default: WalletTransactionStatus.PENDING })
  status: WalletTransactionStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ name: 'balance_before', type: 'decimal', precision: 12, scale: 2 })
  balanceBefore: number;

  @Column({ name: 'balance_after', type: 'decimal', precision: 12, scale: 2 })
  balanceAfter: number;

  @Column({ name: 'reference_id', length: 255, nullable: true })
  referenceId: string | null;

  @Column({ name: 'reference_type', length: 50, nullable: true })
  referenceType: string | null;

  @Column({ length: 3, default: 'EGP' })
  currency: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'description_ar', type: 'text', nullable: true })
  descriptionAr: string | null;

  @Column({ name: 'idempotency_key', length: 255, unique: true })
  idempotencyKey: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;
}
