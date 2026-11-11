/* Hero animation: a bottle pours into a glass, then a second glass arrives for a cheers.
   Plays only while on screen; rests on its still frame under reduced motion or when paused. */
(function () {
'use strict';
var svg = document.getElementById('pourSvg'); if (!svg) return;
var $ = function (id) { return document.getElementById(id); };
var gA = $('gA'), gB = $('gB'), wA = $('wA'), wAr = $('wAr'), wAs = $('wAs'), wB = $('wB'), bottle = $('bottle'), stream = $('stream'), spark = $('spark'), scene = $('scene'), btn = $('pourPause'), shB = $('shB');

var T = 11;                                  // seconds per loop
var XA = 300, XB_IN = 520, XB_TOUCH = 502, XB_OUT = 1000;
var EMPTY = -106, FULL = -168;               // wine level in glass coordinates
var UP = { x: 640, y: 88, a: 0 }, POUR = { x: 322, y: 72, a: -100 };
var TILT = 10;

var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
var seg = function (t, a, b) { return clamp((t - a) / (b - a)); };
var ease = function (p) { return p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
var out = function (p) { return 1 - Math.pow(1 - p, 3); };
var mix = function (a, b, p) { return a + (b - a) * p; };

function glass(g, w, x, ang, level) {
  g.setAttribute('transform', 'translate(' + x.toFixed(2) + ' 340) rotate(' + ang.toFixed(2) + ')');
  // the wine stays level while the glass tilts
  w.setAttribute('transform', 'rotate(' + (-ang).toFixed(2) + ' 0 ' + level.toFixed(2) + ')');
}

function frame(t) {
  // bottle: swing in, pour, swing back, step away
  var pin = ease(seg(t, .8, 1.8)), pback = ease(seg(t, 4.9, 5.9)), p = pin * (1 - pback);
  var bx = mix(UP.x, POUR.x, p), by = mix(UP.y, POUR.y, p), ba = mix(UP.a, POUR.a, p);
  bottle.setAttribute('transform', 'translate(' + bx.toFixed(2) + ' ' + by.toFixed(2) + ') rotate(' + ba.toFixed(2) + ')');
  bottle.setAttribute('opacity', (1 - seg(t, 5.9, 6.4)).toFixed(3));

  // wine level in glass A
  var lvl = mix(EMPTY, FULL, out(seg(t, 2.0, 4.8)));
  wAr.setAttribute('y', lvl.toFixed(2));
  var pouring = t > 2.0 && t < 4.9;
  wAs.setAttribute('cy', lvl.toFixed(2));
  wAs.setAttribute('ry', (pouring ? 4 + 1.6 * Math.sin(t * 14) : 4).toFixed(2));
  wAs.setAttribute('opacity', lvl < EMPTY - 2 ? .95 : 0);

  // the stream: grows from the lip, then lets go from the top
  var surf = 340 + lvl, tipX = POUR.x + 2, tipY = POUR.y + 4;
  var grow = out(seg(t, 1.8, 2.1)), stop = seg(t, 4.8, 5.1);
  if (grow > 0 && stop < 1) {
    var y1 = mix(tipY, surf, stop), y2 = mix(tipY, surf, grow);
    var x1 = mix(tipX, XA + 4, (y1 - tipY) / (surf - tipY || 1)), x2 = mix(tipX, XA + 4, (y2 - tipY) / (surf - tipY || 1));
    stream.setAttribute('d', 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' Q' + ((x1 + x2) / 2 + 3).toFixed(1) + ' ' + ((y1 + y2) / 2).toFixed(1) + ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1));
    stream.setAttribute('opacity', 1);
  } else stream.setAttribute('opacity', 0);

  // the second glass arrives, both tilt in, clink, settle
  var xin = mix(XB_OUT, XB_IN, out(seg(t, 6.0, 7.0)));
  var tin = ease(seg(t, 7.0, 7.5)), bounce = Math.sin(seg(t, 7.5, 7.8) * Math.PI) * .25, tback = ease(seg(t, 8.5, 9.1));
  var tilt = TILT * (tin - bounce * tin) * (1 - tback);
  var xb = mix(xin, XB_TOUCH, tilt / TILT);
  glass(gA, wA, XA, tilt, lvl);
  glass(gB, wB, xb, -tilt, FULL);
  gB.setAttribute('opacity', seg(t, 6.0, 6.3).toFixed(3));
  shB.setAttribute('cx', xb.toFixed(2)); shB.setAttribute('opacity', (.28 * seg(t, 6.0, 6.3)).toFixed(3));

  // the clink
  var s = seg(t, 7.45, 8.05);
  spark.setAttribute('opacity', s > 0 && s < 1 ? (1 - s).toFixed(3) : 0);
  spark.setAttribute('transform', 'translate(401 124) scale(' + (.6 + s * .9).toFixed(3) + ')');

  // fade the whole scene between loops
  scene.setAttribute('opacity', Math.min(seg(t, 0, .4), 1 - seg(t, 10.3, 10.9)).toFixed(3));
}

function still() {   // the frame shown without motion: a full glass, a second one beside it, the bottle standing
  bottle.setAttribute('transform', 'translate(' + UP.x + ' ' + UP.y + ') rotate(0)'); bottle.setAttribute('opacity', 1);
  wAr.setAttribute('y', FULL); wAs.setAttribute('cy', FULL); wAs.setAttribute('ry', 4); wAs.setAttribute('opacity', .95);
  glass(gA, wA, XA, 0, FULL); glass(gB, wB, XB_IN, 0, FULL); gB.setAttribute('opacity', 1);
  shB.setAttribute('cx', XB_IN); shB.setAttribute('opacity', .28);
  stream.setAttribute('opacity', 0); spark.setAttribute('opacity', 0); scene.setAttribute('opacity', 1);
}

var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
var paused = reduce, visible = true, start = null, raf = 0, at = 0;
function loop(now) {
  if (start === null) start = now - at * 1000;
  at = ((now - start) / 1000) % T; frame(at);
  raf = requestAnimationFrame(loop);
}
function run() { cancelAnimationFrame(raf); raf = 0; if (!paused && visible && !document.hidden) { start = null; raf = requestAnimationFrame(loop); } }
function label() { if (!btn) return; btn.textContent = paused ? 'Play' : 'Pause'; btn.setAttribute('aria-label', (paused ? 'Play' : 'Pause') + ' the pouring animation'); }

if (btn) btn.onclick = function () { paused = !paused; if (paused) { still(); at = 0; } label(); run(); };
if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; run(); }).observe(svg);
document.addEventListener('visibilitychange', run);
if (paused) still();
label(); run();
})();
