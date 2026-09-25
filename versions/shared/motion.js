/* ============================================================
   共享动效原语
   三个方向共用同一套时钟与观察器，避免各写一套导致手感不一致。

   设计约束（来自本次调研的实测结论）：
   1. 只用 transform / opacity；擦除类可用 clip-path。
   2. 只有一个 rAF 循环，滚动读取合批到每帧一次。
   3. **clip-path 会让元素自身的 IntersectionObserver 判定为 0 面积**，
      所以被裁切的元素必须用 data-watch 指向一个不裁切的哨兵元素。
   4. 循环在页面不可见 / 目标离开视口时自动暂停，不做常驻空转。
   5. prefers-reduced-motion 时保留不透明度、去掉所有位移。
   ============================================================ */
(function () {
  'use strict';

  var doc = document;
  var reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
  var flat = reducedQuery.matches || /[?&]flat=1/.test(location.search);
  if (flat) doc.documentElement.classList.add('flat');

  var subs = [];        // 滚动订阅
  var loops = [];       // 常驻循环（可暂停）
  var lastY = scrollY;
  var velocity = 0;
  var frame = 0;

  function tick() {
    frame = 0;
    var y = scrollY;
    velocity = velocity * 0.86 + Math.abs(y - lastY) * 0.14;
    lastY = y;
    for (var i = 0; i < subs.length; i++) subs[i](y);
    for (var j = 0; j < loops.length; j++) {
      var l = loops[j];
      if (l.active && !l.fn(performance.now())) l.active = false;
    }
    schedule();
  }
  function schedule() {
    if (frame) return;
    if (doc.hidden) return;                 // 页面不可见时不烧帧
    frame = requestAnimationFrame(tick);
  }

  function onScroll(fn) { subs.push(fn); fn(scrollY); }
  function requestTick() { schedule(); }

  doc.addEventListener('visibilitychange', function () {
    if (!doc.hidden) { lastY = scrollY; schedule(); }
  });

  /* ── 观察器：进入一次就解绑 ── */
  var observer = new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      if (!e.isIntersecting) continue;
      var cb = callbacks.get(e.target);
      if (cb) { callbacks.delete(e.target); observer.unobserve(e.target); cb(e.target); }
    }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
  var callbacks = new Map();

  function observeOnce(target, cb, opts) {
    if (!target) return;
    if (flat) { cb(target); return; }
    if (opts && (opts.immediate || opts.margin)) {
      var o = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (!entries[i].isIntersecting) continue;
          o.disconnect(); cb(entries[i].target);
        }
      }, { rootMargin: (opts.margin || '0px 0px -12% 0px'), threshold: opts.threshold == null ? 0.12 : opts.threshold });
      o.observe(target);
      return o;
    }
    callbacks.set(target, cb);
    observer.observe(target);
    return observer;
  }

  /* ── 揭示：支持哨兵，解决被裁切元素永远等不到自己的问题 ── */
  function reveal(root) {
    var scope = root || doc;
    var els = scope.querySelectorAll('[data-reveal],[data-stagger],.wipe,[data-watch]');
    Array.prototype.forEach.call(els, function (el) {
      if (el.classList.contains('is-in')) return;
      var sel = el.getAttribute('data-watch');
      var token = sel ? sel : el;      // 没有哨兵就观察自己
      if (sel && sel === 'self') token = el;
      var watchTarget = (sel && sel !== 'self') ? doc.querySelector(sel) : token;
      observeOnce(watchTarget, function () { el.classList.add('is-in'); });
    });
  }

  /* ── 数字滚动：默认从 0 到目标，带 eased 收束 ── */
  function count(el, opts) {
    opts = opts || {};
    var to = opts.to != null ? opts.to : parseFloat(el.getAttribute('data-count'));
    if (isNaN(to)) return;
    var dec = opts.dec != null ? opts.dec : parseInt(el.getAttribute('data-dec') || '0', 10);
    var suffix = opts.suffix != null ? opts.suffix : (el.getAttribute('data-suffix') || '');
    var dur = opts.dur || 1500;
    var group = el.getAttribute('data-group') !== '0';
    var prefix = el.getAttribute('data-prefix') || '';

    function render(v) {
      var n = dec > 0
        ? v.toFixed(dec)
        : (group ? Math.round(v).toLocaleString('en-US') : String(Math.round(v)));
      el.textContent = prefix + n + suffix;
    }
    if (flat) { render(to); return; }
    var t0 = performance.now();
    (function step(now) {
      var p = Math.min(1, (now - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      render(to * eased);
      if (p < 1) requestAnimationFrame(step);
      else render(to);
    }(t0));
  }

  function countAll(root) {
    var els = (root || doc).querySelectorAll('[data-count]');
    Array.prototype.forEach.call(els, function (el) {
      if (el.dataset.counted) return;
      el.dataset.counted = '1';
      observeOnce(el, function () { count(el); }, { threshold: 0.4 });
    });
  }

  /* ── 进度：元素穿过视口走了多远，0→1 ── */
  function progress(el, opts) {
    opts = opts || {};
    var start = opts.start == null ? 0 : opts.start;   // 0 = 元素顶边刚到视口底
    var end = opts.end == null ? 1 : opts.end;
    var r = el.getBoundingClientRect();
    var from = innerHeight * (1 - start);
    var span = innerHeight + r.height;
    var t = (from - r.top) / span;
    return Math.max(0, Math.min(1, (t - start) / (end - start || 1)));
  }

  /* ── 粘性段落进度：用于 pin 住的舞台 ── */
  function pinProgress(el) {
    var r = el.getBoundingClientRect();
    var total = r.height - innerHeight;
    if (total <= 0) return r.top < innerHeight * 0.5 ? 1 : 0;
    return Math.max(0, Math.min(1, -r.top / total));
  }

  /* ── 一个可暂停的常驻循环。fn 返回 false 即自动挂起。 ── */
  function loop(fn) {
    var entry = { fn: fn, active: true };
    loops.push(entry);
    schedule();
    return {
      start: function () { entry.active = true; schedule(); },
      stop: function () { entry.active = false; },
    };
  }

  /* ── 告诉循环层：某个元素进入视口时启用，离开时挂起 ── */
  function loopWhileVisible(el, fn) {
    var l = loop(fn);
    l.stop();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.isIntersecting ? l.start() : l.stop(); });
    }, { rootMargin: '120px 0px' });
    io.observe(el);
    return l;
  }

  window.Motion = {
    flat: flat,
    reduced: reducedQuery.matches,
    onScroll: onScroll,
    requestTick: requestTick,
    observeOnce: observeOnce,
    reveal: reveal,
    count: count,
    countAll: countAll,
    progress: progress,
    pinProgress: pinProgress,
    loop: loop,
    loopWhileVisible: loopWhileVisible,
    velocity: function () { return velocity; },
    onChange: function (fn) {
      if (reducedQuery.addEventListener) reducedQuery.addEventListener('change', function (e) { fn(e.matches); });
    },
  };

  /* 自动接线：页面只要写了 data-reveal / data-count 就会生效 */
  function boot() { reveal(); countAll(); schedule(); }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
}());
