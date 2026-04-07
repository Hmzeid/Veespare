import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.items)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'store_product_id', type: 'uuid' })
  storeProductId: string;

  @Column({ name: 'product_name_en', length: 300 })
  productNameEn: string;

  @Column({ name: 'product_name_ar', length: 300 })
  productNameAr: string;

  @Column({ name: 'oem_number', length: 100, nullable: true })
  oemNumber: string | null;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ name: 'total_price', type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ length: 50, nullable: true })
  condition: string | null;

  @Column({ name: 'product_image', length: 500, nullable: true })
  productImage: string | null;

  @Column({ name: 'warranty_months', type: 'int', nullable: true })
  warrantyMonths: number | null;
}
