import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../../config/data-source';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  const dataSource = new DataSource(dataSourceOptions);
  await dataSource.initialize();
  console.log('Database connected for seeding...');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // ============ SEED USERS ============
    const adminId = uuidv4();
    const storeOwnerId = uuidv4();
    const customerId = uuidv4();
    const passwordHash = await bcrypt.hash('password123', 12);

    await queryRunner.query(`
      INSERT INTO users (id, first_name, last_name, first_name_ar, last_name_ar, email, phone, password_hash, role, is_verified, is_active)
      VALUES
        ($1, 'Admin', 'VeeParts', 'مدير', 'في بارتس', 'admin@veeparts.com', '+201000000001', $4, 'admin', true, true),
        ($2, 'Ahmed', 'Hassan', 'أحمد', 'حسن', 'ahmed@store.com', '+201000000002', $4, 'store_owner', true, true),
        ($3, 'Mohamed', 'Ali', 'محمد', 'علي', 'mohamed@customer.com', '+201000000003', $4, 'customer', true, true)
      ON CONFLICT DO NOTHING
    `, [adminId, storeOwnerId, customerId, passwordHash]);

    console.log('Users seeded');

    // ============ SEED STORES ============
    const storeId1 = uuidv4();
    const storeId2 = uuidv4();

    await queryRunner.query(`
      INSERT INTO stores (id, name_en, name_ar, slug, description_en, description_ar, owner_id, phone_primary, address, address_ar, area, city, governorate, lat, lng, is_verified, status, subscription_tier, avg_rating, total_orders, supports_delivery)
      VALUES
        ($1, 'AutoParts Egypt', 'قطع غيار مصر', 'autoparts-egypt', 'Best auto parts store in Cairo', 'أفضل متجر لقطع غيار السيارات في القاهرة', $3, '+201111111111', '15 Tahrir St, Downtown', '15 شارع التحرير، وسط البلد', 'Downtown', 'Cairo', 'Cairo', 30.0444, 31.2357, true, 'active', 'premium', 4.5, 150, true),
        ($2, 'Delta Car Parts', 'قطع غيار الدلتا', 'delta-car-parts', 'Quality parts in Alexandria', 'قطع غيار ممتازة في الإسكندرية', $3, '+201222222222', '5 Corniche Road', '5 طريق الكورنيش', 'Corniche', 'Alexandria', 'Alexandria', 31.2001, 29.9187, true, 'active', 'basic', 4.2, 85, true)
      ON CONFLICT DO NOTHING
    `, [storeId1, storeId2, storeOwnerId]);

    console.log('Stores seeded');

    // ============ SEED STORE PRODUCTS ============
    const products = [
      { nameEn: 'Oil Filter - Toyota Corolla', nameAr: 'فلتر زيت - تويوتا كورولا', oem: '04152-YZZA6', category: 'filters', price: 150, stock: 50 },
      { nameEn: 'Brake Pads Front - Hyundai Elantra', nameAr: 'تيل فرامل أمامي - هيونداي إلنترا', oem: '58101-F2A10', category: 'brake_system', price: 450, stock: 30 },
      { nameEn: 'Air Filter - Nissan Sunny', nameAr: 'فلتر هواء - نيسان صني', oem: '16546-3J400', category: 'filters', price: 120, stock: 45 },
      { nameEn: 'Spark Plugs Set - Chevrolet Optra', nameAr: 'طقم بوجيهات - شيفروليه أوبترا', oem: 'BCPR6ES-11', category: 'engine_parts', price: 280, stock: 25 },
      { nameEn: 'Radiator - Toyota Yaris', nameAr: 'رادياتير - تويوتا ياريس', oem: '16400-21270', category: 'cooling', price: 1800, stock: 8 },
      { nameEn: 'Alternator - Kia Cerato', nameAr: 'دينامو - كيا سيراتو', oem: '37300-2B300', category: 'electrical', price: 2500, stock: 5 },
      { nameEn: 'Shock Absorber Front - Hyundai Tucson', nameAr: 'مساعد أمامي - هيونداي توسان', oem: '54651-2S000', category: 'suspension', price: 950, stock: 12 },
      { nameEn: 'Clutch Kit - Chevrolet Lanos', nameAr: 'طقم كلتش - شيفروليه لانوس', oem: '96343035', category: 'transmission', price: 1200, stock: 7 },
      { nameEn: 'Head Gasket - Toyota Corolla', nameAr: 'جوان وش سلندر - تويوتا كورولا', oem: '11115-22050', category: 'engine_parts', price: 350, stock: 15 },
      { nameEn: 'Water Pump - Nissan Sunny', nameAr: 'طرمبة مياه - نيسان صني', oem: '21010-4M526', category: 'cooling', price: 600, stock: 10 },
    ];

    for (const product of products) {
      await queryRunner.query(`
        INSERT INTO store_products (id, store_id, part_id, oem_number, name_en, name_ar, category, price, currency, stock, condition, status, compatible_cars, ai_category_confidence, ai_authenticity_score, ai_risk_level)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'EGP', $9, 'new', 'active', '[]', 0.85, 0.92, 'low')
      `, [uuidv4(), storeId1, uuidv4(), product.oem, product.nameEn, product.nameAr, product.category, product.price, product.stock]);
    }

    // Add some products to second store with different prices
    for (const product of products.slice(0, 5)) {
      const priceVariation = Math.round(product.price * (0.85 + Math.random() * 0.3));
      await queryRunner.query(`
        INSERT INTO store_products (id, store_id, part_id, oem_number, name_en, name_ar, category, price, currency, stock, condition, status, compatible_cars, ai_category_confidence, ai_authenticity_score, ai_risk_level)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'EGP', $9, 'new', 'active', '[]', 0.78, 0.88, 'low')
      `, [uuidv4(), storeId2, uuidv4(), product.oem, product.nameEn, product.nameAr, product.category, priceVariation, Math.floor(product.stock * 0.7)]);
    }

    console.log('Store products seeded');

    // ============ SEED SAMPLE ORDER ============
    const orderId = uuidv4();
    await queryRunner.query(`
      INSERT INTO orders (id, order_number, customer_id, store_id, status, payment_method, payment_status, subtotal, delivery_fee, total, commission_amount, commission_rate, store_payout, delivery_method, delivery_address)
      VALUES ($1, 'VP-240101-0001', $2, $3, 'completed', 'paymob', 'paid', 600, 50, 650, 36, 0.06, 564, 'delivery',
        '{"street": "10 شارع مصر الجديدة", "area": "مصر الجديدة", "city": "القاهرة", "governorate": "القاهرة", "phone": "+201000000003"}'::jsonb)
    `, [orderId, customerId, storeId1]);

    console.log('Sample order seeded');

    await queryRunner.commitTransaction();
    console.log('Seeding completed successfully!');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

seed().catch(console.error);
