// Builds the inner pages and refreshes the shared header and footer on every page.
// Run from the fabwines folder: node journey/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const OWNER = { name: 'Aditya Singh', email: 'adityasingh11may@gmail.com' };
const NAV = [['wines.html', 'Wines', 'wines'], ['bundle.html', 'Three bottles', 'bundle'], ['pairing.html', 'Pairing', 'pairing'], ['delivery.html', 'Delivery', 'delivery'], ['about.html', 'About us', 'about'], ['contact.html', 'Contact', 'contact']];
const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="M5 19 19 5M8 5h11v11"/></svg>';
const PHOTOS = [
  ['View towards distant Siena', 'Eric Kilby', 'CC BY-SA 2.0', 'https://creativecommons.org/licenses/by-sa/2.0/', 'https://commons.wikimedia.org/wiki/File:View_Towards_Distant_Siena.jpg'],
  ['Wine cellar at Château Kirwan', 'Jon', 'CC BY 2.0', 'https://creativecommons.org/licenses/by/2.0/', 'https://commons.wikimedia.org/wiki/File:Wine_Cellar_at_Chateau_Kirwan.jpg'],
  ['Grapes and vine, Oberlin noir (cropped)', 'KenBailey', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/', 'https://commons.wikimedia.org/wiki/File:Grappes_et_vigne_d%27oberlin_noir_20221812.jpg'],
  ['Hand harvesting Pinot noir grapes (cropped)', 'Mark Smith', 'CC BY 2.0', 'https://creativecommons.org/licenses/by/2.0/', 'https://commons.wikimedia.org/wiki/File:Hand_harvesting_Pinot_noir_grapes.jpg'],
  ['A hand holding a glass of red wine (cropped)', 'PattayaPatrol', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/', 'https://commons.wikimedia.org/wiki/File:DFC_5084_A_hand_with_bright_blue_nails_holding_a_glass_of_red_wine_beside_a_pink_orchid_on_a_table.jpg'],
];

const header = (page) => `<header class="rx-head"><div class="rx-hd">
  <a class="rx-logo" href="index.html" aria-label="Fab Wines home"><b>FW</b></a>
  <nav class="rx-nav" aria-label="Main">${NAV.map(([h, t, p]) => `<a href="${h}"${p === page ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
  <button class="menu-btn" type="button" aria-label="Menu"><span></span><span></span></button>
  <a class="rx-cart" href="cart.html" aria-label="Cart"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M6 8h12l1 13H5zM9 8a3 3 0 0 1 6 0" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M6 8h12l1 13H5z"/></svg><span data-cart-total>₹0</span><b data-cart-count class="sr-only">0</b></a>
</div></header>`;

const footer = () => `<footer>
  <div class="wrap">
    <div class="ft">
      <div><h4>Fab Wines</h4><a href="about.html">About us</a><a href="contact.html">Contact</a></div>
      <div><h4>Shop</h4><a href="wines.html">Wines</a><a href="bundle.html">Three bottles</a><a href="cart.html">Cart</a></div>
      <div><h4>Help</h4><a href="pairing.html">Pairing</a><a href="delivery.html">Delivery and questions</a></div>
      <div><h4>Letters from the cellar</h4><form class="nl"><input type="email" name="email" placeholder="Your email" aria-label="Email" required><button class="btn sm">Subscribe</button></form></div>
    </div>
    <div class="legal"><span>© 2026 Fab Wines. Alcohol is for adults only. Please drink responsibly.</span><a href="credits.html">Photographs via Wikimedia Commons</a></div>
    <div class="owner-end"><div><b>${OWNER.name}</b><span>Founder and owner, Fab Wines</span></div><a href="mailto:${OWNER.email}">${OWNER.email}</a></div>
  </div>
  <div class="foot-word" aria-hidden="true">Fab Wines</div>
</footer>`;

const wrapPage = ({ page, title, desc, main }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Arimo:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="site.css">
<link rel="stylesheet" href="relax.css">
</head>
<body data-page="${page}">
<!--HEADER-->${header(page)}<!--/HEADER-->
<main>
${main}
</main>
<!--FOOTER-->${footer()}<!--/FOOTER-->
<script src="wines.js"></script>
<script src="reviews.js"></script>
<script src="site.js"></script>
</body>
</html>
`;

const phead = (label, h, p) => `<section class="phead"><div class="wrap"><p class="label">${label}</p><h1>${h}</h1>${p ? `<p>${p}</p>` : ''}</div></section>`;
const bar = (extra) => `<div class="bar"><div class="tabs2" id="tabs" role="group" aria-label="Filter wines"></div><div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><span class="count" id="count"></span>${extra}</div></div>`;
const owner = `<div class="ownercard"><div class="ava" aria-hidden="true">A</div><div><h3>${OWNER.name}</h3><p>Founder and owner, Fab Wines</p><a class="link" href="mailto:${OWNER.email}">${OWNER.email}</a></div></div>`;

const pages = [
  { file: 'wines.html', page: 'wines', title: 'Wines | Fab Wines', desc: 'Nineteen reds, whites, rosés and ports from ₹3,200, shipped within 24 hours.',
    main: `${phead('The cellar', 'Nineteen <em>wines</em>', 'Reds, whites, rosés and ports from ₹3,200. Every bottle is 750 ml and priced below its list price.')}
<section class="sec tight" style="padding-top:0"><div class="wrap">
  ${bar('<select id="sort" aria-label="Sort wines"><option value="featured">Sort: Featured</option><option value="lo">Price: low to high</option><option value="hi">Price: high to low</option><option value="off">Biggest saving</option></select>')}
  <div class="grid4" id="grid"></div>
</div></section>` },
  { file: 'wine.html', page: 'wine', title: 'Wine | Fab Wines', desc: 'A bottle from the Fab Wines cellar.',
    main: `<section class="sec tight" style="padding-top:0"><div class="wrap"><p class="crumbs"><a class="link" href="wines.html">← All wines</a></p><div id="wine" style="margin-top:28px"></div></div></section>
<section class="sec paper"><div class="wrap two">
  <div><h2 class="h-lg" style="margin-bottom:18px">Reviews</h2><div id="revs" class="revs"></div></div>
  <form class="stack" id="rform">
    <h3 class="h-lg" style="font-size:clamp(28px,3vw,40px)">Write a review</h3>
    <div class="pick" role="group" aria-label="Your rating">${[1, 2, 3, 4, 5].map((v) => `<button type="button" data-v="${v}" aria-label="${v} star${v > 1 ? 's' : ''}" aria-pressed="false"></button>`).join('')}</div>
    <label>Your name<input name="name" required maxlength="40" autocomplete="name"></label>
    <label>Your review<textarea name="text" maxlength="600" placeholder="What did you drink it with?"></textarea></label>
    <button class="btn" type="submit">Post review</button>
    <p class="note" id="rnote" role="status"></p>
  </form>
</div></section>
<section class="sec"><div class="wrap"><h2 class="h-lg" style="margin-bottom:32px">More wines</h2><div class="grid4" id="related"></div></div></section>` },
  { file: 'bundle.html', page: 'bundle', title: 'Three bottles, ten percent off | Fab Wines', desc: 'Pick any three bottles and ten percent comes off in your cart.',
    main: `${phead('Three bottles', 'Pick three, <em>save ten</em> percent', 'Choose any three bottles from the cellar. The saving comes off in your cart, with no code to enter.')}
<section class="sec tight" style="padding-top:0"><div class="wrap builder"><div class="grid3" id="grid"></div><aside class="summary" id="sum" aria-live="polite"></aside></div></section>` },
  { file: 'pairing.html', page: 'pairing', title: 'Dinner pairings | Fab Wines', desc: 'Find the bottle that suits tonight\'s dinner.',
    main: `${phead('Pairing', 'Dinner <em>pairings</em>', 'Search a dish and we show the wines that suit it.')}
<section class="sec tight" style="padding-top:0"><div class="wrap">
  ${bar('<input type="search" id="term" placeholder="Search a dish, for example lamb" aria-label="Search a dish" style="min-width:260px">')}
  <ul class="plist" id="plist"></ul>
</div></section>` },
  { file: 'delivery.html', page: 'delivery', title: 'Delivery and questions | Fab Wines', desc: 'Delivery is free over ₹5,000. Orders ship within 24 hours and you pay on delivery.',
    main: `${phead('Delivery', 'Packed upright, <em>shipped</em> in a day', 'Orders ship within 24 hours and you pay when the bottles arrive.')}
<section class="sec tight" style="padding-top:10px"><div class="wrap fcards3">
  <div class="fc"><h3>Free delivery <b>over ₹5,000</b></h3><p>Orders over ₹5,000 ship free, otherwise ₹250.</p></div>
  <div class="fc"><h3>Ships <b>within 24 hours</b></h3><p>Every bottle ships padded and upright.</p></div>
  <div class="fc"><h3>Adults <b>21 and over</b></h3><p>Age is checked at delivery.</p></div>
</div></section>
<section class="sec paper"><div class="wrap two"><h2 class="h-xl">Questions</h2><div class="faq">
  <div><h3>Who can order?</h3><p>Anyone aged 21 or over. Age is checked at delivery.</p></div>
  <div><h3>What does delivery cost?</h3><p>Free when your order is over ₹5,000, otherwise ₹250. Orders ship within 24 hours.</p></div>
  <div><h3>How do I pay?</h3><p>On delivery, by cash, UPI or card.</p></div>
  <div><h3>How does the three-bottle deal work?</h3><p>Add any three bottles to your cart and ten percent comes off automatically. You can also <a class="link" href="bundle.html">pick your three</a>.</p></div>
  <div><h3>Can I track my order?</h3><p>Yes. Choose Track an Order and enter your order number and phone number.</p></div>
  <div><h3>Still stuck?</h3><p>Write to us on the <a class="link" href="contact.html">contact page</a> and we reply by email.</p></div>
</div></div></section>` },
  { file: 'about.html', page: 'about', title: 'About us | Fab Wines', desc: 'Why Fab Wines keeps its shelf short, and who runs it.',
    main: `${phead('About us', 'Our <em>way</em>', 'A short shelf, chosen on purpose.')}
<section class="sec tight" style="padding-top:0"><div class="wrap two">
  <div class="prose"><h2 class="h-lg" style="margin-bottom:24px">We sell the evening, not just the bottle</h2>
    <p>We keep the shelf short on purpose. Every bottle is there because it is easy to share, easy to talk about and worth opening on an ordinary evening.</p>
    <p>No jargon on the labels and no rare bottles locked away. Tell us what is on the table and who is coming, and we will suggest something that fits.</p>
    <a class="btn" href="wines.html">Shop wines <span class="arr">→</span></a></div>
  <div class="oct" style="aspect-ratio:4/5;background:linear-gradient(180deg,#efe6d2,#e1cfa6);display:flex;align-items:flex-end;justify-content:center;gap:5%;padding:0 6% 6%"><img src="img/n1.webp" alt="Sassicaia 2018" style="height:84%;width:auto"><img src="img/n2.webp" alt="Tignanello 2018" style="height:84%;width:auto"><img src="img/n3.webp" alt="Ornellaia 2017" style="height:84%;width:auto"></div>
</div></section>
<section class="sec paper"><div class="wrap">${owner}</div></section>` },
  { file: 'contact.html', page: 'contact', title: 'Contact | Fab Wines', desc: 'Write to Aditya Singh at Fab Wines.',
    main: `${phead('Contact', 'Write <em>to us</em>', 'Ask about a bottle, an order or a gift. We reply by email.')}
<section class="sec tight" style="padding-top:0"><div class="wrap two">
  ${owner}
  <form class="stack" id="cform">
    <label>Your name<input name="name" required autocomplete="name"></label>
    <label>Your email<input name="email" type="email" required autocomplete="email"></label>
    <label>Message<textarea name="message" required></textarea></label>
    <button class="btn" type="submit">Send message <span class="arr">→</span></button>
    <p class="note" id="cnote" role="status"></p>
  </form>
</div></section>` },
  { file: 'cart.html', page: 'cart', title: 'Your cart | Fab Wines', desc: 'Your Fab Wines cart.',
    main: `${phead('Cart', 'Your <em>cart</em>', '')}
<section class="sec tight" style="padding-top:0"><div class="wrap cart"><div id="lines"></div><aside class="summary" id="csum" aria-live="polite"></aside></div></section>` },
  { file: 'credits.html', page: 'credits', title: 'Photo credits | Fab Wines', desc: 'Credits for the photographs on Fab Wines.',
    main: `${phead('Credits', 'Photo <em>credits</em>', 'The landscape and cellar photographs come from Wikimedia Commons under Creative Commons licences. They were resized for the web. Bottle photographs are Fab Wines\' own.')}
<section class="sec tight" style="padding-top:0"><div class="wrap"><ul class="rows">${PHOTOS.map(([t, a, l, lu, src]) => `<li><span>${t}, by ${a}</span><span><a class="link" href="${lu}">${l}</a> · <a class="link" href="${src}">Source</a></span></li>`).join('')}</ul></div></section>` },
];

for (const p of pages) fs.writeFileSync(path.join(dir, p.file), wrapPage(p));

const ip = path.join(dir, 'index.html');
let home = fs.readFileSync(ip, 'utf8');
home = home.replace(/<!--HEADER-->[\s\S]*?<!--\/HEADER-->/, `<!--HEADER-->${header('home')}<!--/HEADER-->`);
home = home.replace(/<!--FOOTER-->[\s\S]*?<!--\/FOOTER-->/, `<!--FOOTER-->${footer()}<!--/FOOTER-->`);
fs.writeFileSync(ip, home);
console.log('built', pages.length, 'pages + refreshed index.html');
