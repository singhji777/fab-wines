# Fab Wines

Full-stack wine shop: storefront, accounts, cart, checkout (pay on delivery), order tracking, wishlist, coupons, rewards, notifications and an owner dashboard.

**Stack:** Node.js + Express + **MongoDB**, plain HTML/CSS/JS front end.

## 1. Start MongoDB
- **Local MongoDB (Windows):** it runs as the "MongoDB" service after installing MongoDB Community Server. If not, open Services and start "MongoDB", or run `mongod`.
- **MongoDB Atlas (cloud):** copy your connection string and put it in `.env` (see below).

## 2. Run the shop
1. Open the `fabwines` folder in VS Code (the one containing `server.js`).
2. Copy `.env.example` to `.env`, then set `MONGODB_URI` (default `mongodb://127.0.0.1:27017` works for local MongoDB) and `ADMIN_PASSWORD`.
3. Terminal: `npm install` then `npm start`. (If PowerShell says "scripts is disabled", use a Command Prompt terminal or `npm.cmd`.)
4. Open the address printed (http://localhost:3000). Owner dashboard: `/admin.html`.

**Easiest on Windows:** double-click `START_FAB_WINES.bat`. It installs Node.js and MongoDB if missing, creates the settings file, loads the wines into MongoDB, starts the shop and opens your browser. (`npm run go` does the same start-and-open on any computer.)

The first start creates the database `fabwines` with 19 sample wines, 3 coupons and your owner account. Do not open `index.html` directly or use Live Server; the shop needs the server.

## Loading the data into MongoDB
Starting the shop for the first time loads everything automatically (19 wines, 3 coupons, your owner account). To load it without starting the shop run `npm run seed`. To wipe and reload only the sample wines and coupons (orders and customers are kept) run `npm run seed:reset`.

## What works
- Age gate, 21+ sign-up, login (scrypt passwords, signed tokens)
- Catalogue with filters, sort, wine pages, wishlist
- Cart with 10% bundle (3+ bottles), coupons (WELCOME5, FABGOLD, CELEBRATE), free delivery over Rs 5,000
- Checkout with server-side pricing and atomic stock control (no overselling); order history, cancel (restocks), re-order, tracking timeline, track by order number and phone
- Notifications, rewards points, profile and password change, customer care form, newsletter
- Owner dashboard: sales chart, best sellers, low stock, order status updates, edit price/MRP/stock/visibility, add wines, customers, messages

## Collections
users, products, orders, wishlist, coupons, notifications, enquiries, subscribers, meta. Health check: `/api/health`.

## Before real selling
- Prices, MRPs, stock and notes are sample data. Edit them in the dashboard.
- Online alcohol sale is restricted in many Indian states. Get the right excise licence first.
- Payments are cash/UPI/card on delivery. Add a payment gateway later if your licence allows.
- Bottle photos come from other stores. Replace with photos you own.

## Deploy
Docker or Render (`render.yaml`). Set `MONGODB_URI` (Atlas), `ADMIN_PASSWORD`, `JWT_SECRET` as environment variables.
