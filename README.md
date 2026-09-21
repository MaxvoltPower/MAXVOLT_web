# MAXVOLT — Trusted Power Always ⚡

Professional battery and power solutions website for **MAXVOLT** (Kolkata, India).

A modern, full-stack monorepo with a **React 18 + Vite + Tailwind** frontend and a **Node.js serverless backend**, deployed on **Vercel Services** — all under one domain, one repo, one env file.

---

## 🏗️ Architecture

This project uses Vercel's **[Services](https://vercel.com/docs/services)** feature to deploy two independent services from a single repository:

| Service | Location | Purpose |
|---------|----------|---------|
| **`frontend/`** | React 18 + Vite + Tailwind CSS | Public website + admin panel (SPA) |
| **`api/`** | Node.js serverless functions | REST API (auth, products, orders, payments, quotes, admin, chatbot) |

Vercel automatically routes:
- `/api/*` → **backend** service
- everything else → **frontend** service (with SPA fallback)

This config lives in [`vercel.json`](./vercel.json).

---

## 🧰 Tech Stack

### Frontend
- **React 18** — UI library
- **React Router v6** — client-side routing
- **Vite 5** — fast build tool & dev server
- **Tailwind CSS 3** — utility-first styling (custom dark theme)
- **Firebase Auth (Web SDK)** — user authentication
- **Razorpay Checkout** — online payments
- **Custom Context API** — Auth, Cart, Products state
- **Custom Chatbot widget** — floating AI assistant (Groq-powered)

### Backend (Serverless)
- **Node.js 24.x** (Vercel runtime)
- **MongoDB Atlas** — primary data store
- **Firebase Admin SDK** — token verification & user role management
- **Razorpay Node SDK** — payment order creation & signature verification
- **Groq API** — LLM backend for the chatbot
- **Zod** — schema validation (reserved for future use)

### Infrastructure
- **Vercel** — hosting, CDN, serverless functions, HTTPS, custom domain
- **GitHub** — version control, auto-deploy on push

---

## 📁 Project Structure

```
maxvolt-web/
├── frontend/                       # React SPA
│   ├── public/
│   │   └── assets/                 # Static assets served at /assets/*
│   │       ├── maxvolt-logo.png
│   │       └── maxvolt-logo.webp
│   ├── src/
│   │   ├── components/             # Reusable UI + feature components
│   │   │   ├── account/            # Login, Register, Profile forms
│   │   │   ├── admin/              # Admin dashboard pages
│   │   │   ├── cart/               # CartItem, CartSummary
│   │   │   ├── checkout/           # CheckoutForm, OrderSummary
│   │   │   ├── home/               # Homepage sections
│   │   │   ├── layout/             # Header, Footer, Layout
│   │   │   ├── products/           # ProductCard, Grid, Filters
│   │   │   └── ui/                 # Badge, Button, Card, Input, etc.
│   │   ├── context/                # AuthContext, CartContext, ProductsContext
│   │   ├── data/                   # Fallback product catalogue
│   │   ├── hooks/                  # useLocalStorage, useScrollToTop
│   │   ├── lib/                    # api.js, firebase.js, razorpay.js, utils.js
│   │   ├── pages/                  # Route-level page components
│   │   ├── App.jsx                 # Root routing
│   │   ├── index.css               # Tailwind + global styles
│   │   └── main.jsx                # Entry point
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── api/                            # Serverless backend
│   ├── _lib/                       # Shared helpers
│   │   ├── firebase-admin.js
│   │   ├── middleware.js
│   │   ├── mongodb.js
│   │   └── razorpay.js
│   ├── admin.js                    # /api/admin/*
│   ├── auth.js                     # /api/auth/*
│   ├── chat.js                     # /api/chat
│   ├── config.js                   # /api/config
│   ├── contact.js                  # /api/contact
│   ├── orders.js                   # /api/orders/*
│   ├── payments.js                 # /api/payments/*
│   ├── products.js                 # /api/products/*
│   ├── quotes.js                   # /api/quotes/*
│   ├── sections.js                 # /api/sections/*
│   └── webhook.js                  # /api/payments/webhook (Razorpay)
│
├── server/                         # Local dev backend (mirrors Vercel routing)
│   ├── index.mjs                   # Node HTTP server on :3001
│   ├── router.mjs                  # Maps /api/* → api/*.js handlers
│   └── vercel-adapter.mjs          # Wraps Vercel handlers for plain Node
│
├── scripts/                        # One-time DB utilities
│   ├── seed-products.mjs           # Populate MongoDB with product catalogue
│   └── setup-indexes.mjs           # Create MongoDB indexes
│
├── .env.example                    # Environment variable template
├── .gitignore
├── package.json                    # Root scripts + backend deps
├── vercel.json                     # Vercel Services + redirects + rewrites
└── README.md                       # This file
```

---

## 🚀 Local Development

This project runs **two processes locally**:

| Process | Port | What it does |
|---------|------|--------------|
| **API** (`server/index.mjs`) | `3001` | Serves all `/api/*` routes by importing the Vercel handlers from `api/` |
| **Frontend** (Vite dev server) | `3000` | Serves the React SPA and proxies `/api/*` → `localhost:3001` |

The root `npm run dev` script launches **both** with `concurrently`, so you only need one terminal.

---

### ✅ Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| **Node.js** | **20 LTS or 24.x** | Matches `engines.node: "24.x"` in `package.json` |
| **npm** | 10+ | Ships with Node 20+ |
| **Git** | Any | To clone the repo |
| **MongoDB Atlas** account | — | Free tier is fine |
| **Firebase** project | — | Web + Admin service account |
| **Razorpay** test account | — | For payment testing (optional) |
| **Groq** API key | — | For the chatbot (optional) |

> 💡 **Windows users**: All commands below work in PowerShell, Git Bash, and CMD. If you use PowerShell and hit an "execution policy" error, run once: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

---

### 1️⃣ Clone the repository

```bash
git clone https://github.com/MaxvoltPower/MAXVOLT.git
cd MAXVOLT
```

(Or `cd` into your local folder if you already have it, e.g. `cd "D:/72 projects of python/MAXVOLT_web"`.)

---

### 2️⃣ Install dependencies

Install **both** root (backend) and frontend deps:

```bash
# Root deps — firebase-admin, mongodb, razorpay, zod, concurrently, dotenv
npm install

# Frontend deps — react, vite, tailwind, firebase web SDK, etc.
cd frontend && npm install && cd ..
```

> On Windows, if you're using PowerShell and want to chain: `npm install; cd frontend; npm install; cd ..`

---

### 3️⃣ Create your local `.env`

Copy the template and open it in your editor:

```bash
cp .env.example .env
```

**Edit `.env`** and fill in **real** values for at least these variables. The app will boot without some of them, but features will be broken:

#### Required for the API to connect

| Variable | Where to get it |
|----------|-----------------|
| `MONGODB_URI` | MongoDB Atlas → Connect → Drivers. Format: `mongodb+srv://user:pass@cluster.mongodb.net/maxvolt?retryWrites=true&w=majority` |
| `MONGODB_DB` | Any name, e.g. `maxvolt` |

#### Required for Firebase Auth (login/register/admin)

| Variable | Where to get it |
|----------|-----------------|
| `FIREBASE_PROJECT_ID` | Firebase Console → Project Settings → General |
| `FIREBASE_CLIENT_EMAIL` | Firebase Console → Project Settings → **Service Accounts** → Generate new private key |
| `FIREBASE_PRIVATE_KEY` | Same JSON as above — copy the `private_key` field, keep the literal `\n` sequences, wrap the whole thing in double quotes |
| `VITE_FIREBASE_API_KEY` | Firebase Console → Project Settings → General → Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | e.g. `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Same as `FIREBASE_PROJECT_ID` |
| `VITE_FIREBASE_STORAGE_BUCKET` | e.g. `your-project.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | From Firebase web config |
| `VITE_FIREBASE_APP_ID` | From Firebase web config |

> ⚠️ **`FIREBASE_PRIVATE_KEY` gotcha:** paste the **whole** key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----\n`, keep all `\n` as **two characters** (backslash + n), and wrap the entire value in **double quotes** on a **single line**. The backend does `.replace(/\\n/g, '\n')` to unescape it.

#### Required for the Chatbot

| Variable | Where to get it |
|----------|-----------------|
| `GROQ_API_KEY` | https://console.groq.com/keys — starts with `gsk_` |

#### Required for Payments (only if testing checkout)

| Variable | Where to get it |
|----------|-----------------|
| `RAZORPAY_KEY_ID` | https://dashboard.razorpay.com/app/keys |
| `RAZORPAY_KEY_SECRET` | Same page |
| `RAZORPAY_WEBHOOK_SECRET` | Only needed in production; for local dev use any string |
| `VITE_RAZORPAY_KEY_ID` | Same as `RAZORPAY_KEY_ID` |

#### Recommended for Admin access

| Variable | Value |
|----------|-------|
| `ADMIN_EMAILS` | Comma-separated (no spaces!): `you@gmail.com,partner@gmail.com` |

#### Public contact info (safe to commit)

| Variable | Value |
|----------|-------|
| `VITE_WHATSAPP_NUMBER` | e.g. `917595941311` |
| `VITE_CONTACT_EMAIL` | e.g. `maxvolt.power@gmail.com` |
| `VITE_CONTACT_PHONE` | e.g. `+91 7595941311` |

> 🔒 **Never** prefix secrets like `FIREBASE_PRIVATE_KEY` or `RAZORPAY_KEY_SECRET` with `VITE_`. Anything prefixed with `VITE_` is embedded into the browser bundle.

---

### 4️⃣ (One-time) Seed the database

Populate MongoDB with the product catalogue and create the recommended indexes:

```bash
npm run seed
npm run setup-indexes
```

Both scripts read `MONGODB_URI` and `MONGODB_DB` from your `.env`. You should see:

```
Loaded 41 products from inline data
✅ Seed complete: 41 inserted, 0 updated
✅ Indexes created
```

---

### 5️⃣ Run the dev servers

From the **project root**:

```bash
npm run dev
```

You should see output similar to:

```
[api]   ⚡ MAXVOLT — local backend
[api]   ➜  http://localhost:3001
[api]   ➜  Health: http://localhost:3001/api/health
[api]   ➜  Handlers: admin, auth, chat, config, contact, orders, payments, products, quotes, sections, webhook
[web]   VITE v5.x.x  ready in 400 ms
[web]   ➜  Local:   http://localhost:3000/
```

Open **http://localhost:3000** in your browser.

#### What `npm run dev` actually does

The root `package.json` defines:

```json
"dev": "concurrently -n api,web -c cyan,magenta \"npm:dev:api\" \"npm:dev:frontend\"",
"dev:api": "node server/index.mjs",
"dev:frontend": "npm --prefix frontend run dev"
```

| Step | Command | Result |
|------|---------|--------|
| 1 | `node server/index.mjs` | Boots a plain Node HTTP server on port **3001** that imports `api/*.js` handlers and routes `/api/*` to them |
| 2 | `npm --prefix frontend run dev` | Boots the Vite dev server on port **3000** with a proxy: `/api/*` → `http://localhost:3001` |

So when the browser requests `/api/products`, Vite forwards it to your local backend — you get the exact same URL structure as on Vercel.

---

### 6️⃣ Quick smoke tests

With the dev server running, verify:

| Check | URL / Action | Expected |
|-------|--------------|----------|
| Health check | http://localhost:3001/api/health | `{ "ok": true, "service": "maxvolt-api", ... }` |
| Public config | http://localhost:3000/api/config | `{ "success": true, "data": { "firebase": {...}, "razorpayKeyId": "..." } }` |
| Products list | http://localhost:3000/api/products | `{ "success": true, "data": { "items": [...], "total": N } }` |
| Homepage | http://localhost:3000/ | Hero carousel + marquee + categories render |
| Chatbot | Click the orange chat button (bottom-right) → type `hi` | An AI reply appears (not the "Sorry, I could not generate a response" message) |
| Admin login | Log in with an email listed in `ADMIN_EMAILS` → http://localhost:3000/admin | Dashboard loads with stats |

If the chatbot still fails, see the **Troubleshooting → Chatbot** section below.

---

### 🔁 Available scripts (root)

| Command | What it does |
|---------|--------------|
| `npm run dev` | Runs API (`:3001`) + Vite (`:3000`) via `concurrently` |
| `npm run dev:api` | Runs **only** the local API server on `:3001` |
| `npm run dev:frontend` | Runs **only** the Vite dev server on `:3000` (expects API at `:3001`) |
| `npm run seed` | Seeds MongoDB with the fallback product catalogue |
| `npm run setup-indexes` | Creates MongoDB indexes |
| `npm run deploy` | Deploys to Vercel production (`vercel --prod`) |

### 🔁 Available scripts (frontend)

Run from `frontend/` (or via `npm --prefix frontend run <cmd>`):

| Command | What it does |
|---------|--------------|
| `npm run dev` | Vite dev server (standalone) |
| `npm run build` | Production build → `frontend/dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | ESLint on the frontend |

---

### 🎛️ Running the API and frontend separately

If you prefer two terminals:

**Terminal 1 — API:**
```bash
npm run dev:api
# → http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
npm run dev:frontend
# → http://localhost:3000
```

The Vite proxy in `frontend/vite.config.js` handles the `/api` forwarding.

---

### 🌐 Trying production-build locally

To test the built frontend against your local API:

```bash
cd frontend
npm run build
npm run preview     # serves the built SPA on :4173 by default
```

> ⚠️ `vite preview` **does not** proxy `/api`. For a full prod-like run, either point `VITE_API_BASE_URL=http://localhost:3001` in `.env` and rebuild, or use `vercel dev` (see below).

---

### 🧪 Using `vercel dev` instead (optional)

If you have the Vercel CLI installed and prefer Vercel's own local runtime:

```bash
npm i -g vercel
vercel link         # link to the existing project
vercel dev          # serves frontend + api on the same port (default :3000)
```

This is closer to production but slower to restart than the `concurrently` setup. Either workflow works.

---

## 🛠️ Troubleshooting (Local Dev)

| Symptom | Cause / Fix |
|---------|-------------|
| `MONGODB_URI is not defined` | `.env` missing at project root, or the variable isn't set. Copy `.env.example` → `.env` and fill it in. |
| `Firebase Admin credentials missing` | One of `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` is empty. |
| `Failed to parse private key` | `FIREBASE_PRIVATE_KEY` pasted with real newlines instead of `\n`, or missing the surrounding quotes. Paste as a single line with `\n` escapes and wrap in `"..."`. |
| `/api/*` returns 404 | You ran `npm run dev:frontend` alone without the API running. Start both with `npm run dev`, or start `npm run dev:api` in another terminal. |
| `EADDRINUSE :3001` | Something else is already on port 3001. Kill it or set `PORT=3002` (and update the proxy target in `frontend/vite.config.js`). |
| Vite crashes with `__dirname is not defined` | Old Node version. Use Node 20+. `vite.config.js` already handles ESM `__dirname` via `fileURLToPath`. |
| Frontend shows old build | Hard-refresh: **Cmd/Ctrl + Shift + R**. |
| Admin page redirects to `/login` | Your email isn't in `ADMIN_EMAILS`, or `ADMIN_EMAILS` has spaces after commas. Use `a@x.com,b@y.com` (no spaces). |
| Products list is empty | You haven't seeded. Run `npm run seed` with the correct `MONGODB_URI`. |
| Razorpay signature fails | `RAZORPAY_KEY_SECRET` mismatch between server and Razorpay dashboard. |
| Custom domain shows 404 (prod only) | Wait for DNS propagation (up to 48 h). |

### 🐛 Chatbot returns "Sorry, I could not generate a response."

The chatbot (`/api/chat`) tries your configured Groq model, then falls back through a list of known-good models. If **all** fail, it returns an error. To diagnose:

1. Open the browser **Network** tab, trigger a chat message, and inspect the **`/api/chat`** response.
   - If `success: true` and `data.reply` is present → the frontend should render it. Hard-refresh if not.
   - If `success: false` → the `error` field contains the exact upstream reason (invalid key, unknown model, rate limit, etc.).

2. Check the **API terminal** where `npm run dev:api` is running. You'll see lines like:
   ```
   [chat] Trying Groq model: llama-3.3-70b-versatile
   [chat] Model "llama-3.3-70b-versatile" failed: Invalid API Key
   [chat] Trying Groq model: llama-3.1-8b-instant
   ...
   ```

3. Common fixes:
   - **Invalid API Key** → set a fresh `GROQ_API_KEY` in `.env`, or clear the saved key in Admin → Settings → Chatbot.
   - **Model not found** → clear the **Model Name** field in Admin → Settings → Chatbot (leave blank to use the default).
   - **Key saved in DB overrides `.env`** → Admin → Settings → Chatbot shows a saved key. Clearing it makes the server fall back to `GROQ_API_KEY`.

4. Restart the API (`Ctrl+C` in the dev terminal, then `npm run dev` again) after editing `.env`.

---

## 🌐 API Reference

All endpoints return `{ success: boolean, data?: any, error?: string }`.

### Auth — `/api/auth/*`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/verify` | Bearer | Verify Firebase ID token, upsert user doc, return profile |
| GET | `/api/auth/profile` | Bearer | Fetch current user profile |
| PUT | `/api/auth/profile` | Bearer | Update current user profile |

### Products — `/api/products/*`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/products` | Public | List products (paginated, filterable) |
| GET | `/api/products/:id` | Public | Get single product |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |

### Orders — `/api/orders/*`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/orders` | Bearer | List my orders (or all if admin & `?all=1`) |
| POST | `/api/orders` | Bearer | Create order |
| GET | `/api/orders/:id` | Bearer | Get single order |
| PATCH | `/api/orders/:id` | Bearer | Update order (status, etc.) |

### Payments — `/api/payments/*`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/payments/create-order` | Bearer | Create Razorpay order + internal order |
| POST | `/api/payments/verify` | Bearer | Verify Razorpay signature |
| POST | `/api/payments/webhook` | Public | Razorpay webhook receiver |

### Quotes — `/api/quotes/*`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/quotes` | Public | Submit a quote request |
| GET | `/api/quotes` | Admin | List all quotes |
| PATCH | `/api/quotes/:id` | Admin | Update quote status |
| DELETE | `/api/quotes/:id` | Admin | Delete quote |

### Admin — `/api/admin/*`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/stats` | Admin | Dashboard statistics |
| GET | `/api/admin/users` | Admin | List users (with optional `?q=` search) |
| PATCH | `/api/admin/users` | Admin | Change user role (`admin` / `customer`) |
| GET | `/api/admin/settings` | Admin | Get site + chatbot settings |
| PUT | `/api/admin/settings` | Admin | Save site + chatbot settings |

### Sections — `/api/sections/*`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/sections` | Public | List active homepage sections |
| POST | `/api/sections` | Admin | Create section |
| PUT | `/api/sections/:id` | Admin | Update section |
| DELETE | `/api/sections/:id` | Admin | Delete section |

### Chat — `/api/chat`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/chat` | Public | Send message to AI assistant (Groq) |

### Contact — `/api/contact`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/contact` | Public | Submit contact form |
| GET | `/api/contact` | Admin | List contact submissions |

### Config — `/api/config`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/config` | Public | Return public Firebase + Razorpay config |

---

## 🔐 Environment Variables

A **single `.env` file** at the project root holds all secrets for local dev. On Vercel, set them in **Project → Settings → Environment Variables**.

### Backend variables (no prefix)
| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `MONGODB_DB` | Database name (default: `maxvolt`) |
| `FIREBASE_PROJECT_ID` | Firebase project ID (Admin SDK) |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key (keep `\n` escapes) |
| `FIREBASE_API_KEY` | Firebase Web API key (also served via `/api/config`) |
| `FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID |
| `FIREBASE_APP_ID` | Firebase app ID |
| `RAZORPAY_KEY_ID` | Razorpay API key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook signature secret |
| `ADMIN_EMAILS` | Comma-separated admin emails (no spaces) |
| `GROQ_API_KEY` | Groq API key for the chatbot |
| `SITE_URL` | Public site URL (for absolute links) |
| `PORT` | Local API port (default: `3001`) |

### Frontend variables (must start with `VITE_`)
| Variable | Purpose |
|----------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_RAZORPAY_KEY_ID` | Razorpay public key ID |
| `VITE_WHATSAPP_NUMBER` | Business WhatsApp number (with country code) |
| `VITE_CONTACT_EMAIL` | Public contact email |
| `VITE_CONTACT_PHONE` | Public contact phone |
| `VITE_API_BASE_URL` | Leave blank to use same-origin `/api` |

> ⚠️ **`VITE_*` vars are baked at build time.** After changing them, restart the dev server (or redeploy on Vercel).

---

## 🚢 Deployment (Vercel)

### Automatic (recommended)

1. Push your changes to `main` on GitHub.
2. Vercel automatically builds and deploys both services.
3. Done — live in ~1 minute.

### Manual

```bash
vercel --prod
```

### What Vercel does

1. Reads `vercel.json` → sees two services (`frontend`, `backend`)
2. Builds `frontend/` with Vite → static assets
3. Bundles `api/*.js` → serverless functions
4. Applies `redirects` (old `.html` URLs → new React routes, 301)
5. Applies `rewrites` (`/api/*` → backend, everything else → frontend)
6. Provisions HTTPS + global CDN

### Vercel environment variables

Set **every** variable from the `.env` tables above in **Project → Settings → Environment Variables** for **Production**, **Preview**, and **Development**.

**Important gotchas on Vercel:**

| Variable | Rule |
|----------|------|
| `FIREBASE_PRIVATE_KEY` | Paste **without** surrounding quotes. Keep the literal `\n` sequences. |
| `ADMIN_EMAILS` | No spaces after commas. |
| `MONGODB_URI` | Add `?retryWrites=true&w=majority` and URL-encode special characters in the password. |
| `VITE_*` | Baked at build time — after changing, **redeploy**. |

After adding all variables, go to **Deployments → ⋯ → Redeploy**.

### Adding a custom domain

1. Go to **Vercel → Project → Settings → Domains**
2. Add your domain (e.g. `maxvoltbatteries.in`)
3. Update DNS records as instructed
4. Vercel auto-provisions a free SSL certificate

---

## 🔄 Redirects (Vanilla → React)

Legacy URLs from the pre-React version are **301-redirected** to the new routes. See [`vercel.json`](./vercel.json) for the full list — e.g. `/cart.html` → `/cart`, `/admin/index.html` → `/admin`.

---

## 👥 User Roles

| Role | Access |
|------|--------|
| **Guest** | Homepage, products, product detail, privacy, terms, chatbot, quote form |
| **Customer** | + Cart, checkout, order history, profile |
| **Admin** | + `/admin` panel (dashboard, products, sections, orders, quotes, users, settings) |

Admin access is determined by:
1. `ADMIN_EMAILS` env var, **or**
2. A custom `role: 'admin'` claim set via the Admin → Users page

---

## 🧪 Testing Checklist (Before Deploy)

### Homepage
- [ ] Hero carousel rotates through 4 slides
- [ ] Marquee scrolls product names
- [ ] Category cards navigate correctly
- [ ] Calculator returns a recommendation
- [ ] Dynamic sections render (if any exist)
- [ ] Featured products show (fallback if no dynamic featured)
- [ ] Quotation form submits

### Products
- [ ] `/products` lists all products
- [ ] Filters (category, brand, search, sort) work
- [ ] `/product/:id` shows detail + related products
- [ ] "Add to Cart" and "Buy Now" work

### Cart & Checkout
- [ ] Cart badge updates on header
- [ ] Quantity + / − works
- [ ] Checkout requires login
- [ ] COD order completes
- [ ] Razorpay order opens + verifies

### Account
- [ ] Register, login, logout work
- [ ] Forgot password sends email
- [ ] Profile updates save

### Admin (login as admin)
- [ ] Dashboard shows stats
- [ ] Products CRUD works
- [ ] Sections CRUD works
- [ ] Orders status can be updated
- [ ] Quotes can be updated/deleted
- [ ] Users can be promoted/demoted
- [ ] Settings save + chatbot test works

### Redirects
- [ ] `/products/car-batteries.html` → 301 → `/products?category=carBatteries`
- [ ] `/cart.html` → 301 → `/cart`
- [ ] `/admin/index.html` → 301 → `/admin`

### Chatbot
- [ ] Floating widget opens
- [ ] Sends message, receives AI reply

---

## 🐛 Troubleshooting (Production)

| Symptom | Cause / Fix |
|---------|-------------|
| `MONGODB_URI is not defined` | Variable not set on Vercel. Add it and redeploy. |
| `Firebase Admin credentials missing` | Missing `FIREBASE_PRIVATE_KEY` on Vercel — remember to keep `\n` escapes and drop the outer quotes. |
| `Failed to parse private key` | `FIREBASE_PRIVATE_KEY` pasted with real newlines. Repaste as a single line with literal `\n`. |
| `/api/*` returns 404 | The `rewrites` in `vercel.json` aren't being applied — check that the project root is the repo root. |
| Frontend shows old build | `vercel --prod` again, or hard-refresh. |
| Chatbot fails with model error | Check `GROQ_API_KEY` on Vercel, or clear the DB-saved key in Admin → Settings → Chatbot. |
| Razorpay signature fails | `RAZORPAY_KEY_SECRET` mismatch between Vercel and Razorpay dashboard. |
| Products empty on production | Run `npm run seed` against the production `MONGODB_URI`. |

---

## 📸 Key Features

### Storefront
- 🎠 Animated 4-slide hero carousel (brand, home, TOTO, UPS)
- 📜 Auto-scrolling product marquee
- 🏠 6-category product grid
- 🧮 Interactive inverter + battery calculator with real product recommendations
- 🛒 Cart with persistent localStorage state
- 💳 Checkout with Razorpay + Cash on Delivery
- 💬 Floating AI chatbot (Groq-powered, with multi-model fallback)
- 📱 Fully responsive, mobile-first, dark theme

### Admin Panel
- 📊 Dashboard with revenue, orders, quotes, users, recent activity
- 📦 Full CRUD for products (with multi-image paste-from-clipboard support)
- 🏷️ Homepage section manager (Featured / Sale / Combo / New Arrivals)
- 🛒 Order management with status updates
- 💬 Quote request inbox
- 👥 User management with role control
- ⚙️ Site + chatbot settings with live test button

### Trust & Localization
- 🇮🇳 Kolkata-focused, GST-inclusive pricing
- ✅ Genuine branded products only
- 📞 Multiple contact channels (Phone, WhatsApp, Email)
- 📄 Privacy Policy + Terms & Conditions

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit: `git commit -m "feat: description"`
3. Push: `git push origin feature/your-feature`
4. Open a Pull Request

### Commit Convention
- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation only
- `refactor:` — code change that neither fixes a bug nor adds a feature
- `chore:` — build / tooling / dependency updates
- `security:` — security-related fix (e.g. rotating leaked keys)

---

## 📞 Contact

**MAXVOLT**
- 📍 Kolkata, West Bengal, India
- 📱 Phone: **+91 7595941311**
- 💬 WhatsApp: **+91 7595941311**
- 📧 Email: **maxvolt.power@gmail.com**
- 🌐 Website: https://maxvolt-web.vercel.app

---

## 📄 License

© MAXVOLT. All rights reserved.  
This codebase is proprietary and confidential. Unauthorized reproduction or distribution is prohibited.

---

**MAXVOLT — Trusted Power Always** ⚡  
Built with ❤️ for Kolkata and beyond.
