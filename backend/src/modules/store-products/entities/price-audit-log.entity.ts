import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { StoreProduct } from './store-product.entity';

@Entity('price_audit_logs')
@Index('idx_price_audit_product', ['storeProductId'])
@Index('idx_price_audit_created', ['createdAt'])
export class PriceAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'store_product_id', type: 'uuid' })
  storeProductId: string;

  @ManyToOne(() => StoreProduct, (sp) => sp.priceAuditLogs)
  @JoinColumn({ name: 'store_product_id' })
  storeProduct: StoreProduct;

  @Column({ name: 'old_price', type: 'decimal', precision: 10, scale: 2 })
  oldPrice: number;

  @Column({ name: 'new_price', type: 'decimal', precision: 10, scale: 2 })
  newPrice: number;

  @Column({ name: 'old_stock', type: 'int', nullable: true })
  oldStock: number | null;

  @Column({ name: 'new_stock', type: 'int', nullable: true })
  newStock: number | null;

  @Column({ name: 'changed_by', type: 'uuid' })
  changedBy: string;

  @Column({ name: 'change_reason', length: 500, nullable: true })
  changeReason: string | null;

  @Column({ name: 'change_source', length: 50, default: 'manual' })
  changeSource: string; // 'manual' | 'bulk_import' | 'api' | 'ai_recommendation'

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
