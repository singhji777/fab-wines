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
var RKEY = 'fabreviews_preview', mine = {};
try { mine = JSON.parse(localStorage.getItem(RKEY) || '{}'); } catch (e) { mine = {}; }
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
var KEY = 'fabcart_preview', cart = [];
try { cart = JSON.parse(localStorage.getItem(KEY) || '[]').filter(function (c) { return byId[c.id] && c.q > 0; }); } catch (e) { cart = []; }
function save() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} paintCount(); }
function qty() { return cart.reduce(function (s, c) { return s + c.q; }, 0); }
function paintCount() { [].forEach.call(document.querySelectorAll('[data-cart-count]'), function (e) { e.textContent = qty(); }); }
function line(id) { return cart.filter(function (c) { return c.id === id; })[0]; }
function toast(m) {
  var t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = m; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(function () { t.classList.remove('show'); }, 1800);
}
function add(id, q) { q = q || 1; var it = line(id); if (it) it.q += q; else cart.push({ id: id, q: q }); save(); toast('Added to your cart'); }
function totals() {
  var sub = 0, n = 0; cart.forEach(function (c) { sub += byId[c.id].price * c.q; n += c.q; });
  var bundle = n >= 3 ? Math.round(sub * 0.1) : 0, after = sub - bundle, delivery = n ? (after >= 5000 ? 0 : 250) : 0;
  return { sub: sub, n: n, bundle: bundle, after: after, delivery: delivery, total: after + delivery };
}

/* ---------- shared bits ---------- */
function card(w, pick) {
  var media = pick
    ? '<div class="pic"><span class="tag">' + pctOff(w) + '% off</span><img src="' + w.img + '" alt="' + esc(w.name) + ' ' + esc(w.year) + '" loading="lazy"><span class="tick" aria-hidden="true">✓</span></div>'
    : '<a class="pic" href="wine.html?id=' + w.id + '"><span class="tag">' + pctOff(w) + '% off</span><img src="' + w.img + '" alt="' + esc(w.name) + ' ' + esc(w.year) + '" loading="lazy"></a>';
  return '<article class="pcard' + (pick ? ' pick' : '') + '" data-id="' + w.id + '"' + (pick ? ' tabindex="0" role="button" aria-pressed="false"' : '') + '>' + media
    + '<div class="body"><div class="meta">' + esc(w.type) + ' · ' + esc(w.region) + ' · ' + esc(w.year) + '</div>'
    + '<h3>' + (pick ? esc(w.name) : '<a href="wine.html?id=' + w.id + '">' + esc(w.name) + '</a>') + '</h3>'
    + ratingHtml(w.id)
    + '<p class="notes">' + esc(w.notes) + '</p>'
    + '<div class="row"><span class="price">' + fmt(w.price) + '<s>' + fmt(w.mrp) + '</s></span>'
    + (pick ? '' : '<button class="btn sm" data-add="' + w.id + '">Add to cart</button>') + '</div></div></article>';
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
    + '<button class="btn" id="addw">Add to cart</button></div></div></div>';
  $('#m').onclick = function () { n = Math.max(1, n - 1); $('#n').textContent = n; };
  $('#p').onclick = function () { n = Math.min(12, n + 1); $('#n').textContent = n; };
  $('#addw').onclick = function () { add(w.id, n); };

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
    rf.onsubmit = function (e) {
      e.preventDefault();
      if (!stars) { $('#rnote').textContent = 'Choose a star rating from 1 to 5.'; return; }
      var d = new FormData(rf);
      (mine[w.id] = mine[w.id] || []).push({ name: String(d.get('name')).trim().slice(0, 40), stars: stars, text: String(d.get('text')).trim().slice(0, 600), date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) });
      try { localStorage.setItem(RKEY, JSON.stringify(mine)); } catch (x) {}
      rf.reset(); stars = 0; paint(0); drawReviews(); $('#rnote').textContent = 'Thank you. Your review is posted.';
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
        + '<div class="go"><span class="price">' + fmt(w.price) + '</span><button class="btn sm" data-add="' + w.id + '">Add to cart</button></div></li>';
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
      + '<button class="btn" id="co"' + (t.n ? '' : ' disabled') + '>Checkout</button><p class="note" id="conote" role="status"></p>';
    var co = $('#co'); if (co) co.onclick = function () { $('#conote').textContent = 'Checkout is part of the live shop. This preview shows the cart only, so no order is placed.'; };
  }
  host.onclick = function (e) {
    var r = e.target.closest('[data-rm]'); if (r) { cart = cart.filter(function (c) { return c.id !== r.dataset.rm; }); save(); draw(); return; }
    var b = e.target.closest('[data-q]'); if (b) { var it = line(b.dataset.id); it.q += +b.dataset.q; if (it.q < 1) cart = cart.filter(function (c) { return c !== it; }); save(); draw(); }
  };
  draw();
}

function contactPage() {
  var f = $('#cform'); if (!f) return;
  f.onsubmit = function (e) {
    e.preventDefault();
    var d = new FormData(f), body = 'Name: ' + d.get('name') + '\nEmail: ' + d.get('email') + '\n\n' + d.get('message');
    location.href = 'mailto:' + OWNER + '?subject=' + encodeURIComponent('Message from ' + d.get('name') + ' via Fab Wines') + '&body=' + encodeURIComponent(body);
    $('#cnote').textContent = 'Your email app will open with the message ready to send.';
  };
}

/* ---------- boot ---------- */
document.addEventListener('click', function (e) {
  var a = e.target.closest('[data-add]'); if (a) { add(a.dataset.add, 1); return; }
  if (e.target.closest('.menu-btn')) document.body.classList.toggle('menu-open');
  else if (e.target.closest('.hd nav a')) document.body.classList.remove('menu-open');
});
document.addEventListener('submit', function (e) {
  var f = e.target.closest('form.nl'); if (!f) return; e.preventDefault();
  location.href = 'mailto:' + OWNER + '?subject=' + encodeURIComponent('Letters from the cellar') + '&body=' + encodeURIComponent('Please add ' + f.email.value + ' to the letters from the cellar.');
});
paintCount();
var page = document.body.dataset.page;
({ wines: winesPage, wine: winePage, bundle: bundlePage, pairing: pairingPage, cart: cartPage, contact: contactPage }[page] || function () {})();
window.Fab = { add: add, fmt: fmt, byId: byId, ratingHtml: ratingHtml };
})();
