# SpaceFlow Deployment Guide: Vercel + Railway

This guide walks you through deploying the complete SpaceFlow stack:
- **Frontend** (React + Vite) → **Vercel**
- **Backend** (Express + Node.js) → **Railway**
- **Database** (PostgreSQL) → **Railway**

---

## Prerequisites

- [Vercel](https://vercel.com) account
- [Railway](https://railway.app) account
- Git repository (GitHub, GitLab, or Bitbucket)

---

## Part 1: Deploy Backend + Database on Railway

### Step 1: Create a Railway Project

1. Go to [railway.app](https://railway.app) and sign in.
2. Click **New Project** → **Deploy from GitHub repo** (or use Railway CLI).
3. Connect your GitHub account and select the `spaceflow_v1` repository.

### Step 2: Add PostgreSQL

1. In your Railway project, click **+ New** → **Database** → **PostgreSQL**.
2. Railway will provision a PostgreSQL instance and expose `DATABASE_URL` as an environment variable.
3. Copy the `DATABASE_URL` value (you’ll use it for the backend service).

### Step 3: Deploy the Backend Service

1. Click **+ New** → **GitHub Repo** and select the same repo.
2. Railway will detect the repo. Configure it:
   - **Root Directory**: `server` (important – backend lives in `server/`)
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npx prisma migrate deploy && npm start`
   - **Watch Paths**: `server/**` (optional, for redeploys on server changes only)

### Step 4: Set Environment Variables (Backend)

In the backend service → **Variables**, add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | From PostgreSQL service (Railway auto-links if same project) |
| `JWT_SECRET` | Long random string (64+ chars) – e.g. `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | Another long random string (64+ chars) |
| `NODE_ENV` | `production` |
| `PORT` | `4000` (Railway sets `PORT` automatically; this is fallback) |
| `FRONTEND_URL` | Your Vercel URL, e.g. `https://spaceflow.vercel.app` |
| `GEMINI_API_KEY` | Your Gemini API key |
| `OPENAI_API_KEY` | Your OpenAI API key (fallback for AI features) |
| `SEED_ADMIN_EMAIL` | (Optional) Admin email for seeding |
| `SEED_ADMIN_PASSWORD` | (Optional) Admin password for seeding |
| `SEED_TOKEN` | Random string – used to trigger seed via `/api/seed?token=xxx` |

### Step 5: Seed the Database (One-Time)

After the first deploy, seed the database with admin, sample users, spaces, and bookings:

1. Add `SEED_TOKEN` to Railway variables (e.g. `fc3b853c2af16efe382d11248025224d`).
2. Visit: `https://YOUR-RAILWAY-URL/api/seed?token=YOUR_SEED_TOKEN`
3. You should see `{"ok":true,"message":"Database seeded successfully"}`.
4. Login with `admin@spaceflow.local` / `Admin@SpaceFlow1!`.

### Step 6: Get the Backend URL

1. Go to the backend service → **Settings** → **Networking**.
2. Click **Generate Domain** to get a public URL, e.g. `https://spaceflow-server-production-xxxx.up.railway.app`.
3. Copy this URL – you’ll use it as `VITE_API_URL` for the frontend.

### Step 7: Run Migrations (First Deploy)

On first deploy, run migrations:

1. In Railway, open the backend service → **Settings** → **Deploy**.
2. Or use Railway CLI: `railway run npx prisma migrate deploy` from the `server` directory.

---

## Part 2: Deploy Frontend on Vercel

### Step 1: Import Project

1. Go to [vercel.com](https://vercel.com) and sign in.
2. Click **Add New** → **Project**.
3. Import your Git repository.

### Step 2: Configure Build Settings

- **Framework Preset**: Vite (auto-detected)
- **Root Directory**: `.` (leave empty – frontend is at repo root)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 3: Set Environment Variables (Frontend)

In **Settings** → **Environment Variables**, add:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Your Railway backend URL, e.g. `https://spaceflow-server-production-xxxx.up.railway.app` |

Important: `VITE_` variables are baked in at build time. Redeploy after changing them.

### Step 4: Deploy

Click **Deploy**. Vercel will build and deploy the frontend.

---

## Part 3: Cross-Origin Cookie Fix (Required)

Because the frontend (Vercel) and backend (Railway) use different domains, cookies must be set for cross-origin requests.

### Update `server/src/routes/auth.ts`

Change the cookie options in `setCookies`:

```ts
function setCookies(res: Response, accessToken: string, refreshToken: string) {
  const isCrossOrigin = process.env.FRONTEND_URL && 
    new URL(process.env.FRONTEND_URL).origin !== 
    (process.env.BACKEND_ORIGIN || `http://localhost:${process.env.PORT || 4000}`);
  
  const cookieOpts = {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: (IS_PROD && isCrossOrigin) ? ("none" as const) : (IS_PROD ? ("strict" as const) : ("lax" as const)),
    path: "/",
  };
  // ... rest unchanged
}
```

Or, if you always deploy frontend and backend on different domains in production, use:

```ts
const cookieOpts = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: IS_PROD ? ("none" as const) : ("lax" as const),  // "none" for cross-origin
  path: "/",
};
```

Add `BACKEND_ORIGIN` to Railway env vars (your backend URL) if you use the first approach.

---

## Part 4: Update CORS (Backend)

Ensure `FRONTEND_URL` in Railway matches your Vercel URL exactly (including `https://`). The backend already uses it for CORS:

```ts
origin: FRONTEND_URL,  // e.g. https://spaceflow.vercel.app
credentials: true,
```

If you use a custom domain on Vercel, set `FRONTEND_URL` to that URL.

---

## Part 5: Final Checklist

- [ ] PostgreSQL running on Railway
- [ ] Backend deployed on Railway with correct env vars
- [ ] `FRONTEND_URL` set to your Vercel URL
- [ ] Frontend deployed on Vercel with `VITE_API_URL` set to Railway backend URL
- [ ] Cookie `sameSite` updated to `"none"` for cross-origin auth
- [ ] Prisma migrations run (`npx prisma migrate deploy`)

---

## Custom Domains (Optional)

### Vercel
- Project → **Settings** → **Domains** → add your domain.

### Railway
- Service → **Settings** → **Networking** → **Custom Domain** → add your domain.

Remember to update `FRONTEND_URL` and `VITE_API_URL` if you change domains.

---

## Redeploying

- **Frontend**: Push to Git or trigger redeploy in Vercel dashboard.
- **Backend**: Push to Git; Railway auto-deploys. Or use Railway CLI: `railway up` from `server/`.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS errors | Ensure `FRONTEND_URL` matches your Vercel URL exactly (no trailing slash). |
| 401 / auth not working | Check cookie `sameSite: "none"` and `secure: true` in production. |
| `VITE_API_URL` not updating | Redeploy the frontend after changing env vars (Vite bakes them at build time). |
| Prisma / DB errors | Run `npx prisma migrate deploy` in the server. Ensure `DATABASE_URL` is correct. |
| Build fails on Vercel | Ensure root directory is `.` and build command is `npm run build`. |
| Build fails on Railway | Ensure root directory is `server` and build includes `prisma generate`. |
