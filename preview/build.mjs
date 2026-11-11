// Builds the inner pages and refreshes the shared header/footer on every page.
// Run from the fabwines folder: node preview/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const OWNER = { name: 'Aditya Singh', email: 'adityasingh11may@gmail.com' };

const NAV = [['wines.html', 'Wines', 'wines'], ['bundle.html', 'Three bottles', 'bundle'], ['pairing.html', 'Pairing', 'pairing'], ['delivery.html', 'Delivery', 'delivery'], ['about.html', 'About', 'about'], ['contact.html', 'Contact', 'contact']];

const header = (page) => `<header><div class="wrap hd">
  <a class="brand" href="index.html">Fab Wines</a>
  <nav aria-label="Main">${NAV.map(([h, t, p]) => `<a href="${h}"${p === page ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
  <div class="right"><a class="cartlink" href="cart.html">Cart <b data-cart-count>0</b></a><a class="btn" href="wines.html">Order wine</a><button class="menu-btn" type="button" aria-label="Menu">☰</button></div>
</div></header>`;

const footer = () => `<footer id="contact">
  <div class="wrap">
    <div class="ft">
      <div><h4>Fab Wines</h4><a href="about.html">About us</a><a href="contact.html">Contact</a></div>
      <div><h4>Shop</h4><a href="wines.html">Wines</a><a href="bundle.html">Three bottles</a><a href="cart.html">Cart</a></div>
      <div><h4>Help</h4><a href="pairing.html">Pairing</a><a href="delivery.html">Delivery</a></div>
      <div><h4>Letters from the cellar</h4><form class="nl"><input type="email" name="email" placeholder="Your email" aria-label="Email" required><button>Subscribe</button></form></div>
    </div>
    <div class="legal">© 2026 Fab Wines. Alcohol is for adults only. Please drink responsibly.</div>
    <div class="owner-end"><div><b>${OWNER.name}</b><span>Founder and owner, Fab Wines</span></div><a href="mailto:${OWNER.email}">${OWNER.email}</a></div>
  </div>
  <div class="foot-word" aria-hidden="true">Fab Wines</div>
</footer>`;

const wrapPage = ({ file, page, title, desc, main }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="stylesheet" href="site.css">
<link rel="stylesheet" href="pages.css">
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

const phead = (h, p, cream = false) => `<section class="phead${cream ? ' cream' : ''}"><div class="wrap"><h1 class="mega">${h}</h1>${p ? `<p>${p}</p>` : ''}</div></section>`;
const tabsBar = (extra = '') => `<div class="bar"><div class="tabs2" id="tabs" role="group" aria-label="Filter wines"></div>${extra}</div>`;

const pages = [
  {
    file: 'wines.html', page: 'wines', title: 'Wines | Fab Wines', desc: 'Nineteen reds, whites, rosés and ports from ₹3,200, shipped within 24 hours.',
    main: `${phead('Nineteen wines', 'Reds, whites, rosés and ports from ₹3,200. Every bottle is 750 ml and priced below its list price.')}
<section class="sec dark"><div class="wrap">
  ${tabsBar('<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><span class="count" id="count"></span><select id="sort" aria-label="Sort wines"><option value="featured">Sort: Featured</option><option value="lo">Price: low to high</option><option value="hi">Price: high to low</option><option value="off">Biggest saving</option></select></div>')}
  <div class="grid4" id="grid"></div>
</div></section>`,
  },
  {
    file: 'wine.html', page: 'wine', title: 'Wine | Fab Wines', desc: 'A bottle from the Fab Wines cellar.',
    main: `<section class="sec dark" style="padding-top:0"><div class="wrap">
  <p class="crumbs"><a href="wines.html">← All wines</a></p>
  <div id="wine"></div>
</div></section>
<section class="sec green"><div class="wrap two">
  <div><h2 class="sh">Reviews</h2><div id="revs" class="revs"></div></div>
  <form class="stack" id="rform">
    <h3 class="sh" style="font-size:clamp(28px,3vw,40px);margin:0">Write a review</h3>
    <div class="pick" role="group" aria-label="Your rating">${[1, 2, 3, 4, 5].map((v) => `<button type="button" data-v="${v}" aria-label="${v} star${v > 1 ? 's' : ''}" aria-pressed="false"></button>`).join('')}</div>
    <label>Your name<input name="name" required maxlength="40" autocomplete="name"></label>
    <label>Your review<textarea name="text" maxlength="600" placeholder="What did you drink it with?"></textarea></label>
    <button class="btn" type="submit">Post review</button>
    <p class="note" id="rnote" role="status"></p>
  </form>
</div></section>
<section class="sec dark"><div class="wrap"><h2 class="sh">More wines</h2><div class="grid4" id="related"></div></div></section>`,
  },
  {
    file: 'bundle.html', page: 'bundle', title: 'Three bottles, ten percent off | Fab Wines', desc: 'Pick any three bottles and ten percent comes off in your cart.',
    main: `${phead('Three bottles, ten percent off', 'Pick any three bottles from the cellar. The saving comes off in your cart, with no code to enter.')}
<section class="sec dark"><div class="wrap"><div class="builder">
  <div class="grid3" id="grid"></div>
  <aside class="summary" id="sum" aria-live="polite"></aside>
</div></div></section>`,
  },
  {
    file: 'pairing.html', page: 'pairing', title: 'Dinner pairings | Fab Wines', desc: 'Find the bottle that suits tonight\'s dinner.',
    main: `${phead('Dinner pairings', 'Search a dish and we show the wines that suit it.', true)}
<section class="sec cream"><div class="wrap">
  ${tabsBar('<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><span class="count" id="count"></span><input type="search" id="term" placeholder="Search a dish, for example lamb" aria-label="Search a dish" style="min-width:260px"></div>')}
  <ul class="plist" id="plist"></ul>
</div></section>`,
  },
  {
    file: 'delivery.html', page: 'delivery', title: 'Delivery and questions | Fab Wines', desc: 'Delivery is free over ₹5,000. Orders ship within 24 hours and you pay on delivery.',
    main: `${phead('Delivery', 'Packed upright, shipped within 24 hours, paid for when the bottles arrive.')}
<section class="sec green" style="padding-top:20px"><div class="wrap"><div class="fcards3">
  <div class="fc"><h3>Free delivery <b>₹5,000+</b></h3><p>Orders over ₹5,000 ship free, otherwise ₹250.</p></div>
  <div class="fc"><h3>Ships in <b>24 hrs</b></h3><p>Every bottle ships padded and upright within 24 hours.</p></div>
  <div class="fc"><h3>Adults only <b>21+</b></h3><p>Age is checked at delivery.</p></div>
</div></div></section>
<section class="sec dark"><div class="wrap"><h2 class="sh" style="text-align:center">Questions</h2><div class="faq">
  <div><h3>Who can order?</h3><p>Anyone aged 21 or over. Age is checked at delivery.</p></div>
  <div><h3>What does delivery cost?</h3><p>Free when your order is over ₹5,000, otherwise ₹250. Orders ship within 24 hours.</p></div>
  <div><h3>How do I pay?</h3><p>On delivery, by cash, UPI or card.</p></div>
  <div><h3>How does the three-bottle deal work?</h3><p>Add any three bottles to your cart and ten percent comes off automatically. You can also <a href="bundle.html" class="link">pick your three</a> here.</p></div>
  <div><h3>Can I track my order?</h3><p>Yes. Choose Track an Order and enter your order number and phone number.</p></div>
  <div><h3>Still stuck?</h3><p>Write to us on the <a href="contact.html" class="link">contact page</a> and we reply by email.</p></div>
</div></div></section>`,
  },
  {
    file: 'about.html', page: 'about', title: 'About | Fab Wines', desc: 'Why Fab Wines keeps its shelf short, and who runs it.',
    main: `${phead('Our way', 'A short shelf, chosen on purpose.')}
<section class="sec green"><div class="wrap two">
  <div class="prose"><h2>We sell the evening, not just the bottle.</h2>
    <p>We keep the shelf short on purpose. Every bottle is there because it is easy to share, easy to talk about and worth opening on an ordinary evening.</p>
    <p>No jargon on the labels and no rare bottles locked away. Tell us what is on the table and who is coming, and we will suggest something that fits.</p>
    <a class="btn" href="wines.html">Order wine ↗</a></div>
  <div class="panel tall"><img src="img/n1.webp" alt="Sassicaia 2018"><img src="img/n2.webp" alt="Tignanello 2018"><img src="img/n3.webp" alt="Ornellaia 2017"></div>
</div></section>
<section class="sec dark"><div class="wrap">
  <div class="ownercard"><div class="ava" aria-hidden="true">A</div><div><h3>${OWNER.name}</h3><p>Founder and owner, Fab Wines</p><a class="link" href="mailto:${OWNER.email}">${OWNER.email}</a></div></div>
</div></section>`,
  },
  {
    file: 'contact.html', page: 'contact', title: 'Contact | Fab Wines', desc: 'Write to Aditya Singh at Fab Wines.',
    main: `${phead('Contact', 'Ask about a bottle, an order or a gift. We reply by email.')}
<section class="sec dark"><div class="wrap two">
  <div><h2>Write to us</h2>
    <div class="ownercard"><div class="ava" aria-hidden="true">A</div><div><h3>${OWNER.name}</h3><p>Founder and owner, Fab Wines</p><a class="link" href="mailto:${OWNER.email}">${OWNER.email}</a></div></div></div>
  <form class="stack" id="cform">
    <label>Your name<input name="name" required autocomplete="name"></label>
    <label>Your email<input name="email" type="email" required autocomplete="email"></label>
    <label>Message<textarea name="message" required></textarea></label>
    <button class="btn" type="submit">Send message</button>
    <p class="note" id="cnote" role="status"></p>
  </form>
</div></section>`,
  },
  {
    file: 'cart.html', page: 'cart', title: 'Your cart | Fab Wines', desc: 'Your Fab Wines cart.',
    main: `${phead('Your cart', '')}
<section class="sec dark" style="padding-top:20px"><div class="wrap"><div class="cart">
  <div id="lines"></div>
  <aside class="summary" id="csum" aria-live="polite"></aside>
</div></div></section>`,
  },
];

for (const p of pages) fs.writeFileSync(path.join(dir, p.file), wrapPage(p));

// the home page keeps its own sections; refresh its shared header, footer and links
const ip = path.join(dir, 'index.html');
let home = fs.readFileSync(ip, 'utf8');
home = home.replace(/<!--HEADER-->[\s\S]*?<!--\/HEADER-->/, `<!--HEADER-->${header('home')}<!--/HEADER-->`);
home = home.replace(/<!--FOOTER-->[\s\S]*?<!--\/FOOTER-->/, `<!--FOOTER-->${footer()}<!--/FOOTER-->`);
if (!home.includes('pages.css')) home = home.replace('<link rel="stylesheet" href="site.css">', '<link rel="stylesheet" href="site.css">\n<link rel="stylesheet" href="pages.css">');
if (!home.includes('reviews.js')) home = home.replace('<script src="site.js"></script>', '<script src="reviews.js"></script>\n<script src="site.js"></script>\n<script src="pour.js"></script>');
fs.writeFileSync(ip, home);

console.log('built', pages.length, 'pages + refreshed index.html');
