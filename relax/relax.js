/* Home: one wine per colour. Pressing Next fills the button with the next colour, a round wipe sweeps
   across the page from it, the bottles slide and the words change. Autoplays until the visitor acts. */
(function () {
'use strict';
var W = window.WINES || [], by = {}; W.forEach(function (w) { by[w.id] = w; });
var $ = function (id) { return document.getElementById(id); };
var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
var fmt = window.Fab ? window.Fab.fmt : function (n) { return '₹' + n; };

// one wine for each colour; the bottle photographs are the shop's own
var SET = [
  { id: 'cloudy', t: 'white', bg: '#f6efdc', next: '#f6efdc', thumb: 'harvest' },
  { id: 'tignanello', t: 'red', bg: '#b32020', thumb: 'grapes' },
  { id: 'angel', t: 'rose', bg: '#fcc9ba', thumb: 'hills' },
  { id: 'graham', t: 'port', bg: '#4a1a14', thumb: 'cellar' }
].filter(function (s) { return by[s.id]; });
var N = SET.length, cur = 0, busy = false, auto = true, timer = 0;
var rx = $('rx'), wipe = $('wipe'), track = $('track'), next = $('next'), desc = $('desc'), view = $('view'), thumb = $('thumb'), col = $('col');
var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduce) auto = false;

function slide(i) {
  var w = by[SET[i % N].id];
  return '<div class="rx-slide"><div class="bt"><img src="' + w.img + '" alt="' + esc(w.name) + ' ' + esc(w.year) + ' bottle"></div>'
    + '<h3><a class="nm" href="wine.html?id=' + w.id + '">Fab Wines: ' + esc(w.name) + ', ' + esc(w.type.toLowerCase()) + '</a></h3>'
    + '<div class="pr"><span>' + fmt(w.price) + '</span><button class="plus" type="button" data-add="' + w.id + '" aria-label="Add ' + esc(w.name) + ' to cart">+</button></div></div>';
}
function words(i) {
  var w = by[SET[i].id];
  desc.textContent = w.name + ' ' + w.year.replace('NV', '') + ' is a ' + w.type.toLowerCase() + ' wine from ' + w.region + ', at ' + w.abv + ' alcohol. ' + w.notes + ' ' + (w.pair ? 'Pour it with ' + w.pair.toLowerCase() + '.' : '');
  view.href = 'wine.html?id=' + w.id; thumb.src = 'img/photo/' + SET[i].thumb + '.webp';
}
function render(i) { track.innerHTML = slide(i) + slide(i + 1) + slide(i + 2); track.style.transition = 'none'; track.style.transform = 'translateX(0)'; }
function slideW() { return track.firstElementChild.getBoundingClientRect().width; }

function go() {
  if (busy) return; busy = true;
  var to = (cur + 1) % N, nx = SET[to], r = rx.getBoundingClientRect(), b = next.getBoundingClientRect();
  var cx = b.left + b.width / 2 - r.left, cy = b.top + b.height / 2 - r.top;
  // the Next button takes the colour of the wine that is coming
  next.classList.add('fill');
  var swap = function () {
    rx.classList.add('swap');
    setTimeout(function () { rx.dataset.t = nx.t; words(to); rx.classList.remove('swap'); }, 360);
  };
  if (reduce) { rx.dataset.t = nx.t; words(to); cur = to; render(cur); armNext(); next.classList.remove('fill'); busy = false; return; }
  wipe.style.transition = 'none'; wipe.style.background = 'radial-gradient(60% 55% at 14% 34%,' + glow(nx.t) + ',transparent 70%),' + nx.bg;
  wipe.style.clipPath = 'circle(0px at ' + cx + 'px ' + cy + 'px)'; void wipe.offsetWidth;
  setTimeout(function () {
    wipe.style.transition = 'clip-path 1s cubic-bezier(.65,0,.25,1)';
    wipe.style.clipPath = 'circle(' + Math.hypot(r.width, r.height) + 'px at ' + cx + 'px ' + cy + 'px)';
    swap();
    track.style.transition = 'transform 1s cubic-bezier(.65,0,.25,1)'; track.style.transform = 'translateX(-' + slideW() + 'px)';
  }, 260);
  setTimeout(function () {
    cur = to; rx.dataset.t = nx.t; wipe.style.transition = 'none'; wipe.style.clipPath = 'circle(0px at 50% 50%)';
    render(cur); armNext(); next.classList.remove('fill'); busy = false;
  }, 1340);
}
function glow(t) { return { white: '#efdcaa', red: '#d41414', rose: '#f8a99a', port: '#7a2a1c' }[t]; }

next.addEventListener('click', function () { auto = false; clearInterval(timer); go(); });
col.addEventListener('pointerenter', function () { clearInterval(timer); });
function start() { if (!auto) return; clearInterval(timer); timer = setInterval(function () { if (auto && !document.hidden) go(); }, 6500); }
document.addEventListener('visibilitychange', function () { if (document.hidden) clearInterval(timer); else start(); });
col.addEventListener('pointerleave', start);

// the Next button fills with the colour of the wine that comes after the one on show
var FILL = { white: '#c9a24b', red: '#b32020', rose: '#e8806c', port: '#5a1f16' };
function armNext() { rx.style.setProperty('--next', FILL[SET[(cur + 1) % N].t]); }
words(0); render(0); rx.dataset.t = SET[0].t; armNext(); start();

// below the stage: the wine rail and three trios
var r1 = $('rail1'); if (r1 && window.Fab) r1.innerHTML = W.map(function (w) { return window.Fab.card(w); }).join('');
[].forEach.call(document.querySelectorAll('.arrows[data-for]'), function (a) {
  var rail = $(a.dataset.for);
  a.addEventListener('click', function (e) { var b = e.target.closest('button[data-d]'); if (!b || !rail.firstElementChild) return; rail.scrollBy({ left: +b.dataset.d * (rail.firstElementChild.offsetWidth + 24), behavior: 'smooth' }); });
});
var TRIOS = [
  { h: 'Tuscan icons', s: 'Sassicaia, Tignanello and Ornellaia.', ids: ['sassicaia', 'tignanello', 'ornellaia'] },
  { h: 'Californian cabernets', s: 'Faust, Pine Ridge and Chateau Buena Vista.', ids: ['faust', 'pineridge', 'buenavista'] },
  { h: 'Crisp whites', s: 'Cloudy Bay, William Fevre Chablis and Grand Napa.', ids: ['cloudy', 'fevre', 'grandnapa'] }
];
var tr = $('trios');
if (tr) tr.innerHTML = TRIOS.map(function (t) {
  var m = t.ids.map(function (i) { return by[i]; }), sum = m.reduce(function (a, w) { return a + w.price; }, 0), mrp = m.reduce(function (a, w) { return a + w.mrp; }, 0);
  return '<article class="rx-trio"><div class="bots">' + m.map(function (w) { return '<img src="' + w.img + '" alt="' + esc(w.name) + '" loading="lazy">'; }).join('') + '</div>'
    + '<div class="body"><h3>' + esc(t.h) + '</h3><p>' + esc(t.s) + '</p><span class="price">' + fmt(Math.round(sum * .9)) + '<s>' + fmt(mrp) + '</s></span>'
    + '<button class="btn" data-add-many="' + t.ids.join(',') + '">Add the three to cart</button></div></article>';
}).join('');
})();
