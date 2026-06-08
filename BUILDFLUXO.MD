# Build Flow — Gestor NFSe

## Pré-requisitos

- Node.js >= 18
- npm
- SQLite (incluso via better-sqlite3)

## Dependências

```
C:\Laboratorio\
├── danfse-pdf-generator\    (pacote local, NÃO publicado no npm)
├── gestor_nfse\
│   ├── backend\             (Express + Drizzle)
│   └── frontend\            (React + Vite)
```

## Ordem de build

### 1. danfse-pdf-generator

Sempre buildar primeiro, pois o backend depende dele.

```bash
cd C:\Laboratorio\danfse-pdf-generator
npm install
npm run build
```

Saída: `dist/` (CJS + ESM + .d.ts)

### 2. Backend

```bash
cd C:\Laboratorio\gestor_nfse\backend
npm install
npm run build          # tsc → dist/
```

### 3. Frontend

O `vite.config.ts` tem `outDir` apontando para `../backend/public/`.

```bash
cd C:\Laboratorio\gestor_nfse\frontend
npm install
npm run build          # vite → ../backend/public/
```

Após o build, o backend serve o frontend estaticamente.

### 4. Banco de dados

```bash
cd C:\Laboratorio\gestor_nfse\backend
npm run db:generate    # drizzle-kit generate
npm run db:migrate     # roda migrations no banco
npm run seed           # cria admin + tenant + trial
```

Seed padrão: `admin@gestornfse.com` / `admin123`

## Para subir em produção (servidor único)

```bash
cd C:\Laboratorio\gestor_nfse\backend
npm run start          # node dist/index.js
```

O servidor escuta em `http://0.0.0.0:8001` e serve:
- API: `/api/v1/*`
- Frontend: `/*` (arquivos estáticos de `public/`)

## Para desenvolvimento

```bash
# Terminal 1 - Backend (com hot-reload)
cd C:\Laboratorio\gestor_nfse\backend
npm run dev            # tsx watch src/index.ts → porta 8001

# Terminal 2 - Frontend (com hot-reload)
cd C:\Laboratorio\gestor_nfse\frontend
npm run dev            # vite → porta 3000 (proxy /api → 8001)
```

Ou usar `dev.bat` (Windows cmd) ou `dev.ps1` (PowerShell) na raiz.

## Atenção

- O `danfse-pdf-generator` é dependência **local** (`file:../../danfse-pdf-generator` no `backend/package.json`). Sempre rebuildar ele antes de buildar o backend.
- O `tsx watch` no backend detecta mudanças em `../../danfse-pdf-generator/dist/` automaticamente.
- O build do frontend joga os arquivos em `../backend/public/` — não versionar essa pasta.
