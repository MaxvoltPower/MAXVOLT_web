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

### Prerequisites
- **Node.js** 20+ (LTS recommended)
- **npm** 10+
- **Vercel CLI** — installed globally
- A **MongoDB Atlas** connection string
- A **Firebase** project (Web + Admin service account)
- A **Razorpay** test account (for payments)
- (Optional) A **Groq API key** for the chatbot

### Step 1 — Install Vercel CLI

```bash
npm i -g vercel
```

### Step 2 — Clone & install dependencies

```bash
git clone https://github.com/MaxvoltPower/MAXVOLT.git
cd MAXVOLT

# Install root deps (backend)
npm install

# Install frontend deps
cd frontend && npm install && cd ..
```

### Step 3 — Set up environment variables

Copy the template and fill in real values:

```bash
cp .env.example .env
```

Edit `.env` and provide:
- `MONGODB_URI` and `MONGODB_DB`
- Firebase Admin credentials (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`)
- Firebase Web config (`VITE_FIREBASE_*`)
- Razorpay keys (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`)
- `ADMIN_EMAILS` (comma-separated)
- `GROQ_API_KEY` (for the chatbot)

> ⚠️ **`VITE_*` variables** are exposed to the browser. **Never** prefix secrets like `FIREBASE_PRIVATE_KEY` or `RAZORPAY_KEY_SECRET` with `VITE_`.

### Step 4 — Link to Vercel (one-time)

```bash
vercel link
```

Choose **Link to existing project** (or create a new one). This creates a `.vercel/` folder locally (gitignored).

### Step 5 — Run locally

```bash
npm run dev
```

This runs `vercel dev`, which:
- Builds and serves the React frontend
- Runs the serverless functions in `api/`
- Routes `/api/*` to the backend automatically
- Reads variables from your local `.env`

Open **http://localhost:3000**

### Step 6 — (One-time) Seed MongoDB

```bash
npm run seed
npm run setup-indexes
```

---

## 🛠️ Available Scripts

Run these from the **project root**:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local dev (frontend + backend on one port via `vercel dev`) |
| `npm run deploy` | Deploy to production (`vercel --prod`) |
| `npm run seed` | Seed MongoDB with the product catalogue |
| `npm run setup-indexes` | Create MongoDB indexes for performance |

Run these from **`frontend/`**:

| Command | Description |
|---------|-------------|
| `npm run dev` | Run the Vite dev server standalone (needs API proxy) |
| `npm run build` | Production build → `frontend/dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint on the frontend |

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

A **single `.env` file** at the project root holds all secrets.

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
| `ADMIN_EMAILS` | Comma-separated admin emails |
| `GROQ_API_KEY` | Groq API key for the chatbot |
| `SITE_URL` | Public site URL (for absolute links) |

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

**On Vercel:** Set each variable in **Project → Settings → Environment Variables** for **Production**, **Preview**, and **Development** environments.

**Locally:** Set them once in `.env`, or pull them from Vercel:

```bash
vercel env pull .env
```

---

## 🚢 Deployment

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

### Adding a custom domain
1. Go to **Vercel → Project → Settings → Domains**
2. Add your domain (e.g. `maxvoltbatteries.in`)
3. Update DNS records as instructed
4. Vercel auto-provisions a free SSL certificate

---

## 🔄 Redirects (Vanilla → React)

Legacy URLs from the pre-React version are **301-redirected** to the new routes:

| Old URL | New URL |
|---------|---------|
| `/products/home-inverter-batteries.html` | `/products?category=homeInverterBatteries` |
| `/products/car-batteries.html` | `/products?category=carBatteries` |
| `/products/toto-erickshaw.html` | `/products?category=totoErickshawBatteries` |
| `/products/ebike-batteries.html` | `/products?category=ebikeBatteries` |
| `/products/ups.html` | `/products?category=ups` |
| `/product-detail.html` | `/products` |
| `/cart.html` | `/cart` |
| `/checkout.html` | `/checkout` |
| `/order-success.html` | `/order-success` |
| `/privacy-policy.html` | `/privacy-policy` |
| `/terms-conditions.html` | `/terms-conditions` |
| `/account/:page.html` | `/account/:page` |
| `/admin/:page.html` | `/admin/:page` |
| `/admin/index.html` | `/admin` |

All defined in [`vercel.json`](./vercel.json).

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

## 🐛 Troubleshooting

| Symptom | Cause / Fix |
|---------|-------------|
| `MONGODB_URI is not defined` | Missing `.env` or variable not set on Vercel |
| `Firebase Admin credentials missing` | Missing `FIREBASE_PRIVATE_KEY` — remember to keep `\n` escapes |
| `Failed to parse private key` | `FIREBASE_PRIVATE_KEY` pasted without `\n` or without quotes |
| `/api/*` returns 404 in dev | Run `npm run dev` (which uses `vercel dev`) — not `vite dev` |
| Frontend shows old build | Run `vercel --prod` again, or hard-refresh (Cmd/Ctrl + Shift + R) |
| Chatbot fails with model error | Check `GROQ_API_KEY` and the model name in Admin → Settings |
| Razorpay signature fails | `RAZORPAY_KEY_SECRET` mismatch between server and Razorpay dashboard |
| Products empty on production | Run `npm run seed` with production `MONGODB_URI` |
| `vercel dev` runs but `/api` fails | Ensure `vercel link` succeeded and you're in the repo root |
| Custom domain shows 404 | Wait for DNS propagation (up to 48 h) |

---

## 📸 Key Features

### Storefront
- 🎠 Animated 4-slide hero carousel (brand, home, TOTO, UPS)
- 📜 Auto-scrolling product marquee
- 🏠 6-category product grid
- 🧮 Interactive inverter + battery calculator with real product recommendations
- 🛒 Cart with persistent localStorage state
- 💳 Checkout with Razorpay + Cash on Delivery
- 💬 Floating AI chatbot (Groq-powered)
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
