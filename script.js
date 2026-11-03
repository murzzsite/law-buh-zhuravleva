const LEAD_ENDPOINT = 'https://lead-relay.leestygpt.workers.dev/lead/3PMHHYQESM';

(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches && !location.search.includes('motion=1');
  const fine = window.matchMedia('(pointer:fine)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const fmt = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  const y2 = $('#year2'); if (y2) y2.textContent = new Date().getFullYear();

  // header
  const header = $('#header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // burger
  const burger = $('#burger'), nav = $('#nav');
  const closeNav = () => { burger.classList.remove('is-open'); nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); };
  burger.addEventListener('click', () => {
    const open = burger.classList.toggle('is-open');
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
  });

  // smooth scroll (Lenis if present)
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: t => 1 - Math.pow(1 - t, 4), smoothWheel: true });
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (href.length <= 1) return;
    const target = $(href);
    if (!target) return;
    e.preventDefault();
    closeNav();
    if (lenis) lenis.scrollTo(target, { offset: -72, duration: 1.4 });
    else window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 72, behavior: reduce ? 'auto' : 'smooth' });
  }));

  // phone mask
  $$('input[type="tel"]').forEach(input => {
    input.addEventListener('input', e => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.startsWith('8')) v = '7' + v.slice(1);
      if (!v.startsWith('7')) v = '7' + v;
      v = v.slice(0, 11);
      let out = '+7';
      if (v.length > 1) out += ' (' + v.slice(1, 4);
      if (v.length >= 4) out += ') ' + v.slice(4, 7);
      if (v.length >= 7) out += '-' + v.slice(7, 9);
      if (v.length >= 9) out += '-' + v.slice(9, 11);
      e.target.value = out;
    });
  });

  // ===== calculator =====
  const opts = $$('input[name="plan"]');
  const sumEl = $('#sum'), yearEl = $('#year'), fromEl = $('#from');
  const emp = $('#emp'), empVal = $('#empVal');
  const tariffSel = $('#tariffSel'), empField = $('#empField');
  let employees = 0, shown = 7000;
  const tariffMap = {
    'ip-income': 0, 'ip-dr': 1, 'ooo-zero': 2, 'ooo-1m': 3
  };
  const current = () => opts.find(o => o.checked);
  const calc = (animate = true) => {
    const o = current();
    const base = +o.dataset.base, per = +(o.dataset.per || 0);
    const hasEmp = per > 0;
    emp.hidden = !hasEmp;
    const total = base + (hasEmp ? per * employees : 0);
    const exact = o.value === 'ooo-zero';
    fromEl.style.display = exact ? 'none' : '';
    yearEl.parentElement.hidden = false;
    const apply = v => { sumEl.textContent = fmt(v); };
    if (animate && hasGsap && !reduce) {
      const o2 = { v: shown };
      gsap.to(o2, { v: total, duration: .8, ease: 'power3.out', onUpdate: () => apply(o2.v) });
    } else apply(total);
    shown = total;
    yearEl.textContent = fmt(total * 12);
    tariffSel.selectedIndex = tariffMap[o.value];
    empField.value = hasEmp ? 'Сотрудников: ' + employees : '';
  };
  opts.forEach(o => o.addEventListener('change', () => { employees = 0; empVal.textContent = 0; calc(); }));
  $('#empPlus').addEventListener('click', () => { employees = Math.min(30, employees + 1); empVal.textContent = employees; calc(); });
  $('#empMinus').addEventListener('click', () => { employees = Math.max(0, employees - 1); empVal.textContent = employees; calc(); });
  tariffSel.addEventListener('change', () => {
    const i = tariffSel.selectedIndex;
    if (i <= 3) { const o = opts[i]; if (o && !o.checked) { o.checked = true; employees = 0; empVal.textContent = 0; calc(false); } }
  });
  calc(false);
  $('#alertCta').addEventListener('click', () => { tariffSel.selectedIndex = 4; });

  // ===== form =====
  const form = $('#leadForm');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const label = btn.querySelector('span');
    const orig = label.textContent;
    const payload = {};
    new FormData(form).forEach((v, k) => { payload[k] = v; });
    if (payload._gotcha) return;
    const digits = (payload.phone || '').replace(/\D/g, '');
    if (!payload.name || digits.length < 11) { alert('Укажите имя и телефон полностью'); return; }
    btn.disabled = true; label.textContent = 'Отправляем…';
    try {
      const resp = await fetch(LEAD_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      label.textContent = 'Заявка отправлена, скоро ответим'; form.reset(); calc(false);
    } catch (err) {
      console.error(err); label.textContent = 'Не отправилось, попробуйте ещё раз';
    } finally {
      setTimeout(() => { label.textContent = orig; btn.disabled = false; }, 3500);
    }
  });

  // static fallbacks when no motion
  const countEls = $$('[data-count]');
  if (!hasGsap || reduce) return;

  // ===== motion =====
  gsap.registerPlugin(ScrollTrigger);

  const splitWords = el => {
    const t = el.textContent.trim();
    el.setAttribute('aria-label', t);
    el.innerHTML = t.split(/\s+/).map(w => `<span class="w" aria-hidden="true"><span class="wi">${w}</span></span>`).join(' ');
    return $$('.wi', el);
  };

  // hero timeline
  const heroWords = splitWords($('.hero__title'));
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  gsap.set(heroWords, { yPercent: 115 });
  gsap.set('.hero__lead, .hero__actions', { y: 28, opacity: 0 });
  gsap.set('.hero__photo', { clipPath: 'inset(100% 0% 0% 0%)' });
  gsap.set('.hero__photo img', { scale: 1.25 });
  gsap.set('.slip', { y: 40, opacity: 0 });
  const ticks = $$('.slip .tick');
  ticks.forEach(t => { const l = t.getTotalLength(); t.style.strokeDasharray = l; t.style.strokeDashoffset = l; });
  gsap.set('.slip__list li', { opacity: .35 });
  gsap.set('.slip__foot', { opacity: 0 });
  tl.to(heroWords, { yPercent: 0, duration: 1.5, stagger: .08 }, .1)
    .to('.hero__photo', { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'power4.inOut' }, .2)
    .to('.hero__photo img', { scale: 1, duration: 2.2, ease: 'expo.out' }, .2)
    .to('.hero__lead', { y: 0, opacity: 1, duration: 1.1 }, .75)
    .to('.hero__actions', { y: 0, opacity: 1, duration: 1.1 }, .9)
    .to('.slip', { y: 0, opacity: 1, duration: 1 }, 1.3);
  ticks.forEach((t, i) => {
    const li = t.closest('li');
    tl.to(li, { opacity: 1, duration: .4, ease: 'power2.out' }, 1.6 + i * .42)
      .to(t, { strokeDashoffset: 0, duration: .45, ease: 'power3.out' }, 1.65 + i * .42);
  });
  tl.to('.slip__foot', { opacity: 1, duration: .6 }, 1.6 + ticks.length * .42);

  // hero photo parallax
  gsap.to('.hero__photo img', { yPercent: 7, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // headings: masked words
  $$('[data-split]').forEach(h => {
    const words = splitWords(h);
    gsap.set(words, { yPercent: 115 });
    ScrollTrigger.create({ trigger: h, start: 'top 90%', once: true, onEnter: () => gsap.to(words, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: .06 }) });
  });

  // generic rise (stagger within batch)
  const rises = $$('[data-rise]');
  gsap.set(rises, { y: 36, opacity: 0 });
  ScrollTrigger.batch(rises, {
    start: 'top 92%', once: true,
    onEnter: els => gsap.to(els, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', stagger: .08 })
  });

  // manifest: words light up with scroll
  const mt = $('#manifestText');
  const mwords = mt.textContent.trim().split(/\s+/);
  mt.setAttribute('aria-label', mt.textContent.trim());
  mt.innerHTML = mwords.map(w => `<span class="mw" aria-hidden="true">${w}</span>`).join(' ');
  gsap.fromTo($$('.mw', mt), { opacity: .16 }, { opacity: 1, ease: 'none', stagger: .12, scrollTrigger: { trigger: mt, start: 'top 82%', end: 'bottom 48%', scrub: .6 } });

  // counters
  countEls.forEach(el => {
    const target = +el.dataset.count, sep = !!el.dataset.sep;
    const o = { v: 0 };
    el.textContent = '0';
    ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => gsap.to(o, { v: target, duration: 1.8, ease: 'power3.out', onUpdate: () => { el.textContent = sep ? fmt(o.v) : Math.round(o.v); } }) });
  });

  // process: bar fills, steps light up
  const steps = $$('#steps li');
  gsap.set(steps, { opacity: .3 });
  gsap.fromTo('#barFill', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.start__body', start: 'top 60%', end: 'bottom 70%', scrub: .5 } });
  steps.forEach(li => ScrollTrigger.create({
    trigger: li, start: 'top 68%', end: 'bottom 40%',
    onToggle: s => gsap.to(li, { opacity: s.isActive ? 1 : (s.progress >= 1 ? .55 : .3), duration: .5, ease: 'power2.out' })
  }));

  // reviews column parallax
  if (window.innerWidth > 900) gsap.fromTo('#revCol', { y: 60 }, { y: -40, ease: 'none', scrollTrigger: { trigger: '.reviews__grid', start: 'top bottom', end: 'bottom top', scrub: true } });

  // marquee, speed follows scroll velocity
  const track = $('#marqueeTrack');
  if (track) {
    let x = 0, half = 0;
    const measure = () => { half = track.scrollWidth / 2; };
    measure(); window.addEventListener('resize', measure);
    gsap.ticker.add(() => {
      const v = lenis ? lenis.velocity : 0;
      x -= 0.9 + Math.min(Math.abs(v), 40) * 0.35;
      if (-x >= half) x += half;
      gsap.set(track, { x });
    });
  }

  // magnetic buttons
  if (fine) $$('.btn:not(.btn--wide)').forEach(b => {
    const qx = gsap.quickTo(b, 'x', { duration: .5, ease: 'power3.out' });
    const qy = gsap.quickTo(b, 'y', { duration: .5, ease: 'power3.out' });
    b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); qx((e.clientX - r.left - r.width / 2) * .25); qy((e.clientY - r.top - r.height / 2) * .35); });
    b.addEventListener('mouseleave', () => { qx(0); qy(0); });
  });

  // footer name rises
  gsap.from('.footer__name', { yPercent: 40, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.footer', start: 'top 85%', once: true } });

  window.addEventListener('load', () => ScrollTrigger.refresh());
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
