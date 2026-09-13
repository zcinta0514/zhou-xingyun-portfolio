export function pickSection(rects, viewportHeight, atBottom, requestedId = null) {
  if (!rects.length) return null;
  if (atBottom) {
    const requested = rects.find(rect => rect.id === requestedId);
    if (requested && requested.top >= 0 && requested.top < viewportHeight) return requested.id;
    return rects.at(-1).id;
  }
  let active = rects[0].id;
  for (const rect of rects) {
    if (rect.top <= viewportHeight * .3) active = rect.id;
  }
  return active;
}

if (typeof document !== 'undefined') {
  const sections = [...document.querySelectorAll('[data-section]')];
  const navLinks = [...document.querySelectorAll('.wb-mark, .wb-nav-item')];
  const toggle = document.querySelector('.wb-nav-toggle');
  const panel = document.querySelector('.wb-nav-panel');
  const items = [...panel.querySelectorAll('a')];
  const count = document.querySelector('.wb-rail-count b');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 920px), (pointer: coarse)');
  let requestedSection = null;
  let pointerScrollPending = false;

  function setOpen(open, restoreFocus = false) {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    if (open) items[0]?.focus();
    else if (restoreFocus) toggle.focus();
  }
  function setActive(id) {
    navLinks.forEach(link => {
      if (link.hash === '#' + id) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    const index = sections.findIndex(section => section.id === id);
    if (index >= 0) count.textContent = String(index + 1).padStart(2, '0');
  }
  function targetFrom(hash) {
    try { return document.getElementById(decodeURIComponent(hash.slice(1))); }
    catch { return null; }
  }
  function moveTo(hash, push, animate) {
    const target = targetFrom(hash);
    if (!target) return;
    const section = target.closest('[data-section]');
    requestedSection = section?.id || null;
    pointerScrollPending = false;
    if (push && location.hash !== hash) history.pushState(null, '', hash);
    setOpen(false);
    target.scrollIntoView({ behavior: animate && !motion.matches ? 'smooth' : 'auto', block:'start' });
    const focusTarget = target.querySelector('h1, h2, h3') || target;
    if (!focusTarget.hasAttribute('tabindex')) focusTarget.setAttribute('tabindex', '-1');
    focusTarget.focus({ preventScroll:true });
    if (section) setActive(section.id);
  }
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!targetFrom(link.hash)) return;
      event.preventDefault();
      moveTo(link.hash, true, true);
    });
  });
  toggle.addEventListener('click', () => setOpen(panel.hidden));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); setOpen(false, true); }
  });
  document.addEventListener('pointerdown', event => {
    if (!panel.hidden && !panel.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
  });
  mobile.addEventListener('change', () => { if (!mobile.matches) setOpen(false); });

  let queued = false;
  function update() {
    queued = false;
    const atBottom = scrollY + innerHeight >= document.documentElement.scrollHeight - 3;
    const rects = sections.map(section => ({ id:section.id, top:section.getBoundingClientRect().top }));
    setActive(pickSection(rects, innerHeight, atBottom, requestedSection));
  }
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  // A short final chapter may share the same clamped scroll position with its neighbour.
  // Preserve the explicit destination until the reader starts navigating manually.
  function resumeReadingPosition() { requestedSection = null; schedule(); }
  addEventListener('wheel', resumeReadingPosition, { passive:true });
  addEventListener('touchmove', resumeReadingPosition, { passive:true });
  addEventListener('pointerdown', () => { pointerScrollPending = true; }, { passive:true });
  addEventListener('pointerup', () => { pointerScrollPending = false; }, { passive:true });
  addEventListener('pointercancel', () => { pointerScrollPending = false; }, { passive:true });
  addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) resumeReadingPosition();
  });
  addEventListener('scroll', () => {
    if (pointerScrollPending) requestedSection = null;
    schedule();
  }, { passive:true });
  addEventListener('resize', schedule);
  addEventListener('hashchange', () => moveTo(location.hash || '#home', false, false));
  addEventListener('popstate', () => moveTo(location.hash || '#home', false, false));
  if (location.hash) moveTo(location.hash, false, false);
  update();
}
