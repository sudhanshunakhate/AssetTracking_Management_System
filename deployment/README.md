# CAITS — Tomcat production deployment

Single-context deploy: one **ROOT.war** embeds the React SPA and the Spring Boot API.

```text
Browser  →  Apache Tomcat :8080 (ROOT)
              ├── SPA static  (/ , /login , /dashboard , …)
              └── API         (/api/v1/** , /ws)
                    └── PostgreSQL
```

Same-origin relative API base: `/api/v1` (no hardcoded host).

---

## Prerequisites

| Component | Version / notes |
|-----------|-----------------|
| **Java** | **21** (build and runtime) |
| **Node.js** | **20+** (build machine only; not required on server) |
| **npm** | comes with Node (project uses npm) |
| **Maven** | 3.9+ (`mvn` on PATH) |
| **Tomcat** | **10.1.x** (Jakarta EE 9+ / Servlet 5+) — required for Spring Boot 3 |
| **Database** | PostgreSQL reachable from the server (`CAITS_DB=1` → schema `caits_local`, `CAITS_DB=2` → schema `caits`) |

Do **not** use Tomcat 9 (javax). Spring Boot 3.3.5 uses **jakarta.***.

Local reference install used for testing:

```text
C:\Program Files\apache-tomcat-10.1.50
```

---

## Architecture choice

Frontend production files are copied into the WAR (`classpath:/static`) at Maven package time. Deploying **only** `ROOT.war` to Tomcat’s `webapps/` is enough — you do not need a separate `webapps/ROOT` static folder unless you prefer that for ops reasons.

| Artifact | Role |
|----------|------|
| `backend/target/ROOT.war` | Deployable app (SPA + API) |
| `frontend/dist/` | Intermediate Vite build (also copied under `deployment/frontend/`) |

Context path: **`/`** (ROOT).  
API base: **`http://<host>:8080/api/v1`**.  
SPA deep links (e.g. `/login`, `/dashboard`) are forwarded to `index.html` by `SpaForwardController` without stealing `/api/**` or `/assets/**`.

---

## Build (developer / build machine)

From the repo root on Windows:

```powershell
cd D:\AssetTracking_Management_System\deployment\scripts
.\build-all.ps1
```

Or manually:

```powershell
cd D:\AssetTracking_Management_System\frontend
npm ci   # or: npm install
npm run build

cd ..\backend
mvn clean package -DskipTests
```

### Build outputs

```text
Frontend:  <repo>\frontend\dist\
Backend:   <repo>\backend\target\ROOT.war
Package:   <repo>\deployment\frontend\   (static copy)
           <repo>\deployment\backend\ROOT.war
```

Node.js is **not** required on the production server if you hand over the WAR (or `deployment/` package).

---

## Configure Tomcat

1. Install **JDK 21** and **Tomcat 10.1.x**.
2. Set `CATALINA_HOME` (or use the full path to Tomcat).
3. Copy `deployment/config/setenv.bat.example` → `%CATALINA_HOME%\bin\setenv.bat` (Windows)  
   or `setenv.sh.example` → `$CATALINA_HOME/bin/setenv.sh` (Linux), then edit placeholders.
4. Ensure Postgres is reachable and credentials match your profile / JDBC overrides.
5. Create upload and log directories from `CAITS_STORAGE_UPLOAD_DIR` / `CAITS_LOG_FILE`.

See `deployment/config/environment.example` for the full variable list (no secrets committed).

### Important variables

| Variable | Purpose |
|----------|---------|
| `CAITS_DB` | `1` = `caits_local`, `2` = `caits` (default) |
| `CAITS_SECURITY_JWT_SECRET` | JWT signing secret (32+ chars) |
| `CAITS_SECURITY_FIELD_ENCRYPTION_KEY` | Field encryption key material |
| `CAITS_SECURITY_COOKIE_SECURE` | `true` behind HTTPS |
| `CAITS_SECURITY_COOKIE_SAME_SITE` | e.g. `Lax` or `Strict` |
| `CAITS_CORS_ALLOWED_ORIGINS` | Comma-separated origins if not same-origin only |
| `CAITS_STORAGE_UPLOAD_DIR` | Absolute upload path |
| `CAITS_LOG_FILE` | Absolute log file path |
| `SPRING_DATASOURCE_*` | Optional JDBC URL / user / password overrides |

---

## Deploy to local Tomcat (test)

```powershell
$env:CATALINA_HOME = "C:\Program Files\apache-tomcat-10.1.50"
cd D:\AssetTracking_Management_System\deployment\scripts
.\deploy-tomcat.ps1
```

Or manually:

```powershell
$env:CATALINA_HOME = "C:\Program Files\apache-tomcat-10.1.50"
& "$env:CATALINA_HOME\bin\shutdown.bat"
# wait a few seconds
Remove-Item "$env:CATALINA_HOME\webapps\ROOT" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$env:CATALINA_HOME\webapps\ROOT.war" -Force -ErrorAction SilentlyContinue
Copy-Item D:\AssetTracking_Management_System\backend\target\ROOT.war "$env:CATALINA_HOME\webapps\ROOT.war"
& "$env:CATALINA_HOME\bin\startup.bat"
```

### Start / stop (Windows)

```powershell
& "$env:CATALINA_HOME\bin\startup.bat"
& "$env:CATALINA_HOME\bin\shutdown.bat"
```

### Start / stop (Linux)

```bash
$CATALINA_HOME/bin/startup.sh
$CATALINA_HOME/bin/shutdown.sh
```

Logs: `$CATALINA_HOME/logs/catalina.*.log` and `CAITS_LOG_FILE`.

---

## Tomcat layout after deploy

```text
$CATALINA_HOME/webapps/
  ROOT.war          ← deployed artifact
  ROOT/             ← exploded by Tomcat (auto)
    WEB-INF/
    ...
```

Optional separate static frontend is **not** required when using this WAR.

---

## URLs (local test)

| What | URL |
|------|-----|
| App / SPA | http://localhost:8080/ |
| Login | http://localhost:8080/login |
| Dashboard | http://localhost:8080/dashboard |
| CSRF | http://localhost:8080/api/v1/auth/csrf |
| Public key | http://localhost:8080/api/v1/auth/public-key |
| Session | http://localhost:8080/api/v1/auth/me |

Quick checks:

```powershell
Invoke-WebRequest http://localhost:8080/api/v1/auth/public-key -UseBasicParsing
Invoke-WebRequest http://localhost:8080/login -UseBasicParsing
```

---

## Handing the build to a server admin

### Build machine

1. Run `deployment/scripts/build-all.ps1` (or manual frontend + backend build).
2. Optionally refresh `deployment/frontend` and `deployment/backend/ROOT.war`.
3. Zip and transfer **`deployment/`** (or at least `backend/ROOT.war` + `config/*`).
4. Do **not** include real passwords, JWT secrets, or `.env` files with production values.

### Server machine

1. Install **Java 21** + **Tomcat 10.1.x** only (no Node required).
2. Configure `setenv` / environment from the examples.
3. Copy `ROOT.war` → `$CATALINA_HOME/webapps/ROOT.war`.
4. Start Tomcat; open `http://<server>:8080/`.
5. Confirm Postgres connectivity and smoke-test login.

---

## Local development (unchanged)

Dev still uses Vite + embedded Spring Boot:

```powershell
# Terminal 1 — API on :8085
cd backend
mvn spring-boot:run

# Terminal 2 — UI on :5173 (proxies /api to backend)
cd frontend
npm run dev
```

Stop `spring-boot:run` before packaging if `backend/target` is locked.

---

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| API returns “No static resource api/…” | Stale WAR with catch-all static handler — `mvn clean package`, redeploy |
| `/login` 500 after deploy | SPA forward matching `index.html` (fixed in `SpaForwardController`) |
| WAR won’t clean/build | Kill Java/Tomcat holding `backend/target` |
| DB validate fails on startup | Schema behind migrations — sync DB per project migration rules |
| CORS errors | Add browser origin to `CAITS_CORS_ALLOWED_ORIGINS` |
| Cookies missing on HTTPS | Set `CAITS_SECURITY_COOKIE_SECURE=true` |
