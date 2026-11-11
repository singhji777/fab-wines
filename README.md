# Fab Wines

Full-stack wine shop: storefront, accounts, cart, checkout (pay on delivery), order tracking, wishlist, coupons, rewards, notifications and an owner dashboard.

**Stack:** Node.js + Express + **Postgres (Neon)**, plain HTML/CSS/JS front end. Deployed on Vercel.

**Live site:** LIVE_LINK_PENDING

## Run it locally
1. Create a free Postgres database at [neon.com](https://neon.com) and copy its connection string.
2. Copy `.env.example` to `.env`, set `DATABASE_URL` and `ADMIN_PASSWORD`.
3. `npm install` then `npm start`, and open http://localhost:3000. Owner dashboard: `/admin.html`.

The first start creates the tables and loads 19 sample wines, 3 coupons and the owner account. `npm run seed` loads them without starting the shop; `npm run seed:reset` reloads only the sample wines and coupons.

## Deploy on Vercel
Import the repo, add the environment variables `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` and `JWT_SECRET`, and deploy. `vercel.json` runs the server as a serverless function.

## What works
- Age gate, 21+ sign-up, login (scrypt passwords, signed tokens)
- Catalogue with filters, sort, wine pages, wishlist
- Cart with 10% bundle (3+ bottles), coupons (WELCOME5, FABGOLD, CELEBRATE), free delivery over Rs 5,000
- Checkout with server-side pricing and atomic stock control (no overselling); order history, cancel (restocks), re-order, tracking timeline, track by order number and phone
- Notifications, rewards points, profile and password change, customer care form, newsletter
- Owner dashboard: sales chart, best sellers, low stock, order status updates, edit price/MRP/stock/visibility, add wines, customers, messages

## Tables
One table per collection (`c_users`, `c_products`, `c_orders`, `c_wishlist`, `c_coupons`, `c_notifications`, `c_enquiries`, `c_subscribers`, `c_reviews`, `c_meta`), each holding a JSON document. Stock is taken with row locks, so a bottle can never be oversold. Health check: `/api/health`.

## Before real selling
- Prices, MRPs, stock and notes are sample data. Edit them in the dashboard.
- Online alcohol sale is restricted in many Indian states. Get the right excise licence first.
- Payments are cash/UPI/card on delivery. Add a payment gateway later if your licence allows.
- Bottle photos come from other stores. Replace with photos you own.

## Deploy
Docker or Render (`render.yaml`). Set `DATABASE_URL` (Neon), `ADMIN_PASSWORD`, `JWT_SECRET` as environment variables.
