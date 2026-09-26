/* 作品直接操作：转轮、翻书、报纸掀角。只在操作时运行动效，不接管页面滚动。 */
(function () {
  'use strict';
  var mod = function (n, len) { return ((n % len) + len) % len; };
  var clamp = function (n, lo, hi) { return Math.max(lo, Math.min(hi, n)); };
  var ease = 'cubic-bezier(.22,1,.36,1)';

  window.createWorkViewer = function (block, items, kind, options) {
    var el = options.el, asset = options.asset, stats = options.stats;
    var quiet = function () { return options.instant || window.matchMedia('(prefers-reduced-motion: reduce)').matches; };
    var v = { items: items, cursor: 0, i: 0, state: 'idle', queued: 0 };
    var wrap = el('div', 'viewer viewer--' + kind);
    wrap.dataset.viewer = block.id;
    wrap.setAttribute('data-rv', '');
    var panel = el('div', 'vpanel');
    var n = el('p', 'v-n');
    var count = el('span', 'v-count');
    var line = el('span', 'v-progress');
    var fill = el('span', 'v-progress-fill');
    line.setAttribute('aria-hidden', 'true'); line.appendChild(fill);
    n.appendChild(count); n.appendChild(line);
    var title = el('h4', 'v-title');
    var face = el('p', 'v-face');
    var meta = el('p', 'v-meta');
    var sub = el('p', 'v-sub');
    var why = el('p', 'v-why');
    var credit = el('p', 'v-credit');
    var link = el('a', 'link v-link');
    link.target = '_blank'; link.rel = 'noopener noreferrer';
    [n, title, face, meta, sub, why, credit, link].forEach(function (x) { panel.appendChild(x); });
    var live = el('span', 'viewer-live');
    live.setAttribute('aria-live', 'polite'); live.setAttribute('aria-atomic', 'true');

    function paint(announce) {
      var item = items[v.i];
      wrap.dataset.current = item.id;
      wrap.dataset.index = String(v.i);
      count.textContent = String(v.i + 1).padStart(2, '0') + ' / ' + String(items.length).padStart(2, '0');
      fill.style.transform = 'scaleX(' + ((v.i + 1) / items.length) + ')';
      title.textContent = item.title;
      face.textContent = item.face || '';
      why.textContent = item.body || '';
      stats(meta, item.meta);
      stats(sub, item.stats.length > 2 ? item.stats.slice(1, 2) : []);
      sub.hidden = !sub.textContent;
      credit.textContent = item.note || ''; credit.hidden = !item.note;
      link.href = item.url || '#'; link.textContent = item.urlText || '打开原帖'; link.hidden = !item.url;
      if (announce) live.textContent = item.title + '，第 ' + (v.i + 1) + ' 件，共 ' + items.length + ' 件';
    }

    /* 所有装置在吸附结束后一起提交画面、标题、数字和链接，避免快速操作串页。 */
    function settle(target, draw, reset, duration) {
      v.state = 'settling'; wrap.dataset.state = v.state;
      var changed = mod(target, items.length) !== v.i;
      if (changed) panel.classList.add('is-turning');
      var ms = quiet() ? 0 : (duration || 320);
      draw(ms);
      function done() {
        v.cursor = target; v.i = mod(target, items.length);
        reset(); paint(changed);
        panel.classList.remove('is-turning');
        v.state = 'idle'; wrap.dataset.state = v.state;
        if (v.queued) { var d = v.queued; v.queued = 0; stage.step(d); }
      }
      if (ms) v.timer = setTimeout(done, ms);
      else done();
    }

    function transition(node, ms) { node.style.transition = ms ? 'transform ' + ms + 'ms ' + ease : 'none'; }
    function image(item) {
      var im = el('img'); im.src = asset(item.media); im.alt = item.alt || item.title;
      im.draggable = false; im.decoding = 'async'; return im;
    }
    function focusable(node, label) {
      node.tabIndex = 0; node.setAttribute('role', 'group');
      node.setAttribute('aria-label', label);
      node.setAttribute('aria-keyshortcuts', 'ArrowLeft ArrowRight Home End');
      return node;
    }

    /* 指针捕获保证拖出画面再松手也能结束；取消、Esc 和窗口失焦统一回到原件。 */
    function drag(node, actions) {
      var track = null, suppressClick = 0;
      node.addEventListener('dragstart', function (e) { e.preventDefault(); });
      node.addEventListener('pointerdown', function (e) {
        if (!e.isPrimary || e.button !== 0 || v.state !== 'idle') return;
        if (e.target.closest('a')) return;
        var r = node.getBoundingClientRect();
        track = { id:e.pointerId, x:e.clientX, y:e.clientY, lx:e.clientX, ly:e.clientY, time:performance.now(), vx:0, vy:0, dx:0, dy:0, moved:false, target:e.target, localX:e.clientX-r.left, width:r.width };
        node.focus({preventScroll:true});
        node.setPointerCapture(e.pointerId);
        actions.start(track);
        v.state = 'dragging'; wrap.dataset.state = v.state;
        e.preventDefault();
      });
      node.addEventListener('pointermove', function (e) {
        if (!track || e.pointerId !== track.id) return;
        var now = performance.now(), dt = Math.max(8, now - track.time);
        track.vx = (e.clientX - track.lx) / dt;
        track.vy = (e.clientY - track.ly) / dt;
        track.dx = e.clientX - track.x; track.dy = e.clientY - track.y;
        track.lx = e.clientX; track.ly = e.clientY; track.time = now;
        if (Math.hypot(track.dx, track.dy) > 6) track.moved = true;
        if (track.moved) { node.classList.add('is-dragging'); actions.move(track); }
      });
      function release(cancelled) {
        if (!track) return;
        var t = track; track = null;
        if (node.hasPointerCapture(t.id)) node.releasePointerCapture(t.id);
        node.classList.remove('is-dragging');
        if (performance.now() - t.time > 90) { t.vx = 0; t.vy = 0; }
        if (t.moved) suppressClick = performance.now() + 500;
        if (cancelled) actions.cancel();
        else if (t.moved) actions.end(t);
        else { v.state = 'idle'; wrap.dataset.state = v.state; actions.tap(t); }
      }
      node.addEventListener('pointerup', function (e) { if (track && e.pointerId === track.id) release(false); });
      node.addEventListener('pointercancel', function () { release(true); });
      node.addEventListener('lostpointercapture', function () { release(true); });
      node.addEventListener('click', function (e) { if (performance.now() < suppressClick) { e.preventDefault(); e.stopPropagation(); } });
      node.addEventListener('keydown', function (e) { if (e.key === 'Escape' && track) { e.preventDefault(); e.stopPropagation(); release(true); } });
      window.addEventListener('blur', function () { release(true); });
      document.addEventListener('visibilitychange', function () { if (document.hidden) release(true); });
    }

    function ring() {
      var box = focusable(el('div', 'ring'), '短视频转轮，左右拖动或点两侧作品，方向键切换');
      var inner = el('div', 'ring-in');
      var theta = 360 / items.length, position = 0, start = 0, unit = 230;
      var faces = items.map(function (item, i) {
        var f = el('figure', 'ring-i');
        f.dataset.item = String(i);
        f.style.transform = 'rotateY(' + (i * theta) + 'deg) translateZ(calc(var(--rw) * ' + (1 / (2 * Math.tan(Math.PI / items.length))).toFixed(4) + '))';
        var im = image(item); im.loading = 'lazy'; f.appendChild(im);
        var caption = el('figcaption', 'ring-label', item.title); f.appendChild(caption);
        inner.appendChild(f); return f;
      });
      box.appendChild(inner);
      box.appendChild(el('span', 'ring-axis'));
      function draw(p) {
        position = p;
        inner.style.transform = 'rotateY(' + (-p * theta) + 'deg)';
        var current = mod(Math.round(p), items.length);
        faces.forEach(function (f, i) { f.classList.toggle('is-on', i === current); });
      }
      function go(target) {
        settle(target, function (ms) { transition(inner, ms); draw(target); }, function () { transition(inner, 0); }, 700);
      }
      drag(box, {
        start:function () { start = position; unit = Math.max(150, box.clientWidth * .36); transition(inner, 0); },
        move:function (t) { if (!quiet()) draw(start - t.dx / unit); },
        end:function (t) {
          var raw = start - t.dx / unit;
          var momentum = quiet() ? 0 : clamp(-t.vx * 160 / unit, -1.2, 1.2);
          go(quiet() ? start + (Math.abs(t.dx) > 30 ? (t.dx < 0 ? 1 : -1) : 0) : Math.round(raw + momentum));
        },
        cancel:function () { go(v.cursor); },
        tap:function (t) {
          var f = t.target.closest('.ring-i');
          if (!f) return;
          var d = Number(f.dataset.item) - v.i;
          if (d > items.length / 2) d -= items.length;
          if (d < -items.length / 2) d += items.length;
          if (d) go(v.cursor + d);
        }
      });
      draw(0);
      return {el:box, hint:'拖动转轮，或点两侧作品', step:function (d) { go(v.cursor + d); }, jump:function (target) { go(target); }};
    }

    function book() {
      var box = focusable(el('div', 'book'), '海报样本册，向左拖下一张，向右拖上一张，方向键切换');
      var under = el('figure', 'book-page book-under');
      var leaf = el('figure', 'book-page book-leaf');
      var back = el('div', 'book-back'); back.setAttribute('aria-hidden', 'true');
      back.appendChild(el('span', null, '视觉创意'));
      var front = el('div', 'book-front');
      var underImg = image(items[1 % items.length]), leafImg = image(items[0]);
      under.appendChild(underImg); front.appendChild(leafImg);
      leaf.appendChild(front); leaf.appendChild(back);
      var edges = el('div', 'book-edges'); edges.setAttribute('aria-hidden', 'true');
      for (var k = 0; k < 3; k++) edges.appendChild(el('span', 'book-edge'));
      box.appendChild(edges); box.appendChild(under); box.appendChild(leaf);
      box.appendChild(el('span', 'book-spine'));
      var dir = 1, progress = 0;
      function set(im, item) { im.src = asset(item.media); im.alt = item.alt || item.title; }
      function ready(d) {
        dir = d; progress = 0; transition(leaf, 0);
        set(underImg, items[d > 0 ? mod(v.i + 1, items.length) : v.i]);
        set(leafImg, items[d > 0 ? v.i : mod(v.i - 1, items.length)]);
        leaf.style.transform = 'rotateY(' + (d > 0 ? 0 : -178) + 'deg)';
        void leaf.offsetWidth;
      }
      function draw(p) {
        progress = clamp(p, 0, 1);
        leaf.style.transform = 'rotateY(' + (-178 * (dir > 0 ? progress : 1 - progress)) + 'deg)';
      }
      function reset() {
        transition(leaf, 0); set(leafImg, items[v.i]); set(underImg, items[mod(v.i + 1, items.length)]);
        leaf.style.transform = 'rotateY(0deg)'; box.classList.remove('is-turning');
      }
      function finish(commit) {
        box.classList.add('is-turning');
        settle(v.cursor + (commit ? dir : 0), function (ms) { transition(leaf, ms); draw(commit ? 1 : 0); }, reset, 320);
      }
      drag(box, {
        start:function () { ready(1); },
        move:function (t) {
          var d = t.dx < 0 ? 1 : -1;
          if (d !== dir) ready(d);
          if (!quiet()) draw(Math.abs(t.dx) / Math.max(180, box.clientWidth * .72));
        },
        end:function (t) { finish(Math.abs(t.dx) > box.clientWidth * .18 || Math.abs(t.vx) > .45); },
        cancel:function () { finish(false); },
        tap:function (t) {
          if (t.localX > t.width * .68 || t.localX < t.width * .22) { ready(t.localX > t.width * .68 ? 1 : -1); finish(true); }
          else reset();
        }
      });
      return {el:box, hint:'抓住纸边翻页 · 向右拖可翻回', step:function (d) { ready(d > 0 ? 1 : -1); finish(true); }, jump:function (target) { v.cursor=target; v.i=mod(target,items.length); reset(); paint(true); }};
    }

    function peel() {
      var box = el('div', 'peel');
      var under = el('article', 'peel-page peel-under');
      var leaf = el('article', 'peel-page peel-leaf');
      under.setAttribute('aria-hidden', 'true');
      function news(node, item) {
        node.textContent = '';
        var mast = el('p', 'peel-top');
        mast.appendChild(el('span', null, '虎扑 · 长文'));
        mast.appendChild(el('span', 'peel-issue', '体育观察'));
        node.appendChild(mast);
        node.appendChild(el('h5', 'peel-head', item.title));
        node.appendChild(el('p', 'peel-face', item.face));
        node.appendChild(stats(el('p', 'peel-meta'), item.meta));
        node.appendChild(el('div', 'peel-lines'));
      }
      news(under, items[1 % items.length]); news(leaf, items[0]);
      box.appendChild(under); box.appendChild(leaf);
      var fold = el('div', 'peel-fold'); fold.setAttribute('aria-hidden', 'true');
      box.appendChild(fold);
      var corner = el('button', 'peel-corner'); corner.type = 'button';
      corner.setAttribute('aria-label', '拖动右下折角或点击，翻到另一篇长文');
      corner.setAttribute('aria-keyshortcuts', 'ArrowLeft ArrowRight Enter Space');
      corner.appendChild(el('span', 'peel-corner-tip', '掀开'));
      box.appendChild(corner);
      var p = 0, dir = 1;
      function ready(d) {
        dir = d; p = 0; transition(leaf, 0); transition(corner, 0);
        news(under, items[mod(v.i + dir, items.length)]);
      }
      function draw(value) {
        p = clamp(value, 0, 1);
        // 裁切线从右下角沿纸面对角线推进，下页逐步露出；纸背沿折线一起移动。
        var cut = p * 200;
        var points = cut <= 100
          ? '0 0,100% 0,100% ' + (100-cut) + '%, ' + (100-cut) + '% 100%,0 100%'
          : '0 0,' + (200-cut) + '% 0,' + (200-cut) + '% 0,0 ' + (200-cut) + '%,0 ' + (200-cut) + '%';
        leaf.style.clipPath = 'polygon(' + points + ')';
        var edge = 100 - cut, end = Math.min(100, 200 - cut);
        fold.style.clipPath = cut <= 100
          ? 'polygon(100% ' + edge + '%, ' + edge + '% 100%, ' + edge + '% ' + edge + '%)'
          : 'polygon(' + end + '% 0,0 ' + end + '%, ' + edge + '% ' + edge + '%)';
        corner.style.transform = 'translate(' + (-p * 2 * box.clientWidth) + 'px,' + (-p * 2 * box.clientHeight) + 'px)';
        box.style.setProperty('--peel', String(p));
      }
      function reset() {
        leaf.style.transition = 'none'; fold.style.transition = 'none'; transition(corner, 0);
        news(leaf, items[v.i]); news(under, items[mod(v.i + 1, items.length)]); draw(0);
      }
      function finish(commit) {
        settle(v.cursor + (commit ? dir : 0), function (ms) {
          leaf.style.transition = ms ? 'clip-path ' + ms + 'ms ' + ease : 'none';
          fold.style.transition = leaf.style.transition;
          transition(corner, ms); draw(commit ? 1 : 0);
        }, reset, 320);
      }
      drag(corner, {
        start:function () { ready(1); },
        move:function (t) { if (!quiet()) draw((-t.dx / box.clientWidth - t.dy / box.clientHeight) / 4); },
        end:function (t) { finish((-t.dx-t.dy) > 65 || (-t.vx-t.vy) > .5); },
        cancel:function () { finish(false); },
        tap:function () { finish(true); }
      });
      // 原生按钮的键盘 click 没有 pointerdown，同样能翻页。
      corner.addEventListener('click', function (e) { if (e.detail === 0 && v.state === 'idle') { ready(1); finish(true); } });
      return {el:box, hint:'拖住右下折角，掀开另一篇', step:function (d) { ready(d > 0 ? 1 : -1); finish(true); }, jump:function (target) { v.cursor=target; v.i=mod(target,items.length); reset(); paint(true); }};
    }

    var stage = kind === 'ring' ? ring() : kind === 'book' ? book() : peel();
    var surface = el('div', 'v-surface');
    var hint = el('p', 'v-hint');
    hint.appendChild(el('span', 'v-hint-mark', kind === 'peel' ? '↖' : '↔'));
    hint.appendChild(document.createTextNode(stage.hint));
    surface.appendChild(stage.el); surface.appendChild(hint);
    wrap.appendChild(surface); wrap.appendChild(panel); wrap.appendChild(live);
    wrap.dataset.state = v.state;
    wrap.addEventListener('keydown', function (e) {
      if (e.target.closest('a') || v.state === 'dragging') return;
      var d = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
      // 首尾键直接到目标，避免排队播放多次翻页。
      if (e.key === 'Home') d = -v.i;
      if (e.key === 'End') d = items.length - 1 - v.i;
      if ((e.key === ' ' || e.key === 'Enter') && kind !== 'peel') d = 1;
      if (!d) {
        if (e.key === 'Home' || e.key === 'End') e.preventDefault();
        return;
      }
      e.preventDefault();
      if (v.state === 'settling') { v.queued = d > 0 ? 1 : -1; return; }
      if (e.key === 'Home' || e.key === 'End') stage.jump(v.cursor + d);
      else stage.step(d);
    });
    Object.defineProperty(wrap, 'viewerState', {get:function () { return {kind:kind, index:v.i, cursor:v.cursor, state:v.state, title:items[v.i].title}; }});
    paint(false);
    return wrap;
  };
}());
