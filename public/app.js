/* Fab Wines: operational layer. Runs after the page script; overrides render/draw/add and wires the API. */
(function () {
'use strict';
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
var money = function (n) { return '₹' + new Intl.NumberFormat('en-IN').format(n); };

/* ---------- own icon set (stroke, 24px grid) ---------- */
var IC = {
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
  box: '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="m3 7.5 9 4.5 9-4.5M12 12v9"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  gift: '<rect x="3" y="9" width="18" height="4" rx="1"/><path d="M5 13v8h14v-8M12 9v12"/><path d="M12 9C10 4.5 6 5 7 8c.5 1.2 3 1 5 1zm0 0c2-4.500 6-4 5-1-.5 1.200-3 1-5 1z"/>',
  crown: '<path d="m3 8 4.500 4L12 5l4.500 7L21 8l-2 11H5z"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
  headset: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="2"/><rect x="17" y="14" width="4" height="6" rx="2"/><path d="M20 20c0 1.500-2 2-5 2"/>',
  truck: '<path d="M2 6h11v10H2zM13 9h5l3 3v4h-8"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  pin: '<path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.500"/>',
  shield: '<path d="m12 3 8 3v6c0 5-3.500 8-8 9-4.500-1-8-4-8-9V6z"/><path d="m8.500 12 2.500 2.500 4.500-5"/>',
  bottle: '<path d="M10 3h4v4c0 1.500 2 2 2 5v8a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-8c0-3 2-3.500 2-5z"/><path d="M8 14h8"/>',
  grape: '<circle cx="9" cy="11" r="2.500"/><circle cx="15" cy="11" r="2.500"/><circle cx="12" cy="15.500" r="2.500"/><circle cx="12" cy="19.500" r="1"/><path d="M12 3c0 3 2 4 5 4M12 3v5"/>',
  glass: '<path d="M7 3h10c0 6-1 9-5 10-4-1-5-4-5-10z"/><path d="M12 13v8M8 21h8"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>',
  store: '<path d="m3 9 2-5h14l2 5"/><path d="M4 9v11h16V9M9 20v-6h6v6"/><path d="M3 9c0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  logout: '<path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9"/>',
  phone: '<path d="M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  star: '<path d="m12 3 2.700 5.600 6.100.8-4.500 4.200 1.100 6.100L12 16.800 6.600 19.700l1.100-6.100L3.200 9.400l6.100-.8z"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  ticket: '<path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z"/><path d="M14 7v2M14 11v2M14 15v2"/>',
  percent: '<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2"/><circle cx="17" cy="17" r="2"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  chev: '<path d="m6 9 6 6 6-6"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  sparkle: '<path d="m12 3 2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
  dash: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.500" cy="8.500" r="1.200"/>',
  diamond: '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M9 3l-2 6 5 12 5-12-2-6"/>',
  snow: '<path d="M12 2v20M3.500 7l17 10M20.500 7l-17 10"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2"/>',
  lease: '<path d="M12 21c-5 0-8-3-8-8 5 0 8 3 8 8zm0 0c0-6 3-10 8-10 0 5-3 10-8 10z"/>'
};
function ic(n, extra) { return '<svg class="i ' + (extra || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (IC[n] || '') + '</svg>'; }
$$('[data-ic]').forEach(function (e) { e.innerHTML = ic(e.dataset.ic); });

/* ---------- state + api ---------- */
var S = { token: null, user: null, points: 0, wish: [], unread: 0 };
try { S.token = localStorage.getItem('fabtoken'); } catch (e) {}
function api(path, opt) {
  opt = opt || {};
  var h = { 'Content-Type': 'application/json' };
  if (S.token) h.Authorization = 'Bearer ' + S.token;
  return fetch(path, { method: opt.method || 'GET', headers: h, body: opt.body ? JSON.stringify(opt.body) : undefined }).then(function (r) {
    return r.json().catch(function () { return {}; }).then(function (j) {
      if (!r.ok) { if (r.status === 401 && S.token) { setAuth(null); } var er = new Error(j.error || 'Something went wrong.'); er.status = r.status; throw er; }
      return j;
    });
  });
}
function setAuth(token, user) {
  S.token = token; if (!token) { S.user = null; S.points = 0; S.wish = []; S.unread = 0; }
  try { token ? localStorage.setItem('fabtoken', token) : localStorage.removeItem('fabtoken'); } catch (e) {}
  if (user) S.user = user;
  paintHeader();
}
function loadMe() {
  if (!S.token) { paintHeader(); return Promise.resolve(); }
  return api('/api/me').then(function (j) { S.user = j.user; S.points = j.points; S.wish = j.wishlist; S.unread = j.unread; paintHeader(); render(); }).catch(function () { paintHeader(); });
}
var toast = window.toast;

/* ---------- modal ---------- */
var mv = document.createElement('div'); mv.className = 'mv'; mv.innerHTML = '<div class="md" role="dialog" aria-modal="true"></div>'; document.body.appendChild(mv);
var md = $('.md', mv);
function modal(title, icon, body, wide) {
  closeDD();
  md.className = 'md' + (wide ? ' wide' : '');
  md.innerHTML = '<div class="mh">' + (icon ? ic(icon) : mini(30)) + '<h3>' + esc(title) + '</h3><button class="mx" aria-label="Close">×</button></div><div class="mb">' + body + '</div>';
  mv.classList.add('on'); document.body.classList.add('lock'); md.scrollTop = 0;
  $('.mx', md).onclick = closeModal;
  return md;
}
function closeModal() { mv.classList.remove('on'); document.body.classList.remove('lock'); }
mv.addEventListener('mousedown', function (e) { if (e.target === mv) closeModal(); });
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeModal(); closeDD(); } });
function note(el, msg, ok) { var n = $('.note', el); if (!n) return; n.className = 'note ' + (ok ? 'okb' : 'err'); n.textContent = msg; n.hidden = !msg; }
function busy(btn, on) { btn.disabled = on; }

/* ---------- header dropdowns ---------- */
function closeDD() { $$('.dd').forEach(function (d) { d.classList.remove('open'); $('.hbtn', d).setAttribute('aria-expanded', 'false'); }); }
function item(act, icon, label, extra) { return '<button class="mi" role="menuitem" data-act="' + act + '">' + ic(icon) + '<span>' + label + '</span>' + (extra || '') + '</button>'; }
function paintHeader() {
  var u = S.user, a = $('#acctMenu');
  $('#acctLabel').textContent = u ? u.name.split(' ')[0] : 'Login';
  $('#acctDot').hidden = !(u && S.unread > 0);
  a.innerHTML = (u
    ? '<div class="who"><b>' + esc(u.name) + '</b><small>' + esc(u.email) + '</small></div>'
    : '<div class="new"><span>New customer?</span><a data-act="signup">Sign up</a></div><button class="lg" data-act="login">Login</button>')
    + item('profile', 'user', 'My Profile')
    + item('orders', 'box', 'Orders')
    + item('wishlist', 'heart', 'Wishlist', S.wish.length ? '<em>' + S.wish.length + '</em>' : '')
    + item('rewards', 'crown', 'Rewards', u ? '<small>' + S.points + ' pts</small>' : '')
    + item('coupons', 'gift', 'Gifts & Coupons')
    + item('notifs', 'bell', 'Notifications', S.unread ? '<em>' + S.unread + '</em>' : '')
    + item('track', 'truck', 'Track an Order')
    + item('care', 'headset', '24x7 Customer Care')
    + (u && u.role === 'admin' ? '<hr>' + item('admin', 'dash', 'Owner Dashboard') : '')
    + (u ? '<hr>' + item('logout', 'logout', 'Log out') : '');
  $('#moreMenu').innerHTML =
    item('story', 'book', 'Our Story')
    + item('pairing', 'glass', 'Pairing Guide')
    + item('sets', 'gift', 'Gift Sets & Trio')
    + item('delivery', 'truck', 'Delivery & Returns')
    + item('partner', 'store', 'Become a Partner')
    + item('stores', 'pin', 'Find a Store')
    + item('faq', 'info', 'FAQs')
    + item('legal', 'shield', 'Responsible Drinking');
}
['Acct', 'More'].forEach(function (k) {
  $('#dd' + k + ' .hbtn').addEventListener('click', function (e) {
    e.stopPropagation(); var d = $('#dd' + k), was = d.classList.contains('open'); closeDD();
    if (!was) { d.classList.add('open'); this.setAttribute('aria-expanded', 'true'); if (typeof closeAll === 'function') closeAll(); }
  });
});
document.addEventListener('click', function (e) { if (!e.target.closest('.dd')) closeDD(); });

/* gate actions that need an account */
function need(fn) { return function () { if (!S.user) { authModal('login', 'Please log in to continue.'); return; } fn.apply(null, arguments); }; }
var ACT = {
  login: function () { authModal('login'); }, signup: function () { authModal('signup'); },
  profile: need(profileModal), orders: need(ordersModal), wishlist: need(wishModal), rewards: need(rewardsModal), notifs: need(notifModal),
  coupons: couponModal, track: trackModal, care: careModal, delivery: deliveryModal, faq: faqModal, legal: legalModal, stores: storesModal,
  partner: function () { careModal('Partnership enquiry: '); },
  story: function () { jump('#story'); }, pairing: function () { jump('#table'); }, sets: function () { jump('#trio'); },
  admin: function () { location.href = '/admin.html'; },
  logout: function () { setAuth(null); toast('You are logged out'); render(); }
};
function jump(sel) { closeDD(); closeModal(); var e = $(sel); if (e) e.scrollIntoView({ behavior: 'smooth' }); }
document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-act]'); if (b && ACT[b.dataset.act]) { e.preventDefault(); closeDD(); ACT[b.dataset.act](); }
  var o = e.target.closest('[data-open]'); if (o && !e.target.closest('[data-wish]')) { productModal(o.dataset.open); }
  var w = e.target.closest('[data-wish]'); if (w) { e.stopPropagation(); toggleWish(w.dataset.wish); }
});

/* ---------- auth ---------- */
function authModal(mode, msg) {
  var el = modal(mode === 'login' ? 'Welcome back' : 'Create your account', 'user',
    '<div class="seg"><button data-m="login" class="' + (mode === 'login' ? 'on' : '') + '">Login</button><button data-m="signup" class="' + (mode === 'signup' ? 'on' : '') + '">Sign up</button></div>'
    + '<div class="note ' + (msg ? 'okb' : '') + '"' + (msg ? '' : ' hidden') + '>' + esc(msg || '') + '</div>'
    + '<form id="af">' + (mode === 'signup' ? '<div class="fld"><label>Full name</label><input name="name" autocomplete="name" required></div><div class="row2"><div class="fld"><label>Phone</label><input name="phone" type="tel" autocomplete="tel" placeholder="+91 98xxx xxxxx" required></div><div class="fld"><label>Date of birth</label><input name="dob" type="date" required></div></div>' : '')
    + '<div class="fld"><label>Email</label><input name="email" type="email" autocomplete="email" required></div>'
    + '<div class="fld"><label>Password' + (mode === 'signup' ? ' (8+ characters)' : '') + '</label><input name="password" type="password" autocomplete="' + (mode === 'signup' ? 'new-password' : 'current-password') + '" minlength="' + (mode === 'signup' ? 8 : 1) + '" required></div>'
    + '<button class="pbtn" type="submit">' + (mode === 'login' ? 'Login' : 'Create account') + '</button></form>'
    + '<p class="small" style="margin-top:14px">' + (mode === 'signup' ? 'You must be of legal drinking age to create an account.' : 'Forgot your password? Message us on Customer Care and we will reset it.') + '</p>');
  $$('.seg button', el).forEach(function (b) { b.onclick = function () { authModal(b.dataset.m); }; });
  $('#af').onsubmit = function (ev) {
    ev.preventDefault(); var f = new FormData(this), body = {}; f.forEach(function (v, k) { body[k] = v; });
    var btn = $('.pbtn', el); busy(btn, true);
    api('/api/auth/' + (mode === 'login' ? 'login' : 'register'), { method: 'POST', body: body }).then(function (j) {
      setAuth(j.token, j.user); closeModal(); toast('Welcome, ' + j.user.name.split(' ')[0]); return loadMe().then(function () { if (pendingCheckout) { pendingCheckout = false; checkoutModal(); } });
    }).catch(function (e) { note(el, e.message); busy(btn, false); });
  };
}
var pendingCheckout = false;

/* ---------- wishlist ---------- */
function toggleWish(id) {
  if (!S.user) { authModal('login', 'Log in to save wines to your wishlist.'); return; }
  var has = S.wish.indexOf(id) > -1;
  api('/api/wishlist/' + id, { method: has ? 'DELETE' : 'POST' }).then(function () {
    S.wish = has ? S.wish.filter(function (x) { return x !== id; }) : S.wish.concat(id); paintHeader(); render(); toast(has ? 'Removed from wishlist' : 'Saved to wishlist');
  }).catch(function (e) { toast(e.message); });
}
function wine(id) { return WINES.filter(function (w) { return w.id === id; })[0]; }
function wishModal() {
  var l = S.wish.map(wine).filter(Boolean);
  modal('Your wishlist', 'heart', l.length ? '<div class="wl">' + l.map(function (w) {
    return '<div class="w"><div class="th"><img src="' + w.img + '" alt=""></div><div><b>' + esc(w.name) + '</b><span class="small">' + money(w.price) + '</span><div class="mini"><button class="gbtn" data-open="' + w.id + '">View</button><button class="gbtn" data-add="' + w.id + '">Add</button></div></div></div>';
  }).join('') + '</div>' : '<div class="empty2">' + ic('heart') + '<p>No saved wines yet. Tap the heart on any bottle.</p></div>');
}

/* ---------- product modal ---------- */
function productModal(id) {
  var w = wine(id); if (!w) return;
  var low = w.stock > 0 && w.stock <= 8;
  var el = modal(w.name, null, '<div class="pd"><div class="st"><span class="off">' + w.pct + '% OFF</span><img src="' + w.img + '" alt="' + esc(w.name) + ' bottle"></div><div class="inf"><small>' + esc(w.type) + ' · ' + esc(w.grape) + '</small><h3>' + esc(w.name) + ' <span style="color:var(--gold-ink);font-size:.55em">' + esc(w.year) + '</span></h3><p>' + esc(w.notes) + '</p>'
    + '<div class="pr"><b>' + money(w.price) + '</b><s>' + money(w.mrp) + '</s></div><div class="small" style="color:#2f7a4a">You save ' + money(w.mrp - w.price) + '</div>'
    + '<div class="facts"><div><b>' + esc(w.abv) + '</b>Alcohol</div><div><b>' + esc(w.volume) + '</b>Bottle size</div><div style="grid-column:1/-1"><b>' + esc(w.pairing) + '</b>Pairs well with</div></div>'
    + (w.stock <= 0 ? '<div class="err">Sold out right now.</div>' : low ? '<div class="lowtag">Only ' + w.stock + ' left in stock</div>' : '<div class="small">In stock. Ships within 24 hours.</div>')
    + '<div class="acts"><button class="pbtn" data-add="' + w.id + '" ' + (w.stock <= 0 ? 'disabled' : '') + '>Add to cart</button><button class="gbtn" data-wish="' + w.id + '" aria-label="Wishlist">' + ic('heart') + '</button></div></div></div>', true);
  $('.mh h3', el).textContent = 'Wine details'; $('.mb', el).style.padding = '0';
}

/* ---------- shelf: filters, sort, cards ---------- */
var F = { sort: 'featured', price: 'all', country: 'all', stock: false };
(function () {
  var host = $('.filters'); if (!host) return;
  var countries = Array.from(new Set(WINES.map(function (w) { return w.grape.split(' · ')[0]; }))).sort();
  var bar = document.createElement('div'); bar.className = 'xf'; bar.id = 'xf';
  bar.innerHTML = '<select id="fs" aria-label="Sort"><option value="featured">Sort: Featured</option><option value="lo">Price: low to high</option><option value="hi">Price: high to low</option><option value="off">Biggest discount</option></select>'
    + '<select id="fp" aria-label="Price"><option value="all">Any price</option><option value="a">Under ₹5,000</option><option value="b">₹5,000 to ₹10,000</option><option value="c">₹10,000 to ₹20,000</option><option value="d">Above ₹20,000</option></select>'
    + '<select id="fc" aria-label="Country"><option value="all">All regions</option>' + countries.map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('') + '</select>'
    + '<label class="in-stock"><input type="checkbox" id="fk"> In stock only</label>';
  host.parentNode.insertBefore(bar, host.nextSibling);
  $('#fs').onchange = function () { F.sort = this.value; render(); }; $('#fp').onchange = function () { F.price = this.value; render(); };
  $('#fc').onchange = function () { F.country = this.value; render(); }; $('#fk').onchange = function () { F.stock = this.checked; render(); };
})();
var PR = { a: [0, 5000], b: [5000, 10000], c: [10000, 20000], d: [20000, 1e9] };
window.render = function () {
  var list = WINES.filter(function (w) {
    if (filter !== 'All' && w.type !== filter) return false;
    if (F.price !== 'all' && !(w.price >= PR[F.price][0] && w.price < PR[F.price][1])) return false;
    if (F.country !== 'all' && w.grape.split(' · ')[0] !== F.country) return false;
    if (F.stock && w.stock <= 0) return false; return true;
  });
  if (F.sort === 'lo') list.sort(function (a, b) { return a.price - b.price; });
  if (F.sort === 'hi') list.sort(function (a, b) { return b.price - a.price; });
  if (F.sort === 'off') list.sort(function (a, b) { return b.pct - a.pct; });
  $('#count').textContent = list.length + ' wine' + (list.length === 1 ? '' : 's');
  $('#rail').innerHTML = list.length ? list.map(function (w) {
    var on = S.wish.indexOf(w.id) > -1;
    return '<article class="card' + (w.stock <= 0 ? ' sold' : '') + '"><div class="pic" data-open="' + w.id + '">' + (w.badge ? '<span class="badge">' + esc(w.badge) + '</span>' : '') + '<span class="yr">' + esc(w.year) + '</span>' + bottle(w, 300) + '<span class="off">' + w.pct + '% OFF</span><button class="hrt' + (on ? ' on' : '') + '" data-wish="' + w.id + '" aria-label="Save to wishlist">' + ic('heart') + '</button></div>'
      + '<div class="cb"><small>' + esc(w.type) + ' · ' + esc(w.grape) + '</small><h3 data-open="' + w.id + '">' + esc(w.name) + '</h3><p>' + esc(w.notes) + '</p><div class="save">You save ' + money(w.mrp - w.price) + '</div>'
      + (w.stock <= 0 ? '<div class="lowtag">Sold out</div>' : w.stock <= 8 ? '<div class="lowtag">Only ' + w.stock + ' left</div>' : '')
      + '<div class="buy"><span class="pw"><span class="mrp">' + money(w.mrp) + '</span><span class="price">' + money(w.price) + '</span></span><button class="add" data-add="' + w.id + '">' + (w.stock <= 0 ? 'Sold out' : 'Add to cart') + '</button></div></div></article>';
  }).join('') : '<div class="empty2" style="width:100%">' + ic('glass') + '<p>No wines match these filters. Try widening them.</p></div>';
  $('#rail').scrollLeft = 0; prog();
  $$('.tab').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.t === filter); });
};

/* ---------- cart ---------- */
window.add = function (id) {
  var w = wine(id); if (!w) return;
  var it = cart.filter(function (c) { return c.id === id; })[0], have = it ? it.q : 0;
  if (w.stock <= 0) { toast('Sorry, ' + w.name + ' is sold out'); return; }
  if (have + 1 > w.stock) { toast('Only ' + w.stock + ' in stock'); return; }
  if (it) it.q++; else cart.push({ id: id, q: 1 }); draw(); toast('Added to your cart');
};
window.draw = function () {
  cart = cart.filter(function (c) { return wine(c.id); }); save();
  var n = cart.reduce(function (s, c) { return s + c.q; }, 0); $('#cnt').textContent = n;
  var sub = 0;
  $('#items').innerHTML = cart.length ? cart.map(function (c) {
    var w = wine(c.id); sub += w.price * c.q;
    return '<div class="it"><div class="th">' + bottle(w, 76) + '</div><div><b>' + esc(w.name) + '</b><small>' + w.type + ' · ' + w.year + '</small><br><span class="qty"><button data-q="-1" data-id="' + w.id + '" aria-label="Fewer">−</button><span>' + c.q + '</span><button data-q="1" data-id="' + w.id + '" aria-label="More">+</button></span></div><div class="price" style="font-size:20px">' + money(w.price * c.q) + '</div></div>';
  }).join('') : '<div class="empty">Your cart is empty.<br>Add three bottles to save ten percent.</div>';
  var disc = n >= 3 ? Math.round(sub * 0.1) : 0, after = sub - disc, del = !n ? 0 : after >= 5000 ? 0 : 250;
  $('#df').innerHTML = '<div><span>Subtotal</span><span>' + money(sub) + '</span></div>'
    + (disc ? '<div><span>Bundle saving (3+ bottles)</span><span>−' + money(disc) + '</span></div>' : '<div class="hint">' + (n === 0 ? 'Any three bottles, ten percent off.' : 'Add ' + (3 - n) + ' more bottle' + (3 - n > 1 ? 's' : '') + ' to save ten percent.') + '</div>')
    + (n ? '<div><span>Delivery</span><span>' + (del ? money(del) : 'Free') + '</span></div>' : '')
    + '<div class="tot"><span>Total</span><span>' + money(after + del) + '</span></div><button class="btn" id="co"' + (n ? '' : ' disabled') + '>Checkout</button>'
    + (n && after < 5000 ? '<div class="hint">Free delivery above ' + money(5000) + '. Add ' + money(5000 - after) + ' more.</div>' : '');
  var co = $('#co'); if (co) co.onclick = function () { closeAll(); if (!S.user) { pendingCheckout = true; authModal('login', 'Log in or create an account to place your order.'); } else checkoutModal(); };
};

/* ---------- checkout ---------- */
function checkoutModal() {
  if (!cart.length) { toast('Your cart is empty'); return; }
  var u = S.user, el = modal('Checkout', 'receipt',
    '<div class="note" hidden></div><form id="cf"><div class="row2"><div class="fld"><label>Full name</label><input name="name" value="' + esc(u.name) + '" required></div><div class="fld"><label>Phone</label><input name="phone" type="tel" value="' + esc(u.phone) + '" required></div></div>'
    + '<div class="fld"><label>Delivery address</label><input name="address" value="' + esc(u.address) + '" placeholder="House, street, area" required></div>'
    + '<div class="row2"><div class="fld"><label>City</label><input name="city" value="' + esc(u.city) + '" required></div><div class="fld"><label>Pincode</label><input name="pincode" inputmode="numeric" maxlength="6" value="' + esc(u.pincode) + '" required></div></div>'
    + '<div class="fld"><label>Payment (pay when it arrives)</label></div><div class="pay"><label><input type="radio" name="payment" value="Cash on delivery" checked><span>Cash on delivery</span></label><label><input type="radio" name="payment" value="UPI on delivery"><span>UPI on delivery</span></label><label><input type="radio" name="payment" value="Card on delivery"><span>Card on delivery</span></label></div>'
    + '<div class="row2"><div class="fld" style="margin:0"><label>Coupon code</label><input name="coupon" id="cc" placeholder="WELCOME5" style="text-transform:uppercase"></div><div style="display:flex;align-items:flex-end"><button class="gbtn" type="button" id="ca" style="width:100%;padding:13px">Apply</button></div></div>'
    + '<div class="sum" id="sm">Calculating…</div>'
    + '<label class="small" style="display:flex;gap:10px;align-items:flex-start;margin-bottom:16px"><input type="checkbox" name="ageConfirm" style="margin-top:4px" required><span>I confirm I am of legal drinking age and will show a valid ID on delivery.</span></label>'
    + '<button class="pbtn" type="submit">Place order</button></form>');
  function quote() {
    api('/api/quote', { method: 'POST', body: { items: cart, coupon: $('#cc').value.trim() } }).then(function (q) {
      $('#sm').innerHTML = '<div><span>Subtotal (' + q.qty + ' bottle' + (q.qty > 1 ? 's' : '') + ')</span><span>' + money(q.subtotal) + '</span></div>' + (q.bundle ? '<div class="g"><span>Bundle saving</span><span>−' + money(q.bundle) + '</span></div>' : '') + (q.discount ? '<div class="g"><span>Coupon ' + esc(q.coupon) + '</span><span>−' + money(q.discount) + '</span></div>' : '') + '<div><span>Delivery</span><span>' + (q.delivery ? money(q.delivery) : 'Free') + '</span></div><div class="t"><span>Total</span><span>' + money(q.total) + '</span></div>';
      note(el, '');
    }).catch(function (e) { note(el, e.message); $('#sm').innerHTML = ''; });
  }
  $('#ca').onclick = quote; quote();
  $('#cf').onsubmit = function (ev) {
    ev.preventDefault(); var f = new FormData(this), b = { items: cart }; f.forEach(function (v, k) { b[k] = v; }); b.ageConfirm = !!f.get('ageConfirm');
    var btn = $('.pbtn', el); busy(btn, true);
    api('/api/orders', { method: 'POST', body: b }).then(function (j) {
      cart = []; draw(); loadMe(); refreshWines();
      var o = j.order; modal('Order placed', null, '<div class="ok">' + ic('check') + '<h4>Thank you, ' + esc(o.name.split(' ')[0]) + '</h4><p>Your order <b>' + o.id + '</b> is confirmed for ' + money(o.total) + '.<br>Payment: ' + esc(o.payment) + '. Please keep your ID ready.</p></div><button class="pbtn" data-act="orders">Track my order</button>');
    }).catch(function (e) { note(el, e.message); busy(btn, false); });
  };
}
function refreshWines() { api('/api/products').then(function (l) { WINES.length = 0; l.forEach(function (w) { WINES.push(w); }); render(); draw(); }).catch(function () {}); }

/* ---------- orders and tracking ---------- */
var STEPS = ['Placed', 'Confirmed', 'Packed', 'Out for delivery', 'Delivered'];
function timeline(o) {
  if (o.status === 'Cancelled') return '<p class="err">This order was cancelled.</p>';
  var idx = STEPS.indexOf(o.status);
  return '<div class="tl">' + STEPS.map(function (s, i) { return '<div class="s' + (i <= idx ? ' done' : '') + '">' + s + '</div>'; }).join('') + '</div>';
}
function orderBody(o) {
  return o.items.map(function (l) { return '<div class="ln"><span>' + l.q + ' × ' + esc(l.name) + ' ' + esc(l.year) + '</span><span>' + money(l.price * l.q) + '</span></div>'; }).join('')
    + '<div class="ln"><span>Delivery</span><span>' + (o.delivery ? money(o.delivery) : 'Free') + '</span></div>' + (o.bundle ? '<div class="ln"><span>Bundle saving</span><span>−' + money(o.bundle) + '</span></div>' : '') + (o.discount ? '<div class="ln"><span>Coupon ' + esc(o.coupon) + '</span><span>−' + money(o.discount) + '</span></div>' : '')
    + '<div class="ln" style="font-weight:600"><span>Total</span><span>' + money(o.total) + '</span></div>' + timeline(o)
    + '<p class="small">' + esc(o.name) + ', ' + esc(o.address) + ', ' + esc(o.city) + ' ' + esc(o.pincode) + '</p>';
}
function ordersModal() {
  var el = modal('Your orders', 'box', '<p class="small">Loading…</p>', true);
  api('/api/orders').then(function (l) {
    $('.mb', el).innerHTML = l.length ? l.map(function (o, i) {
      return '<div class="ol' + (i === 0 ? ' open' : '') + '"><div class="oh"><div><b>' + o.id + '</b><div class="small">' + new Date(o.created).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ' · ' + money(o.total) + '</div></div><span class="pill ' + o.status + '">' + o.status + '</span></div><div class="ob">' + orderBody(o)
        + (['Placed', 'Confirmed'].indexOf(o.status) > -1 ? '<button class="gbtn" data-cancel="' + o.id + '">Cancel order</button> ' : '') + '<button class="gbtn" data-again="' + o.id + '">Order again</button></div></div>';
    }).join('') : '<div class="empty2">' + ic('box') + '<p>No orders yet. Your first bottle is waiting.</p></div>';
    var byId = {}; l.forEach(function (o) { byId[o.id] = o; });
    $$('.oh', el).forEach(function (h) { h.onclick = function () { h.parentNode.classList.toggle('open'); }; });
    $$('[data-cancel]', el).forEach(function (b) { b.onclick = function () { if (!confirm('Cancel this order?')) return; api('/api/orders/' + b.dataset.cancel + '/cancel', { method: 'POST' }).then(function () { refreshWines(); ordersModal(); toast('Order cancelled'); }).catch(function (e) { toast(e.message); }); }; });
    $$('[data-again]', el).forEach(function (b) { b.onclick = function () { byId[b.dataset.again].items.forEach(function (l) { for (var k = 0; k < l.q; k++) add(l.id); }); closeModal(); open(true); }; });
  }).catch(function (e) { $('.mb', el).innerHTML = '<div class="err">' + esc(e.message) + '</div>'; });
}
function trackModal() {
  var el = modal('Track an order', 'truck', '<div class="note" hidden></div><form id="tf"><div class="row2"><div class="fld"><label>Order number</label><input name="id" placeholder="FW2610311234" required></div><div class="fld"><label>Phone used on order</label><input name="phone" type="tel" required></div></div><button class="pbtn" type="submit">Track</button></form><div id="tr" style="margin-top:18px"></div>');
  $('#tf').onsubmit = function (e) { e.preventDefault(); var f = new FormData(this); api('/api/track?id=' + encodeURIComponent(f.get('id')) + '&phone=' + encodeURIComponent(f.get('phone'))).then(function (j) { note(el, ''); $('#tr').innerHTML = '<div class="ol open"><div class="oh"><b>' + j.order.id + '</b><span class="pill ' + j.order.status + '">' + j.order.status + '</span></div><div class="ob">' + orderBody(j.order) + '</div></div>'; }).catch(function (er) { $('#tr').innerHTML = ''; note(el, er.message); }); };
}

/* ---------- account pages ---------- */
function profileModal() {
  var u = S.user, el = modal('My profile', 'user', '<div class="note" hidden></div><form id="pf"><div class="fld"><label>Email</label><input value="' + esc(u.email) + '" disabled></div><div class="row2"><div class="fld"><label>Name</label><input name="name" value="' + esc(u.name) + '" required></div><div class="fld"><label>Phone</label><input name="phone" value="' + esc(u.phone) + '" required></div></div><div class="fld"><label>Address</label><input name="address" value="' + esc(u.address) + '"></div><div class="row2"><div class="fld"><label>City</label><input name="city" value="' + esc(u.city) + '"></div><div class="fld"><label>Pincode</label><input name="pincode" maxlength="6" value="' + esc(u.pincode) + '"></div></div><button class="pbtn" type="submit">Save changes</button></form>'
    + '<h4 style="font-family:var(--display);font-size:26px;margin:26px 0 10px">Change password</h4><form id="pw"><div class="row2"><div class="fld"><label>Current</label><input name="current" type="password" required></div><div class="fld"><label>New (8+)</label><input name="next" type="password" minlength="8" required></div></div><button class="gbtn" type="submit">Update password</button></form><div class="note" id="pn" hidden style="margin-top:12px"></div>');
  $('#pf').onsubmit = function (e) { e.preventDefault(); var b = {}; new FormData(this).forEach(function (v, k) { b[k] = v; }); api('/api/me', { method: 'PUT', body: b }).then(function (j) { S.user = j.user; paintHeader(); note(el, 'Profile saved.', true); }).catch(function (er) { note(el, er.message); }); };
  $('#pw').onsubmit = function (e) { e.preventDefault(); var b = {}; new FormData(this).forEach(function (v, k) { b[k] = v; }); var n = $('#pn'); api('/api/me/password', { method: 'PUT', body: b }).then(function () { n.hidden = false; n.className = 'note okb'; n.textContent = 'Password updated.'; $('#pw').reset(); }).catch(function (er) { n.hidden = false; n.className = 'note err'; n.textContent = er.message; }); };
}
function rewardsModal() {
  var p = S.points, tier = p >= 600 ? 'Gold' : p >= 200 ? 'Silver' : 'Member';
  modal('Fab Rewards', 'crown', '<div class="pts"><b>' + p + '</b>reward points · ' + tier + '</div><div class="info3"><div>' + ic('sparkle') + '<span>Earn 1 point for every ₹100 on delivered orders.</span></div><div>' + ic('gift') + '<span>Silver (200 pts) unlocks early access to limited bottles. Gold (600 pts) adds free gift wrapping.</span></div><div>' + ic('truck') + '<span>Points are added once your order is marked delivered.</span></div></div>');
}
function notifModal() {
  var el = modal('Notifications', 'bell', '<p class="small">Loading…</p>');
  api('/api/notifications').then(function (l) { S.unread = 0; paintHeader(); $('.mb', el).innerHTML = l.length ? l.map(function (n) { return '<div class="nt">' + ic('bell') + '<div>' + esc(n.text) + '<small>' + new Date(n.created).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '</small></div></div>'; }).join('') : '<div class="empty2">' + ic('bell') + '<p>You are all caught up.</p></div>'; });
}
function couponModal() {
  var el = modal('Gifts & Coupons', 'gift', '<p class="small">Loading…</p>');
  api('/api/coupons').then(function (l) {
    $('.mb', el).innerHTML = '<p>Apply a code at checkout. Any three bottles also get 10% off automatically.</p>' + l.map(function (c) { return '<div class="cp">' + ic('ticket') + '<code>' + c.code + '</code><span>' + esc(c.note) + '</span><button class="gbtn" data-copy="' + c.code + '">Copy</button></div>'; }).join('')
      + '<div class="cp" style="border-style:solid">' + ic('gift') + '<span><b>Gifting a bottle?</b> Add a note at checkout address line or message Customer Care for gift wrapping and a handwritten card.</span></div>';
  });
}
function careModal(prefill) {
  var el = modal('24x7 Customer Care', 'headset', '<div class="info3" style="margin-bottom:20px"><div>' + ic('phone') + '<span><b>+91 91100 40511</b><br><span class="small">Call or WhatsApp, every day</span></span></div><div>' + ic('mail') + '<span><b>adityasingh11may@gmail.com</b><br><span class="small">We reply within a few hours</span></span></div></div><div class="note" hidden></div><form id="ef"><div class="row2"><div class="fld"><label>Name</label><input name="name" value="' + esc(S.user ? S.user.name : '') + '" required></div><div class="fld"><label>Email</label><input name="email" type="email" value="' + esc(S.user ? S.user.email : '') + '" required></div></div><div class="fld"><label>How can we help?</label><textarea name="message" rows="4" required>' + esc(typeof prefill === 'string' ? prefill : '') + '</textarea></div><button class="pbtn" type="submit">Send message</button></form>');
  $('#ef').onsubmit = function (e) { e.preventDefault(); var b = {}; new FormData(this).forEach(function (v, k) { b[k] = v; }); api('/api/enquiries', { method: 'POST', body: b }).then(function () { note(el, 'Thank you. We have your message and will reply soon.', true); $('#ef').reset(); }).catch(function (er) { note(el, er.message); }); };
}
function deliveryModal() { modal('Delivery & Returns', 'truck', '<div class="info3"><div>' + ic('truck') + '<span><b>Delivery</b><br>Free above ₹5,000, otherwise ₹250. Most orders ship within 24 hours. We deliver where local excise rules allow it.</span></div><div>' + ic('shield') + '<span><b>Age check</b><br>Our rider checks a valid government photo ID on delivery. Nobody under the legal drinking age can receive an order.</span></div><div>' + ic('box') + '<span><b>Breakage and returns</b><br>Every bottle ships in protective packing. If a bottle arrives damaged or corked, message us within 48 hours with a photo and we will replace it.</span></div><div>' + ic('receipt') + '<span><b>Payment</b><br>Pay on delivery by cash, UPI or card.</span></div></div>'); }
function faqModal() { modal('FAQs', 'info', '<div class="faq"><details><summary>How do I pay?</summary><p>You pay on delivery by cash, UPI or card. No advance payment is taken.</p></details><details><summary>How does the 10% bundle offer work?</summary><p>Add any three bottles and the discount applies automatically in your cart.</p></details><details><summary>Can I cancel an order?</summary><p>Yes, from Orders until it is packed.</p></details><details><summary>How should I store my wine?</summary><p>Lying down, in a cool, dark place. Serve reds just below room temperature and whites chilled.</p></details><details><summary>Are the bottles genuine?</summary><p>We source from authorised importers and distributors only.</p></details></div>'); }
function legalModal() { modal('Responsible drinking', 'shield', '<p>Fab Wines is for adults of legal drinking age only. Please enjoy wine in moderation and never drink and drive. Do not drink if you are pregnant or on medication that interacts with alcohol.</p><p>Alcohol laws differ by state. We deliver only where the law allows and only to verified adults.</p>'); }
function storesModal() { modal('Find us', 'pin', '<p><b>Fab Wines Cellar</b><br>Delhi NCR. Pickup and tasting by appointment.</p><p>Call <b>+91 91100 40511</b> to book a visit.</p>'); }

/* copy buttons inside modals */
document.addEventListener('click', function (e) { var c = e.target.closest('[data-copy]'); if (c && c.closest('.md')) { try { navigator.clipboard.writeText(c.dataset.copy); } catch (x) {} c.textContent = 'Copied'; } });

/* ---------- homepage forms ---------- */
var enq = $('#enq');
if (enq) enq.onsubmit = function (e) {
  e.preventDefault(); var n = $('#enote');
  api('/api/enquiries', { method: 'POST', body: { name: $('#en-name').value, email: $('#en-mail').value, message: $('#en-msg').value } }).then(function () { n.textContent = 'Thank you. We have your message and will reply soon.'; enq.reset(); }).catch(function (er) { n.textContent = er.message; });
};
var news = $('#news');
if (news) news.onsubmit = function (e) { e.preventDefault(); api('/api/subscribe', { method: 'POST', body: { email: $('#nl').value } }).then(function () { $('#nnote').textContent = 'You are on the list. Welcome.'; news.reset(); }).catch(function (er) { $('#nnote').textContent = er.message; }); };
var src = $('.src'); if (src) src.textContent = 'Illustrative demand trends for each wine.';
var btn = $('#flHelp');

/* ---------- mini logo + features ---------- */
function mini(sz, cls) { sz = sz || 34; return '<span class="mlogo ' + (cls || '') + '" style="--s:' + sz + 'px"><svg width="' + (sz * .72) + '" height="' + (sz * .72) + '" viewBox="310 165 380 380" aria-hidden="true"><use href="#glass" width="380" height="380" x="310" y="165"/></svg></span>'; }
(function () {
  var s = $('.trust'); if (!s) return;
  var F6 = [['diamond', 'Authentic bottles', 'Sourced from authorised importers only'], ['glass', 'Hand-picked cellar', 'A small shelf of reds, whites, rosés and port'], ['snow', 'Stored with care', 'Cool, dark and lying down until it ships'], ['shield', 'Age-verified delivery', 'ID checked at your door, every time'], ['gift', 'Gift ready', 'Wrapping and a handwritten card on request'], ['truck', 'Free delivery over ₹5,000', 'Most orders ship within 24 hours']];
  var f = document.createElement('section'); f.className = 'feat'; f.id = 'features';
  f.innerHTML = '<div class="in"><div class="fh"><i></i>' + mini(56, 'big') + '<i></i></div><h2>Why <em>Fab Wines</em></h2><div class="fg">' + F6.map(function (x) { return '<div class="fi"><span class="fb">' + ic(x[0]) + '</span><div><b>' + x[1] + '</b><span>' + x[2] + '</span></div></div>'; }).join('') + '</div></div>';
  s.parentNode.insertBefore(f, s);
  var d = $('#drawer .dh h3'); if (d) d.innerHTML = mini(30) + ' Your cart';
  var ft = $('footer .in'); if (ft) { var r = document.createElement('div'); r.className = 'fmini'; r.innerHTML = mini(46) + '<b>FAB WINES</b><span>Uncork the extraordinary</span>'; ft.insertBefore(r, ft.firstChild); }
  var wh = $('#acctMenu'); if (wh) wh.dataset.mini = '1';
})();

/* ---------- age gate ---------- */
(function () {
  var ok = false; try { ok = localStorage.getItem('fabage') === '1'; } catch (e) {}
  if (ok) return;
  var g = document.createElement('div'); g.className = 'gate'; g.setAttribute('role', 'dialog'); g.setAttribute('aria-modal', 'true');
  g.innerHTML = '<div class="box"><img src="/logo.png" alt="Fab Wines"><h2>Are you of <em>legal drinking age</em>?</h2><p>Fab Wines sells alcohol to adults only. Please confirm your age to enter.</p><div class="acts"><button id="gy">Yes, I am 21 or older</button><button class="no" id="gn">No</button></div><small>Please drink responsibly.</small></div>';
  document.body.appendChild(g); document.body.classList.add('lock');
  $('#gy').onclick = function () { try { localStorage.setItem('fabage', '1'); } catch (e) {} g.remove(); document.body.classList.remove('lock'); };
  $('#gn').onclick = function () { $('.box', g).innerHTML = '<h2>See you <em>soon</em></h2><p>Come back when you are of legal drinking age. Until then, enjoy a glass of grape juice on us.</p>'; };
})();

/* ---------- boot ---------- */
paintHeader(); render(); draw(); loadMe();
})();
