import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000001 implements MigrationInterface {
  name = 'InitialSchema1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`);

    // Create enums
    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM ('customer', 'store_owner', 'admin')
    `);
    await queryRunner.query(`
      CREATE TYPE "auth_provider_enum" AS ENUM ('local', 'google', 'facebook', 'apple')
    `);
    await queryRunner.query(`
      CREATE TYPE "store_status_enum" AS ENUM ('pending', 'active', 'suspended', 'closed')
    `);
    await queryRunner.query(`
      CREATE TYPE "subscription_tier_enum" AS ENUM ('free', 'basic', 'premium', 'enterprise')
    `);
    await queryRunner.query(`
      CREATE TYPE "part_condition_enum" AS ENUM ('new', 'used', 'refurbished')
    `);
    await queryRunner.query(`
      CREATE TYPE "product_status_enum" AS ENUM ('active', 'out_of_stock', 'pending_review', 'rejected', 'draft')
    `);
    await queryRunner.query(`
      CREATE TYPE "order_status_enum" AS ENUM (
        'pending', 'confirmed', 'payment_pending', 'paid', 'preparing',
        'ready_for_pickup', 'on_the_way', 'delivered', 'completed',
        'cancelled', 'refunded', 'disputed'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "payment_method_enum" AS ENUM ('fawry', 'vodafone_cash', 'paymob', 'cod', 'instapay')
    `);
    await queryRunner.query(`
      CREATE TYPE "payment_status_enum" AS ENUM ('pending', 'paid', 'failed', 'refunded', 'partially_refunded')
    `);
    await queryRunner.query(`
      CREATE TYPE "delivery_method_enum" AS ENUM ('delivery', 'pickup')
    `);

    // ============ USERS TABLE ============
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "first_name" varchar(100) NOT NULL,
        "last_name" varchar(100) NOT NULL,
        "first_name_ar" varchar(100),
        "last_name_ar" varchar(100),
        "email" varchar(255) NOT NULL,
        "phone" varchar(20) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "role" "user_role_enum" NOT NULL DEFAULT 'customer',
        "auth_provider" "auth_provider_enum" NOT NULL DEFAULT 'local',
        "auth_provider_id" varchar(255),
        "avatar_url" varchar(500),
        "is_verified" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "preferred_language" varchar(5) NOT NULL DEFAULT 'ar',
        "notification_token" varchar(500),
        "last_login_at" timestamptz,
        "addresses" jsonb NOT NULL DEFAULT '[]',
        "created_by" uuid,
        "updated_by" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        CONSTRAINT "pk_users" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_users_email" ON "users" ("email") WHERE "deleted_at" IS NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_users_phone" ON "users" ("phone") WHERE "deleted_at" IS NULL`);
    await queryRunner.query(`CREATE INDEX "idx_users_role" ON "users" ("role")`);

    // ============ STORES TABLE ============
    await queryRunner.query(`
      CREATE TABLE "stores" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name_en" varchar(200) NOT NULL,
        "name_ar" varchar(200) NOT NULL,
        "slug" varchar(100) NOT NULL,
        "description_en" text,
        "description_ar" text,
        "owner_id" uuid NOT NULL,
        "logo_url" varchar(500),
        "cover_url" varchar(500),
        "phone_primary" varchar(20) NOT NULL,
        "phone_secondary" varchar(20),
        "email" varchar(255),
        "address" varchar(500) NOT NULL,
        "address_ar" varchar(500) NOT NULL,
        "area" varchar(100) NOT NULL,
        "city" varchar(100) NOT NULL,
        "governorate" varchar(100) NOT NULL,
        "lat" decimal(10,7),
        "lng" decimal(10,7),
        "tax_registration_number" varchar(50),
        "commercial_register" varchar(50),
        "is_verified" boolean NOT NULL DEFAULT false,
        "status" "store_status_enum" NOT NULL DEFAULT 'pending',
        "subscription_tier" "subscription_tier_enum" NOT NULL DEFAULT 'free',
        "subscription_expires_at" timestamptz,
        "avg_rating" decimal(3,2) NOT NULL DEFAULT 0,
        "total_ratings" int NOT NULL DEFAULT 0,
        "total_orders" int NOT NULL DEFAULT 0,
        "working_hours" jsonb NOT NULL DEFAULT '{}',
        "delivery_zones" jsonb NOT NULL DEFAULT '[]',
        "supports_pickup" boolean NOT NULL DEFAULT true,
        "supports_delivery" boolean NOT NULL DEFAULT false,
        "wallet_balance" decimal(12,2) NOT NULL DEFAULT 0,
        "pending_balance" decimal(12,2) NOT NULL DEFAULT 0,
        "created_by" uuid,
        "updated_by" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        CONSTRAINT "pk_stores" PRIMARY KEY ("id"),
        CONSTRAINT "fk_stores_owner" FOREIGN KEY ("owner_id") REFERENCES "users"("id")
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_stores_slug" ON "stores" ("slug") WHERE "deleted_at" IS NULL`);
    await queryRunner.query(`CREATE INDEX "idx_stores_owner" ON "stores" ("owner_id")`);
    await queryRunner.query(`CREATE INDEX "idx_stores_status" ON "stores" ("status")`);
    await queryRunner.query(`CREATE INDEX "idx_stores_governorate" ON "stores" ("governorate")`);
    await queryRunner.query(`CREATE INDEX "idx_stores_verified" ON "stores" ("is_verified")`);
    await queryRunner.query(`CREATE INDEX "idx_stores_location" ON "stores" ("lat", "lng")`);
    await queryRunner.query(`CREATE INDEX "idx_stores_subscription" ON "stores" ("subscription_tier")`);

    // ============ STORE_PRODUCTS TABLE ============
    await queryRunner.query(`
      CREATE TABLE "store_products" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "store_id" uuid NOT NULL,
        "part_id" varchar(50) NOT NULL,
        "oem_number" varchar(100),
        "name_en" varchar(300) NOT NULL,
        "name_ar" varchar(300) NOT NULL,
        "description_en" text,
        "description_ar" text,
        "category" varchar(100),
        "brand" varchar(100),
        "price" decimal(10,2) NOT NULL,
        "original_price" decimal(10,2),
        "currency" varchar(3) NOT NULL DEFAULT 'EGP',
        "stock" int NOT NULL DEFAULT 0,
        "min_stock_alert" int NOT NULL DEFAULT 5,
        "condition" "part_condition_enum" NOT NULL,
        "status" "product_status_enum" NOT NULL DEFAULT 'pending_review',
        "images" jsonb NOT NULL DEFAULT '[]',
        "compatible_cars" jsonb NOT NULL DEFAULT '[]',
        "warranty_months" int,
        "weight_kg" decimal(8,3),
        "ai_category_confidence" decimal(3,2),
        "ai_authenticity_score" decimal(3,2),
        "ai_risk_level" varchar(20),
        "view_count" int NOT NULL DEFAULT 0,
        "order_count" int NOT NULL DEFAULT 0,
        "avg_rating" decimal(3,2) NOT NULL DEFAULT 0,
        "total_ratings" int NOT NULL DEFAULT 0,
        "created_by" uuid,
        "updated_by" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        CONSTRAINT "pk_store_products" PRIMARY KEY ("id"),
        CONSTRAINT "fk_store_products_store" FOREIGN KEY ("store_id") REFERENCES "stores"("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_store_products_store" ON "store_products" ("store_id")`);
    await queryRunner.query(`CREATE INDEX "idx_store_products_part" ON "store_products" ("part_id")`);
    await queryRunner.query(`CREATE INDEX "idx_store_products_price" ON "store_products" ("price")`);
    await queryRunner.query(`CREATE INDEX "idx_store_products_condition" ON "store_products" ("condition")`);
    await queryRunner.query(`CREATE INDEX "idx_store_products_status" ON "store_products" ("status")`);
    await queryRunner.query(`CREATE INDEX "idx_store_products_oem" ON "store_products" ("oem_number")`);
    await queryRunner.query(`CREATE INDEX "idx_store_products_category" ON "store_products" ("category")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_store_products_store_part_condition" ON "store_products" ("store_id", "part_id", "condition") WHERE "deleted_at" IS NULL`);
    // GIN index for Arabic full-text search on name
    await queryRunner.query(`CREATE INDEX "idx_store_products_name_ar_trgm" ON "store_products" USING gin ("name_ar" gin_trgm_ops)`);
    await queryRunner.query(`CREATE INDEX "idx_store_products_name_en_trgm" ON "store_products" USING gin ("name_en" gin_trgm_ops)`);

    // ============ PRICE_AUDIT_LOGS TABLE ============
    await queryRunner.query(`
      CREATE TABLE "price_audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "store_product_id" uuid NOT NULL,
        "old_price" decimal(10,2) NOT NULL,
        "new_price" decimal(10,2) NOT NULL,
        "old_stock" int,
        "new_stock" int,
        "changed_by" uuid NOT NULL,
        "change_reason" varchar(500),
        "change_source" varchar(50) NOT NULL DEFAULT 'manual',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_price_audit_logs" PRIMARY KEY ("id"),
        CONSTRAINT "fk_price_audit_product" FOREIGN KEY ("store_product_id") REFERENCES "store_products"("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_price_audit_product" ON "price_audit_logs" ("store_product_id")`);
    await queryRunner.query(`CREATE INDEX "idx_price_audit_created" ON "price_audit_logs" ("created_at")`);

    // ============ ORDERS TABLE ============
    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "order_number" varchar(20) NOT NULL,
        "customer_id" uuid NOT NULL,
        "store_id" uuid NOT NULL,
        "status" "order_status_enum" NOT NULL DEFAULT 'pending',
        "payment_method" "payment_method_enum" NOT NULL,
        "payment_status" "payment_status_enum" NOT NULL DEFAULT 'pending',
        "payment_reference" varchar(255),
        "payment_transaction_id" varchar(255),
        "paid_at" timestamptz,
        "subtotal" decimal(10,2) NOT NULL,
        "delivery_fee" decimal(10,2) NOT NULL DEFAULT 0,
        "discount" decimal(10,2) NOT NULL DEFAULT 0,
        "total" decimal(10,2) NOT NULL,
        "commission_amount" decimal(10,2) NOT NULL DEFAULT 0,
        "commission_rate" decimal(5,4) NOT NULL DEFAULT 0.06,
        "store_payout" decimal(10,2) NOT NULL DEFAULT 0,
        "commission_cleared" boolean NOT NULL DEFAULT false,
        "commission_cleared_at" timestamptz,
        "currency" varchar(3) NOT NULL DEFAULT 'EGP',
        "delivery_method" "delivery_method_enum" NOT NULL,
        "delivery_address" jsonb,
        "estimated_delivery_at" timestamptz,
        "delivered_at" timestamptz,
        "cod_deposit_amount" decimal(10,2),
        "cod_deposit_paid" boolean NOT NULL DEFAULT false,
        "rating" int,
        "review_text" text,
        "reviewed_at" timestamptz,
        "customer_notes" text,
        "store_notes" text,
        "admin_notes" text,
        "idempotency_key" varchar(255),
        "cancelled_at" timestamptz,
        "cancel_reason" text,
        "refund_amount" decimal(10,2),
        "refunded_at" timestamptz,
        "confirm_deadline" timestamptz,
        "created_by" uuid,
        "updated_by" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        CONSTRAINT "pk_orders" PRIMARY KEY ("id"),
        CONSTRAINT "fk_orders_customer" FOREIGN KEY ("customer_id") REFERENCES "users"("id"),
        CONSTRAINT "fk_orders_store" FOREIGN KEY ("store_id") REFERENCES "stores"("id")
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_orders_order_number" ON "orders" ("order_number")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "idx_orders_idempotency" ON "orders" ("idempotency_key") WHERE "idempotency_key" IS NOT NULL`);
    await queryRunner.query(`CREATE INDEX "idx_orders_customer" ON "orders" ("customer_id")`);
    await queryRunner.query(`CREATE INDEX "idx_orders_store" ON "orders" ("store_id")`);
    await queryRunner.query(`CREATE INDEX "idx_orders_status" ON "orders" ("status")`);
    await queryRunner.query(`CREATE INDEX "idx_orders_payment_status" ON "orders" ("payment_status")`);
    await queryRunner.query(`CREATE INDEX "idx_orders_created" ON "orders" ("created_at")`);

    // ============ ORDER_ITEMS TABLE ============
    await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "order_id" uuid NOT NULL,
        "store_product_id" uuid NOT NULL,
        "product_name_en" varchar(300) NOT NULL,
        "product_name_ar" varchar(300) NOT NULL,
        "oem_number" varchar(100),
        "unit_price" decimal(10,2) NOT NULL,
        "quantity" int NOT NULL,
        "total_price" decimal(10,2) NOT NULL,
        "condition" varchar(50),
        "product_image" varchar(500),
        "warranty_months" int,
        CONSTRAINT "pk_order_items" PRIMARY KEY ("id"),
        CONSTRAINT "fk_order_items_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_order_items_order" ON "order_items" ("order_id")`);

    // ============ ORDER_STATUS_HISTORY TABLE ============
    await queryRunner.query(`
      CREATE TABLE "order_status_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "order_id" uuid NOT NULL,
        "from_status" "order_status_enum",
        "to_status" "order_status_enum" NOT NULL,
        "changed_by" uuid,
        "change_reason" text,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_order_status_history" PRIMARY KEY ("id"),
        CONSTRAINT "fk_order_status_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_order_status_history_order" ON "order_status_history" ("order_id")`);

    // ============ COMMISSION_TRANSACTIONS TABLE ============
    await queryRunner.query(`
      CREATE TABLE "commission_transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "order_id" uuid NOT NULL,
        "store_id" uuid NOT NULL,
        "amount" decimal(10,2) NOT NULL,
        "commission_amount" decimal(10,2) NOT NULL,
        "store_payout" decimal(10,2) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'held',
        "held_until" timestamptz,
        "cleared_at" timestamptz,
        "transferred_at" timestamptz,
        "transfer_reference" varchar(255),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_commission_transactions" PRIMARY KEY ("id"),
        CONSTRAINT "fk_commission_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id"),
        CONSTRAINT "fk_commission_store" FOREIGN KEY ("store_id") REFERENCES "stores"("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_commission_store" ON "commission_transactions" ("store_id")`);
    await queryRunner.query(`CREATE INDEX "idx_commission_status" ON "commission_transactions" ("status")`);

    // ============ STORE_WALLETS TABLE ============
    await queryRunner.query(`
      CREATE TABLE "store_wallet_transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "store_id" uuid NOT NULL,
        "type" varchar(20) NOT NULL,
        "amount" decimal(12,2) NOT NULL,
        "balance_after" decimal(12,2) NOT NULL,
        "reference_type" varchar(50),
        "reference_id" uuid,
        "description" varchar(500),
        "description_ar" varchar(500),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_wallet_transactions" PRIMARY KEY ("id"),
        CONSTRAINT "fk_wallet_store" FOREIGN KEY ("store_id") REFERENCES "stores"("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_wallet_store" ON "store_wallet_transactions" ("store_id")`);
    await queryRunner.query(`CREATE INDEX "idx_wallet_created" ON "store_wallet_transactions" ("created_at")`);

    // ============ USER_CARS TABLE ============
    await queryRunner.query(`
      CREATE TABLE "user_cars" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "make" varchar(100) NOT NULL,
        "model" varchar(100) NOT NULL,
        "year" int NOT NULL,
        "engine" varchar(100),
        "vin" varchar(17),
        "plate_number" varchar(20),
        "color" varchar(50),
        "nickname" varchar(100),
        "mileage_km" int,
        "is_primary" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        CONSTRAINT "pk_user_cars" PRIMARY KEY ("id"),
        CONSTRAINT "fk_user_cars_user" FOREIGN KEY ("user_id") REFERENCES "users"("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_user_cars_user" ON "user_cars" ("user_id")`);

    // ============ MAINTENANCE_RECORDS TABLE ============
    await queryRunner.query(`
      CREATE TABLE "maintenance_records" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_car_id" uuid NOT NULL,
        "type" varchar(100) NOT NULL,
        "description" text,
        "description_ar" text,
        "mileage_km" int,
        "cost" decimal(10,2),
        "performed_at" date NOT NULL,
        "next_due_at" date,
        "next_due_mileage" int,
        "store_id" uuid,
        "order_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_maintenance_records" PRIMARY KEY ("id"),
        CONSTRAINT "fk_maintenance_car" FOREIGN KEY ("user_car_id") REFERENCES "user_cars"("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_maintenance_car" ON "maintenance_records" ("user_car_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "maintenance_records" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_cars" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "store_wallet_transactions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "commission_transactions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "order_status_history" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "order_items" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "orders" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "price_audit_logs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "store_products" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "stores" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "delivery_method_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_method_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "order_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "product_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "part_condition_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "subscription_tier_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "store_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "auth_provider_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum"`);
  }
}
