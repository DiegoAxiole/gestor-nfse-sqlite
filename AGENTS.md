# AGENTS.md — Gestor NFSe

NFSe manager: **Express (Node.js) backend** + **React 19 frontend**. Self-managed auth (bcrypt + JWT). Drizzle ORM + PostgreSQL.

**⚠️ Stale frontend routes:** `frontend/src/api.ts` references `/automacao/*` (agendar, agendamentos, logs), but `backend/src/modules/automacao/` is **empty** and no routes are registered in `app.ts`. These API calls will **404**.

## Quick links

| File | Purpose |
|------|---------|
| `backend/src/app.ts` | Express app wiring, route registration, static file serving |
| `backend/src/index.ts` | Entrypoint, port 8001, `127.0.0.1` |
| `backend/src/config.ts` | Env vars: `DATABASE_URL`, `JWT_SECRET`, `AMBIENTE`, `CODIGO_MUNICIPIO` |
| `backend/src/db/schema.ts` | 12 Drizzle tables |
| `backend/vendor/consulta-nfse-api-node/` | SEFAZ client lib (vendored, not npm) |
| `frontend/vite.config.ts` | Port 3000, proxy `/api` → `:8001`, `@/` alias → `frontend/` root, **`outDir` → `../backend/public/`** |
| `frontend/src/api.ts` | All API calls + adapter functions |
| `frontend/src/services/xml-parser.ts` | Client-side NFSe XML parsing (DOMParser + regex fallback) |

## Build order

1. `danfse-pdf-generator` (local dep `file:../../danfse-pdf-generator`): `cd danfse-pdf-generator && npm run build`
2. Backend: `cd backend && npm install && npm run build`
3. Frontend: `cd frontend && npm install && npm run build` — outputs to `../backend/public/`
4. DB: `npm run db:push` then `npm run seed` (creates `admin@gestornfse.com` / `admin123`, 30-day trial)

## Commands

| Context | Command | Notes |
|---------|---------|-------|
| Backend dev | `npm run dev` | `tsx watch src/index.ts`, hot-reload |
| Backend build | `npm run build` | `tsc`, outputs to `backend/dist/` |
| Backend prod | `npm run start` | `node dist/index.js` |
| Backend typecheck | `npm run typecheck` | `tsc --noEmit` |
| Backend test | `npm run test` | vitest (71 tests, 9 suites) |
| DB generate | `npm run db:generate` | drizzle-kit generate |
| DB push | `npm run db:push` | sync schema directly to DB |
| DB migrate | `npm run db:migrate` | run pending migrations |
| Seed | `npm run seed` | **must run after db:push** |
| Frontend dev | `npm run dev` | vite, port 3000 |
| Frontend typecheck | `npm run lint` | `tsc --noEmit` |
| Both dev servers | `dev.bat` (cmd) or `dev.ps1` (PowerShell) | kills old processes on ports 8001/3000 |

## API

All routes under `/api/v1/`. JWT required except `/auth/*` and `/health`.
Subscription middleware returns **402** if expired (blocks all routes except `/auth`, `/subscription`).

| Module | Routes | Auth |
|--------|--------|------|
| **Health** | `GET /health` | None |
| **Auth** | `POST /auth/login`, `POST /auth/cadastrar` | None |
| **Prestadores** | `GET/POST /prestadores` (POST: multipart c/ PFX), `GET/PUT/DELETE /.../:cnpj` | JWT |
| **Config** | `GET/PUT /config` | JWT |
| **Tenant** | `GET/PUT /tenant` | JWT |
| **Usuários** | `GET/POST /usuarios`, `PATCH /.../:id/papel`, `DELETE /.../:id` | JWT (admin-only for PATCH/DELETE) |
| **Distribuição** | `POST /distribuicao/consultar` → returns `task_id` | JWT |
| **Tasks** | `GET /tasks/{task_id}` (poll background task) | JWT |
| **Documentos** | `GET /documentos`, `GET .../{chave}/xml\|pdf`, `GET .../download-zip` | JWT |
| **Subscription** | `GET /subscription`, `POST /.../cancelar`, `POST /.../upgrade` | JWT |
| **Operações** | `GET /operacoes` | JWT |
| **Admin** | `PATCH /admin/tenants/:id/limits` | JWT + adminMiddleware |
| **Webhooks** | `POST /webhooks/asaas` | **No auth** (webhook secret validation in billing.config) |

## Key conventions

- **Module pattern:** factory functions (`criarRouter*`) called from `app.ts`, receive config values where needed
- **4-layer pattern** in `prestadores/` only: routes → controller → service → repository. Other modules are flatter (routes may call repository/service directly)
- **Zod v4** request validation in route/controller files
- **Custom error hierarchy:** `AppError` → `NotFoundError` (404), `ValidationError` (422), `ConflictError` (409)
- **Auth:** `authMiddleware` sets `req.tenantId`, `req.usuarioId`, `req.papel`; `adminMiddleware` checks `papel === 'admin'`
- **CNPJ** digits-only (14 chars), chave de acesso 44 or 50 digits — `validators.ts`
- **Multer** memory storage for PFX certificate uploads (`multipart/form-data`, not JSON)
- **PFX certificates** stored as `bytea` in `prestadores` table
- **Multi-tenant:** all tables scoped by `tenant_id`
- **LGPD masking utils:** `formatCnpj`, `maskRazao`, `maskChave`, `maskEmail` in `frontend/src/utils.ts`
- **EOL:** LF for `.ts/.tsx/.json/.yml/.md`, CRLF for `.bat/.ps1/.cmd` (via `.gitattributes`)
- **HTTP logging** to `data/http.log` (sensitive fields redacted before writing)
- `scripts/`, `start.bat`, `install.bat` are CI-generated, not in repo
- `data/` is gitignored, created at runtime for logs

## Known issues & gotchas

- **DANFSe PDF:** generated on-demand via `danfse-pdf-generator` (`parseNfseXml` + `generateDanfsePdf`). No `pdf_blob` storage. Backend reads `?lgpd=true` query param and passes `lgpdAtivo` to the generator. `pdf_blob` column still exists in schema but is **unused**.
- **pdfmake warning fix:** `setUrlAccessPolicy(() => true)` and `setLocalAccessPolicy(() => true)` must be **callback functions**, not strings. Don't use `() => false` (breaks local font loading).
- **Frontend LGPD flow:** `lgpdAtivo` comes from `ProtectedLayout` state, fetched from `GET /config`, passed via OutletContext to child views.
- **Query URL:** no PDF generation — just `https://www.nfse.gov.br/ConsultaPublica/?tpc=1&chave=<chave>`.
- **Asaas sandbox:** `billing/billing.config.ts` uses `baseUrl` and `apiKey` from env (sandbox/production switch).
- **plan-limits admin:** `PATCH /api/v1/admin/tenants/:id/limits` allows overriding plan limits per tenant (`prestadores_max`, `documentos_mes_max`, `usuarios_max`, `lote_zip`).
