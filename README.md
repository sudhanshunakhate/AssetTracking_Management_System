# CAITS

**Centralized Asset and Inventory Tracking System**

## Stack

| Layer | Technology |
|-------|------------|
| UI (Phase 1–2) | React 19, Vite, TypeScript, Tailwind CSS 4 |
| Planned API | Java 21 |
| Planned DB | PostgreSQL |

## Run the UI

```bash
cd frontend
npm install
npm run dev
```

Open the printed local URL. Demo login: any password works (prefilled `aditya.kulkarni`).

## Phase 1 + 2 scope

- Attractive login (React Bits accents)
- App shell (sidebar / topbar) — **no icons**
- Dashboard
- All Master list + form screens
- Transactions: Opening Stock, Requisitions, GRN, Gatepass, Issue, Transfer, Return
- Reports: Stock Register, Full Report
- Mock data only — **no API or database yet**

Java 21 + PostgreSQL come in a later phase.

## Folder map

```
frontend/src/
  components/{layout,ui,react-bits}
  features/{auth,dashboard,masters,transactions,reports}
  config/  data/mock/  styles/
metadata/          AI agent map (index + features)
wireframe/         Source HTML wireframe
```
