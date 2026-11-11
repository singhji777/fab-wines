/* Home hero: the letters rise on load; while the stage is pinned, the cut-corner window opens into a
   full-width vineyard band, WINE turns ivory over it and the bottle settles. Rests under reduced motion. */
(function () {
'use strict';
var hero = document.getElementById('hero'); if (!hero) return;
var $ = function (id) { return document.getElementById(id); };
var stage = $('stage'), win = $('win'), poly = $('framePoly'), frame = $('frame'), word = $('word'),
    kTop = $('kTop'), kBot = $('kBot'), lead = $('lead'), bottle = $('bottle'), btn = $('heroBtn');
var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduce) hero.classList.add('static');

var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
var mix = function (a, b, t) { return a + (b - a) * t; };
var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
var oct = function (x, y, w, h, c) {
  return [[x + c, y], [x + w - c, y], [x + w, y + c], [x + w, y + h - c], [x + w - c, y + h], [x + c, y + h], [x, y + h - c], [x, y + c]];
};
var GOLD = [242, 181, 68], IVORY = [250, 248, 242];
var G = {};

function layout() {
  var vw = stage.clientWidth, vh = stage.clientHeight, head = 84, phone = vw < 700;
  var w0 = phone ? vw * .58 : clamp(vw * .29, 250, 440);
  var h0 = Math.min((vh - head) * (phone ? .6 : .74), w0 * 1.62);
  var fs = phone ? vw * .2 : Math.min(vw * .26, 400);
  word.style.fontSize = fs + 'px';
  // the gap between I and N is exactly as wide as the bottle that stands in it
  var h0pre = Math.min((vh - head) * (phone ? .6 : .74), (phone ? vw * .58 : clamp(vw * .29, 250, 440)) * 1.62);
  word.children[1].style.marginRight = (h0pre * 1.08 * 164 / 640 + fs * .06).toFixed(1) + 'px';
  G = { vw: vw, vh: vh, head: head, phone: phone, w0: w0, h0: h0, x0: (vw - w0) / 2, y0: head + (vh - head - h0) * (phone ? .32 : .5) + (phone ? 20 : 0), fs: fs,
        ww: word.offsetWidth, wh: word.offsetHeight, bandH: (vh - head) * (phone ? .5 : .62) };
  bottle.style.height = (G.h0 * 1.08) + 'px';
  // centre the gap between I and N (where the bottle stands) on the page, not the word's middle
  var keep = word.style.transform; word.style.transform = 'none';
  var s = word.children, wr = word.getBoundingClientRect(), a = s[1].getBoundingClientRect(), b = s[2].getBoundingClientRect();
  G.shift = wr.width / 2 - ((a.right + b.left) / 2 - wr.left);
  word.style.transform = keep;
}

function frameAt(p) {
  var e = ease(p), g = G;
  // the window and its gold outline
  var x = mix(g.x0, 0, e), y = mix(g.y0, g.head, e), w = mix(g.w0, g.vw, e), h = mix(g.h0, g.bandH, e), c = mix(28, 0, e);
  win.style.clipPath = 'polygon(' + oct(x, y, w, h, c).map(function (q) { return q[0].toFixed(1) + 'px ' + q[1].toFixed(1) + 'px'; }).join(',') + ')';
  poly.setAttribute('points', oct(x - 12, y - 12, w + 24, h + 24, c + 8).map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' '));
  frame.style.opacity = clamp(1 - e * 2.4, 0, 1);

  // WINE: sits across the window, then rises into the band and turns ivory
  var cy = mix(g.y0 + g.h0 * .47, g.head + g.bandH * .52, e), s = mix(1, g.phone ? .82 : .74, e);
  word.style.transform = 'translate(calc(-50% + ' + g.shift.toFixed(1) + 'px),' + (cy - g.wh / 2).toFixed(1) + 'px) scale(' + s.toFixed(3) + ')';
  var col = GOLD.map(function (v, i) { return Math.round(mix(v, IVORY[i], clamp(e * 1.6, 0, 1))); });
  word.style.color = 'rgb(' + col.join(',') + ')';

  // the small words, the line and the button step back as the band opens
  var left = g.vw / 2 - g.ww / 2 + g.shift, top = cy - g.wh / 2, fade = clamp(1 - p * 2.6, 0, 1);
  // the small words stay on the ivory, clear of the window, so dark type never sits on the photograph
  var rightCol = Math.max(g.x0 + g.w0 + 30, left + g.ww - kBot.offsetWidth);
  kTop.style.transform = 'translate(' + (left + g.fs * .04).toFixed(1) + 'px,' + (top - kTop.offsetHeight - g.fs * .02 - p * 60).toFixed(1) + 'px)';
  kBot.style.transform = 'translate(' + rightCol.toFixed(1) + 'px,' + (top + g.wh + g.fs * .04 + p * 60).toFixed(1) + 'px)';
  lead.style.transform = 'translate(' + rightCol.toFixed(1) + 'px,' + (top + g.wh + g.fs * .04 + kBot.offsetHeight + 14 + p * 60).toFixed(1) + 'px)';
  if (!hero.classList.contains('intro')) { kTop.style.opacity = kBot.style.opacity = lead.style.opacity = btn.style.opacity = fade; }
  btn.style.transform = 'translate(' + (g.x0 - (g.phone ? 70 : 92)).toFixed(1) + 'px,' + (g.y0 + g.h0 * .66).toFixed(1) + 'px)';
  if (g.phone) {   // on a phone the small words sit on the left line, above and under the window
    kTop.style.transform = 'translate(24px,' + (g.y0 - kTop.offsetHeight - 22 - p * 60).toFixed(1) + 'px)';
    kBot.style.transform = 'translate(24px,' + (g.y0 + g.h0 + 22 + p * 60).toFixed(1) + 'px)';
    lead.style.transform = 'translate(24px,' + (g.y0 + g.h0 + 30 + kBot.offsetHeight + p * 60).toFixed(1) + 'px)';
  }

  // the bottle stays in the middle and settles a little
  var by = mix(g.y0 + g.h0 - bottle.offsetHeight + g.vh * .03, g.y0 + g.h0 - bottle.offsetHeight + g.vh * .14, e);
  bottle.style.transform = 'translate(-50%,' + by.toFixed(1) + 'px) scale(' + mix(1, .9, e).toFixed(3) + ')';
}

function progress() {
  if (reduce) return 0;
  var r = hero.getBoundingClientRect(), span = hero.offsetHeight - innerHeight;
  return span > 0 ? clamp(-r.top / span, 0, 1) : 0;
}
var ticking = false;
function onScroll() { if (ticking) return; ticking = true; requestAnimationFrame(function () { ticking = false; frameAt(progress()); }); }
function boot() {
  layout(); frameAt(progress());
  requestAnimationFrame(function () { requestAnimationFrame(function () { hero.classList.remove('intro'); setTimeout(function () { frameAt(progress()); }, 1200); }); });
}
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', function () { layout(); frameAt(progress()); });
(document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(boot);
})();
