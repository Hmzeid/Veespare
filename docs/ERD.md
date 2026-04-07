# VeeParts Database Schema - Entity Relationship Diagram

## ERD (Mermaid)

```mermaid
erDiagram
    USERS {
        uuid id PK
        varchar first_name
        varchar last_name
        varchar first_name_ar
        varchar last_name_ar
        varchar email UK
        varchar phone UK
        varchar password_hash
        enum role "customer|store_owner|admin"
        enum auth_provider "local|google|facebook|apple"
        boolean is_verified
        boolean is_active
        varchar preferred_language
        jsonb addresses
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    STORES {
        uuid id PK
        varchar name_en
        varchar name_ar
        varchar slug UK
        text description_en
        text description_ar
        uuid owner_id FK
        varchar phone_primary
        varchar address
        varchar address_ar
        varchar governorate
        decimal lat
        decimal lng
        boolean is_verified
        enum status "pending|active|suspended|closed"
        enum subscription_tier "free|basic|premium|enterprise"
        decimal avg_rating
        int total_orders
        jsonb working_hours
        jsonb delivery_zones
        decimal wallet_balance
        decimal pending_balance
        timestamptz created_at
        timestamptz deleted_at
    }

    STORE_PRODUCTS {
        uuid id PK
        uuid store_id FK
        varchar part_id "MongoDB ref"
        varchar oem_number
        varchar name_en
        varchar name_ar
        varchar category
        varchar brand
        decimal price
        decimal original_price
        int stock
        enum condition "new|used|refurbished"
        enum status "active|out_of_stock|pending_review|rejected|draft"
        jsonb images
        jsonb compatible_cars
        decimal ai_category_confidence
        decimal ai_authenticity_score
        varchar ai_risk_level
        int view_count
        int order_count
        timestamptz created_at
        timestamptz deleted_at
    }

    PRICE_AUDIT_LOGS {
        uuid id PK
        uuid store_product_id FK
        decimal old_price
        decimal new_price
        int old_stock
        int new_stock
        uuid changed_by
        varchar change_reason
        varchar change_source "manual|bulk_import|api|ai_recommendation"
        timestamptz created_at
    }

    ORDERS {
        uuid id PK
        varchar order_number UK "VP-YYMMDD-XXXX"
        uuid customer_id FK
        uuid store_id FK
        enum status "pending|confirmed|paid|preparing|on_the_way|delivered|completed|cancelled|refunded"
        enum payment_method "fawry|vodafone_cash|paymob|cod|instapay"
        enum payment_status "pending|paid|failed|refunded|partially_refunded"
        varchar payment_reference
        decimal subtotal
        decimal delivery_fee
        decimal discount
        decimal total
        decimal commission_amount
        decimal commission_rate "0.06"
        decimal store_payout
        boolean commission_cleared
        enum delivery_method "delivery|pickup"
        jsonb delivery_address
        varchar idempotency_key UK
        int rating
        text review_text
        timestamptz created_at
        timestamptz deleted_at
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid store_product_id FK
        varchar product_name_en
        varchar product_name_ar
        varchar oem_number
        decimal unit_price
        int quantity
        decimal total_price
        varchar condition
    }

    ORDER_STATUS_HISTORY {
        uuid id PK
        uuid order_id FK
        enum from_status
        enum to_status
        uuid changed_by
        text change_reason
        jsonb metadata
        timestamptz created_at
    }

    COMMISSION_TRANSACTIONS {
        uuid id PK
        uuid order_id FK
        uuid store_id FK
        decimal amount
        decimal commission_amount
        decimal store_payout
        varchar status "held|cleared|transferred"
        timestamptz held_until
        timestamptz cleared_at
        timestamptz transferred_at
        timestamptz created_at
    }

    STORE_WALLET_TRANSACTIONS {
        uuid id PK
        uuid store_id FK
        varchar type "credit|debit|commission|refund|withdrawal"
        decimal amount
        decimal balance_after
        varchar reference_type
        uuid reference_id
        varchar description
        varchar description_ar
        timestamptz created_at
    }

    USER_CARS {
        uuid id PK
        uuid user_id FK
        varchar make
        varchar model
        int year
        varchar engine
        varchar vin
        varchar plate_number
        int mileage_km
        boolean is_primary
        timestamptz created_at
        timestamptz deleted_at
    }

    MAINTENANCE_RECORDS {
        uuid id PK
        uuid user_car_id FK
        varchar type
        text description
        int mileage_km
        decimal cost
        date performed_at
        date next_due_at
        uuid store_id
        uuid order_id
        timestamptz created_at
    }

    USERS ||--o{ STORES : "owns"
    USERS ||--o{ ORDERS : "places"
    USERS ||--o{ USER_CARS : "has"
    STORES ||--o{ STORE_PRODUCTS : "sells"
    STORES ||--o{ ORDERS : "receives"
    STORES ||--o{ COMMISSION_TRANSACTIONS : "earns"
    STORES ||--o{ STORE_WALLET_TRANSACTIONS : "has"
    STORE_PRODUCTS ||--o{ PRICE_AUDIT_LOGS : "tracks"
    STORE_PRODUCTS ||--o{ ORDER_ITEMS : "ordered_as"
    ORDERS ||--o{ ORDER_ITEMS : "contains"
    ORDERS ||--o{ ORDER_STATUS_HISTORY : "tracks"
    ORDERS ||--o{ COMMISSION_TRANSACTIONS : "generates"
    USER_CARS ||--o{ MAINTENANCE_RECORDS : "has"
```

## MongoDB Collections (Flexible Schema)

### car_parts Collection
```json
{
  "_id": "ObjectId",
  "oemNumber": "string (unique, indexed)",
  "nameAr": "string (text indexed, weight: 10)",
  "nameEn": "string (text indexed, weight: 8)",
  "descriptionAr": "string (text indexed)",
  "category": "enum (indexed)",
  "subcategory": "string",
  "brand": "string (indexed)",
  "alternativeOemNumbers": ["string"],
  "crossReferenceNumbers": ["string"],
  "compatibleCars": [{
    "make": "string",
    "model": "string",
    "yearFrom": "number",
    "yearTo": "number",
    "engine": "string"
  }],
  "images": ["string"],
  "specifications": {
    "weight": "number",
    "dimensions": "object"
  },
  "additionalAttributes": "Map<string, string>",
  "tags": ["string"],
  "tagsAr": ["string"],
  "marketMedianPrice": "number (indexed)",
  "totalListings": "number",
  "isActive": "boolean"
}
```

### car_compatibility Collection
```json
{
  "_id": "ObjectId",
  "make": "string (indexed)",
  "makeAr": "string",
  "model": "string (indexed)",
  "modelAr": "string",
  "yearFrom": "number",
  "yearTo": "number",
  "engine": "string",
  "fuelType": "string",
  "transmission": "string",
  "bodyType": "string",
  "partIds": ["ObjectId (indexed)"],
  "partsByCategory": "Map<string, [ObjectId]>"
}
```

## Index Strategy

### PostgreSQL Indexes
| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| users | idx_users_email | UNIQUE (partial) | Login lookup |
| users | idx_users_phone | UNIQUE (partial) | Phone login |
| users | idx_users_role | B-tree | Role filtering |
| stores | idx_stores_slug | UNIQUE (partial) | URL lookup |
| stores | idx_stores_governorate | B-tree | Location filter |
| stores | idx_stores_location | B-tree (lat,lng) | Geo queries |
| store_products | idx_store_products_store_part_condition | UNIQUE (partial) | Prevent duplicates |
| store_products | idx_store_products_name_ar_trgm | GIN (pg_trgm) | Arabic fuzzy search |
| store_products | idx_store_products_name_en_trgm | GIN (pg_trgm) | English fuzzy search |
| store_products | idx_store_products_oem | B-tree | OEM lookup |
| orders | idx_orders_order_number | UNIQUE | Order lookup |
| orders | idx_orders_idempotency | UNIQUE (partial) | Idempotency |
| orders | idx_orders_created | B-tree | Time queries |
| price_audit_logs | idx_price_audit_created | B-tree | Audit timeline |

### MongoDB Indexes
| Collection | Index | Type | Purpose |
|------------|-------|------|---------|
| car_parts | text_search_index | Text (weighted) | Arabic full-text search |
| car_parts | compatibleCars compound | Compound | Car compatibility lookup |
| car_parts | category + brand | Compound | Category browsing |
| car_compatibility | make + model + year | Compound UNIQUE | Car lookup |
