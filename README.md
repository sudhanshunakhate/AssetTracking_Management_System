# CAITS

**Centralized Asset and Inventory Tracking System**

## Stack

| Layer | Technology |
|-------|------------|
| UI | React 19, Vite, TypeScript, Tailwind CSS 4 |
| API | Java 21, Spring Boot 3.3, JWT |
| DB | PostgreSQL schema `caits_local` |

## Run backend

```bash
cd backend
mvn spring-boot:run
```

API: `http://localhost:8081/api/v1`

Seeded login (first start):

- Login ID: `aditya.kulkarni`
- Password: `Admin@123`

## Run UI

```bash
cd frontend
npm install
npm run dev
```

Vite proxies `/api` → `http://localhost:8081`. Auth and Unit/Category masters call the live API; other screens still use mock data until wired the same way.

## Backend layout

```
backend/src/main/java/com/caits/
  modules/auth|masters|transactions|reports|dashboard
  domain/entity|repository
  security/  config/  common/
```

API contract source: `backend_approach/CAIMS_API_Documentation.xlsx`  
DB design source: `db_approach/`

## Phase status

- Phase 1–2 UI complete
- PostgreSQL schema `caits_local` created
- Backend APIs implemented for auth, masters, transactions, reports, dashboard
- UI ↔ API: login + units + categories live; remaining masters/transactions can reuse the same `api/` helpers
