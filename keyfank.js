/* ============================================================
   KEYFANK — app.js
   Systems:
     1. Product data (sample catalog, easy to extend)
     2. Collection / product-detail rendering
     3. Cart (drawer, quantities, persistence)
     4. Checkout (front-end architecture, payment marked below)
     5. Three.js scene — procedural keyboard, scroll-driven story
   ============================================================ */
import * as THREE from 'three';

/* ---------------- helpers ---------------- */
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const money = n => '$' + n.toFixed(2);
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE_POINTER = window.matchMedia('(pointer: fine)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smoothstep = (t, a, b) => { const x = clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };

/* ============================================================
   1. PRODUCT DATA — edit / add products here
   ============================================================ */
const PRODUCTS = [
  {
    id: 'aurora-flow', name: 'Aurora Flow', price: 24, category: 'Gradient Series', featured: true,
    stock: 'in', compatibility: ['60%', '75%', 'TKL', 'Full-size'],
    desc: 'A slow-pour gradient from polar cyan into violet dusk. Designed as one continuous composition across every key.',
    variants: [
      { id: 'dawn',  name: 'Dawn',  g1: '#67e8f9', g2: '#a78bfa' },
      { id: 'dusk',  name: 'Dusk',  g1: '#f0abfc', g2: '#818cf8' },
      { id: 'frost', name: 'Frost', g1: '#bae6fd', g2: '#5eead4' },
    ],
    details: ['Matte soft-touch laminate', 'Includes space-bar accent', '104-key full template'],
  },
  {
    id: 'sunset-punch', name: 'Sunset Punch', price: 24, category: 'Gradient Series', featured: false,
    stock: 'in', compatibility: ['60%', '75%', 'TKL', 'Full-size'],
    desc: 'Warm ember orange bleeding into hot pink. The loudest quiet upgrade your desk will ever get.',
    variants: [
      { id: 'ember', name: 'Ember', g1: '#fb923c', g2: '#f472b6' },
      { id: 'peach', name: 'Peach', g1: '#fdba74', g2: '#fb7185' },
      { id: 'coral', name: 'Coral', g1: '#f97316', g2: '#e11d48' },
    ],
    details: ['Gloss-resistant finish', 'Includes space-bar accent', '104-key full template'],
  },
  {
    id: 'mono-chrome', name: 'Mono Chrome', price: 19, category: 'Minimal Series', featured: false,
    stock: 'low', compatibility: ['60%', '75%', 'TKL', 'Full-size'],
    desc: 'Restraint as a feature. Two-tone graphite keys with a single pearlescent accent row.',
    variants: [
      { id: 'onyx',    name: 'Onyx',    g1: '#475569', g2: '#0f172a' },
      { id: 'pearl',   name: 'Pearl',   g1: '#f1f5f9', g2: '#94a3b8' },
      { id: 'graphite',name: 'Graphite',g1: '#64748b', g2: '#1e293b' },
    ],
    details: ['Fingerprint-proof coating', 'Single accent row', '87-key TKL template included'],
  },
  {
    id: 'cyber-mint', name: 'Cyber Mint', price: 22, category: 'Accent Series', featured: false,
    stock: 'in', compatibility: ['60%', '75%', 'TKL', 'Full-size'],
    desc: 'Fresh mint over deep space black, with an electric lime space bar. Small footprint, big presence.',
    variants: [
      { id: 'mint', name: 'Mint', g1: '#6ee7b7', g2: '#14b8a6' },
      { id: 'ice',  name: 'Ice',  g1: '#a5f3fc', g2: '#67e8f9' },
      { id: 'lime', name: 'Lime', g1: '#bef264', g2: '#4ade80' },
    ],
    details: ['UV-stable inks', 'Electric space-bar accent', '104-key full template'],
  },
];

const STEPS = [
  { title: 'Choose your design', text: 'Pick a set and a variant from the collection. Every design comes in three colourways.' },
  { title: 'Receive your sticker set', text: 'Your set ships as one precision-cut template sheet — every key aligned to the millimetre.' },
  { title: 'Clean your keyboard', text: 'Wipe keycaps with the included alcohol pad. A clean surface means zero bubbles.' },
  { title: 'Apply the stickers', text: 'Peel, place, press. The template layout means each sticker lands exactly where it should.' },
  { title: 'Transform your keyboard', text: 'Step back. A blank board is now unmistakably yours.' },
];

/* ============================================================
   2. COLLECTION RENDERING + product cards
   ============================================================ */
const grid = $('#productGrid');

function miniKeyboardHTML(variant, keys = 24, extraClass = '') {
  const keysHTML = Array.from({ length: keys }, () => '<span class="mk-key"></span>').join('');
  return `<div class="mini-kb ${extraClass}" style="--g1:${variant.g1};--g2:${variant.g2}" aria-hidden="true">${keysHTML}</div>`;
}

function renderCollection() {
  grid.innerHTML = PRODUCTS.map(p => `
    <article class="card reveal" data-tilt data-id="${p.id}">
      <div class="card-media">
        ${miniKeyboardHTML(p.variants[0])}
        ${p.featured ? '<span class="badge">Featured</span>' : ''}
      </div>
      <div class="card-body">
        <div class="card-top"><h3>${p.name}</h3><span class="price">${money(p.price)}</span></div>
        <p>${p.desc}</p>
        <div class="chips">${p.compatibility.map(c => `<span class="chip">${c}</span>`).join('')}</div>
        <div class="swatches" aria-label="Available variants">
          ${p.variants.map(v => `<span class="sw" style="background:linear-gradient(135deg,${v.g1},${v.g2})" title="${v.name}"></span>`).join('')}
        </div>
        <div class="card-actions">
          <button class="btn ghost sm" data-view="${p.id}">View Product</button>
          <button class="btn primary sm" data-add="${p.id}">Add to Cart</button>
        </div>
      </div>
    </article>`).join('');
  attachTilt();
}

/* subtle 3D tilt on product cards */
function attachTilt() {
  if (!FINE_POINTER || REDUCED) return;
  $$('[data-tilt]').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const rx = ((e.clientY - r.top) / r.height - 0.5) * -7;
      const ry = ((e.clientX - r.left) / r.width - 0.5) * 9;
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}

/* ---------------- product detail modal ---------------- */
const productModal = $('#productModal');
let pmProduct = null, pmVariant = 0, pmQty = 1;

function openProduct(id) {
  pmProduct = PRODUCTS.find(p => p.id === id);
  if (!pmProduct) return;
  pmVariant = 0; pmQty = 1;
  $('#pmCategory').textContent = pmProduct.category;
  $('#pmName').textContent = pmProduct.name;
  $('#pmDesc').textContent = pmProduct.desc;
  $('#pmPrice').textContent = money(pmProduct.price);
  $('#pmCompat').innerHTML = pmProduct.compatibility.map(c => `<span class="chip">${c}</span>`).join('');
  $('#pmDetails').innerHTML = pmProduct.details.map(d => `<li>${d}</li>`).join('');
  const stockEl = $('#pmStock');
  if (pmProduct.stock === 'in')  stockEl.innerHTML = '<span class="stock ok">✓ In stock — ships in 24h</span>';
  if (pmProduct.stock === 'low') stockEl.innerHTML = '<span class="stock low">● Low stock — order soon</span>';
  renderVariants();
  syncPM();
  openModal(productModal);
  applyPaletteToKeyboard(pmProduct.variants[0]);   // 3D keyboard wears this design
}

function renderVariants() {
  $('#pmVariants').innerHTML = pmProduct.variants.map((v, i) => `
    <button class="variant-btn ${i === pmVariant ? 'active' : ''}" data-variant="${i}">
      <span class="sw" style="background:linear-gradient(135deg,${v.g1},${v.g2})"></span>${v.name}
    </button>`).join('');
  $('#pmKeyboard').outerHTML = miniKeyboardHTML(pmProduct.variants[pmVariant], 24, 'lg').replace('class="mini-kb', 'id="pmKeyboard" class="mini-kb');
}

function syncPM() {
  $('#qtyVal').textContent = pmQty;
  $('#pmAddPrice').textContent = money(pmProduct.price * pmQty);
}

$('#pmVariants').addEventListener('click', e => {
  const btn = e.target.closest('[data-variant]');
  if (!btn) return;
  pmVariant = +btn.dataset.variant;
  renderVariants();
  applyPaletteToKeyboard(pmProduct.variants[pmVariant]);
});
$('#qtyMinus').addEventListener('click', () => { pmQty = Math.max(1, pmQty - 1); syncPM(); });
$('#qtyPlus').addEventListener('click', () => { pmQty = Math.min(9, pmQty + 1); syncPM(); });
$('#pmAdd').addEventListener('click', () => {
  addToCart(pmProduct.id, pmProduct.variants[pmVariant].id, pmQty);
  toast(`${pmProduct.name} · ${pmProduct.variants[pmVariant].name} added to cart`);
});

/* grid buttons (event delegation) */
grid.addEventListener('click', e => {
  const view = e.target.closest('[data-view]');
  const add  = e.target.closest('[data-add]');
  if (view) openProduct(view.dataset.view);
  if (add) {
    const p = PRODUCTS.find(x => x.id === add.dataset.add);
    addToCart(p.id, p.variants[0].id, 1);
    toast(`${p.name} added to cart`);
  }
});

/* ============================================================
   3. CART
   ============================================================ */
let cart = [];
try { cart = JSON.parse(localStorage.getItem('keyfank_cart') || '[]'); } catch { cart = []; }

const drawer = $('#cartDrawer'), overlay = $('#overlay');
const saveCart = () => localStorage.setItem('keyfank_cart', JSON.stringify(cart));
const cartTotalQty = () => cart.reduce((s, i) => s + i.qty, 0);
const cartSubtotal = () => cart.reduce((s, i) => {
  const p = PRODUCTS.find(x => x.id === i.productId);
  return s + (p ? p.price * i.qty : 0);
}, 0);

function addToCart(productId, variantId, qty) {
  const line = cart.find(i => i.productId === productId && i.variantId === variantId);
  if (line) line.qty = Math.min(9, line.qty + qty);
  else cart.push({ productId, variantId, qty });
  saveCart(); renderCart(); bumpBadge();
}
function setQty(productId, variantId, qty) {
  const line = cart.find(i => i.productId === productId && i.variantId === variantId);
  if (!line) return;
  line.qty = clamp(qty, 0, 9);
  if (line.qty === 0) cart = cart.filter(i => i !== line);
  saveCart(); renderCart();
}
function bumpBadge() {
  const el = $('#cartCount');
  el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
}

function renderCart() {
  $('#cartCount').textContent = cartTotalQty();
  const body = $('#cartItems'), foot = $('#cartFoot');
  if (!cart.length) {
    body.innerHTML = `<div class="cart-empty">
      <p>Your cart is empty.</p>
      <a class="btn ghost sm" href="#collection" id="emptyBrowse">Browse the Collection</a></div>`;
    foot.style.display = 'none';
    $('#emptyBrowse').addEventListener('click', closeDrawer);
    return;
  }
  foot.style.display = '';
  body.innerHTML = cart.map(i => {
    const p = PRODUCTS.find(x => x.id === i.productId);
    const v = p.variants.find(x => x.id === i.variantId);
    return `<div class="cart-item">
      ${miniKeyboardHTML(v, 12, 'sm')}
      <div class="ci-info">
        <strong>${p.name}</strong>
        <span class="variant">${v.name} · ${p.category}</span>
        <div class="qty" style="margin-top:.4rem">
          <button data-dec="${p.id}|${v.id}" aria-label="Decrease">−</button>
          <span>${i.qty}</span>
          <button data-inc="${p.id}|${v.id}" aria-label="Increase">+</button>
        </div>
      </div>
      <div class="ci-right">
        <span class="ci-price">${money(p.price * i.qty)}</span>
        <button class="icon-btn" data-rem="${p.id}|${v.id}" aria-label="Remove ${p.name}">✕</button>
      </div>
    </div>`;
  }).join('');
  const sub = cartSubtotal();
  $('#cartSubtotal').textContent = money(sub);
  $('#shipNote').textContent = sub >= 40
    ? '✓ You unlocked free standard shipping.'
    : `Add ${money(40 - sub)} more for free standard shipping.`;
}

$('#cartItems').addEventListener('click', e => {
  const hit = e.target.closest('[data-dec],[data-inc],[data-rem]');
  if (!hit) return;
  const [pid, vid] = (hit.dataset.dec || hit.dataset.inc || hit.dataset.rem).split('|');
  const line = cart.find(i => i.productId === pid && i.variantId === vid);
  if (!line) return;
  if (hit.dataset.dec) setQty(pid, vid, line.qty - 1);
  if (hit.dataset.inc) setQty(pid, vid, line.qty + 1);
  if (hit.dataset.rem) setQty(pid, vid, 0);
});

function openDrawer() {
  renderCart();
  drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false');
  overlay.hidden = false; requestAnimationFrame(() => overlay.classList.add('show'));
  $('#cartClose').focus();
}
function closeDrawer() {
  drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true');
  overlay.classList.remove('show');
  setTimeout(() => { overlay.hidden = true; }, 300);
}
$('#cartBtn').addEventListener('click', openDrawer);
$('#cartClose').addEventListener('click', closeDrawer);
overlay.addEventListener('click', closeDrawer);

/* ============================================================
   4. CHECKOUT — front-end architecture
   PAYMENT_INTEGRATION_POINT: mount Stripe Elements / PayPal SDK
   at the marked block in keyfank.html and confirm server-side.
   This demo stops before any real payment.
   ============================================================ */
const checkoutModal = $('#checkoutModal');

function shippingCost(method) {
  if (method === 'express') return 12.99;
  return cartSubtotal() >= 40 ? 0 : 4.99;
}

function renderSummary() {
  const method = ($('input[name="ship"]:checked') || {}).value || 'standard';
  const sub = cartSubtotal(), ship = shippingCost(method), total = sub + ship;
  $('#stdLabel').textContent = shippingCost('standard') === 0 ? 'Free' : money(4.99);
  $('#orderSummary').innerHTML =
    cart.map(i => {
      const p = PRODUCTS.find(x => x.id === i.productId);
      const v = p.variants.find(x => x.id === i.variantId);
      return `<div class="row"><span>${p.name} · ${v.name} × ${i.qty}</span><span>${money(p.price * i.qty)}</span></div>`;
    }).join('') +
    `<div class="row"><span>Shipping (${method})</span><span>${ship === 0 ? 'Free' : money(ship)}</span></div>
     <div class="row total"><span>Total</span><span>${money(total)}</span></div>`;
  $('#orderTotal').textContent = money(total);
  return total;
}

$('#checkoutBtn').addEventListener('click', () => {
  if (!cart.length) { toast('Your cart is empty.'); return; }
  closeDrawer();
  $('#checkoutFormWrap').hidden = false;
  $('#orderSuccess').hidden = true;
  renderSummary();
  openModal(checkoutModal);
});
checkoutModal.addEventListener('change', e => { if (e.target.name === 'ship') renderSummary(); });

$('#checkoutForm').addEventListener('submit', e => {
  e.preventDefault();
  const form = e.target;
  if (!form.reportValidity()) return;
  /* PAYMENT_INTEGRATION_POINT — a real provider tokenizes payment here.
     Demo behavior: simulate order acceptance, never claim a real charge. */
  const orderId = 'KF-' + Date.now().toString(36).toUpperCase().slice(-6);
  $('#orderId').textContent = orderId;
  $('#checkoutFormWrap').hidden = true;
  $('#orderSuccess').hidden = false;
  cart = []; saveCart(); renderCart();
  form.reset();
});

/* ============================================================
   MODAL / OVERLAY / TOAST utilities
   ============================================================ */
function openModal(m)  { m.classList.add('open'); m.setAttribute('aria-hidden', 'false'); }
function closeModal(m) { m.classList.remove('open'); m.setAttribute('aria-hidden', 'true'); }
$$('.modal').forEach(m => m.addEventListener('click', e => {
  if (e.target === m || e.target.closest('[data-close]')) closeModal(m);
}));
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  $$('.modal.open').forEach(closeModal);
  if (drawer.classList.contains('open')) closeDrawer();
});

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}
$$('[data-demo-link]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  toast('Demo link — this page is not part of the demo build.');
}));

/* how-it-works steps (built from data, with staggered key glow) */
$('#howGrid').innerHTML = STEPS.map((s, i) => `
  <div class="step glass-panel reveal">
    <span class="step-num">0${i + 1}</span>
    <h3>${s.title}</h3>
    <p>${s.text}</p>
    <div class="mini-kb" style="--g1:#7dd3fc;--g2:#c084fc" aria-hidden="true">
      ${Array.from({ length: 8 }, (_, k) => `<span class="mk-key" style="--i:${k + i}"></span>`).join('')}
    </div>
  </div>`).join('');

/* reveal-on-scroll */
const io = new IntersectionObserver(entries => entries.forEach(en => {
  if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
}), { threshold: 0.18 });
function observeReveals() { $$('.reveal:not(.in)').forEach(el => io.observe(el)); }

/* ============================================================
   5. THREE.JS — the 3D keyboard story
   Procedural keyboard (replaceable by a GLTF model later —
   swap buildKeyboard() for a GLTFLoader import, keep the same
   sticker material system).
   ============================================================ */
const canvas = $('#scene');
let renderer, scene, camera, kb, keyGroup, stickerMeshes = [], accentLight;
let scrollTarget = 0, scrollSmooth = 0, pointerX = 0, pointerY = 0;
let sceneOK = false;

/* sticker reveal windows per group, as fractions of total page scroll */
const REVEAL = [[0.14, 0.30], [0.32, 0.48], [0.50, 0.64]];

/* gradient sticker texture (canvas-generated, no external assets) */
function stickerTexture(c1, c2, angle = 135) {
  const s = 128, cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const ctx = cv.getContext('2d');
  const rad = angle * Math.PI / 180;
  const g = ctx.createLinearGradient(0, 0, s * Math.abs(Math.cos(rad)) || s, s * Math.abs(Math.sin(rad)) || s);
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
  /* subtle top-glass highlight */
  const hl = ctx.createLinearGradient(0, 0, 0, s);
  hl.addColorStop(0, 'rgba(255,255,255,.35)'); hl.addColorStop(0.4, 'rgba(255,255,255,0)');
  ctx.fillStyle = hl; ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildKeyboard() {
  const U = 0.4;                       // key unit size
  const GAP = 0.055, CAP_H = 0.26;
  const rows = [
    { widths: Array(14).fill(1) },
    { widths: Array(14).fill(1) },
    { widths: [1.5, ...Array(12).fill(1), 1.5] },
    { widths: [1.75, ...Array(11).fill(1), 2.25] },
    { widths: [2.25, 1.25, 1.25, 6.25, 1.25, 1.25, 1.25, 2.75] },
  ];
  const maxUnits = 14;
  const baseW = maxUnits * U + 0.7, baseD = rows.length * U + 0.6;

  kb = new THREE.Group();
  keyGroup = new THREE.Group();

  /* metallic base plate */
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(baseW, 0.3, baseD),
    new THREE.MeshStandardMaterial({ color: 0x15181f, metalness: 0.85, roughness: 0.35 })
  );
  base.position.y = -0.15;
  kb.add(base);

  /* glass rim above the plate */
  const rim = new THREE.Mesh(
    new THREE.BoxGeometry(baseW - 0.12, 0.06, baseD - 0.12),
    new THREE.MeshPhysicalMaterial({
      color: 0x8fb7ff, metalness: 0, roughness: 0.15, transmission: 0.55,
      transparent: true, opacity: 0.35, thickness: 0.4,
    })
  );
  rim.position.y = 0.03;
  kb.add(rim);

  const capMat = new THREE.MeshStandardMaterial({ color: 0x232733, metalness: 0.55, roughness: 0.42 });
  const groupCounts = [0, 0, 0];

  rows.forEach((row, ri) => {
    const total = row.widths.reduce((a, b) => a + b, 0);
    const offset = (maxUnits - total) / 2;
    let cursor = offset;
    const gIndex = ri < 2 ? 0 : ri < 4 ? 1 : 2;

    row.widths.forEach(wUnits => {
      const w = wUnits * U - GAP, d = U - GAP;
      const cx = -baseW / 2 + 0.35 + (cursor + wUnits / 2) * U;

      const cap = new THREE.Mesh(new THREE.BoxGeometry(w, CAP_H, d), capMat);
      cap.position.set(cx, CAP_H / 2 + 0.05, (ri - 2) * U);
      keyGroup.add(cap);

      /* sticker decal on the keycap top — starts invisible, revealed by scroll */
      const smat = new THREE.MeshBasicMaterial({
        map: stickerTexture('#67e8f9', '#a78bfa', 135 + gIndex * 60),
        transparent: true, opacity: 0, toneMapped: false,
      });
      const decal = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.09, d - 0.09), smat);
      decal.rotation.x = -Math.PI / 2;
      decal.position.set(cx, CAP_H + 0.052, (ri - 2) * U);
      keyGroup.add(decal);

      const idx = groupCounts[gIndex]++;
      stickerMeshes.push({ mesh: decal, g: gIndex, idx });

      cursor += wUnits;
    });
  });
  kb.add(keyGroup);

  /* soft fake shadow under the board */
  const shCv = document.createElement('canvas'); shCv.width = shCv.height = 256;
  const sctx = shCv.getContext('2d');
  const rg = sctx.createRadialGradient(128, 128, 20, 128, 128, 128);
  rg.addColorStop(0, 'rgba(0,0,0,.55)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
  sctx.fillStyle = rg; sctx.fillRect(0, 0, 256, 256);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(baseW * 1.7, baseD * 2.6),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shCv), transparent: true, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.42;
  kb.add(shadow);

  scene.add(kb);
}

/* recolour every sticker to a product variant (called from product modal) */
function applyPaletteToKeyboard(variant) {
  if (!sceneOK) return;
  stickerMeshes.forEach(({ mesh, g }) => {
    const old = mesh.material.map;
    mesh.material.map = stickerTexture(variant.g1, variant.g2, 135 + g * 60);
    mesh.material.needsUpdate = true;
    if (old) old.dispose();
  });
}

/* camera + keyboard pose keyframes across the page scroll (t = 0..1) */
const KEYS = [
  { t: 0.00, cam: [0, 1.55, 7.8], look: [0, 0.2, 0],    rotY: 0.0 },
  { t: 0.16, cam: [2.7, 1.35, 5.6], look: [0, 0.2, 0],  rotY: 0.55 },
  { t: 0.32, cam: [-2.5, 1.9, 5.2], look: [0, 0.22, 0], rotY: -0.5 },
  { t: 0.48, cam: [0, 2.9, 5.6],  look: [0, 0.15, 0],   rotY: 0.18 },
  { t: 0.64, cam: [0.55, 0.85, 3.0], look: [0.5, 0.18, 0.3], rotY: 0.35 },
  { t: 0.82, cam: [0, 1.7, 7.4], look: [0, 0.3, 0],     rotY: 0.0 },
  { t: 1.00, cam: [2.4, 1.8, 6.6], look: [0, 0.35, 0], rotY: 0.6 },
];
const _pos = new THREE.Vector3(), _look = new THREE.Vector3();

function poseAt(t) {
  let a = KEYS[0], b = KEYS[KEYS.length - 1];
  for (let i = 0; i < KEYS.length - 1; i++) {
    if (t >= KEYS[i].t && t <= KEYS[i + 1].t) { a = KEYS[i]; b = KEYS[i + 1]; break; }
  }
  const f = smoothstep((t - a.t) / (b.t - a.t || 1), 0, 1);
  _pos.set(
    a.cam[0] + (b.cam[0] - a.cam[0]) * f,
    a.cam[1] + (b.cam[1] - a.cam[1]) * f,
    a.cam[2] + (b.cam[2] - a.cam[2]) * f
  );
  _look.set(
    a.look[0] + (b.look[0] - a.look[0]) * f,
    a.look[1] + (b.look[1] - a.look[1]) * f,
    a.look[2] + (b.look[2] - a.look[2]) * f
  );
  return { pos: _pos, look: _look, rotY: a.rotY + (b.rotY - a.rotY) * f };
}

function initScene() {
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (err) {
    $('#loader').classList.add('done');
    toast('WebGL unavailable — showing the site without 3D.');
    return;
  }
  sceneOK = true;
  const mobile = window.innerWidth < 768;
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 60);

  /* cinematic lighting */
  scene.add(new THREE.HemisphereLight(0xbfd4ff, 0x0a0c14, 0.5));
  const key = new THREE.DirectionalLight(0xfff2e0, 1.35); key.position.set(3.5, 6, 4); scene.add(key);
  const rimViolet = new THREE.PointLight(0x8b5cf6, 22, 22); rimViolet.position.set(-4.5, 3, -3); scene.add(rimViolet);
  const rimCyan = new THREE.PointLight(0x22d3ee, 14, 20); rimCyan.position.set(4.5, 2, -2.5); scene.add(rimCyan);
  accentLight = new THREE.PointLight(0xf0abfc, 0, 18); accentLight.position.set(0, 4, 2); scene.add(accentLight);

  buildKeyboard();

  if (REDUCED) { /* static fully-decorated board, no scroll animation */
    stickerMeshes.forEach(({ mesh }) => { mesh.material.opacity = 1; });
    const p = poseAt(0);
    camera.position.copy(p.pos); camera.lookAt(p.look);
    renderer.render(scene, camera);
  } else {
    requestAnimationFrame(tick);
  }
  $('#loader').classList.add('done');
}

/* per-frame */
const clock = new THREE.Clock();
function tick() {
  requestAnimationFrame(tick);
  const t = clock.getElapsedTime();

  scrollSmooth += (scrollTarget - scrollSmooth) * 0.08;
  const p = poseAt(scrollSmooth);

  /* sticker reveals with per-key stagger */
  const GROUP_TOTALS = [28, 27, 8]; /* keys per reveal group: rows 0-1, rows 2-3, bottom row */
  stickerMeshes.forEach(({ mesh, g, idx }) => {
    const [r0, r1] = REVEAL[g];
    const total = GROUP_TOTALS[g];
    const start = r0 + (idx / total) * (r1 - r0) * 0.55;
    mesh.material.opacity = smoothstep(scrollSmooth, start, start + 0.07);
  });

  /* keyboard pose + idle float */
  kb.rotation.y = p.rotY;
  kb.rotation.x = -0.07;
  kb.position.y = Math.sin(t * 0.8) * 0.045;

  /* camera: keyframe pose + gentle pointer parallax */
  pointerX += ((window._px || 0) - pointerX) * 0.05;
  pointerY += ((window._py || 0) - pointerY) * 0.05;
  camera.position.set(
    p.pos.x + pointerX * 0.45,
    p.pos.y - pointerY * 0.3,
    p.pos.z
  );
  camera.lookAt(p.look);

  /* final-section glow ramps up near the end of the page */
  accentLight.intensity = smoothstep(scrollSmooth, 0.85, 1) * 26;

  renderer.render(scene, camera);
}

/* scroll + pointer + resize wiring */
function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  scrollTarget = max > 0 ? clamp(scrollY / max, 0, 1) : 0;
  $('#nav').classList.toggle('scrolled', scrollY > 30);
  $('#progress').style.width = (scrollTarget * 100).toFixed(2) + '%';
}
addEventListener('scroll', onScroll, { passive: true });
addEventListener('pointermove', e => {
  window._px = (e.clientX / innerWidth - 0.5) * 2;
  window._py = (e.clientY / innerHeight - 0.5) * 2;
}, { passive: true });
addEventListener('resize', () => {
  if (!sceneOK) return;
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  onScroll();
});

/* ---------------- boot ---------------- */
renderCollection();
renderCart();
observeReveals();
onScroll();
initScene();