# Election Survey Frontend

React + Vite + TailwindCSS frontend for the Election Survey Call Center.

## Setup

```bash
cp .env.example .env
# Edit VITE_API_BASE_URL to point to your Django backend

npm install
npm run dev
```

## Build for production

```bash
npm run build
```

## Deploy to Vercel

1. Push to GitHub
2. Import repo in vercel.com
3. Set environment variable: `VITE_API_BASE_URL=https://your-backend.com/api`
4. Framework: Vite — Vercel detects automatically
5. Deploy!

The `vercel.json` included handles SPA routing (all paths → index.html).

## Key Features

- JWT auth with auto-refresh on 401
- Role-based routing: Admin vs Operator
- Admin: Beneficiary CRUD, bulk CSV upload, operator management, assignments, analytics, geography
- Operator: Dashboard, assigned beneficiary list, survey form with tap-to-call
- Fully responsive (mobile-first for operators)

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Django backend API URL, e.g. `https://api.yourdomain.com/api` |
