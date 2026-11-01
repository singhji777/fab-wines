'use strict';
if (+process.versions.node.split('.')[0] < 18) { console.error('\nFab Wines needs Node.js 18 or newer. You have ' + process.version + '. Install the LTS version from https://nodejs.org and try again.\n'); process.exit(1); }
/* Fab Wines: storefront + API + owner dashboard. Express + MongoDB. */
const fs = require('fs');
/* optional .env file (KEY=value per line) so you can keep your MongoDB address out of the code */
try { fs.readFileSync(require('path').join(__dirname, '.env'), 'utf8').split(/\r?\n/).forEach(l => { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/); if (m && !l.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); }); } catch (e) {}
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'fabwines';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'adityasingh11may@gmail.com').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'FabAdmin@2026';

let db, C = {}, SECRET = process.env.JWT_SECRET || '';

/* ---------- helpers ---------- */
const now = () => new Date().toISOString();
const hash = (pw, salt = crypto.randomBytes(16).toString('hex')) => salt + ':' + crypto.scryptSync(pw, salt, 32).toString('hex');
const verify = (pw, h) => { const [s, k] = String(h).split(':'); const t = crypto.scryptSync(pw, s, 32).toString('hex'); return t.length === k.length && crypto.timingSafeEqual(Buffer.from(t), Buffer.from(k)); };
const b64 = s => Buffer.from(s).toString('base64url');
const sign = p => { const body = b64(JSON.stringify({ ...p, exp: Date.now() + 30 * 864e5 })); return body + '.' + crypto.createHmac('sha256', SECRET).update(body).digest('base64url'); };
const unsign = t => { try { const [b, s] = String(t).split('.'); const e = crypto.createHmac('sha256', SECRET).update(b).digest('base64url'); if (s.length !== e.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(e))) return null; const p = JSON.parse(Buffer.from(b, 'base64url').toString()); return p.exp > Date.now() ? p : null; } catch { return null; } };
const clean = (s, n = 200) => String(s == null ? '' : s).replace(/[<>]/g, '').trim().slice(0, n);
const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const validPhone = p => /^[+0-9][0-9 ]{8,14}$/.test(p);
const age = dob => { const d = new Date(dob); if (isNaN(d)) return 0; const n = new Date(); let a = n.getFullYear() - d.getFullYear(); if (n < new Date(n.getFullYear(), d.getMonth(), d.getDate())) a--; return a; };
const MIN_AGE = 21, FREE_DELIVERY = 5000, DELIVERY_FEE = 250;
const oid = x => { try { return new ObjectId(String(x)); } catch { return null; } };
const pub = u => u && { id: String(u._id), name: u.name, email: u.email, phone: u.phone, address: u.address, city: u.city, pincode: u.pincode, role: u.role };
const strip = o => { if (!o) return o; const { _id, ...r } = o; return { id: _id, ...r }; };

/* simple rate limiter */
const hits = new Map();
function limit(key, max, ms) { const t = Date.now(); const a = (hits.get(key) || []).filter(x => t - x < ms); a.push(t); hits.set(key, a); return a.length > max; }

/* ---------- sample catalogue ---------- */
const SEED = [
  ['sassicaia','img/n1.webp','Sassicaia','Red','Italy · Tuscan Red · Bolgheri','2018',28500,34000,'Icon','A benchmark Tuscan red. Dark fruit, cedar and a long, refined finish.',12,'13.5%','750 ml','Roast lamb, aged cheese, wild mushrooms'],
  ['tignanello','img/n2.webp','Tignanello','Red','Italy · Tuscan Red · Chianti Classico','2018',14500,17500,'Signature','Cherry, leather and warm spice with a savoury, balanced finish.',18,'14%','750 ml','Grilled steak, tomato pasta, hard cheese'],
  ['ornellaia','img/n3.webp','Ornellaia','Red','Italy · Bolgheri Superiore','2017',24500,29500,'Reserve','Dark berries, graphite and silky tannins. Made for slow dinners.',9,'14.5%','750 ml','Beef short rib, truffle dishes'],
  ['grandnapa','img/b01.webp','Grand Napa Chardonnay','White','California · Chardonnay · Los Carneros','2025',6200,7200,'','Stone fruit, citrus and a creamy finish.',30,'13.5%','750 ml','Butter chicken, grilled prawns, creamy pasta'],
  ['vajra','img/b02.webp','Vajra Barolo Albe','Red','Italy · Nebbiolo · Barolo','2022',5400,6300,'','Rose, cherry and firm, fine tannins. Best with slow food.',22,'14%','750 ml','Mushroom risotto, braised lamb'],
  ['silveroak','img/b03.webp','Silver Oak Cabernet','Red','California · Cabernet Sauvignon · Alexander Valley','2021',18500,22000,'Signature','Dark fruit, vanilla and a long, polished finish.',10,'14.5%','750 ml','Ribeye, lamb chops, dark chocolate'],
  ['graham','img/b04.webp','Graham\'s 20 Year Tawny','Port','Portugal · Port · 20 year old','NV',9800,11500,'Reserve','Dried fig, toasted nuts and caramel. A slow evening pour.',14,'20%','750 ml','Walnuts, blue cheese, crème brûlée'],
  ['dobbes','img/b05.webp','Dobbes Grand Assemblage','Red','Oregon · Pinot Noir','2022',3800,4500,'','Red cherry, earth and silky texture.',26,'13.5%','750 ml','Roast duck, salmon, paneer tikka'],
  ['caymus','img/b06.webp','Caymus Cabernet','Red','California · Cabernet Sauvignon · Napa Valley','2023',16500,19400,'Limited','Ripe black fruit and a rich, generous finish.',6,'14.8%','750 ml','Prime rib, mutton biryani'],
  ['corbin','img/b07.webp','Chateau Saint-Andre Corbin','Red','France · Bordeaux Red Blend','2023',3200,3700,'','Plum, cedar and a soft, savoury edge.',40,'13.5%','750 ml','Roast chicken, kebabs, cheddar'],
  ['cloudy','img/b08.webp','Cloudy Bay Sauvignon Blanc','White','New Zealand · Sauvignon Blanc','2025',3600,4300,'New','Zesty citrus, passion fruit and fresh herbs.',35,'13%','750 ml','Oysters, goat cheese, Thai green curry'],
  ['artemis','img/b09.webp','Stag\'s Leap Artemis','Red','California · Cabernet Sauvignon · Napa Valley','2023',12500,14600,'','Blackcurrant, spice and a smooth, structured finish.',11,'14.5%','750 ml','Grilled steak, aged gouda'],
  ['rombauer','img/b10.webp','Rombauer Chardonnay','White','California · Chardonnay','2024',7800,9100,'','Ripe peach, butter and toasted oak.',16,'14.5%','750 ml','Lobster, roast chicken, corn chowder'],
  ['faust','img/b11.webp','Faust Cabernet','Red','California · Cabernet Sauvignon · Napa Valley','2023',7200,8400,'','Black cherry, cocoa and polished tannins.',19,'14.5%','750 ml','Burgers, barbecue, tandoori lamb'],
  ['angel','img/b12.webp','Whispering Angel Rosé','Rosé','France · Rosé · Provence','2025',3900,4600,'Favourite','Strawberry, peach and a dry, crisp finish.',44,'13%','750 ml','Salads, sushi, tandoori prawns'],
  ['buenavista','img/b13.webp','Chateau Buena Vista Cabernet','Red','California · Cabernet Sauvignon · Napa Valley','2022',5800,6800,'','Cassis, tobacco and a long finish.',17,'14%','750 ml','Lamb curry, grilled vegetables'],
  ['pineridge','img/b14.webp','Pine Ridge Cabernet','Red','California · Cabernet Sauvignon · Napa Valley','2023',6600,7700,'','Blackberry, dark chocolate and soft spice.',20,'14.5%','750 ml','Pepper steak, mushroom dishes'],
  ['fevre','img/b15.webp','William Fevre Chablis','White','France · Chardonnay · Chablis','2023',4800,5600,'','Green apple, flint and bright acidity.',21,'12.5%','750 ml','Seafood platter, fish tikka, sushi'],
  ['farniente','img/b16.webp','Far Niente Chardonnay','White','California · Chardonnay · Napa Valley','2024',11500,13400,'Limited','Pear, citrus blossom and a creamy, elegant finish.',8,'14%','750 ml','Crab cakes, creamy risotto']
];

async function connect() {
  const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 6000 });
  try { await client.connect(); await client.db('admin').command({ ping: 1 }); }
  catch (e) {
    console.error('\nCould not connect to MongoDB at ' + MONGODB_URI.replace(/\/\/[^@]*@/, '//***@') + '\n  ' + e.message + '\n\nFix: start MongoDB (the "MongoDB" Windows service, or run mongod), or set MONGODB_URI to your Atlas connection string.\n');
    process.exit(1);
  }
  db = client.db(MONGODB_DB);
  ['users', 'products', 'orders', 'wishlist', 'coupons', 'notifications', 'enquiries', 'subscribers', 'meta'].forEach(n => { C[n] = db.collection(n); });
  await C.users.createIndex({ email: 1 }, { unique: true });
  await C.orders.createIndex({ user_id: 1 }); await C.orders.createIndex({ created: -1 });
  await C.wishlist.createIndex({ user_id: 1, product_id: 1 }, { unique: true });
  await C.notifications.createIndex({ user_id: 1 });
  if (!SECRET) {
    let m = await C.meta.findOne({ _id: 'secret' });
    if (!m) { await C.meta.updateOne({ _id: 'secret' }, { $setOnInsert: { value: crypto.randomBytes(32).toString('hex') } }, { upsert: true }); m = await C.meta.findOne({ _id: 'secret' }); }
    SECRET = m.value;
  }
  if (process.argv.includes('--reset-catalogue')) { await C.products.deleteMany({}); await C.coupons.deleteMany({}); console.log('Catalogue cleared; reloading the sample wines and coupons.'); }
  if (!(await C.products.countDocuments())) {
    await C.products.insertMany(SEED.map((p, i) => ({ _id: p[0], img: p[1], name: p[2], type: p[3], grape: p[4], year: p[5], price: p[6], mrp: p[7], badge: p[8], notes: p[9], stock: p[10], abv: p[11], volume: p[12], pairing: p[13], active: true, sort: i })));
  }
  if (!(await C.coupons.countDocuments())) {
    await C.coupons.insertMany([{ _id: 'WELCOME5', pct: 5, min: 3000, note: 'Extra 5% off on orders above ₹3,000', active: true }, { _id: 'FABGOLD', pct: 8, min: 15000, note: 'Extra 8% off on orders above ₹15,000', active: true }, { _id: 'CELEBRATE', pct: 6, min: 8000, note: 'Extra 6% off on orders above ₹8,000', active: true }]);
  }
  if (!(await C.users.findOne({ email: ADMIN_EMAIL })))
    await C.users.insertOne({ name: 'Aditya Singh', email: ADMIN_EMAIL, phone: '+91 91100 40511', pass: hash(ADMIN_PASSWORD), dob: '2000-01-01', address: '', city: '', pincode: '', role: 'admin', created: now() });
}

/* ---------- app ---------- */
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use((req, res, next) => { res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'SAMEORIGIN', 'Referrer-Policy': 'strict-origin-when-cross-origin' }); next(); });

const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(e => { console.error(e); if (!res.headersSent) res.status(500).json({ error: 'Something went wrong. Please try again.' }); });
const bad = (res, m, c = 400) => res.status(c).json({ error: m });
const auth = wrap(async (req, res, next) => {
  const p = unsign((req.headers.authorization || '').replace('Bearer ', '')); const id = p && oid(p.id);
  const u = id && await C.users.findOne({ _id: id });
  if (!u) return bad(res, 'Please log in to continue.', 401);
  req.user = u; next();
});
const admin = (req, res, next) => auth(req, res, () => req.user.role === 'admin' ? next() : bad(res, 'Owner access only.', 403));

const products = async () => (await C.products.find({ active: true }).sort({ sort: 1, name: 1 }).toArray()).map(view);
const view = p => { const { _id, ...r } = p; return { id: _id, ...r, pct: Math.round((1 - p.price / p.mrp) * 100) }; };

const PUB = fs.existsSync(path.join(__dirname, 'public')) ? path.join(__dirname, 'public') : __dirname;
const ALLOW = /^(app\.js|app\.css|fonts\.css|admin\.html|logo\.png|[a-z0-9]+\.webp)$/;
app.get(['/', '/index.html'], wrap(async (req, res) => {
  const html = fs.readFileSync(path.join(PUB, 'index.html'), 'utf8').replace('/*__WINES__*/[]', JSON.stringify(await products()).replace(/</g, '\\u003c'));
  res.type('html').send(html);
}));
/* only an allowlist of public files is served, so server code is never exposed */
app.get('/fonts/:f', (req, res, next) => { const f = req.params.f; const p = path.join(PUB, 'fonts', f); if (!/^[a-z0-9-]+\.woff2$/.test(f) || !fs.existsSync(p)) return next(); res.set('Cache-Control', 'public, max-age=31536000, immutable'); res.sendFile(p); });
app.get(['/img/:f', '/:f'], (req, res, next) => {
  const f = req.params.f; if (!ALLOW.test(f)) return next();
  const c = [path.join(PUB, 'img', f), path.join(PUB, f)].filter(p => fs.existsSync(p));
  if (!c.length) return next();
  res.set('Cache-Control', 'public, max-age=3600'); res.sendFile(c[0]);
});

app.get('/api/health', wrap(async (req, res) => { await db.command({ ping: 1 }); res.json({ ok: true, products: await C.products.countDocuments(), orders: await C.orders.countDocuments() }); }));
app.get('/api/products', wrap(async (req, res) => res.json(await products())));
app.get('/api/coupons', wrap(async (req, res) => res.json((await C.coupons.find({ active: true }).toArray()).map(c => ({ code: c._id, pct: c.pct, min: c.min, note: c.note })))));

/* auth */
app.post('/api/auth/register', wrap(async (req, res) => {
  if (limit('reg' + req.ip, 8, 6e5)) return bad(res, 'Too many attempts. Try again in a few minutes.', 429);
  const b = req.body || {}, name = clean(b.name, 80), email = clean(b.email, 120).toLowerCase(), phone = clean(b.phone, 20), pw = String(b.password || ''), dob = clean(b.dob, 10);
  if (name.length < 2) return bad(res, 'Please enter your full name.');
  if (!validEmail(email)) return bad(res, 'Please enter a valid email.');
  if (!validPhone(phone)) return bad(res, 'Please enter a valid phone number.');
  if (pw.length < 8) return bad(res, 'Password must be at least 8 characters.');
  if (age(dob) < MIN_AGE) return bad(res, 'You must be at least ' + MIN_AGE + ' years old to create an account.');
  let r;
  try { r = await C.users.insertOne({ name, email, phone, pass: hash(pw), dob, address: '', city: '', pincode: '', role: 'customer', created: now() }); }
  catch (e) { if (e.code === 11000) return bad(res, 'An account with this email already exists. Please log in.', 409); throw e; }
  const u = await C.users.findOne({ _id: r.insertedId });
  await C.notifications.insertOne({ user_id: String(u._id), text: 'Welcome to Fab Wines! Use code WELCOME5 on your first order.', read: false, created: now() });
  res.json({ token: sign({ id: String(u._id) }), user: pub(u) });
}));
app.post('/api/auth/login', wrap(async (req, res) => {
  if (limit('log' + req.ip, 15, 6e5)) return bad(res, 'Too many attempts. Try again in a few minutes.', 429);
  const email = clean(req.body && req.body.email, 120).toLowerCase(), u = await C.users.findOne({ email });
  if (!u || !verify(String((req.body || {}).password || ''), u.pass)) return bad(res, 'Email or password is not correct.', 401);
  res.json({ token: sign({ id: String(u._id) }), user: pub(u) });
}));
app.get('/api/me', auth, wrap(async (req, res) => {
  const uid = String(req.user._id);
  const delivered = await C.orders.find({ user_id: uid, status: 'Delivered' }).project({ total: 1 }).toArray();
  res.json({ user: pub(req.user), points: delivered.reduce((s, o) => s + Math.floor(o.total / 100), 0), wishlist: (await C.wishlist.find({ user_id: uid }).toArray()).map(r => r.product_id), unread: await C.notifications.countDocuments({ user_id: uid, read: false }) });
}));
app.put('/api/me', auth, wrap(async (req, res) => {
  const b = req.body || {}, name = clean(b.name, 80), phone = clean(b.phone, 20);
  if (name.length < 2) return bad(res, 'Please enter your name.');
  if (!validPhone(phone)) return bad(res, 'Please enter a valid phone number.');
  await C.users.updateOne({ _id: req.user._id }, { $set: { name, phone, address: clean(b.address, 200), city: clean(b.city, 60), pincode: clean(b.pincode, 10) } });
  res.json({ user: pub(await C.users.findOne({ _id: req.user._id })) });
}));
app.put('/api/me/password', auth, wrap(async (req, res) => {
  const b = req.body || {};
  if (!verify(String(b.current || ''), req.user.pass)) return bad(res, 'Current password is not correct.', 401);
  if (String(b.next || '').length < 8) return bad(res, 'New password must be at least 8 characters.');
  await C.users.updateOne({ _id: req.user._id }, { $set: { pass: hash(String(b.next)) } });
  res.json({ ok: true });
}));

/* wishlist */
app.post('/api/wishlist/:id', auth, wrap(async (req, res) => {
  if (!(await C.products.findOne({ _id: req.params.id }))) return bad(res, 'Unknown wine.', 404);
  await C.wishlist.updateOne({ user_id: String(req.user._id), product_id: req.params.id }, { $setOnInsert: { created: now() } }, { upsert: true }); res.json({ ok: true });
}));
app.delete('/api/wishlist/:id', auth, wrap(async (req, res) => { await C.wishlist.deleteOne({ user_id: String(req.user._id), product_id: req.params.id }); res.json({ ok: true }); }));

/* pricing: used by quote and order so numbers always match */
async function price(items, code) {
  if (!Array.isArray(items) || !items.length) throw new Error('Your cart is empty.');
  const lines = []; let qty = 0, sub = 0;
  for (const it of items.slice(0, 40)) {
    const p = await C.products.findOne({ _id: clean(it.id, 40), active: true }); const n = Math.floor(+it.q);
    if (!p || !(n > 0) || n > 24) throw new Error('One of the items in your cart is not available.');
    if (p.stock < n) throw new Error(p.name + ': ' + (p.stock > 0 ? 'only ' + p.stock + ' left in stock.' : 'sold out.'));
    lines.push({ id: p._id, name: p.name, year: p.year, type: p.type, price: p.price, q: n }); qty += n; sub += p.price * n;
  }
  const bundle = qty >= 3 ? Math.round(sub * 0.1) : 0;
  let discount = 0, applied = '';
  if (code) {
    const c = await C.coupons.findOne({ _id: clean(code, 20).toUpperCase(), active: true });
    if (!c) throw new Error('That coupon code is not valid.');
    if (sub - bundle < c.min) throw new Error('This coupon needs an order of at least ₹' + c.min.toLocaleString('en-IN') + '.');
    discount = Math.round((sub - bundle) * c.pct / 100); applied = c._id;
  }
  const after = sub - bundle - discount, delivery = after >= FREE_DELIVERY ? 0 : DELIVERY_FEE;
  return { lines, qty, subtotal: sub, bundle, coupon: applied, discount, delivery, total: after + delivery };
}
app.post('/api/quote', wrap(async (req, res) => { try { res.json(await price(req.body.items, req.body.coupon)); } catch (e) { bad(res, e.message); } }));

/* orders */
const orderId = () => 'FW' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + crypto.randomInt(1000, 9999);
const STATUSES = ['Placed', 'Confirmed', 'Packed', 'Out for delivery', 'Delivered', 'Cancelled'];
const orderView = o => strip(o);
/* order placement runs one at a time so stock can never be oversold, even before the database-level check */
let queue = Promise.resolve();
const serial = fn => { const r = queue.then(fn, fn); queue = r.catch(() => {}); return r; };
async function placeOrder(req, res) {
  const b = req.body || {}, name = clean(b.name, 80), phone = clean(b.phone, 20), address = clean(b.address, 200), city = clean(b.city, 60), pin = clean(b.pincode, 10);
  if (name.length < 2 || !validPhone(phone) || address.length < 8 || city.length < 2 || !/^[0-9]{6}$/.test(pin)) return bad(res, 'Please fill in your name, phone, full address, city and 6-digit pincode.');
  if (!b.ageConfirm) return bad(res, 'Please confirm that you are of legal drinking age.');
  if (age(req.user.dob) < MIN_AGE) return bad(res, 'You must be at least ' + MIN_AGE + ' years old to order.');
  const payment = ['Cash on delivery', 'UPI on delivery', 'Card on delivery'].includes(b.payment) ? b.payment : 'Cash on delivery';
  let p; try { p = await price(b.items, b.coupon); } catch (e) { return bad(res, e.message); }
  /* take stock atomically, line by line; undo everything if any line fails */
  const taken = [];
  for (const l of p.lines) {
    const r = await C.products.updateOne({ _id: l.id, stock: { $gte: l.q } }, { $inc: { stock: -l.q } });
    if (!r.matchedCount) { for (const t of taken) await C.products.updateOne({ _id: t.id }, { $inc: { stock: t.q } }); return bad(res, l.name + ' just sold out. Please update your cart.'); }
    taken.push(l);
  }
  const id = orderId(), t = now(), uid = String(req.user._id);
  try {
    await C.orders.insertOne({ _id: id, user_id: uid, name, phone, email: req.user.email, address, city, pincode: pin, payment, items: p.lines, subtotal: p.subtotal, bundle: p.bundle, coupon: p.coupon, discount: p.discount, delivery: p.delivery, total: p.total, status: 'Placed', created: t, history: [{ status: 'Placed', at: t }] });
  } catch (e) { for (const l of taken) await C.products.updateOne({ _id: l.id }, { $inc: { stock: l.q } }); throw e; }
  if (!req.user.address) await C.users.updateOne({ _id: req.user._id }, { $set: { address, city, pincode: pin, phone } });
  await C.notifications.insertOne({ user_id: uid, text: 'Order ' + id + ' placed. We will confirm it shortly.', read: false, created: t });
  res.json({ order: orderView(await C.orders.findOne({ _id: id })) });
}
app.post('/api/orders', auth, wrap((req, res) => serial(() => placeOrder(req, res))));
app.get('/api/orders', auth, wrap(async (req, res) => res.json((await C.orders.find({ user_id: String(req.user._id) }).sort({ created: -1 }).toArray()).map(orderView))));
app.post('/api/orders/:id/cancel', auth, wrap(async (req, res) => {
  const o = await C.orders.findOne({ _id: req.params.id, user_id: String(req.user._id) });
  if (!o) return bad(res, 'Order not found.', 404);
  if (!['Placed', 'Confirmed'].includes(o.status)) return bad(res, 'This order can no longer be cancelled.');
  await setStatus(o, 'Cancelled'); res.json({ order: orderView(await C.orders.findOne({ _id: o._id })) });
}));
app.get('/api/track', wrap(async (req, res) => {
  if (limit('trk' + req.ip, 30, 6e5)) return bad(res, 'Too many lookups. Try again shortly.', 429);
  const id = clean(req.query.id, 20).toUpperCase(), ph = clean(req.query.phone, 20).replace(/\D/g, '').slice(-10);
  const o = await C.orders.findOne({ _id: id });
  if (!o || !ph || o.phone.replace(/\D/g, '').slice(-10) !== ph) return bad(res, 'We could not find an order with those details.', 404);
  res.json({ order: orderView(o) });
}));
async function setStatus(o, status) {
  const r = await C.orders.updateOne({ _id: o._id, status: o.status }, { $set: { status }, $push: { history: { status, at: now() } } });
  if (!r.matchedCount) return;
  if (status === 'Cancelled' && o.status !== 'Cancelled') for (const l of o.items) await C.products.updateOne({ _id: l.id }, { $inc: { stock: l.q } });
  const msg = { Confirmed: 'is confirmed', Packed: 'has been packed', 'Out for delivery': 'is out for delivery', Delivered: 'was delivered. Enjoy!', Cancelled: 'was cancelled' }[status];
  if (msg && o.user_id) await C.notifications.insertOne({ user_id: o.user_id, text: 'Order ' + o._id + ' ' + msg + '.', read: false, created: now() });
}

/* notifications */
app.get('/api/notifications', auth, wrap(async (req, res) => {
  const uid = String(req.user._id);
  res.json((await C.notifications.find({ user_id: uid }).sort({ _id: -1 }).limit(30).toArray()).map(strip));
  await C.notifications.updateMany({ user_id: uid, read: false }, { $set: { read: true } });
}));

/* contact */
app.post('/api/enquiries', wrap(async (req, res) => {
  if (limit('enq' + req.ip, 6, 6e5)) return bad(res, 'Too many messages. Please try again later.', 429);
  const b = req.body || {}, name = clean(b.name, 80), email = clean(b.email, 120), msg = clean(b.message, 1000);
  if (name.length < 2 || !validEmail(email)) return bad(res, 'Please enter your name and a valid email.');
  await C.enquiries.insertOne({ name, email, phone: clean(b.phone, 20), message: msg || '(no message)', created: now() });
  res.json({ ok: true });
}));
app.post('/api/subscribe', wrap(async (req, res) => {
  const e = clean(req.body && req.body.email, 120).toLowerCase(); if (!validEmail(e)) return bad(res, 'Please enter a valid email.');
  await C.subscribers.updateOne({ _id: e }, { $setOnInsert: { created: now() } }, { upsert: true }); res.json({ ok: true });
}));

/* ---------- owner dashboard API ---------- */
app.get('/api/admin/stats', admin, wrap(async (req, res) => {
  const all = await C.orders.find({}).project({ total: 1, status: 1, created: 1, items: 1 }).toArray();
  const live = all.filter(o => o.status !== 'Cancelled'), today = new Date().toISOString().slice(0, 10);
  const byStatus = {}; all.forEach(o => { byStatus[o.status] = (byStatus[o.status] || 0) + 1; });
  const dayMap = {}; live.forEach(o => { const d = o.created.slice(0, 10); (dayMap[d] = dayMap[d] || { d, s: 0, c: 0 }); dayMap[d].s += o.total; dayMap[d].c++; });
  const top = {}; live.forEach(o => o.items.forEach(l => { top[l.name] = (top[l.name] || 0) + l.q; }));
  const tl = live.filter(o => o.created >= today);
  res.json({
    revenue: live.reduce((s, o) => s + o.total, 0), orders: live.length, todayRevenue: tl.reduce((s, o) => s + o.total, 0), todayOrders: tl.length,
    customers: await C.users.countDocuments({ role: 'customer' }), enquiries: await C.enquiries.countDocuments(),
    byStatus: Object.entries(byStatus).map(([status, c]) => ({ status, c })), days: Object.values(dayMap).sort((a, b) => a.d < b.d ? -1 : 1).slice(-14),
    top: Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 6),
    low: (await C.products.find({ stock: { $lte: 8 } }).sort({ stock: 1 }).toArray()).map(p => ({ id: p._id, name: p.name, stock: p.stock }))
  });
}));
app.get('/api/admin/orders', admin, wrap(async (req, res) => res.json((await C.orders.find({}).sort({ created: -1 }).limit(300).toArray()).map(orderView))));
app.put('/api/admin/orders/:id', admin, wrap(async (req, res) => {
  const o = await C.orders.findOne({ _id: req.params.id }), s = req.body && req.body.status;
  if (!o) return bad(res, 'Order not found.', 404);
  if (!STATUSES.includes(s)) return bad(res, 'Unknown status.');
  if (o.status !== s) await setStatus(o, s);
  res.json({ order: orderView(await C.orders.findOne({ _id: o._id })) });
}));
app.get('/api/admin/products', admin, wrap(async (req, res) => res.json((await C.products.find({}).sort({ sort: 1, name: 1 }).toArray()).map(p => { const { _id, ...r } = p; return { id: _id, ...r }; }))));
app.put('/api/admin/products/:id', admin, wrap(async (req, res) => {
  const p = await C.products.findOne({ _id: req.params.id }); if (!p) return bad(res, 'Wine not found.', 404);
  const b = req.body || {}, n = (v, d) => Number.isFinite(+v) && +v >= 0 && v !== '' ? Math.round(+v) : d;
  const pr = n(b.price, p.price), mrp = n(b.mrp, p.mrp);
  if (pr <= 0 || mrp < pr) return bad(res, 'MRP must be at least the selling price.');
  await C.products.updateOne({ _id: p._id }, { $set: { name: clean(b.name, 80) || p.name, price: pr, mrp, stock: n(b.stock, p.stock), badge: clean(b.badge, 20), notes: clean(b.notes, 300) || p.notes, active: !(b.active === false || b.active === 0 || b.active === 'false') } });
  res.json({ product: strip(await C.products.findOne({ _id: p._id })) });
}));
app.post('/api/admin/products', admin, wrap(async (req, res) => {
  const b = req.body || {}, name = clean(b.name, 80), pr = Math.round(+b.price), mrp = Math.round(+b.mrp || +b.price);
  if (!name || !(pr > 0) || mrp < pr) return bad(res, 'Name, price and a valid MRP are required.');
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 24) + crypto.randomInt(10, 99);
  const type = ['Red', 'White', 'Rosé', 'Port'].includes(b.type) ? b.type : 'Red';
  await C.products.insertOne({ _id: id, img: 'img/b03.webp', name, type, grape: clean(b.grape, 120) || 'Region · Grape', year: clean(b.year, 6) || 'NV', price: pr, mrp, badge: clean(b.badge, 20), notes: clean(b.notes, 300) || 'New arrival.', stock: Math.round(+b.stock) || 0, abv: clean(b.abv, 8) || '13.5%', volume: '750 ml', pairing: clean(b.pairing, 160), active: true, sort: 999 });
  res.json({ product: strip(await C.products.findOne({ _id: id })) });
}));
app.get('/api/admin/enquiries', admin, wrap(async (req, res) => res.json((await C.enquiries.find({}).sort({ _id: -1 }).limit(200).toArray()).map(strip))));
app.get('/api/admin/customers', admin, wrap(async (req, res) => {
  const users = await C.users.find({ role: 'customer' }).sort({ _id: -1 }).limit(300).toArray();
  const orders = await C.orders.find({ status: { $ne: 'Cancelled' } }).project({ user_id: 1, total: 1 }).toArray();
  res.json(users.map(u => { const mine = orders.filter(o => o.user_id === String(u._id)); return { id: String(u._id), name: u.name, email: u.email, phone: u.phone, created: u.created, orders: mine.length, spent: mine.reduce((s, o) => s + o.total, 0) }; }));
}));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

function openBrowser(port) {
  if (!process.argv.includes('--open')) return;
  const url = 'http://localhost:' + port, cmd = process.platform === 'win32' ? 'start "" "' + url + '"' : process.platform === 'darwin' ? 'open ' + url : 'xdg-open ' + url;
  require('child_process').exec(cmd, () => {});
}
function listen(port, tries) {
  const srv = app.listen(port, () => { openBrowser(port); console.log('\nFab Wines is running (MongoDB: ' + MONGODB_DB + ').\n  Shop:  http://localhost:' + port + '\n  Owner: http://localhost:' + port + '/admin.html\n'); });
  srv.on('error', e => { if (e.code === 'EADDRINUSE' && tries > 0) { console.log('Port ' + port + ' is busy, trying ' + (port + 1) + '...'); listen(port + 1, tries - 1); } else { console.error('Could not start the server:', e.message); process.exit(1); } });
}
connect().then(async () => {
  if (process.argv.includes('--seed') || process.argv.includes('--reset-catalogue')) {
    console.log('\nDatabase "' + MONGODB_DB + '" is ready:\n  wines: ' + await C.products.countDocuments() + '\n  coupons: ' + await C.coupons.countDocuments() + '\n  owner account: ' + ADMIN_EMAIL + '\n');
    process.exit(0);
  }
  listen(+PORT, 10);
}).catch(e => { console.error(e); process.exit(1); });
