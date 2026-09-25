/* ==========================================================================
   首页形象：黏土半身像跟随光标转头
   --------------------------------------------------------------------------
   从 demo/figure.html 整理而来，去掉了独立页面的舞台布局与加载进度条，
   只保留四件事：
     1) 预加载全部角度帧，全部就绪后才显示（避免看到没对齐的中间态）
     2) 指针横向位置 → 目标角度，用帧率无关的阻尼逼近（k = 1 - exp(-λ·dt)）
     3) 相邻两帧交叉淡入：底帧 1-e、顶帧 e，透明度互补，永不留重影轮廓
     4) 极缓慢的呼吸浮动 + 接触阴影，让静止时也有生命感
   另有键盘（左右方向键 5° 微调）与 preferse-reduced-motion 的完全静止降级。
   尺寸完全由 CSS 决定，本文件不写任何布局。
   ========================================================================== */
(function () {
  'use strict';

  // 素材根路径：本站页在 site/ 下，素材在仓库根目录
  var PREFIX = '../';

  var DEFAULT_FRAMES = [
    { src: 'assets/raw/character/turn/left-30.webp',  angle: -30 },
    { src: 'assets/raw/character/turn/left-15.webp',  angle: -15 },
    { src: 'assets/raw/character/front.webp',         angle:   0 },
    { src: 'assets/raw/character/turn/right-15.webp', angle:  15 },
    { src: 'assets/raw/character/turn/right-30.webp', angle:  30 }
  ];

  var OPT = {
    lambda: 8.5,        // 跟随指针的阻尼系数：τ≈118ms，跟手但不生硬
    lambdaIdle: 3.0,    // 指针离开后的回归更慢：τ≈330ms，像慢慢转回正面
    floatPeriod: 5,     // 呼吸周期（秒）
    floatAmp: 6,        // 呼吸幅度（px）
    keyStep: 5,         // 方向键步进角度
    reacquire: 24       // 键盘接管后，鼠标需移动这么多 px 才重夺控制权
  };

  var clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
  var reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  function createFigure(root, options) {
    if (!root) return null;
    var opt = {}, k;
    for (k in OPT) opt[k] = OPT[k];
    if (options) for (k in options) opt[k] = options[k];
    var frames = opt.frames || DEFAULT_FRAMES;
    var prefix = opt.prefix === undefined ? PREFIX : opt.prefix;

    /* ---- DOM ---- */
    var shadow = document.createElement('div');
    shadow.className = 'shadow';
    shadow.setAttribute('aria-hidden', 'true');
    var framesEl = document.createElement('div');
    framesEl.className = 'frames';
    framesEl.setAttribute('aria-hidden', 'true');
    root.appendChild(shadow);
    root.appendChild(framesEl);

    /* ---- 状态 ---- */
    var st = {
      frames: [], els: [], ops: [],
      cur: 0, target: 0,
      cursorIn: false, keyboard: false,
      phase: 0, last: 0, raf: 0,
      staticMode: !!(opt.static || reduceQuery.matches),
      ready: false, seen: false
    };

    /* ---- 交叉淡入 ---- */
    function blend(angle) {
      var f = st.frames, n = f.length;
      if (!n) return [];
      if (n === 1 || angle <= f[0].angle) return [[0, 1]];
      if (angle >= f[n - 1].angle) return [[n - 1, 1]];
      var i = 0;
      while (i < n - 2 && angle > f[i + 1].angle) i++;
      var span = f[i + 1].angle - f[i].angle;
      var t = span > 0 ? clamp((angle - f[i].angle) / span, 0, 1) : 0;
      var e = t * t * (3 - 2 * t);                 // smoothstep：缩短两帧各半的停留
      if (e <= 0.004) return [[i, 1]];
      if (e >= 0.996) return [[i + 1, 1]];
      return [[i, 1 - e], [i + 1, e]];
    }

    function render(angle) {
      var list = blend(angle), next = {}, i;
      for (i = 0; i < list.length; i++) next[list[i][0]] = list[i][1];
      for (i = 0; i < st.els.length; i++) {
        var o = next[i] || 0;
        if (Math.abs(o - st.ops[i]) < 0.003) continue;   // 变化太小就不碰样式
        st.els[i].style.opacity = o === 1 ? '1' : o.toFixed(3);
        st.ops[i] = o;
      }
    }

    function showSingle(index) {
      st.els.forEach(function (el, i) {
        var o = i === index ? 1 : 0;
        el.style.opacity = o ? '1' : '0';
        st.ops[i] = o;
      });
    }

    function frontIndex() {
      var best = 0;
      st.frames.forEach(function (f, i) {
        if (Math.abs(f.angle) < Math.abs(st.frames[best].angle)) best = i;
      });
      return best;
    }

    /* ---- 主循环 ---- */
    var TAU = Math.PI * 2;
    function tick(now) {
      st.raf = requestAnimationFrame(tick);
      var dt = st.last ? Math.min((now - st.last) / 1000, 0.05) : 0;
      st.last = now;

      // 阻尼跟随（与帧率无关）
      var lambda = st.cursorIn ? opt.lambda : opt.lambdaIdle;
      var k = 1 - Math.exp(-lambda * dt);
      st.cur += (st.target - st.cur) * k;
      if (Math.abs(st.target - st.cur) < 0.05) st.cur = st.target;
      render(st.cur);

      // 呼吸浮动：位移加在帧容器上，不动阴影与布局
      st.phase += dt;
      var y = -opt.floatAmp * 0.5 * (1 - Math.cos(TAU * st.phase / opt.floatPeriod));
      framesEl.style.transform = 'translate3d(0,' + y.toFixed(2) + 'px,0)';
      var p = -y / opt.floatAmp;
      shadow.style.transform = 'translateX(-50%) scale(' + (1 - 0.035 * p).toFixed(4) + ')';
      shadow.style.opacity = (1 - 0.14 * p).toFixed(3);
    }
    function start() {
      if (st.raf || st.staticMode || !st.ready) return;
      st.last = 0;
      st.raf = requestAnimationFrame(tick);
    }
    function stop() {
      if (st.raf) cancelAnimationFrame(st.raf);
      st.raf = 0;
    }

    /* ---- 指针 ---- */
    function angleFromX(x) {
      var f = st.frames;
      if (f.length < 2) return f.length ? f[0].angle : 0;
      var u = clamp(x / Math.max(1, window.innerWidth), 0, 1);
      return f[0].angle + (f[f.length - 1].angle - f[0].angle) * u;
    }
    var lastPt = null;
    function onMove(e) {
      if (st.staticMode || !st.ready) return;
      if (st.keyboard) {
        // 键盘接管中：指针要明显动一次才夺回控制权，避免手抖打断
        if (!lastPt || Math.hypot(e.clientX - lastPt.x, e.clientY - lastPt.y) <= opt.reacquire) {
          lastPt = { x: e.clientX, y: e.clientY };
          return;
        }
        st.keyboard = false;
      }
      lastPt = { x: e.clientX, y: e.clientY };
      st.cursorIn = true;
      st.target = angleFromX(e.clientX);
    }
    function leave() {
      if (st.staticMode) return;
      st.cursorIn = false;
      if (!st.keyboard) st.target = 0;
    }
    function onOut(e) { if (!e.relatedTarget) leave(); }

    /* ---- 键盘 ---- */
    function onKey(e) {
      if (st.staticMode || !st.ready) return;
      var dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!dir) return;
      e.preventDefault();                    // 别把页面横向滚走
      var f = st.frames;
      if (!f.length) return;
      st.keyboard = true;
      var min = f[0].angle, max = f[f.length - 1].angle;
      var from = Math.round(st.target / opt.keyStep) * opt.keyStep;
      st.target = clamp(from + dir * opt.keyStep, min, max);
      st.cursorIn = true;
    }

    /* ---- 尺寸/可见性 ---- */
    var io = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(function (entries) {
        var e = entries[0];
        if (e.isIntersecting) start(); else stop();
      }, { threshold: 0 });
      io.observe(root);
    }
    function onVisibility() {
      if (document.hidden) stop(); else if (st.seen) start();
    }

    /* ---- 静止降级 ---- */
    function applyStatic(on) {
      st.staticMode = on;
      if (on) {
        stop();
        framesEl.style.transform = 'translate3d(0,0,0)';
        shadow.style.transform = 'translateX(-50%)';
        shadow.style.opacity = '1';
        st.target = st.cur = 0;
        root.removeAttribute('tabindex');
        if (st.frames.length) showSingle(frontIndex());
      } else {
        root.setAttribute('tabindex', '0');
        if (st.frames.length) { render(st.cur); start(); }
      }
    }

    /* ---- 预加载 ---- */
    function preload() {
      var total = frames.length, done = 0;
      var imgs = frames.map(function (f, i) {
        var img = document.createElement('img');
        img.className = 'frame';
        img.alt = '';
        img.setAttribute('aria-hidden', 'true');
        img.draggable = false;
        img.decoding = 'async';
        img.style.zIndex = String(i);
        framesEl.appendChild(img);
        return img;
      });
      function finish() {
        var ok = [], keepF = [], keepE = [];
        frames.forEach(function (f, i) { ok[i] = imgs[i].dataset.ok === '1'; });
        frames.forEach(function (f, i) { if (ok[i]) { keepF.push(f); keepE.push(imgs[i]); } });
        st.frames = keepF;
        st.els = keepE;
        st.ops = keepF.map(function () { return -1; });
        if (!keepF.length) {                    // 全部失败：藏掉形象，页面不崩
          root.hidden = true;
          console.warn('[figure] 形象素材全部加载失败：', prefix + frames[0].src);
          return;
        }
        st.ready = true;
        if (!st.seen) { st.seen = true; return; }   // 等 main.js 调 begin()
      }
      imgs.forEach(function (img, i) {
        function settle(okFlag) {
          img.dataset.ok = okFlag ? '1' : '0';
          if (!okFlag) { console.warn('[figure] 跳过加载失败的帧：', prefix + frames[i].src); img.remove(); }
          if (++done === total) finish();
        }
        img.addEventListener('load', function () { settle(true); }, { once: true });
        img.addEventListener('error', function () { settle(false); }, { once: true });
        img.src = prefix + frames[i].src;
      });
    }

    /* ---- 启动 ---- */
    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', leave);
    document.addEventListener('mouseout', onOut, { passive: true });
    window.addEventListener('blur', leave);
    root.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onVisibility);
    if (reduceQuery.addEventListener) reduceQuery.addEventListener('change', function () { applyStatic(reduceQuery.matches); });
    else if (reduceQuery.addListener) reduceQuery.addListener(function () { applyStatic(reduceQuery.matches); });

    applyStatic(st.staticMode);
    if (!st.staticMode) root.setAttribute('tabindex', '0');
    preload();

    return {
      // main.js 在全页内容就绪后调用，避免形象先于文字出现
      begin: function () {
        st.seen = true;
        if (!st.ready) return;
        if (st.staticMode) { showSingle(frontIndex()); return; }
        render(st.cur);
        start();
      },
      setStatic: applyStatic,
      stop: stop,
      start: start,
      get info() {
        return {
          angle: +st.cur.toFixed(2), target: st.target,
          ready: st.ready, static: st.staticMode,
          cursorIn: st.cursorIn, keyboard: st.keyboard,
          frames: st.frames.map(function (f) { return f.angle; })
        };
      }
    };
  }

  window.createFigure = createFigure;
}());
