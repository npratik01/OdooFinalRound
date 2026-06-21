# Mini ERP Backend — Phase 1

Production-grade ERP REST API built with Node.js, Express, and MongoDB.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# 3. Seed initial data (admin user + sample products)
npm run seed

# 4. Start development server
npm run dev
```

## Default Credentials (after seeding)

| Email | Password | Role |
|-------|----------|------|
| admin@erp.com | Admin@1234 | ADMIN |
| owner1@erp.com | Owner@1234 | BUSINESS_OWNER |
| inv1@erp.com | Inv@1234 | INVENTORY_MANAGER |

## API Base URL

```
http://localhost:5000/api
```

## Modules (Phase 1)

- `POST /api/auth/login` — Login
- `GET  /api/auth/me` — Current user
- `POST /api/auth/logout` — Logout
- `GET/POST/PATCH/DELETE /api/users` — User management (ADMIN)
- `GET/POST/PATCH/DELETE /api/products` — Product management
- `GET/PATCH /api/inventory` — Inventory management
- `GET /api/dashboard/stats` — Dashboard KPIs
- `GET /api/dashboard/inventory-status` — Inventory breakdown

## Architecture

```
server.js           → HTTP server entry
app.js              → Express app + middleware stack
src/config/         → Database connection
src/constants/      → Roles, permissions, enums
src/models/         → Mongoose ODM models
src/middleware/     → Auth, RBAC, validation, error handling
src/validators/     → Joi schemas
src/services/       → Business logic layer
src/controllers/    → HTTP request/response handlers
src/routes/         → Express route definitions
src/utils/          → Shared helpers
seeders/            → Database seeding scripts
```
