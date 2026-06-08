# AGENTS.md — Gestor NFSe

Express + React 19 + Drizzle ORM + SQLite (better-sqlite3). JWT auth. Multi-tenant.

## Init (`/init`)

`/init` carrega **codegraph + agentmemory**. Só depois leia este arquivo.

## Priority (OBRIGATÓRIO)

1. **`agentmemory_recall`** — contexto de sessões anteriores
2. **`codegraph_explore`** — arquitetura, símbolos, fluxo
3. **`codegraph_search` / `codegraph_impact`** — buscar/refatorar
4. **Glob / Grep / Read** — **ÚLTIMO RECURSO.** Só se codegraph não deu conta.

**REGRA ABSOLUTA:** codegraph resolve 95%+ dos casos. Glob/Read são EXCEÇÃO — se você pensar em usar Glob ou Read, primeiro prove que codegraph não resolve.

**PROIBIDO usar Glob, Grep ou Read sem antes ter tentado codegraph_explore e constatado que não resolveu.** Se você usou Glob/Read sem codegraph primeiro, está ERRADO. ponto final.

## Env (`backend/.env`)
Obrigatórios: `DATABASE_URL`, `JWT_SECRET`, `AMBIENTE` (Homologacao|Producao), `CODIGO_MUNICIPIO`. Opcionais: `ASAAS_API_KEY`, `ASAAS_WEBHOOK_SECRET`, `ASAAS_SANDBOX`. Arquivo `config.toml` é legado — a config real vem de `.env` via `config.ts:carregarConfig()`.

## Build order
1. `../danfse-pdf-generator`: `npm run build` (dependência local `file:`)
2. `backend`: `npm install && npm run build` (tsc + xcopy migrations → dist)
3. `frontend`: `npm install && npm run build` (vite → `../backend/public/`)

## Commands

| Context | Cmd | Notes |
|---------|-----|-------|
| BE dev | `npm run dev` | tsx watch, hot-reload, `127.0.0.1:8001` |
| BE build | `npm run build` | tsc + `xcopy` migrations |
| BE prod | `npm run start` | `node dist/index.js` |
| BE typecheck | `npm run typecheck` | `tsc --noEmit` |
| BE test | `npm run test` | vitest, `fileParallelism:false`, roda `createApp()` (inclui migrate+seed) |
| DB generate | `npm run db:generate` | drizzle-kit generate |
| DB push | `npm run db:push` | sync schema diretamente (dev) |
| DB migrate | `npm run db:migrate` | roda migrations de `src/db/migrations/` |
| Seed | `npm run seed` | reseta + recria admin + 3 planLimits |
| FE dev | `npm run dev` | vite `:3000`, proxy `/api` → `:8001` |
| FE typecheck | `npm run lint` | `tsc --noEmit` (não há ESLint/Prettier no repo) |
| FE test | `npm run test` | vitest + jsdom + testing-library |
| Both | `dev.bat` / `dev.ps1` | kill ports 8001/3000 |
| Release | `git tag v* && git push origin v*` | CI faz zip com node portátil |

## Arquitetura

- **Rotas API:** `/api/v1/*` — auth + subscription middleware globais (exceto `/auth`, `/subscription`, `/webhooks`)
- **Auth middleware** (`shared/auth.middleware.ts`): seta `req.tenantId`, `req.usuarioId`, `req.papel`
- **Subscription middleware** (`subscription/subscription.middleware.ts`): bloqueia com 402 se expirado
- **4-layer** só em `prestadores/` (routes → controller → service → repository); demais módulos mais planos
- **`backend/` é `"type": "module"`** — imports precisam de `.js` extension (ex: `import './config.js'`)
- **Frontend `@/` alias** → root do frontend (`"@/*": ["./*"]`)
- **Error hierarchy:** `AppError` → `NotFoundError` (404), `ValidationError` (422), `ConflictError` (409); handler em `shared/error-handler.ts`

## Banco

- **SQLite** via `better-sqlite3`, WAL mode + foreign_keys ON (`db/db.ts`)
- **Todas as tabelas escopadas por `tenant_id`** exceto `tenants` e `planLimits`
- **`createApp()`** já roda `migrate` + auto-seed se DB vazio — não precisa rodar seed separadamente em dev
- **planLimits:** trial (5 prestadores, 100 docs/mês), basico (2, 100), profissional (10, 2000)

## Gotchas

- **`/automacao/*`** em `frontend/src/api.ts` → 404 (módulo backend `src/modules/automacao/` vazio)
- **pdfmake:** `setUrlAccessPolicy(() => true)` — precisa ser callback, não string; `() => false` quebra fonts locais
- **DANFSe PDF:** sob demanda via `danfse-pdf-generator` (sibling `file:../../danfse-pdf-generator`); coluna `pdf_blob` não usada
- **CI** usa `windows-latest` + `pwsh` + Node 24; dev usa Node 22
- **Static fallback:** `backend/public/` → `backend/dist/` (se não achar public, serve dist)
- **Asaas:** sandbox por default; `ASAAS_SANDBOX=false` para produção
- **Upload de certificados:** `multer` com `memoryStorage` (não salva em disco)
- **HTTP logging** em `data/http.log` (headers sensíveis redactados; implementação inline em `app.ts`)
- **`db:push`** vs **`db:migrate`**: push sync schema diretamente (dev), migrate roda migration files versionados
