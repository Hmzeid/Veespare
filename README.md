# 🚗 VeeParts — Multi-Tenant Car Spare Parts Marketplace

> **Egypt's premier AI-powered car spare parts marketplace** — connecting customers with spare parts stores across all 27 governorates.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D20-green.svg)
![Python](https://img.shields.io/badge/python-3.11-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.3-blue.svg)

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Backend API](#backend-api)
- [Mobile App](#mobile-app)
- [AI Microservice](#ai-microservice)
- [Store Dashboard](#store-dashboard)
- [Database Schema](#database-schema)
- [Payment Integration](#payment-integration)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Overview

VeeParts is a full-stack, multi-tenant marketplace platform designed specifically for the Egyptian car spare parts market. It features:

- **Arabic-first design** — RTL layout, Cairo font, Egyptian Arabic dialect support
- **AI-powered classification** — Automatic categorization of car parts using Arabic NLP (AraBERT)
- **Counterfeit detection** — ResNet-50 based image analysis to detect potentially fake parts
- **Smart search** — Egyptian Arabic dialect processing with synonym expansion and typo correction
- **Multi-store support** — Store owners manage inventory, pricing, and orders independently
- **Price comparison** — Customers compare prices for the same part across multiple stores
- **Egyptian payment gateways** — Fawry, Vodafone Cash, Paymob (cards), InstaPay, COD
- **Commission engine** — Automated 6% commission with 48hr escrow and monthly invoicing

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Mobile App   │  │  Dashboard   │  │   Admin Panel        │   │
│  │ React Native  │  │  Next.js 14  │  │   (Future)           │   │
│  │ + Expo        │  │  RTL Arabic  │  │                      │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
│         │                  │                      │              │
└─────────┼──────────────────┼──────────────────────┼──────────────┘
          │                  │                      │
          ▼                  ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              NestJS Backend (Node.js)                     │   │
│  │  ┌──────┐ ┌──────┐ ┌───────┐ ┌────────┐ ┌───────────┐  │   │
│  │  │ Auth │ │Users │ │Stores │ │Products│ │  Orders   │  │   │
│  │  └──────┘ └──────┘ └───────┘ └────────┘ └───────────┘  │   │
│  │  ┌──────┐ ┌──────────┐ ┌───────────┐ ┌──────────────┐  │   │
│  │  │Search│ │ Payments │ │Commission │ │  WebSocket   │  │   │
│  │  └──────┘ └──────────┘ └───────────┘ └──────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────┬──────────────────┬──────────────────┬──────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐
│  PostgreSQL  │  │   MongoDB    │  │    AI Microservice        │
│  (Core Data) │  │  (Catalog)   │  │    (FastAPI + PyTorch)    │
│  - Users     │  │  - Car Parts │  │  - Parts Classifier       │
│  - Stores    │  │  - Compat.   │  │  - Counterfeit Detector   │
│  - Orders    │  │  - 500k+     │  │  - Arabic Search          │
│  - Products  │  │    parts     │  │    Enhancement            │
└──────────────┘  └──────────────┘  └──────────────────────────┘
          │
    ┌─────┴─────┐
    │           │
┌───▼───┐ ┌───▼──────────┐
│ Redis │ │Elasticsearch │
│(Cache)│ │(Arabic FTS)  │
└───────┘ └──────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend API** | Node.js, NestJS, TypeScript, TypeORM |
| **Mobile App** | React Native, Expo, NativeWind, React Query, Zustand |
| **AI Service** | Python 3.11, FastAPI, PyTorch, Transformers, AraBERT |
| **Dashboard** | Next.js 14, React, TailwindCSS, Recharts |
| **PostgreSQL** | Core relational data (users, stores, orders, products) |
| **MongoDB** | Car parts catalog (flexible schema, 500k+ parts) |
| **Redis** | Caching product listings, search results, sessions |
| **Elasticsearch** | Arabic full-text search with analyzers |
| **WebSocket** | Real-time order notifications (Socket.IO) |
| **Payments** | Fawry, Vodafone Cash, Paymob, InstaPay, COD |

---

## Project Structure

```
Veespare/
├── backend/                    # NestJS API server
│   ├── src/
│   │   ├── common/            # Shared decorators, guards, pipes
│   │   ├── config/            # Database & app configuration
│   │   ├── database/          # Migrations & seeds
│   │   ├── modules/
│   │   │   ├── auth/          # JWT authentication
│   │   │   ├── users/         # User management
│   │   │   ├── stores/        # Store CRUD & management
│   │   │   ├── store-products/# Product listings & price audit
│   │   │   ├── orders/        # Order lifecycle & WebSocket
│   │   │   ├── car-parts/     # MongoDB car parts catalog
│   │   │   ├── search/        # Elasticsearch integration
│   │   │   ├── payments/      # Payment gateway providers
│   │   │   └── commission/    # Commission & wallet engine
│   │   └── schemas/           # MongoDB Mongoose schemas
│   └── Dockerfile
├── mobile/                    # React Native + Expo app
│   ├── src/
│   │   ├── screens/           # All app screens
│   │   ├── components/        # Reusable UI components
│   │   ├── navigation/        # React Navigation setup
│   │   ├── store/             # Zustand state management
│   │   ├── hooks/             # React Query hooks
│   │   ├── services/          # API client
│   │   ├── i18n/              # Arabic/English translations
│   │   └── constants/         # Theme, colors, categories
│   └── App.tsx
├── ai-service/                # Python AI microservice
│   ├── app/
│   │   ├── api/               # FastAPI route handlers
│   │   ├── services/          # Classification, counterfeit, search
│   │   ├── models/            # Pydantic schemas
│   │   ├── utils/             # Arabic NLP utilities
│   │   └── core/              # Configuration
│   ├── Dockerfile
│   └── requirements.txt
├── dashboard/                 # Next.js 14 store dashboard
│   ├── src/
│   │   ├── app/               # App router pages
│   │   ├── components/        # Dashboard UI components
│   │   ├── i18n/              # Arabic/English translations
│   │   ├── lib/               # API client
│   │   └── store/             # Zustand state
│   └── Dockerfile
├── docs/                      # Documentation & ERD
├── docker-compose.yml         # Full development stack
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js >= 20
- Python >= 3.11
- Docker & Docker Compose
- PostgreSQL 16 (or via Docker)
- MongoDB 7 (or via Docker)
- Redis 7 (or via Docker)

### Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/your-username/veeparts.git
cd veeparts

# Copy environment files
cp backend/.env.example backend/.env

# Start all services
docker-compose up -d

# Run database migrations
docker-compose exec backend npm run migration:run

# Seed sample data
docker-compose exec backend npm run seed

# Services are now available:
# Backend API:  http://localhost:3000
# Swagger Docs: http://localhost:3000/docs
# Dashboard:    http://localhost:3001
# AI Service:   http://localhost:8000
```

### Manual Setup

#### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run migration:run
npm run seed
npm run start:dev
```

#### Mobile App
```bash
cd mobile
npm install
npx expo start
```

#### AI Service
```bash
cd ai-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### Dashboard
```bash
cd dashboard
npm install
npm run dev
```

---

## Backend API

### Authentication
- `POST /api/v1/auth/register` — Register new user (customer/store_owner)
- `POST /api/v1/auth/login` — Login with email/phone + password
- `POST /api/v1/auth/refresh` — Refresh JWT token

### Users
- `GET /api/v1/users/profile` — Get current user profile
- `PATCH /api/v1/users/profile` — Update profile
- `POST /api/v1/users/addresses` — Add delivery address

### Stores
- `GET /api/v1/stores` — List stores (filter by governorate, rating)
- `GET /api/v1/stores/:slug` — Get store by slug
- `POST /api/v1/stores` — Create store (store_owner role)
- `PATCH /api/v1/stores/:id` — Update store

### Products
- `GET /api/v1/store-products` — List products (filter, sort, paginate)
- `GET /api/v1/store-products/:id` — Product detail
- `GET /api/v1/store-products/:id/price-comparison` — Compare prices across stores
- `POST /api/v1/store-products` — Add product (auto-triggers AI classification)
- `POST /api/v1/store-products/bulk-import` — CSV bulk import

### Orders
- `POST /api/v1/orders` — Place order (idempotency key required)
- `GET /api/v1/orders` — List orders (customer/store views)
- `PATCH /api/v1/orders/:id/status` — Update order status
- WebSocket: `ws://localhost:3000` — Real-time order notifications

### Search
- `GET /api/v1/search/products` — Search with Arabic full-text
- `GET /api/v1/search/autocomplete` — Search autocomplete

### Payments
- `POST /api/v1/payments/initiate` — Start payment flow
- `POST /api/v1/payments/webhook/paymob` — Paymob callback
- `POST /api/v1/payments/webhook/fawry` — Fawry callback

Full API documentation available at `http://localhost:3000/docs` (Swagger UI).

---

## Mobile App

### Screens

| Screen | Description |
|--------|-------------|
| **Onboarding** | 3 Arabic slides explaining platform benefits |
| **Home** | Search bar, car selector, categories, featured parts |
| **Search Results** | Grid/list view, filters (price, condition, rating) |
| **Product Detail** | Image gallery, price comparison, AI authenticity badge |
| **Store Profile** | Store info, products, reviews, map location |
| **Cart & Checkout** | Item management, delivery/pickup, payment selection |
| **Order Tracking** | Real-time status timeline |
| **My Garage** | User's cars, maintenance history, part recommendations |

### Key Features
- Arabic-first RTL layout with Cairo font
- Offline-capable with React Query caching
- Egyptian payment deep links (Fawry, Vodafone Cash)
- Push notifications for order updates
- Car make/model/year selector for compatibility search

---

## AI Microservice

### Service 1: Parts Classifier (`POST /api/v1/classify/`)
Classifies car parts from Arabic/English product names and images.
- Category classification with confidence score
- Compatible car detection
- OEM number extraction and validation
- Auto-reject if confidence < 0.4

### Service 2: Counterfeit Detection (`POST /api/v1/counterfeit/check`)
Analyzes product images for counterfeit indicators.
- ResNet-50 feature extraction
- Cosine similarity with authentic part database
- Price anomaly detection (60%+ below market = suspicious)
- Risk level: low/medium/high

### Service 3: Arabic Search Enhancement (`POST /api/v1/search/enhance`)
Processes Egyptian Arabic dialect queries.
- Tashkeel removal and hamza/alef normalization
- Egyptian dialect → standard Arabic mapping
- 100+ car parts synonym pairs (e.g., "فلتر" = "oil filter")
- Common typo correction
- Arabic → English term mapping

---

## Store Dashboard

### Pages
- **Dashboard Home** — Today's stats, recent orders, alerts
- **Inventory Manager** — Product CRUD, CSV bulk upload, AI categorization
- **Orders Kanban** — Drag-and-drop order management
- **Pricing Intelligence** — Market comparison, AI recommendations
- **Analytics** — Revenue charts, bestsellers, customer locations
- **Store Profile** — Edit info, working hours, delivery zones

---

## Database Schema

### PostgreSQL (Relational Data)
- **users** — Customers, store owners, admins (UUID PK, soft delete)
- **stores** — Multi-tenant stores with wallet, location, subscription
- **store_products** — Product listings with price, stock, AI scores
- **price_audit_logs** — Complete audit trail for all price changes
- **orders** — Full order lifecycle with idempotency
- **order_items** — Line items per order
- **order_status_history** — Status change tracking
- **commission_transactions** — Commission escrow and clearing
- **store_wallet_transactions** — Wallet credit/debit history
- **user_cars** — User's car garage
- **maintenance_records** — Car maintenance history

### MongoDB (Flexible Catalog)
- **car_parts** — 500k+ parts with weighted Arabic text search
- **car_compatibility** — Make/model/year/engine → parts mapping

### Key Design Decisions
- UUID primary keys everywhere
- Soft delete pattern (`deleted_at` column)
- GIN indexes with `pg_trgm` for Arabic fuzzy search
- JSONB for flexible data (addresses, delivery zones, compatible cars)
- All prices in EGP with 2 decimal precision
- Full audit logs for price changes

See [docs/ERD.md](docs/ERD.md) for the complete Entity Relationship Diagram.

---

## Payment Integration

### Supported Methods (Egypt)

| Method | Type | Flow |
|--------|------|------|
| **Fawry** | Reference | Generate code → Customer pays at Fawry outlet → Webhook |
| **Vodafone Cash** | Mobile Wallet | Deep link → App-to-app → Callback |
| **Paymob** | Card (Visa/MC) | Payment key → iFrame → 3DS → Webhook |
| **InstaPay** | Bank Transfer | IPN webhook on transfer |
| **Cash on Delivery** | COD | Optional deposit → Full payment on delivery |

### Commission Engine
- **Rate**: 6% of order subtotal (excluding delivery fees)
- **Escrow**: Funds held for 48 hours after delivery confirmation
- **Clearing**: Auto-transfer to store wallet after hold period
- **Refunds**: Full/partial with automatic commission reversal
- **Invoicing**: Monthly Arabic tax-compliant invoices per store

---

## Deployment

### Environment Variables

See `backend/.env.example` for all required environment variables.

### Production Checklist
- [ ] Set strong `JWT_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Configure production PostgreSQL with SSL
- [ ] Set up MongoDB replica set
- [ ] Configure Redis password
- [ ] Set up Elasticsearch cluster
- [ ] Configure Paymob production credentials
- [ ] Configure Fawry production merchant code
- [ ] Set up S3 bucket for image storage
- [ ] Configure CDN for static assets
- [ ] Set up monitoring (Prometheus + Grafana)
- [ ] Configure rate limiting
- [ ] Enable CORS for production domains only

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgements

- [AraBERT](https://github.com/aub-mind/arabert) — Arabic BERT model for NLP
- [CAMeL Tools](https://github.com/CAMeL-Lab/camel_tools) — Arabic NLP toolkit
- [NestJS](https://nestjs.com/) — Progressive Node.js framework
- [Expo](https://expo.dev/) — React Native development platform

---

<div align="center">
  <strong>Built for Egypt 🇪🇬 | Arabic-First Design | AI-Powered</strong>
</div>
