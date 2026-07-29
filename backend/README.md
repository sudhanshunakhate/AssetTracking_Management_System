# CAITS Backend

Java 21 + Spring Boot 3.3 API for the Centralized Asset and Inventory Tracking System.

## Run

```bash
cd backend
mvn spring-boot:run
```

API base: `http://localhost:8080/api/v1`

## Demo login (seeded on first start)

- Login ID: `aditya.kulkarni`
- Password: `Admin@123`

## Database

Uses PostgreSQL schema `caits_local` (see `application.yml`).

## Layout

```
com.caits
  common/           PageResponse, ApiException, handlers
  config/           DataSeeder
  security/         JWT + Spring Security
  domain/entity     JPA entities (1:1 with DB tables)
  domain/repository Spring Data repos
  modules/auth      Login / me / password
  modules/masters   Master CRUD APIs
  modules/transactions  Shared txn_header/detail APIs
  modules/reports   Stock register + full report
  modules/dashboard Summary KPIs
```
