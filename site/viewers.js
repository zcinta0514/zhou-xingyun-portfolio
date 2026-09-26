/* 作品直接操作：物件跟随手势，切换完成后再同步作品说明，不接管页面滚动。 */
(function () {
  'use strict';
  var mod = function (n, len) { return ((n % len) + len) % len; };
  var clamp = function (n, lo, hi) { return Math.max(lo, Math.min(hi, n)); };
  var ease = 'cubic-bezier(.22,1,.36,1)';

  window.createWorkViewer = function (block, items, kind, options) {
    var el = options.el, asset = options.asset, stats = options.stats;
    var quiet = function () { return options.instant || window.matchMedia('(prefers-reduced-motion: reduce)').matches; };
    var v = { cursor:0, i:0, frame:0, state:'idle', queued:null, stopMotion:null };
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
    var frames = el('div', 'v-frames');
    var frameLabel = el('p', 'v-frame-label', '同一作品的不同画面');
    var thumbs = el('div', 'v-thumbs');
    thumbs.setAttribute('role', 'group'); thumbs.setAttribute('aria-label', '当前作品的画面');
    frames.appendChild(frameLabel); frames.appendChild(thumbs); frames.hidden = true;
    var link = el('a', 'link v-link');
    link.target = '_blank'; link.rel = 'noopener noreferrer';
    if (kind === 'peel') {
      // 标题与阅读数由纸面承载。右栏只解释选题和本人工作，避免整套重复。
      title.hidden = true; meta.hidden = true; sub.hidden = true;
      [n, title, el('p', 'v-caption', '选题与展开'), why, el('p', 'v-caption', '我做的'), face, link]
        .forEach(function (x) { panel.appendChild(x); });
    } else {
      [n, title, face, meta, sub, why, credit, frames, link].forEach(function (x) { panel.appendChild(x); });
    }
    var live = el('span', 'viewer-live');
    live.setAttribute('aria-live', 'polite'); live.setAttribute('aria-atomic', 'true');
    var galleryItem = -1;

    function setState(state) { v.state = state; wrap.dataset.state = state; }
    function frameList(index) {
      var item = items[index];
      return [{src:item.media, alt:item.alt || item.title}].concat(item.thumbs || []);
    }
    function currentImage() { return frameList(v.i)[v.frame]; }
    function selectFrame(index) {
      if (v.state !== 'idle') return;
      v.frame = index;
      stage.frame(currentImage());
      [].forEach.call(thumbs.children, function (button, i) {
        button.setAttribute('aria-pressed', String(i === index));
      });
      live.textContent = currentImage().alt;
    }
    function paintGallery() {
      if (kind !== 'book') return;
      var shots = frameList(v.i);
      frames.hidden = shots.length < 2;
      if (galleryItem === v.i) return;
      galleryItem = v.i; thumbs.textContent = '';
      shots.forEach(function (shot, index) {
        var button = el('button', 'v-thumb'); button.type = 'button';
        button.setAttribute('aria-label', '查看' + shot.alt);
        button.setAttribute('aria-pressed', String(index === v.frame));
        var im = el('img'); im.src = asset(shot.src); im.alt = ''; im.draggable = false; im.decoding = 'async';
        button.appendChild(im);
        button.addEventListener('click', function () { selectFrame(index); });
        button.addEventListener('keydown', function (event) {
          var target = event.key === 'ArrowRight' ? mod(index + 1, shots.length)
            : event.key === 'ArrowLeft' ? mod(index - 1, shots.length)
            : event.key === 'Home' ? 0 : event.key === 'End' ? shots.length - 1 : null;
          if (target == null) return;
          event.preventDefault(); event.stopPropagation(); selectFrame(target);
          thumbs.children[target].focus({preventScroll:true});
        });
        thumbs.appendChild(button);
      });
    }
    function paint(announce) {
      var item = items[v.i];
      wrap.dataset.current = item.id; wrap.dataset.index = String(v.i);
      count.textContent = String(v.i + 1).padStart(2, '0') + ' / ' + String(items.length).padStart(2, '0');
      fill.style.transform = 'scaleX(' + ((v.i + 1) / items.length) + ')';
      title.textContent = item.title;
      face.textContent = item.face || '';
      why.textContent = item.body || '';
      stats(meta, item.meta);
      meta.classList.toggle('is-label', !item.meta.some(function (pair) { return /\d/.test(String(pair[0])); }));
      stats(sub, item.stats.length > 2 ? item.stats.slice(1, 2) : []);
      if (kind !== 'peel') sub.hidden = !sub.textContent;
      credit.textContent = item.note || ''; credit.hidden = !item.note;
      link.href = item.url || '#'; link.textContent = item.urlText || '打开原帖'; link.hidden = !item.url;
      paintGallery();
      if (announce) live.textContent = item.title + '，第 ' + (v.i + 1) + ' 件，共 ' + items.length + ' 件';
    }
    function stopMotion() {
      clearTimeout(v.timer);
      if (v.stopMotion) v.stopMotion();
      v.stopMotion = null;
    }
    function commit(target, reset) {
      var changed = mod(target, items.length) !== v.i;
      v.cursor = target; v.i = mod(target, items.length);
      if (changed) v.frame = 0;
      reset(); paint(changed);
      panel.classList.remove('is-turning'); setState('idle');
    }
    function settle(target, draw, reset, duration) {
      stopMotion(); setState('settling');
      if (mod(target, items.length) !== v.i) panel.classList.add('is-turning');
      var ms = quiet() ? 0 : duration;
      v.stopMotion = draw(ms) || null;
      function done() {
        stopMotion(); commit(target, reset);
        if (v.queued) { var action = v.queued; v.queued = null; navigate(action.key, action.d); }
      }
      if (ms) v.timer = setTimeout(done, ms);
      else done();
    }
    function jump(target, reset) { stopMotion(); v.queued = null; commit(target, reset); }
    function transition(node, ms) { node.style.transition = ms ? 'transform ' + ms + 'ms ' + ease : 'none'; }
    function image(item) {
      var im = el('img'); im.src = asset(item.media); im.alt = item.alt || item.title;
      im.draggable = false; im.decoding = 'async'; return im;
    }
    function focusable(node, label) {
      node.tabIndex = 0; node.setAttribute('role', 'group'); node.setAttribute('aria-label', label);
      node.setAttribute('aria-keyshortcuts', 'ArrowLeft ArrowRight Home End'); return node;
    }

    /* 横向装置先判定手势方向；纵向滑动不会被算成翻页。取消只回到已提交的作品。 */
    function drag(node, actions) {
      var track = null, suppressClick = 0;
      node.addEventListener('dragstart', function (e) { e.preventDefault(); });
      node.addEventListener('pointerdown', function (e) {
        if (!e.isPrimary || e.button !== 0 || track || e.target.closest('a')) return;
        if (v.state === 'settling' && actions.interrupt) actions.interrupt();
        if (v.state !== 'idle') return;
        v.queued = null;
        var r = node.getBoundingClientRect();
        track = { id:e.pointerId, x:e.clientX, y:e.clientY, lx:e.clientX, ly:e.clientY, time:performance.now(), vx:0, vy:0, dx:0, dy:0, moved:false, axis:null, target:e.target, localX:e.clientX-r.left, width:r.width };
        node.focus({preventScroll:true}); node.setPointerCapture(e.pointerId);
        actions.start(track); setState('dragging'); e.preventDefault();
      });
      node.addEventListener('pointermove', function (e) {
        if (!track || e.pointerId !== track.id) return;
        var now = performance.now(), dt = Math.max(8, now - track.time);
        track.vx = track.vx * .3 + (e.clientX - track.lx) / dt * .7;
        track.vy = track.vy * .3 + (e.clientY - track.ly) / dt * .7;
        track.dx = e.clientX - track.x; track.dy = e.clientY - track.y;
        track.lx = e.clientX; track.ly = e.clientY; track.time = now;
        if (!track.moved && Math.hypot(track.dx, track.dy) > 7) {
          track.moved = true;
          track.axis = actions.diagonal || Math.abs(track.dx) >= Math.abs(track.dy) * 1.12 ? 'accepted' : 'vertical';
        }
        if (track.axis === 'accepted') { node.classList.add('is-dragging'); actions.move(track); }
      });
      function release(cancelled) {
        if (!track) return;
        var t = track; track = null;
        if (node.hasPointerCapture(t.id)) node.releasePointerCapture(t.id);
        node.classList.remove('is-dragging');
        if (performance.now() - t.time > 90) { t.vx = 0; t.vy = 0; }
        if (t.moved) suppressClick = performance.now() + 420;
        if (cancelled || t.axis === 'vertical') actions.cancel(t);
        else if (t.moved) actions.end(t);
        else { setState('idle'); actions.tap(t); }
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
        var f = el('figure', 'ring-i'); f.dataset.item = String(i);
        f.style.transform = 'rotateY(' + (i * theta) + 'deg) translateZ(calc(var(--rw) * ' + (1 / (2 * Math.tan(Math.PI / items.length))).toFixed(4) + '))';
        var im = image(item); im.loading = 'lazy'; f.appendChild(im);
        f.appendChild(el('figcaption', 'ring-label', item.title)); inner.appendChild(f); return f;
      });
      box.appendChild(inner); box.appendChild(el('span', 'ring-axis'));
      function draw(p) {
        position = p; inner.style.transform = 'rotateY(' + (-p * theta) + 'deg)';
        var current = mod(Math.round(p), items.length);
        faces.forEach(function (f, i) { f.classList.toggle('is-on', i === current); });
      }
      function go(target) {
        var from = position, distance = Math.abs(target - from);
        var duration = distance < .002 ? 0 : clamp(160 + distance * 120, 170, 400);
        // 显式保存每一帧的角度，再次按下可接住此刻的位置，不必等 CSS 动画播完。
        settle(target, function (ms) {
          if (!ms) { draw(target); return; }
          var startTime = performance.now(), frame;
          function tick(time) {
            var p = clamp((time - startTime) / ms, 0, 1);
            draw(from + (target - from) * (1 - Math.pow(1 - p, 3)));
            if (p < 1) frame = requestAnimationFrame(tick);
          }
          frame = requestAnimationFrame(tick);
          return function () { cancelAnimationFrame(frame); };
        }, function () { draw(target); }, duration);
      }
      drag(box, {
        interrupt:function () { stopMotion(); v.queued = null; panel.classList.remove('is-turning'); setState('idle'); },
        start:function () { start = position; unit = Math.max(150, box.clientWidth * .36); },
        move:function (t) { if (!quiet()) draw(start - t.dx / unit); },
        end:function (t) {
          var raw = start - t.dx / unit;
          var momentum = quiet() || Math.abs(t.dx) < 18 ? 0 : clamp(-t.vx * 110 / unit, -.8, .8);
          go(quiet() ? v.cursor + (Math.abs(t.dx) > 30 ? (t.dx < 0 ? 1 : -1) : 0) : Math.round(raw + momentum));
        },
        cancel:function () { go(v.cursor); },
        tap:function (t) {
          var f = t.target.closest('.ring-i');
          var target = Math.round(position);
          if (f) {
            var d = Number(f.dataset.item) - mod(target, items.length);
            if (d > items.length / 2) d -= items.length;
            if (d < -items.length / 2) d += items.length;
            target += d;
          }
          go(target);
        }
      });
      draw(0);
      return {el:box, hint:'左右拖动 · 也可以点两侧作品', step:function (d) { go(v.cursor + d); }, jump:function (target) { jump(target, function () { draw(target); }); }};
    }

    function book() {
      var box = focusable(el('div', 'book'), '海报样本册，向左拖下一张，向右拖上一张，方向键切换');
      var under = el('figure', 'book-page book-under'); under.setAttribute('aria-hidden', 'true');
      var leaf = el('figure', 'book-page book-leaf');
      var front = el('div', 'book-front');
      var underImg = image(items[1 % items.length]), leafImg = image(items[0]);
      under.appendChild(underImg); front.appendChild(leafImg); leaf.appendChild(front);
      var edges = el('div', 'book-edges'); edges.setAttribute('aria-hidden', 'true');
      for (var k = 0; k < 3; k++) edges.appendChild(el('span', 'book-edge'));
      box.appendChild(edges); box.appendChild(under); box.appendChild(leaf); box.appendChild(el('span', 'book-spine'));
      var dir = 0, progress = 0;
      function set(im, shot) { im.src = asset(shot.src || shot.media); im.alt = shot.alt || shot.title; }
      function ready(d) {
        dir = d; progress = 0; transition(leaf, 0);
        set(underImg, items[mod(v.i + d, items.length)]);
        // 当前可见画面始终留在上层，反向拖动不突然换成上一件的背面。
        set(leafImg, currentImage());
        leaf.style.transformOrigin = d > 0 ? '0% 50%' : '100% 50%';
        leaf.style.transform = 'rotateY(0deg)'; box.classList.toggle('is-reverse', d < 0);
        void leaf.offsetWidth;
      }
      function draw(p) {
        progress = clamp(p, 0, 1);
        leaf.style.transform = 'rotateY(' + (-155 * dir * progress) + 'deg)';
      }
      function reset() {
        transition(leaf, 0); set(leafImg, currentImage()); set(underImg, items[mod(v.i + 1, items.length)]);
        leaf.style.transform = 'rotateY(0deg)'; box.classList.remove('is-turning', 'is-reverse'); dir = 0; progress = 0;
      }
      function finish(complete) {
        if (!dir) { reset(); setState('idle'); return; }
        box.classList.add('is-turning');
        var target = v.cursor + (complete ? dir : 0);
        settle(target, function (ms) { transition(leaf, ms); draw(complete ? 1 : 0); }, reset, 180 + Math.abs((complete ? 1 : 0) - progress) * 120);
      }
      drag(box, {
        start:function () { dir = 0; progress = 0; },
        move:function (t) {
          if (!dir) ready(t.dx < 0 ? 1 : -1);
          // 一次手势只翻一个方向，回拖只合上本页；不越过起点突然换纸。
          if (!quiet()) draw(-t.dx * dir / Math.max(180, box.clientWidth * .72));
        },
        end:function (t) {
          var distance = -t.dx * dir, velocity = -t.vx * dir;
          finish(distance > box.clientWidth * .18 || (distance > 20 && velocity > .5));
        },
        cancel:function () { finish(false); },
        tap:function (t) {
          if (t.localX > t.width * .72 || t.localX < t.width * .24) { ready(t.localX > t.width * .72 ? 1 : -1); finish(true); }
          else reset();
        }
      });
      return {
        el:box, hint:'拖动纸页翻看 · 点击纸边也可换页',
        frame:function (shot) { set(leafImg, shot); },
        step:function (d) { ready(d > 0 ? 1 : -1); finish(true); },
        jump:function (target) { jump(target, reset); }
      };
    }

    function peel() {
      var box = el('div', 'peel');
      var under = el('article', 'peel-page peel-under'); under.setAttribute('aria-hidden', 'true');
      var leaf = el('article', 'peel-page peel-leaf');
      function news(node, item) {
        node.textContent = '';
        var mast = el('p', 'peel-top');
        mast.appendChild(el('span', null, '虎扑 · 长文')); mast.appendChild(el('span', 'peel-issue', '体育观察'));
        node.appendChild(mast); node.appendChild(el('h4', 'peel-head', item.title));
        node.appendChild(stats(el('p', 'peel-meta'), item.meta)); node.appendChild(el('div', 'peel-lines'));
      }
      news(under, items[1 % items.length]); news(leaf, items[0]); box.appendChild(under); box.appendChild(leaf);
      var fold = el('div', 'peel-fold'); fold.setAttribute('aria-hidden', 'true'); box.appendChild(fold);
      var corner = el('button', 'peel-corner'); corner.type = 'button';
      corner.setAttribute('aria-label', '拖动右下折角或点击，翻到另一篇长文');
      corner.setAttribute('aria-keyshortcuts', 'ArrowLeft ArrowRight Home End Enter Space');
      var cornerTip = el('span', 'peel-corner-tip', '↖'); cornerTip.setAttribute('aria-hidden', 'true');
      corner.appendChild(cornerTip); box.appendChild(corner);
      var p = 0, dir = 1, rest = .115;
      function ready(d) { dir = d; transition(leaf, 0); fold.style.transition = 'none'; news(under, items[mod(v.i + dir, items.length)]); }
      function draw(value) {
        p = clamp(value, 0, 1);
        var cut = (rest + (2 - rest) * p) * 100;
        var edge = 100 - cut, end = Math.min(100, 200 - cut);
        leaf.style.clipPath = cut <= 100
          ? 'polygon(0 0,100% 0,100% ' + edge + '%,' + edge + '% 100%,0 100%)'
          : 'polygon(0 0,' + end + '% 0,' + end + '% 0,0 ' + end + '%,0 ' + end + '%)';
        fold.style.clipPath = cut <= 100
          ? 'polygon(100% ' + edge + '%,' + edge + '% 100%,' + edge + '% ' + edge + '%)'
          : 'polygon(' + end + '% 0,0 ' + end + '%,' + edge + '% ' + edge + '%)';
        box.style.setProperty('--peel', String(p));
      }
      function reset() {
        leaf.style.transition = 'none'; fold.style.transition = 'none';
        news(leaf, items[v.i]); news(under, items[mod(v.i + 1, items.length)]); draw(0);
      }
      function finish(complete) {
        settle(v.cursor + (complete ? dir : 0), function (ms) {
          leaf.style.transition = ms ? 'clip-path ' + ms + 'ms ' + ease : 'none';
          fold.style.transition = leaf.style.transition; draw(complete ? 1 : 0);
        }, reset, complete ? 310 : 190);
      }
      drag(corner, {
        diagonal:true,
        start:function () { ready(1); },
        move:function (t) { if (!quiet()) draw((-t.dx / box.clientWidth - t.dy / box.clientHeight) / (2 * (2 - rest))); },
        end:function (t) { var distance = -t.dx-t.dy; finish(distance > 65 || (distance > 20 && -t.vx-t.vy > .55)); },
        cancel:function () { finish(false); }, tap:function () { finish(true); }
      });
      corner.addEventListener('click', function (e) { if (e.detail === 0 && v.state === 'idle') { ready(1); finish(true); } });
      draw(0);
      return {el:box, hint:'捏住右下纸角，向内掀开', step:function (d) { ready(d > 0 ? 1 : -1); finish(true); }, jump:function (target) { jump(target, reset); }};
    }

    var stage = kind === 'ring' ? ring() : kind === 'book' ? book() : peel();
    var surface = el('div', 'v-surface');
    var hint = el('p', 'v-hint');
    hint.appendChild(el('span', 'v-hint-mark', kind === 'peel' ? '↖' : '↔'));
    hint.appendChild(document.createTextNode(stage.hint));
    surface.appendChild(stage.el); surface.appendChild(hint);
    wrap.appendChild(surface); wrap.appendChild(panel); wrap.appendChild(live); setState('idle');
    function navigate(key, d) {
      if (key === 'Home') stage.jump(v.cursor - v.i);
      else if (key === 'End') stage.jump(v.cursor + items.length - 1 - v.i);
      else stage.step(d);
    }
    wrap.addEventListener('keydown', function (e) {
      if (e.target.closest('a,.v-thumbs') || v.state === 'dragging') return;
      var d = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
      if ((e.key === ' ' || e.key === 'Enter') && kind !== 'peel') d = 1;
      if (!d && e.key !== 'Home' && e.key !== 'End') return;
      e.preventDefault();
      if (v.state === 'settling') { v.queued = {key:e.key, d:d}; return; }
      navigate(e.key, d);
    });
    Object.defineProperty(wrap, 'viewerState', {get:function () { return {kind:kind, index:v.i, cursor:v.cursor, frame:v.frame, state:v.state, title:items[v.i].title}; }});
    paint(false); return wrap;
  };
}());
