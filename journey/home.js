/* Home: the producers' marquee, the wine rail and the tasting-notes rail. */
(function () {
'use strict';
var W = window.WINES || [], esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

// the producers behind the bottles on the shelf
var MAKERS = ['Tenuta San Guido', 'Marchesi Antinori', 'Tenuta dell’Ornellaia', 'Silver Oak', 'Caymus Vineyards', 'Cloudy Bay', 'Graham’s', 'Rombauer', 'Far Niente', 'Stag’s Leap', 'Château d’Esclans', 'William Fèvre', 'G.D. Vajra', 'Dobbes'];
var row = MAKERS.map(function (m) { return '<span class="maker"><em>' + esc(m) + '</em></span>'; }).join('');
var track = document.getElementById('track');
if (track) track.innerHTML = row + '<span aria-hidden="true" style="display:contents">' + row + '</span>';

var r1 = document.getElementById('rail1');
if (r1 && window.Fab) r1.innerHTML = W.map(function (w) { return window.Fab.card(w); }).join('');

var r2 = document.getElementById('rail2');
if (r2) r2.innerHTML = W.map(function (w) {
  return '<figure class="note-card"><span class="q" aria-hidden="true">“</span><blockquote>' + esc(w.notes) + '</blockquote>'
    + '<figcaption><b>' + esc(w.name) + '</b><span>' + esc(w.type) + ' · ' + esc(w.region) + ' · ' + esc(w.year) + '</span></figcaption></figure>';
}).join('');

// photo rail: one dot per photo, the one in view is gold
var ph = document.getElementById('photos'), dots = document.getElementById('photoDots');
if (ph && dots) {
  dots.innerHTML = Array.prototype.map.call(ph.children, function () { return '<i></i>'; }).join('');
  var mark = function () { var best = 0, mid = ph.scrollLeft + ph.clientWidth / 2, dd0 = 1e9; [].forEach.call(ph.children, function (c, i) { var dd = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (dd < dd0) { dd0 = dd; best = i; } }); [].forEach.call(dots.children, function (x, i) { x.className = i === best ? 'on' : ''; }); };
  ph.addEventListener('scroll', mark, { passive: true }); mark();
}


// process steps: autoplay, one step at a time, with a progress line; pauses on hover or focus
(function () {
  var rail = document.getElementById('steps'); if (!rail) return;
  var cards = [].slice.call(rail.children), dots = document.getElementById('stepDots'), bar = document.getElementById('stepBar'), pp = document.getElementById('stepPause');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DUR = 6000, cur = 0, paused = reduce, hover = false, visible = true, t0 = 0, left = DUR, programmatic = false;
  dots.innerHTML = cards.map(function (_, i) { return '<button type="button" aria-label="Show step ' + (i + 1) + '" style="width:10px;height:10px;border-radius:50%;border:0;padding:0;background:rgba(23,20,15,.3)"></button>'; }).join('');
  var ds = [].slice.call(dots.children);
  function mark() { cards.forEach(function (c, i) { c.classList.toggle('on', i === cur); }); ds.forEach(function (d, i) { d.style.background = i === cur ? '#e6a52c' : 'rgba(23,20,15,.3)'; d.style.transform = i === cur ? 'scale(1.5)' : 'none'; }); }
  function pad() { return parseFloat(getComputedStyle(rail).paddingLeft) || 0; }
  function show(i) {
    cur = (i + cards.length) % cards.length; mark(); left = DUR; t0 = 0;
    programmatic = true; rail.scrollTo({ left: cards[cur].offsetLeft - pad(), behavior: reduce ? 'auto' : 'smooth' }); setTimeout(function () { programmatic = false; }, 900);
    bar.style.transform = 'scaleX(0)';
  }
  function tick(now) {
    if (!paused && !hover && visible && !document.hidden) {
      if (!t0) t0 = now - (DUR - left); var p = Math.min(1, (now - t0) / DUR); bar.style.transform = 'scaleX(' + p + ')'; left = DUR - p * DUR;
      if (p >= 1) { show(cur + 1); t0 = 0; }
    } else t0 = 0;
    requestAnimationFrame(tick);
  }
  function label() { pp.textContent = paused ? 'Play' : 'Pause'; pp.setAttribute('aria-label', (paused ? 'Play' : 'Pause') + ' the slideshow'); }
  pp.addEventListener('click', function () { paused = !paused; label(); });
  ds.forEach(function (d, i) { d.addEventListener('click', function () { show(i); }); });
  document.querySelector('.arrows[data-for="steps"]').addEventListener('click', function (e) { var b = e.target.closest('button[data-d]'); if (b) show(cur + +b.dataset.d); });
  rail.addEventListener('pointerenter', function () { hover = true; }); rail.addEventListener('pointerleave', function () { hover = false; });
  rail.addEventListener('focusin', function () { hover = true; }); rail.addEventListener('focusout', function () { hover = false; });
  rail.addEventListener('touchstart', function () { hover = true; }, { passive: true });
  rail.addEventListener('touchend', function () { setTimeout(function () { hover = false; }, 2500); }, { passive: true });
  // a manual scroll or swipe updates which step is in focus
  var st; rail.addEventListener('scroll', function () {
    if (programmatic) return; clearTimeout(st);
    st = setTimeout(function () { var best = 0, d0 = 1e9; cards.forEach(function (c, i) { var dd = Math.abs(c.offsetLeft - pad() - rail.scrollLeft); if (dd < d0) { d0 = dd; best = i; } }); cur = best; mark(); left = DUR; }, 120);
  }, { passive: true });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { threshold: .35 }).observe(rail);
  document.addEventListener('visibilitychange', function () { t0 = 0; });
  mark(); label(); requestAnimationFrame(tick);
})();

// arrows move a rail by one card
[].forEach.call(document.querySelectorAll('.arrows[data-for]:not([data-for="steps"])'), function (a) {
  var rail = document.getElementById(a.dataset.for);
  a.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-d]'); if (!b || !rail.firstElementChild) return;
    rail.scrollBy({ left: +b.dataset.d * (rail.firstElementChild.offsetWidth + 24), behavior: 'smooth' });
  });
});

// the note in the middle of the rail is the one in focus
if (r2 && 'IntersectionObserver' in window) {
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle('is-center', e.isIntersecting); }); }, { root: r2, rootMargin: '0px -35% 0px -35%', threshold: 0 });
  [].forEach.call(r2.children, function (c) { io.observe(c); });
  requestAnimationFrame(function () { r2.scrollLeft = (r2.children[1] ? r2.children[1].offsetLeft - (r2.clientWidth - r2.children[1].offsetWidth) / 2 : 0); });
}
})();
