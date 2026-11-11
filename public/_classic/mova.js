/* Fab Wines v4 layer: hero bottles, featured-bottle showcase. Runs after app.js. */
(function () {
'use strict';
var $ = function (s) { return document.querySelector(s); };
var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
var money = function (n) { return '₹' + new Intl.NumberFormat('en-IN').format(n); };
var byId = function (id) { return WINES.filter(function (w) { return w.id === id; })[0]; };

/* hero: three Tuscan icons standing behind the headline */
var hb = $('#heroBottles');
if (hb) hb.innerHTML = ['ornellaia', 'sassicaia', 'tignanello'].map(byId).filter(Boolean).map(function (w) {
  return '<img src="' + esc(w.img) + '" alt="" width="240" height="680">';
}).join('');
var hh = $('#heroHelp'); if (hh) hh.onclick = function () { $('#flHelp').click(); };

/* showcase: one big bottle for whatever the shelf below is currently showing */
var rail = $('#rail'); if (!rail) return;
var show = document.createElement('div'); show.className = 'show'; show.id = 'show';
rail.parentNode.insertBefore(show, rail);
var idx = 0, ids = [];

function paint() {
  var w = byId(ids[idx]);
  if (!w) { show.hidden = true; return; }
  show.hidden = false;
  var abv = parseFloat(w.abv);
  show.innerHTML = '<div class="show-pic"><img src="' + esc(w.img) + '" alt="' + esc(w.name) + ' bottle"></div>'
    + '<div class="show-info"><h3>' + esc(w.name) + '</h3><p class="where">' + esc(w.type) + ' · ' + esc(w.grape) + '</p><p class="notes">' + esc(w.notes) + '</p>'
    + '<div class="stats"><div><span>Alcohol</span><b>' + (isNaN(abv) ? esc(w.abv || '–') : abv + '<small>%</small>') + '</b></div>'
    + '<div><span>Vintage</span><b>' + esc(w.year) + '</b></div>'
    + '<div><span>You save</span><b>' + w.pct + '<small>%</small></b></div></div>'
    + '<div class="show-buy"><span class="p">' + money(w.price) + '<s>' + money(w.mrp) + '</s></span>'
    + (w.stock > 0 ? '<button class="btn" data-add="' + esc(w.id) + '">Add to cart</button>' : '<span class="lowtag">Sold out</span>') + '</div></div>'
    + '<div class="show-nav"><span>' + (idx + 1) + ' of ' + ids.length + '</span><button class="arr" data-sh="-1" aria-label="Previous bottle">←</button><button class="arr" data-sh="1" aria-label="Next bottle">→</button></div>';
}

/* follow the shelf: every render() rebuilds the card list, so re-read it */
var baseRender = window.render;
window.render = function () {
  baseRender.apply(this, arguments);
  ids = Array.prototype.map.call(rail.querySelectorAll('[data-add]'), function (b) { return b.dataset.add; });
  idx = 0; paint();
};
show.addEventListener('click', function (e) {
  var b = e.target.closest('[data-sh]'); if (!b || !ids.length) return;
  idx = (idx + +b.dataset.sh + ids.length) % ids.length; paint();
});
window.render();
})();
