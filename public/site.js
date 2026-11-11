/* Fab Wines preview: shared cart and page behaviour. Needs wines.js first. */
(function () {
'use strict';
var W = window.WINES || [], byId = {};
W.forEach(function (w) { byId[w.id] = w; });
var OWNER = 'adityasingh11may@gmail.com';
var $ = function (s, r) { return (r || document).querySelector(s); };
var fmt = function (n) { return '₹' + new Intl.NumberFormat('en-IN').format(n); };
var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
var pctOff = function (w) { return Math.round((1 - w.price / w.mrp) * 100); };

/* ---------- reviews: real ones from reviews.js, plus any left in this browser ---------- */
var mine = {};
function reviewsOf(id) { return ((window.REVIEWS || {})[id] || []).concat(mine[id] || []); }
function rating(id) {
  var r = reviewsOf(id); if (!r.length) return { avg: 0, n: 0 };
  return { avg: r.reduce(function (s, x) { return s + x.stars; }, 0) / r.length, n: r.length };
}
function ratingHtml(id, big) {
  var r = rating(id), avg = Math.round(r.avg * 10) / 10;
  return '<div class="rating' + (big ? ' big' : '') + '"><span class="stars" style="--r:' + avg + '" role="img" aria-label="' + (r.n ? avg + ' out of 5 stars' : 'Not rated yet') + '"></span>'
    + '<span>' + (r.n ? avg.toFixed(1) + ' · ' + r.n + ' review' + (r.n > 1 ? 's' : '') : 'No reviews yet') + '</span></div>';
}

/* ---------- cart (kept in this browser only) ---------- */
var KEY = 'fabcart', cart = [];
function stockOf(id) { var w = byId[id]; return w ? Math.min(w.stock == null ? 24 : w.stock, 24) : 0; }
try { cart = JSON.parse(localStorage.getItem(KEY) || '[]').filter(function (c) { return byId[c.id] && c.q > 0 && stockOf(c.id) > 0; }); cart.forEach(function (c) { c.q = Math.min(c.q, stockOf(c.id)); }); } catch (e) { cart = []; }
function save() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} paintCount(); }
function qty() { return cart.reduce(function (s, c) { return s + c.q; }, 0); }
function paintCount() { [].forEach.call(document.querySelectorAll('[data-cart-count]'), function (e) { e.textContent = qty(); }); }
function line(id) { return cart.filter(function (c) { return c.id === id; })[0]; }
function toast(m) {
  var t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = m; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(function () { t.classList.remove('show'); }, 1800);
}
function add(id, q, quiet) {
  q = q || 1; var cap = stockOf(id), it = line(id), have = it ? it.q : 0;
  if (cap <= 0) { toast('Sorry, this wine is sold out'); return false; }
  if (have >= cap) { toast('Only ' + cap + ' in stock'); return false; }
  var take = Math.min(q, cap - have); if (it) it.q += take; else cart.push({ id: id, q: take }); save();
  if (!quiet) toast(take < q ? 'Only ' + cap + ' in stock, added what we have' : 'Added to your cart'); return true;
}
function totals() {
  var sub = 0, n = 0; cart.forEach(function (c) { sub += byId[c.id].price * c.q; n += c.q; });
  var bundle = n >= 3 ? Math.round(sub * 0.1) : 0, after = sub - bundle, delivery = n ? (after >= 5000 ? 0 : 250) : 0;
  return { sub: sub, n: n, bundle: bundle, after: after, delivery: delivery, total: after + delivery };
}

/* ---------- account and server calls ---------- */
var TOKEN = null, me = null; try { TOKEN = localStorage.getItem('fabtoken'); } catch (e) {}
function api(path, opt) {
  opt = opt || {}; var h = { 'Content-Type': 'application/json' }; if (TOKEN) h.Authorization = 'Bearer ' + TOKEN;
  return fetch(path, { method: opt.method || 'GET', headers: h, body: opt.body ? JSON.stringify(opt.body) : undefined }).then(function (r) {
    return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || 'Something went wrong. Please try again.'); e.status = r.status; throw e; } return j; });
  });
}
function setToken(t) { TOKEN = t; try { t ? localStorage.setItem('fabtoken', t) : localStorage.removeItem('fabtoken'); } catch (e) {} }
function paintAcct() { [].forEach.call(document.querySelectorAll('[data-acct]'), function (a) { a.textContent = me ? me.name.split(' ')[0] : 'Account'; }); }
function loadMe() {
  if (!TOKEN) return Promise.resolve(null);
  return api('/api/me').then(function (j) { me = j.user; me.points = j.points; me.unread = j.unread; return me; }).catch(function (e) { if (e.status === 401) setToken(null); return null; }).then(function (u) { paintAcct(); return u; });
}
var ready = loadMe();
var dateIn = function (iso) { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); };
function addBtn(w, big) {
  return (w.stock != null && w.stock <= 0) ? '<button class="btn' + (big ? '' : ' sm') + '" disabled>Sold out</button>' : '<button class="btn' + (big ? '' : ' sm') + '" data-add="' + w.id + '">Add to cart</button>';
}

/* ---------- shared bits ---------- */
function card(w, pick) {
  var media = pick
    ? '<div class="pic"><span class="tag">' + pctOff(w) + '% off</span><img src="' + w.img + '" alt="' + esc(w.name) + ' ' + esc(w.year) + '" loading="lazy"><span class="tick" aria-hidden="true">✓</span></div>'
    : '<a class="pic" href="wine.html?id=' + w.id + '"><span class="tag">' + pctOff(w) + '% off</span><img src="' + w.img + '" alt="' + esc(w.name) + ' ' + esc(w.year) + '" loading="lazy"></a>';
  return '<article class="pcard' + (pick ? ' pick-card' : '') + '" data-id="' + w.id + '"' + (pick ? ' tabindex="0" role="button" aria-pressed="false"' : '') + '>' + media
    + '<div class="body"><div class="meta">' + esc(w.type) + ' · ' + esc(w.region) + ' · ' + esc(w.year) + '</div>'
    + '<h3>' + (pick ? esc(w.name) : '<a href="wine.html?id=' + w.id + '">' + esc(w.name) + '</a>') + '</h3>'
    + ratingHtml(w.id)
    + '<p class="notes">' + esc(w.notes) + '</p>'
    + '<div class="row"><span class="price">' + fmt(w.price) + '<s>' + fmt(w.mrp) + '</s></span>'
    + (pick ? '' : addBtn(w)) + '</div></div></article>';
}
function tabs(host, items, current, onPick) {
  host.innerHTML = items.map(function (t) { return '<button class="tab" data-t="' + t + '" aria-pressed="' + (t === current) + '">' + t + '</button>'; }).join('');
  host.onclick = function (e) { var b = e.target.closest('.tab'); if (!b) return; [].forEach.call(host.querySelectorAll('.tab'), function (x) { x.setAttribute('aria-pressed', x === b); }); onPick(b.dataset.t); };
}
var TYPES = ['All', 'Red', 'White', 'Rosé', 'Port'];
var q = new URLSearchParams(location.search);

/* ---------- pages ---------- */
function winesPage() {
  var type = TYPES.indexOf(q.get('type')) > -1 ? q.get('type') : 'All', sort = 'featured';
  var grid = $('#grid'), count = $('#count');
  function draw() {
    var l = W.filter(function (w) { return type === 'All' || w.type === type; });
    if (sort === 'lo') l.sort(function (a, b) { return a.price - b.price; });
    if (sort === 'hi') l.sort(function (a, b) { return b.price - a.price; });
    if (sort === 'off') l.sort(function (a, b) { return pctOff(b) - pctOff(a); });
    count.textContent = l.length + ' wine' + (l.length === 1 ? '' : 's');
    grid.innerHTML = l.map(function (w) { return card(w); }).join('');
  }
  tabs($('#tabs'), TYPES, type, function (t) { type = t; draw(); });
  $('#sort').onchange = function () { sort = this.value; draw(); };
  draw();
}

function winePage() {
  var w = byId[q.get('id')] || W[0], n = 1, host = $('#wine');
  document.title = w.name + ' | Fab Wines';
  var abv = parseFloat(w.abv);
  var dishes = String(w.pair || '').split(/,\s*/).filter(Boolean);
  host.innerHTML = '<div class="show"><div class="show-pic"><img src="' + w.img + '" alt="' + esc(w.name) + ' bottle"></div><div>'
    + '<h1 class="h1like">' + esc(w.name) + '</h1><p class="where">' + esc(w.type) + ' · ' + esc(w.region) + '</p><div id="wrate">' + ratingHtml(w.id, true) + '</div><p class="notes">' + esc(w.notes) + '</p>'
    + '<div class="stats"><div><span>Alcohol</span><b>' + (isNaN(abv) ? esc(w.abv) : abv + '<small>%</small>') + '</b></div><div><span>Vintage</span><b>' + esc(w.year) + '</b></div><div><span>Bottle</span><b>750<small>ml</small></b></div><div><span>You save</span><b>' + pctOff(w) + '<small>%</small></b></div></div>'
    + (dishes.length ? '<div class="chips" aria-label="Pairs with">' + dishes.map(function (d) { return '<span class="chip">' + esc(d) + '</span>'; }).join('') + '</div>' : '')
    + '<div class="buy"><span class="price">' + fmt(w.price) + '<s>' + fmt(w.mrp) + '</s></span>'
    + '<span class="qty"><button id="m" aria-label="Fewer">−</button><span id="n">1</span><button id="p" aria-label="More">+</button></span>'
    + (w.stock != null && w.stock <= 0 ? '<button class="btn" disabled>Sold out</button>' : '<button class="btn" id="addw">Add to cart</button>') + (w.stock > 0 && w.stock <= 5 ? '<p class="note" style="flex-basis:100%">Only ' + w.stock + ' left in stock.</p>' : '') + '</div></div></div>';
  $('#m').onclick = function () { n = Math.max(1, n - 1); $('#n').textContent = n; };
  $('#p').onclick = function () { n = Math.min(12, n + 1); $('#n').textContent = n; };
  if ($('#addw')) $('#addw').onclick = function () { add(w.id, n); };

  // reviews: the list and the form to add one
  var stars = 0, rf = $('#rform');
  function drawReviews() {
    var r = reviewsOf(w.id).slice().reverse();
    $('#wrate').innerHTML = ratingHtml(w.id, true);
    $('#revs').innerHTML = r.length ? r.map(function (x) {
      return '<div class="rev"><div class="rating"><span class="stars" style="--r:' + x.stars + '" role="img" aria-label="' + x.stars + ' out of 5 stars"></span><b>' + esc(x.name) + '</b></div>' + (x.text ? '<p>' + esc(x.text) + '</p>' : '') + '<small>' + esc(x.date || '') + '</small></div>';
    }).join('') : '<p class="none">No reviews of ' + esc(w.name) + ' yet. Be the first to write one.</p>';
  }
  if (rf) {
    var picks = rf.querySelectorAll('.pick button');
    var paint = function (v) { [].forEach.call(picks, function (b) { var on = +b.dataset.v <= v; b.classList.toggle('on', on); b.setAttribute('aria-pressed', +b.dataset.v === stars); }); };
    [].forEach.call(picks, function (b) {
      b.onclick = function () { stars = +b.dataset.v; paint(stars); $('#rnote').textContent = ''; };
      b.onmouseenter = function () { paint(+b.dataset.v); }; b.onmouseleave = function () { paint(stars); };
    });
    var nameField = rf.querySelector('[name=name]'); if (nameField) { var lab = nameField.closest('label') || nameField; lab.hidden = true; nameField.required = false; }
    rf.onsubmit = function (e) {
      e.preventDefault();
      if (!stars) { $('#rnote').textContent = 'Choose a star rating from 1 to 5.'; return; }
      ready.then(function () {
        if (!me) { $('#rnote').innerHTML = 'Please <a class="link" href="account.html?next=' + encodeURIComponent(location.pathname.replace(/^\//, '') + location.search) + '">log in</a> to leave a review.'; return; }
        var d = new FormData(rf);
        api('/api/reviews', { method: 'POST', body: { id: w.id, stars: stars, text: String(d.get('text') || '') } }).then(function () { $('#rnote').textContent = 'Thank you. Your review is posted.'; setTimeout(function () { location.reload(); }, 700); }).catch(function (er) { $('#rnote').textContent = er.message; });
      });
    };
  }
  drawReviews();
  var rel = W.filter(function (x) { return x.id !== w.id && x.type === w.type; }).concat(W.filter(function (x) { return x.id !== w.id && x.type !== w.type; })).slice(0, 4);
  $('#related').innerHTML = rel.map(function (x) { return card(x); }).join('');
}

function bundlePage() {
  var sel = [], grid = $('#grid'), sum = $('#sum');
  grid.innerHTML = W.map(function (w) { return card(w, true); }).join('');
  function draw() {
    [].forEach.call(grid.querySelectorAll('.pcard'), function (c) { var on = sel.indexOf(c.dataset.id) > -1; c.classList.toggle('sel', on); c.setAttribute('aria-pressed', on); });
    var s = sel.reduce(function (a, id) { return a + byId[id].price; }, 0), save = Math.round(s * 0.1);
    sum.innerHTML = '<h2>Your three</h2>'
      + (sel.length ? '<ul class="rows">' + sel.map(function (id) { return '<li><span>' + esc(byId[id].name) + '</span><span>' + fmt(byId[id].price) + '</span></li>'; }).join('')
        + (sel.length === 3 ? '<li><span>Ten percent off</span><span>−' + fmt(save) + '</span></li><li><span>Three bottles</span><b>' + fmt(s - save) + '</b></li>' : '') + '</ul>' : '<p class="none">Pick any three bottles below.</p>')
      + '<button class="btn" id="addb"' + (sel.length === 3 ? '' : ' disabled') + '>' + (sel.length === 3 ? 'Add three to cart' : 'Pick ' + (3 - sel.length) + ' more') + '</button>';
    var b = $('#addb'); if (b) b.onclick = function () { sel.forEach(function (id) { add(id, 1); }); sel = []; draw(); toast('Your three are in the cart'); };
  }
  function toggle(c) { if (!c) return; var id = c.dataset.id, i = sel.indexOf(id); if (i > -1) sel.splice(i, 1); else if (sel.length < 3) sel.push(id); else toast('Remove a bottle first'); draw(); }
  grid.onclick = function (e) { toggle(e.target.closest('.pcard')); };
  grid.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(e.target.closest('.pcard')); } };
  draw();
}

function pairingPage() {
  var type = 'All', term = '', host = $('#plist'), count = $('#count');
  function draw() {
    var l = W.filter(function (w) { return (type === 'All' || w.type === type) && (!term || (w.pair + ' ' + w.name).toLowerCase().indexOf(term) > -1); });
    count.textContent = l.length + ' wine' + (l.length === 1 ? '' : 's');
    host.innerHTML = l.length ? l.map(function (w) {
      return '<li><img src="' + w.img + '" alt="" loading="lazy"><div><h3><a href="wine.html?id=' + w.id + '" style="text-decoration:none">' + esc(w.name) + '</a></h3>' + ratingHtml(w.id) + '<div class="dish">' + esc(w.pair) + '</div></div>'
        + '<div class="go"><span class="price">' + fmt(w.price) + '</span>' + addBtn(w) + '</div></li>';
    }).join('') : '<li style="display:block;padding:40px 0">No wine matches that dish. Try lamb, prawns or cheese.</li>';
  }
  tabs($('#tabs'), TYPES, 'All', function (t) { type = t; draw(); });
  $('#term').oninput = function () { term = this.value.toLowerCase().trim(); draw(); };
  draw();
}

function cartPage() {
  var host = $('#lines'), sum = $('#csum');
  function draw() {
    var t = totals();
    host.innerHTML = cart.length ? cart.map(function (c) {
      var w = byId[c.id];
      return '<div class="line"><img src="' + w.img + '" alt="' + esc(w.name) + '"><div><h3><a href="wine.html?id=' + w.id + '" style="text-decoration:none">' + esc(w.name) + '</a></h3><div class="meta">' + esc(w.type) + ' · ' + esc(w.year) + ' · ' + fmt(w.price) + ' each</div><button class="rm" data-rm="' + w.id + '">Remove</button></div>'
        + '<span class="qty"><button data-q="-1" data-id="' + w.id + '" aria-label="Fewer">−</button><span>' + c.q + '</span><button data-q="1" data-id="' + w.id + '" aria-label="More">+</button></span><span class="price">' + fmt(w.price * c.q) + '</span></div>';
    }).join('') : '<p style="padding:40px 0;color:var(--soft)">Your cart is empty. <a href="wines.html" class="link">Order wine</a></p>';
    var need = 3 - t.n;
    sum.innerHTML = '<h2>Order summary</h2><div class="totals"><div><span>Subtotal</span><span>' + fmt(t.sub) + '</span></div>'
      + (t.bundle ? '<div class="good"><span>Three-bottle saving</span><span>−' + fmt(t.bundle) + '</span></div>' : '')
      + '<div><span>Delivery</span><span>' + (t.n ? (t.delivery ? fmt(t.delivery) : 'Free') : '–') + '</span></div>'
      + '<div class="grand"><span>Total</span><span>' + fmt(t.total) + '</span></div></div>'
      + (t.n && need > 0 ? '<p class="hint">Add ' + need + ' more bottle' + (need > 1 ? 's' : '') + ' to save ten percent.</p>' : '')
      + (t.n && t.after < 5000 ? '<p class="hint">Add ' + fmt(5000 - t.after) + ' more for free delivery.</p>' : '')
      + (t.n ? '<a class="btn" id="co" href="checkout.html">Checkout <span class="arr">→</span></a>' : '<button class="btn" disabled>Checkout</button>');
  }
  host.onclick = function (e) {
    var r = e.target.closest('[data-rm]'); if (r) { cart = cart.filter(function (c) { return c.id !== r.dataset.rm; }); save(); draw(); return; }
    var b = e.target.closest('[data-q]'); if (b) { var it = line(b.dataset.id); var cap = stockOf(it.id); if (it.q + +b.dataset.q > cap) toast('Only ' + cap + ' in stock'); it.q = Math.min(it.q + +b.dataset.q, cap); if (it.q < 1) cart = cart.filter(function (c) { return c !== it; }); save(); draw(); }
  };
  draw();
}

function contactPage() {
  var f = $('#cform'); if (!f) return;
  f.onsubmit = function (e) {
    e.preventDefault(); var d = new FormData(f), n = $('#cnote'), btn = f.querySelector('button[type=submit]'); btn.disabled = true;
    api('/api/enquiries', { method: 'POST', body: { name: d.get('name'), email: d.get('email'), message: d.get('message') } })
      .then(function () { n.textContent = 'Thank you. We have your message and will reply by email.'; f.reset(); })
      .catch(function (er) { n.textContent = er.message; }).then(function () { btn.disabled = false; });
  };
}

/* ---------- account: log in, sign up, orders, profile, tracking ---------- */
function orderHtml(o, open) {
  var lines = o.items.map(function (l) { return '<div class="ln"><span>' + l.q + ' × ' + esc(l.name) + ' ' + esc(l.year) + '</span><span>' + fmt(l.price * l.q) + '</span></div>'; }).join('');
  var tot = '<div class="ln"><span>Delivery</span><span>' + (o.delivery ? fmt(o.delivery) : 'Free') + '</span></div>'
    + (o.bundle ? '<div class="ln good"><span>Three-bottle saving</span><span>−' + fmt(o.bundle) + '</span></div>' : '')
    + (o.discount ? '<div class="ln good"><span>Coupon ' + esc(o.coupon) + '</span><span>−' + fmt(o.discount) + '</span></div>' : '')
    + '<div class="ln grand"><span>Total</span><span>' + fmt(o.total) + '</span></div>';
  var steps = (o.history || []).map(function (h) { return '<li><b>' + esc(h.status) + '</b><span>' + new Date(h.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) + '</span></li>'; }).join('');
  var cancel = (['Placed', 'Confirmed'].indexOf(o.status) > -1 && o.user_id) ? '<button class="btn sm ghost" data-cancel="' + o.id + '">Cancel order</button>' : '';
  return '<details class="order"' + (open ? ' open' : '') + '><summary><span><b>' + esc(o.id) + '</b><small>' + dateIn(o.created) + ' · ' + fmt(o.total) + ' · ' + esc(o.payment) + '</small></span><span class="pill">' + esc(o.status) + '</span></summary>'
    + '<div class="ob">' + lines + tot + '<ol class="tl">' + steps + '</ol><p class="small">Delivering to ' + esc(o.name) + ', ' + esc(o.address) + ', ' + esc(o.city) + ' ' + esc(o.pincode) + '</p>' + cancel + '</div></details>';
}

function accountPage() {
  var host = $('#acct'), next = q.get('next');
  if (next && !/^[a-z0-9-]+\.html(\?[\w=&%.-]*)?$/i.test(next)) next = '';

  function authView(mode) {
    host.innerHTML = '<div class="authbox"><div class="tabs" id="amode"></div>'
      + (mode === 'login'
        ? '<form class="stack" id="af"><label>Email<input name="email" type="email" required autocomplete="email"></label><label>Password<input name="password" type="password" required autocomplete="current-password"></label><button class="btn" type="submit">Log in <span class="arr">→</span></button><p class="note" id="anote" role="alert"></p></form>'
        : '<form class="stack" id="af"><label>Full name<input name="name" required autocomplete="name"></label><label>Email<input name="email" type="email" required autocomplete="email"></label><label>Phone<input name="phone" type="tel" required autocomplete="tel" placeholder="+91 98765 43210"></label><label>Date of birth<input name="dob" type="date" required autocomplete="bday"></label><label>Password (8 or more characters)<input name="password" type="password" minlength="8" required autocomplete="new-password"></label><button class="btn" type="submit">Create account <span class="arr">→</span></button><p class="note" id="anote" role="alert"></p><p class="small">You must be 21 or over to order wine.</p></form>')
      + '</div>';
    var t = $('#amode'); t.innerHTML = '<button class="tab" aria-pressed="' + (mode === 'login') + '" data-m="login">Log in</button><button class="tab" aria-pressed="' + (mode === 'register') + '" data-m="register">Create account</button>';
    t.onclick = function (e) { var b = e.target.closest('[data-m]'); if (b) authView(b.dataset.m); };
    $('#af').onsubmit = function (e) {
      e.preventDefault(); var body = {}; new FormData(this).forEach(function (v, k) { body[k] = v; }); var btn = this.querySelector('button[type=submit]'); btn.disabled = true;
      api('/api/auth/' + mode, { method: 'POST', body: body }).then(function (j) {
        setToken(j.token); me = null; return loadMe();
      }).then(function () { if (next) location.href = next; else accountView('orders'); })
        .catch(function (er) { $('#anote').textContent = er.message; btn.disabled = false; });
    };
  }

  function accountView(tab) {
    if (!me) return authView('login');
    var tabsHtml = ['orders', 'profile', 'updates'].map(function (k) { return '<button class="tab" data-v="' + k + '" aria-pressed="' + (k === tab) + '">' + { orders: 'Orders', profile: 'Profile', updates: 'Updates' }[k] + (k === 'updates' && me.unread ? ' (' + me.unread + ')' : '') + '</button>'; }).join('');
    host.innerHTML = '<div class="acct-head"><div><p class="label">Signed in</p><h2 class="h-lg">Hello, ' + esc(me.name.split(' ')[0]) + '</h2><p class="small">' + esc(me.email) + (me.points ? ' · ' + me.points + ' reward points' : '') + '</p></div>'
      + '<div class="acct-act">' + (me.role === 'admin' ? '<a class="btn sm" href="admin.html">Owner dashboard</a>' : '') + '<button class="btn sm ghost" id="logout">Log out</button></div></div>'
      + '<div class="tabs" id="vtabs">' + tabsHtml + '</div><div id="vbody" aria-live="polite"></div>';
    $('#logout').onclick = function () { setToken(null); me = null; paintAcct(); authView('login'); };
    $('#vtabs').onclick = function (e) { var b = e.target.closest('[data-v]'); if (b) accountView(b.dataset.v); };
    var body = $('#vbody');
    if (tab === 'orders') {
      body.innerHTML = '<p class="small">Loading your orders…</p>';
      api('/api/orders').then(function (l) {
        body.innerHTML = l.length ? l.map(function (o, i) { return orderHtml(o, i === 0); }).join('') : '<p class="none">No orders yet. <a class="link" href="wines.html">Your first bottle is waiting.</a></p>';
        body.onclick = function (e) {
          var c = e.target.closest('[data-cancel]'); if (!c || !confirm('Cancel this order?')) return;
          api('/api/orders/' + c.dataset.cancel + '/cancel', { method: 'POST' }).then(function () { toast('Order cancelled'); accountView('orders'); }).catch(function (er) { toast(er.message); });
        };
      }).catch(function (er) { body.innerHTML = '<p class="note">' + esc(er.message) + '</p>'; });
    } else if (tab === 'profile') {
      body.innerHTML = '<form class="stack prof" id="pf"><label>Email<input value="' + esc(me.email) + '" disabled></label><label>Name<input name="name" value="' + esc(me.name) + '" required></label><label>Phone<input name="phone" value="' + esc(me.phone) + '" required></label><label>Address<input name="address" value="' + esc(me.address) + '"></label><label>City<input name="city" value="' + esc(me.city) + '"></label><label>Pincode<input name="pincode" maxlength="6" value="' + esc(me.pincode) + '"></label><button class="btn" type="submit">Save changes</button><p class="note" id="pnote" role="status"></p></form>'
        + '<form class="stack prof" id="pw"><h3>Change password</h3><label>Current password<input name="current" type="password" required autocomplete="current-password"></label><label>New password<input name="next" type="password" minlength="8" required autocomplete="new-password"></label><button class="btn" type="submit">Update password</button><p class="note" id="wnote" role="status"></p></form>';
      $('#pf').onsubmit = function (e) { e.preventDefault(); var b = {}; new FormData(this).forEach(function (v, k) { b[k] = v; }); api('/api/me', { method: 'PUT', body: b }).then(function (j) { var u = j.user; u.points = me.points; u.unread = me.unread; me = u; paintAcct(); $('#pnote').textContent = 'Saved.'; }).catch(function (er) { $('#pnote').textContent = er.message; }); };
      $('#pw').onsubmit = function (e) { e.preventDefault(); var b = {}; new FormData(this).forEach(function (v, k) { b[k] = v; }); api('/api/me/password', { method: 'PUT', body: b }).then(function () { $('#wnote').textContent = 'Password updated.'; $('#pw').reset(); }).catch(function (er) { $('#wnote').textContent = er.message; }); };
    } else {
      body.innerHTML = '<p class="small">Loading…</p>';
      api('/api/notifications').then(function (l) { me.unread = 0; body.innerHTML = l.length ? '<ul class="updates">' + l.map(function (n) { return '<li>' + esc(n.text) + '<small>' + dateIn(n.created) + '</small></li>'; }).join('') + '</ul>' : '<p class="none">Nothing new yet.</p>'; }).catch(function (er) { body.innerHTML = '<p class="note">' + esc(er.message) + '</p>'; });
    }
  }

  ready.then(function () { if (me && next) { location.href = next; return; } me ? accountView('orders') : authView(location.hash === '#register' ? 'register' : 'login'); });

  // track an order: no login needed, the phone number on the order is the key
  var tf = $('#tform');
  if (tf) tf.onsubmit = function (e) {
    e.preventDefault(); var d = new FormData(tf), res = $('#tres'); res.innerHTML = '<p class="small">Looking…</p>';
    api('/api/track?id=' + encodeURIComponent(d.get('id')) + '&phone=' + encodeURIComponent(d.get('phone'))).then(function (j) { res.innerHTML = orderHtml(j.order, true).replace(/<button class="btn sm ghost" data-cancel[^<]*<\/button>/, ''); }).catch(function (er) { res.innerHTML = '<p class="note">' + esc(er.message) + '</p>'; });
  };
}

/* ---------- checkout ---------- */
function checkoutPage() {
  var host = $('#checkout'), coupon = '', quote = null;
  ready.then(function () {
    if (!cart.length) { host.innerHTML = '<p class="none">Your cart is empty. <a class="link" href="wines.html">Order wine</a></p>'; return; }
    if (!me) { host.innerHTML = '<div class="gate"><h2 class="h-lg">Log in to place your order</h2><p>Your cart is saved. Log in or create an account, then come straight back here.</p><a class="btn" href="account.html?next=checkout.html">Log in or create an account <span class="arr">→</span></a></div>'; return; }
    host.innerHTML = '<form class="stack co-form" id="cof"><h2>Delivery</h2>'
      + '<label>Full name<input name="name" value="' + esc(me.name) + '" required autocomplete="name"></label>'
      + '<label>Phone<input name="phone" value="' + esc(me.phone) + '" required autocomplete="tel"></label>'
      + '<label>Address<input name="address" value="' + esc(me.address) + '" required autocomplete="street-address" placeholder="House, street, area"></label>'
      + '<div class="two-f"><label>City<input name="city" value="' + esc(me.city) + '" required autocomplete="address-level2"></label><label>Pincode<input name="pincode" value="' + esc(me.pincode) + '" required inputmode="numeric" maxlength="6" autocomplete="postal-code"></label></div>'
      + '<h2>Payment</h2><div class="pay" role="radiogroup" aria-label="Payment method">'
      + ['Cash on delivery', 'UPI on delivery', 'Card on delivery'].map(function (m, i) { return '<label class="pay-o"><input type="radio" name="payment" value="' + m + '"' + (i === 0 ? ' checked' : '') + '><span>' + m + '</span></label>'; }).join('') + '</div>'
      + '<label class="agree"><input type="checkbox" name="ageConfirm" required><span>I am 21 or over and I will show proof of age on delivery.</span></label>'
      + '<button class="btn" type="submit" id="place">Place order <span class="arr">→</span></button><p class="note" id="conote" role="alert"></p></form>'
      + '<aside class="summary" id="osum" aria-live="polite"></aside>';
    var sum = $('#osum');
    function drawQuote() {
      sum.innerHTML = '<h2>Your order</h2><p class="small">Checking prices…</p>';
      api('/api/quote', { method: 'POST', body: { items: cart.map(function (c) { return { id: c.id, q: c.q }; }), coupon: coupon } }).then(function (qq) {
        quote = qq;
        sum.innerHTML = '<h2>Your order</h2><div class="lines">' + qq.lines.map(function (l) { return '<div class="ln"><span>' + l.q + ' × ' + esc(l.name) + ' ' + esc(l.year) + '</span><span>' + fmt(l.price * l.q) + '</span></div>'; }).join('') + '</div>'
          + '<div class="totals"><div><span>Subtotal</span><span>' + fmt(qq.subtotal) + '</span></div>'
          + (qq.bundle ? '<div class="good"><span>Three-bottle saving</span><span>−' + fmt(qq.bundle) + '</span></div>' : '')
          + (qq.discount ? '<div class="good"><span>Coupon ' + esc(qq.coupon) + '</span><span>−' + fmt(qq.discount) + '</span></div>' : '')
          + '<div><span>Delivery</span><span>' + (qq.delivery ? fmt(qq.delivery) : 'Free') + '</span></div><div class="grand"><span>Total</span><span>' + fmt(qq.total) + '</span></div></div>'
          + '<form class="cpn" id="cpn"><input name="c" placeholder="Coupon code" value="' + esc(coupon) + '" aria-label="Coupon code"><button class="btn sm ghost" type="submit">Apply</button></form><p class="note" id="cpnote" role="status"></p><a class="link" href="cart.html">Edit cart</a>';
        $('#cpn').onsubmit = function (e) { e.preventDefault(); coupon = this.c.value.trim(); drawQuote(); };
      }).catch(function (er) {
        if (coupon && /coupon/i.test(er.message)) { var bad = er.message; coupon = ''; drawQuote(); setTimeout(function () { var n = $('#cpnote'); if (n) n.textContent = bad; }, 400); return; }
        sum.innerHTML = '<h2>Your order</h2><p class="note">' + esc(er.message) + '</p><a class="btn sm" href="cart.html">Back to cart</a>'; quote = null;
      });
    }
    drawQuote();
    $('#cof').onsubmit = function (e) {
      e.preventDefault(); var d = new FormData(this), note = $('#conote'), btn = $('#place'); note.textContent = '';
      if (!quote) { note.textContent = 'Please fix your cart first.'; return; }
      btn.disabled = true;
      api('/api/orders', { method: 'POST', body: { name: d.get('name'), phone: d.get('phone'), address: d.get('address'), city: d.get('city'), pincode: d.get('pincode'), payment: d.get('payment'), ageConfirm: !!d.get('ageConfirm'), coupon: coupon, items: cart.map(function (c) { return { id: c.id, q: c.q }; }) } }).then(function (j) {
        cart = []; save();
        host.innerHTML = '<div class="done"><p class="label">Order placed</p><h2 class="h-lg">Thank you, ' + esc(me.name.split(' ')[0]) + '</h2><p>Your order number is <b>' + esc(j.order.id) + '</b>. We will confirm it shortly and ship within 24 hours. You pay ' + esc(j.order.payment.toLowerCase()) + '.</p>'
          + orderHtml(j.order, true).replace(/<button class="btn sm ghost" data-cancel[^<]*<\/button>/, '') + '<div class="done-act"><a class="btn" href="account.html">View my orders</a><a class="btn ghost" href="wines.html">Keep shopping</a></div></div>';
        window.scrollTo(0, 0);
      }).catch(function (er) { note.textContent = er.message; btn.disabled = false; });
    };
  });
}

/* ---------- age check: shown once per browser ---------- */
(function () {
  if (document.body.dataset.page === 'credits') return;
  var ok = false; try { ok = localStorage.getItem('fabage') === '1'; } catch (e) {}
  if (ok) return;
  var g = document.createElement('div'); g.className = 'agegate'; g.setAttribute('role', 'dialog'); g.setAttribute('aria-modal', 'true'); g.setAttribute('aria-labelledby', 'agt');
  g.innerHTML = '<div class="agebox"><p class="label">Fab Wines</p><h2 id="agt">Are you 21 or older?</h2><p>We sell wine to adults only. Please confirm your age to continue.</p><div class="age-act"><button class="btn" id="ageyes" type="button">Yes, I am 21 or over</button><button class="btn ghost" id="ageno" type="button">No</button></div></div>';
  document.body.appendChild(g); document.body.classList.add('lock');
  $('#ageyes').onclick = function () { try { localStorage.setItem('fabage', '1'); } catch (e) {} g.remove(); document.body.classList.remove('lock'); };
  $('#ageno').onclick = function () { g.querySelector('.agebox').innerHTML = '<p class="label">Fab Wines</p><h2>Come back when you are 21</h2><p>We can only serve customers who are 21 or older.</p>'; };
  $('#ageyes').focus();
})();


/* ---------- boot ---------- */
document.addEventListener('click', function (e) {
  var a = e.target.closest('[data-add]'); if (a) { add(a.dataset.add, 1); return; }
  var many = e.target.closest('[data-add-many]'); if (many) { many.dataset.addMany.split(',').forEach(function (id) { if (byId[id]) { var it = line(id); add(id, 1, true); } }); save(); toast('The three bottles are in your cart'); return; }
  if (e.target.closest('.menu-btn')) document.body.classList.toggle('menu-open');
  else if (e.target.closest('.hd nav a')) document.body.classList.remove('menu-open');
});
document.addEventListener('submit', function (e) {
  var f = e.target.closest('form.nl'); if (!f) return; e.preventDefault();
  api('/api/subscribe', { method: 'POST', body: { email: f.email.value } }).then(function () { f.reset(); toast('You are on the list. Welcome.'); }).catch(function (er) { toast(er.message); });
});
paintCount();
var onScroll = function () { document.body.classList.toggle('scrolled', scrollY > 8); };
addEventListener('scroll', onScroll, { passive: true }); onScroll();
var page = document.body.dataset.page;
({ wines: winesPage, wine: winePage, bundle: bundlePage, pairing: pairingPage, cart: cartPage, contact: contactPage, account: accountPage, checkout: checkoutPage }[page] || function () {})();

/* ---------- circle wipe: a link marked data-wipe fills the page with a colour from the point clicked, then opens ---------- */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var el = document.createElement('div'); el.className = 'wipe'; el.setAttribute('aria-hidden', 'true'); document.body.appendChild(el);
  var R = function (x, y) { return Math.ceil(Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))) + 2; };
  // arriving after a wipe: the colour still covers the page and the circle closes back to the point it started from
  var from = null; try { from = JSON.parse(sessionStorage.getItem('fabwipe') || 'null'); sessionStorage.removeItem('fabwipe'); } catch (e) {}
  if (from && !reduce) {
    el.style.clipPath = 'circle(' + R(from.x, from.y) + 'px at ' + from.x + 'px ' + from.y + 'px)';
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      el.style.transition = 'clip-path .8s cubic-bezier(.65,0,.25,1)'; el.style.clipPath = 'circle(0px at ' + from.x + 'px ' + from.y + 'px)';
    }); });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-wipe]'); if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault();
    if (reduce) { location.href = a.href; return; }
    var b = a.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2;
    try { sessionStorage.setItem('fabwipe', JSON.stringify({ x: x, y: y })); } catch (x2) {}
    el.classList.add('cover'); el.style.transition = 'none'; el.style.clipPath = 'circle(0px at ' + x + 'px ' + y + 'px)'; void el.offsetWidth;
    el.style.transition = 'clip-path .75s cubic-bezier(.65,0,.25,1)'; el.style.clipPath = 'circle(' + R(x, y) + 'px at ' + x + 'px ' + y + 'px)';
    setTimeout(function () { location.href = a.href; }, 760);
  });
  addEventListener('pageshow', function (e) { if (e.persisted) { el.classList.remove('cover'); el.style.transition = 'none'; el.style.clipPath = 'circle(0px at 50% 50%)'; } });
})();

window.Fab = { add: add, fmt: fmt, byId: byId, ratingHtml: ratingHtml, card: card, api: api };
})();
