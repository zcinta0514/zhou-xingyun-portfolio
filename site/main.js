/* ==========================================================================
   周性运 · 个人作品集首页
   --------------------------------------------------------------------------
   数据：全部读 versions/shared/content.js（全站唯一事实来源），
        本文件只做呈现与派生计算，不写死任何数字。
   动效：
     · 入场用 IntersectionObserver 观察「不被裁切」的 [data-rv] 元素，只播一次
     · 卡片展开用手写 FLIP：卡片在格子间平移，尺寸与图片前后完全一致，因此只需要 translate，
       不会出现文字被缩放变形的问题
     · 展开分两级：先平移就位（700ms），再用 clip-path 把详情自上而下揭开（700ms）
     · 关闭：Esc / 收起按钮 / 再点一次卡片；焦点回到卡片
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------ 0 环境与工具 */
  // content.js 按 versions/X/index.html 的深度写死为 '../../'，本页在 site/ 下，浅一级
  window.ASSET_PREFIX = '../';
  var S = window.SITE;
  var asset = window.asset;
  var html = document.documentElement;
  var FLAT = /[?&]flat=1/.test(location.search);
  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var INSTANT = FLAT || REDUCE;   // 不做 FLIP、不做计数、形象静止
  if (FLAT) html.classList.add('flat', 'calm');
  // 峰值位置 A/B：默认把峰值放在作品区（代表作通栏），?peak=hero 换成首屏巨数。
  // 两个方案共用一套数据和卡片，只换峰值的位置与体量，对比才有效。
  var PEAK = /[?&]peak=hero/.test(location.search) ? 'hero' : 'works';
  html.setAttribute('data-peak', PEAK);

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function num(n) { return n.toLocaleString('en-US'); }
  function trim1(x) { return (Math.round(x * 10) / 10).toFixed(1).replace(/\.0$/, ''); }
  // 卡片上的数字用紧凑写法，全部由原始数字现算（1,600,000 → 1.6M）
  function short(n) {
    if (n >= 1e6) return trim1(n / 1e6) + 'M';
    if (n >= 1e4) return trim1(n / 1e3) + 'K';
    return num(n);
  }
  // 指标统一为 [值, 说明] 对，值加粗、说明弱化
  function stats(node, pairs) {
    node.textContent = '';                            // 允许重填（带架切换时要用）
    pairs.forEach(function (p, i) {
      if (i) node.appendChild(document.createTextNode(' · '));
      if (p[0] || p[1]) {
        if (p[0]) node.appendChild(el('b', null, p[0]));
        if (p[1]) node.appendChild(document.createTextNode(p[1].indexOf(' ') === 0 ? p[1] : ' ' + p[1]));
      }
    });
    return node;
  }

  /* ------------------------------------------------------------ 1 数据整形 */
  // 作品章按「能力」分成四块，块 id 同时也是能力章的跳转锚点
  var B_VIDEO = 'works-tiktok', B_POSTER = 'works-instagram', B_FLOW = 'works-localization', B_TEXT = 'works-hupu';

  function tiktokItems() {
    var list = S.tiktok.works.map(function (w) {
      return {
        id: 'tt-' + w.id, dom: 'work-' + w.id.toLowerCase(),
        title: w.title, cat: w.cat, face: w.face,
        media: w.src, alt: w.title + ' · 视频封面',
        meta: [[short(w.views), '播放'], [w.rate + '%', '互动']],
        stats: [[num(w.views), '播放'], [num(w.likes), '点赞'], [w.rate + '%', '互动率']],
        body: w.why,
        url: w.url, urlText: '在 TikTok 打开原帖',
        lead: w.id === S.tiktok.lead,
        views: w.views
      };
    });
    // 按播放从高到低排（内容不变，只调展示顺序）。作品章导语对读者承诺了“从高到低”，
    // 所以这个顺序是承诺的一部分，不能随意改回原顺序。1.6M 那条自然排在第一。
    list.sort(function (a, b) { return b.views - a.views; });
    return list;
  }

  function instagramItems() {
    return S.instagram.works.map(function (w) {
      var tail = w.cat.split(' · ').pop();
      var m = w.metrics.length
        ? w.metrics.map(function (x) { return [x.value, x.label]; })
        : [[tail, '']];
      return {
        id: 'ig-' + w.id, dom: 'work-' + w.id,
        title: w.title, cat: w.cat, face: w.face,
        media: w.images[0].src, alt: w.images[0].alt,
        meta: m, stats: m,
        body: w.desc,
        role: w.role,
        note: w.credit,
        thumbs: w.images.slice(1).map(function (i) { return { src: i.src, alt: i.alt }; }),
        url: w.url, urlText: '在 Instagram 打开原帖'
      };
    });
  }

  function hupuItems() {
    return S.hupu.articles.map(function (a) {
      return {
        id: 'hp-' + a.n, dom: 'work-hupu-' + a.n,
        title: a.title, cat: a.cat, face: a.face,
        meta: [[num(a.views), '阅读'], [num(a.replies), '回复']],
        stats: [[num(a.views), '阅读'], [num(a.replies), '回复']],
        body: a.desc,
        url: a.url, urlText: '在虎扑看原文'
      };
    });
  }

  /* ---- 四块能力。每块：目标 / 我负责的 / 怎么实现的。
     三样全部取自 content.js 已有字段（brief / duties / role / credit / steps / tags），
     不新写任何事实，也不把同一句话说两遍。 ---- */
  var TT_ALL = tiktokItems();
  var TT_LEAD = TT_ALL.filter(function (w) { return w.lead; })[0];
  var TT_REST = TT_ALL.filter(function (w) { return !w.lead; });
  var IG = instagramItems();
  var HP = hupuItems();

  function dutyNames(d) { return d.map(function (x) { return x.name; }).join(' · '); }

  var BLOCKS = [
    {
      kind: 'video', id: B_VIDEO, name: '短视频', count: S.tiktok.works.length + ' 条', cols: 5,
      goal: S.tiktok.brief,
      role: dutyNames(S.tiktok.duties),
      how: S.tiktok.duties,
      note: S.tiktok.note,
      lead: TT_LEAD, items: TT_REST
    },
    {
      kind: 'poster', id: B_POSTER, name: '视觉创意', count: S.instagram.works.length + ' 件', cols: 4,
      goal: S.instagram.brief,
      role: S.instagram.works[2].credit,
      how: S.instagram.tags.join(' · '),
      note: S.instagram.note,
      items: IG
    },
    {
      kind: 'flow', id: B_FLOW, name: '内容规划与外包协作', count: S.localization.count.value, cols: 2,
      goal: S.localization.brief,
      role: S.localization.credit,
      note: S.localization.countNote,
      steps: S.localization.steps,
      shot: S.localization.capture,
      shotUrl: S.localization.accountUrl,
      shotLabel: S.localization.accountLabel
    },
    {
      kind: 'text', id: B_TEXT, name: '长文', count: S.hupu.articles.length + ' 篇', cols: 2,
      goal: S.hupu.brief,
      role: S.hupu.role,
      how: S.hupu.tags.join(' · '),
      note: S.hupu.note,
      items: HP
    }
  ];

  /* ------------------------------------------------- 2.5 块级公共件 */
  // 目标 / 我负责的 / 怎么实现的：三行一组，值可以是字符串，也可以是节点
  function buildMeta(rows) {
    var dl = el('dl', 'blk-meta');
    rows.forEach(function (r) {
      if (!r || !r[1] || (typeof r[1] === 'string' && !r[1].length)) return;
      var row = el('div', 'blk-row');
      row.appendChild(el('dt', null, r[0]));
      var dd = el('dd');
      if (r[1].nodeType) dd.appendChild(r[1]);
      else dd.textContent = r[1];
      row.appendChild(dd);
      dl.appendChild(row);
    });
    return dl;
  }
  // 五步 / 三步这类流程：带序号的短列表（有 text 就带一句说明）
  function buildSteps(steps) {
    var ol = el('ol', 'blk-steps');
    steps.forEach(function (s) {
      var li = el('li');
      li.appendChild(el('b', 'blk-step-n', s.n || ''));
      var box = el('span', 'blk-step-b');
      box.appendChild(el('b', 'blk-step-name', s.name));
      if (s.text) box.appendChild(el('span', 'blk-step-text', s.text));
      li.appendChild(box);
      ol.appendChild(li);
    });
    return ol;
  }
  function buildHead(block, slim) {
    var head = el('header', 'blk-head' + (slim ? ' blk-head--slim' : ''));
    head.setAttribute('data-rv', '');
    var h = el('h3', 'blk-name');
    h.id = block.id + '-h';
    h.appendChild(document.createTextNode(block.name));
    h.appendChild(el('span', 'blk-count', block.count));
    head.appendChild(h);
    if (!slim) {
      head.appendChild(buildMeta([['目标', block.goal], ['我负责的', block.role]]));
      if (block.how) {
        var how = el('div', 'blk-how');
        how.appendChild(el('p', 'blk-how-h', '怎么实现的'));
        how.appendChild(block.how.nodeType ? block.how : buildSteps(block.how));
        head.appendChild(how);
      }
      if (block.note) head.appendChild(el('p', 'blk-note', block.note));
    }
    return head;
  }

  /* ------------------------------------------------- 2.6 四块各自的版式 */
  function deckOld() { /* 主片换成带架后就不再需要单独的 feature 块 */ }

  /* ------------------------------------------------- 2.6 翻阅装置 */
  /* 作品块不再把东西平铺出来。每块是一台自己的翻阅装置，一次只完整露出一个：
       短视频   ring 转轮 —— 圆环绕 Y 轴转，正面那盘对着你，背面自动消失
       视觉创意 book 翻书 —— 一次只见一页，页面绕书脊转出去、露出下一页
       长文     peel 掀角 —— 版面从右下角整张掀开，露出下一版
       内容规划       —— 不是作品集，是“我怎么干的”，单独做成一台抽屉（见 renderCabinet）
     外壳（计数 / 上一件 下一件 / 圆点 / 信息栏 / 键盘）四块共用，
     真正不同的是各自那台舞台的机械动作。

     舞台接口（三个可选）：
       init(i)      建好后的初始状态
       begin(i,p)   切换一开始就调（机械动作从这里出发）
       settle(i)    到 swapAt 时调（用于舞台内部的内容换位）
       finish(i)    机械动作结束后调（复位、备下一轮）
     注意：对被 IntersectionObserver 观察的元素不要下 clip-path，
     被裁到 0 面积就永远等不到揭示回调（PROGRESS.md 记过）。 */
  var viewers = {};

  // ---- 舞台：转轮 ----
  function stageRing(v) {
    var box = el('div', 'ring');
    var inner = el('div', 'ring-in');
    var step = 360 / v.items.length;                 // 6 盘 → 每盘 60°，正好一圈
    v.figs = [];
    v.items.forEach(function (item, i) {
      var f = el('figure', 'ring-i');
      // 半径由卡宽推出来：正六边形外接圆 R = w / (2·tan30°) = w × .866
      f.style.transform = 'rotateY(' + (i * step) + 'deg) translateZ(calc(var(--rw) * .866))';
      var im = el('img');
      im.src = asset(item.media); im.alt = ''; im.loading = 'lazy'; im.decoding = 'async';
      f.appendChild(im);
      inner.appendChild(f);
      v.figs.push(f);
    });
    box.appendChild(inner);
    v.inner = inner; v.step = step;
    function mark(i) { v.figs.forEach(function (f, n) { f.classList.toggle('is-on', n === i); }); }
    return {
      el: box, swapAt: 320, dur: 700,
      init: function (i) { inner.style.transform = 'rotateY(' + (-i * step) + 'deg)'; mark(i); },
      begin: function (i) { inner.style.transform = 'rotateY(' + (-i * step) + 'deg)'; mark(i); },  // 整圈转 60° = 轮回
      settle: function () {}
    };
  }

  // ---- 舞台：翻书 ----
  // 两层就够：下层放“下一页”，上层绕书脊转出去；过 90° 后背面不可见，
  // 下面那页自然就露出来了。转完再把上层复位、换成当前页。
  function stageBook(v) {
    var box = el('div', 'book');
    var under = el('figure', 'book-page book-under');
    var leaf = el('figure', 'book-page book-leaf');
    var uim = el('img'), lim = el('img');
    uim.alt = ''; lim.alt = '';
    under.appendChild(uim); leaf.appendChild(lim);
    box.appendChild(under); box.appendChild(leaf);
    var edges = el('div', 'book-edges');           // 右侧一叠纸边的暗示
    for (var k = 0; k < 4; k++) edges.appendChild(el('span', 'book-edge'));
    box.appendChild(edges);
    v.under = uim; v.leaf = lim;
    function set(node, item) { node.src = asset(item.media); node.alt = item.title; }
    return {
      el: box, swapAt: 420, dur: 720,
      init: function (i) {
        set(lim, v.items[i]);
        set(uim, v.items[(i + 1) % v.items.length]);
      },
      begin: function (i) {
        set(uim, v.items[i]);                     // 转出去之后露出来的就是这一页
        leaf.classList.add('is-flipping');
      },
      finish: function (i) {
        leaf.style.transition = 'none';           // 复位不能带过渡，否则会倒着转回去
        leaf.classList.remove('is-flipping');
        void leaf.offsetHeight;
        leaf.style.transition = '';
        set(lim, v.items[i]);
        set(uim, v.items[(i + 1) % v.items.length]);
      }
    };
  }

  // ---- 舞台：撕角（报纸版面从右下角掀开）----
  // 长文没有图，版面本身就是内容：大标题 + 版号 + 阅读数，靠字撑起来。
  function stagePeel(v) {
    var box = el('div', 'peel');
    var under = el('article', 'peel-page peel-under');
    var leaf = el('article', 'peel-page peel-leaf');
    box.appendChild(under); box.appendChild(leaf);
    v.underEl = under; v.leafEl = leaf;
    function fill(node, item) {
      node.textContent = '';
      var top = el('p', 'peel-top');
      top.appendChild(el('span', 'peel-issue', '第 ' + (v.items.indexOf(item) + 1) + ' 版'));
      top.appendChild(el('span', null, '虎扑 · 长文'));
      node.appendChild(top);
      node.appendChild(el('h5', 'peel-head', item.title));
      node.appendChild(el('p', 'peel-face', item.face || ''));
      node.appendChild(stats(el('p', 'peel-meta'), item.meta));
    }
    v.fill = fill;
    return {
      el: box, swapAt: 400, dur: 720,
      init: function (i) {
        fill(leaf, v.items[i]);
        fill(under, v.items[(i + 1) % v.items.length]);
      },
      begin: function (i) {
        fill(under, v.items[i]);
        leaf.classList.add('is-peeling');
      },
      finish: function (i) {
        leaf.style.transition = 'none';
        leaf.classList.remove('is-peeling');
        void leaf.offsetHeight;
        leaf.style.transition = '';
        fill(leaf, v.items[i]);
        fill(under, v.items[(i + 1) % v.items.length]);
      }
    };
  }

  var STAGES = { ring: stageRing, book: stageBook, peel: stagePeel };

  /* ---- 外壳 ---- */
  function viewerPaint(v, i) {
    var item = v.items[i];
    v.count.textContent = (i + 1) + ' / ' + v.items.length;
    v.title.textContent = item.title;
    v.face.textContent = item.face || '';
    v.why.textContent = item.body || '';
    stats(v.meta, item.meta);
    // 副数字只用于 TikTok 那种三项数据（中间那项赞），两项数据的块不再重复一遍
    stats(v.sub, item.stats.length > 2 ? item.stats.slice(1, 2) : []);
    if (item.url) {
      v.link.href = item.url;
      v.link.textContent = item.urlText || '打开原帖';
      v.link.hidden = false;
    } else v.link.hidden = true;
    v.dots.forEach(function (d, n) {
      d.classList.toggle('is-on', n === i);
      if (n === i) d.setAttribute('aria-current', 'true');
      else d.removeAttribute('aria-current');
    });
  }

  function viewerGo(v, i) {
    if (i === v.i) return;
    var prev = v.i;
    v.i = i;
    v.stage.begin(i, prev);
    if (INSTANT) {
      if (v.stage.settle) v.stage.settle(i);
      if (v.stage.finish) v.stage.finish(i);
      viewerPaint(v, i);
      return;
    }
    // 文字在机械动作走到一半（这时看不见舞台）时换掉，再从另一侧淡回来
    v.panel.classList.add('is-turning');
    clearTimeout(v.timer);
    v.timer = setTimeout(function () {
      if (v.stage.settle) v.stage.settle(i);
      viewerPaint(v, i);
      v.panel.classList.remove('is-turning');
    }, v.stage.swapAt);
    if (v.stage.finish) {
      clearTimeout(v.timer2);
      v.timer2 = setTimeout(function () { v.stage.finish(i); }, v.stage.dur);
    }
  }

  function viewerStep(v, d) {
    var n = v.items.length;
    viewerGo(v, (v.i + d + n) % n);          // 到头回到开头，一圈一圈转
  }

  function buildViewer(block, items, kind) {
    var v = { id: block.id, items: items, i: 0, kind: kind };
    var wrap = el('div', 'viewer viewer--' + kind);
    wrap.dataset.viewer = block.id;                 // viewerKeys 靠它找回是哪台装置
    wrap.setAttribute('data-rv', '');

    v.stage = STAGES[kind](v);
    wrap.appendChild(v.stage.el);

    var panel = el('div', 'vpanel');
    v.count = el('span', 'v-count');
    var n = el('p', 'v-n');
    n.appendChild(v.count);
    var nav = el('span', 'v-nav');
    var prev = el('button', 'v-btn', '‹ 上一件');
    var next = el('button', 'v-btn', '下一件 ›');
    prev.type = 'button'; next.type = 'button';
    prev.addEventListener('click', function () { viewerStep(v, -1); });
    next.addEventListener('click', function () { viewerStep(v, 1); });
    nav.appendChild(prev); nav.appendChild(next);
    n.appendChild(nav);

    // 一圈数字点：看得出“一共几件、现在第几件”，但不透内容
    var dots = el('div', 'v-dots');
    dots.setAttribute('role', 'group');
    dots.setAttribute('aria-label', '选择作品');
    v.dots = [];
    items.forEach(function (item, i) {
      var d = el('button', 'v-dot');
      d.type = 'button';
      d.textContent = String(i + 1);
      d.setAttribute('aria-label', '第 ' + (i + 1) + ' 件：' + item.title);
      d.addEventListener('click', function () { viewerGo(v, i); });
      dots.appendChild(d);
      v.dots.push(d);
    });

    v.title = el('h4', 'v-title');
    v.face = el('p', 'v-face');
    v.meta = el('p', 'v-meta');
    v.sub = el('p', 'v-sub');
    v.why = el('p', 'v-why');
    v.link = el('a', 'link v-link');
    v.link.target = '_blank'; v.link.rel = 'noopener noreferrer';
    [n, dots, v.title, v.face, v.meta, v.sub, v.why, v.link]
      .forEach(function (x) { panel.appendChild(x); });
    wrap.appendChild(panel);
    v.panel = panel;

    v.stage.init(0);
    viewerPaint(v, 0);
    viewers[v.id] = v;
    return wrap;
  }

  /* 抽屉柜：拉出一个、看一步。窗口固定高，靠 translateX 滑动，不动高度 */
  function cabGo(cab, i) {
    if (i === cab.i) return;
    cab.i = i;
    cab.drawer.style.transform = 'translateX(' + (-i * 100) + '%)';
    cab.handles.forEach(function (b, n) { b.classList.toggle('is-on', n === i); });
  }

  function viewerKeys(e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    var a = document.activeElement;
    if (!a || !a.closest) return;
    var host = a.closest('.viewer');
    if (!host) return;                             // 焦点在装置里才接管方向键
    var v = viewers[host.dataset.viewer];
    if (!v) return;
    e.preventDefault();
    viewerStep(v, e.key === 'ArrowRight' ? 1 : -1);
    v.dots[v.i].focus({ preventScroll: true });
  }

  function renderWorks() {
    BLOCKS.forEach(function (b) {
      var blk = el('section', 'blk blk--' + b.kind);
      blk.id = b.id;
      blk.setAttribute('aria-labelledby', b.id + '-h');

      if (b.kind === 'flow') {
        /* 块 3：不是作品网格，是“我怎么干的”。做成一台抽屉柜：
           左边参数（目标 / 我负责的），右边三个把手，拉出一个看一步的说明与证据。 */
        var side = el('div', 'blk-side');
        side.setAttribute('data-rv', '');
        var h3 = el('h3', 'blk-name');
        h3.id = b.id + '-h';
        h3.appendChild(document.createTextNode(b.name));
        h3.appendChild(el('span', 'blk-count', b.count));
        side.appendChild(h3);
        side.appendChild(buildMeta([['目标', b.goal], ['我负责的', b.role]]));
        side.appendChild(el('p', 'blk-note', b.note));
        blk.appendChild(side);

        var body = el('div', 'blk-body cabinet');
        body.setAttribute('data-rv', '');
        var handles = el('ul', 'cab-handles');
        var hop = el('div', 'cab-hop');               // 抽屉口：固定窗口，里面滑动
        var drawer = el('div', 'cab-drawer');
        var sheets = [];
        var cab = { drawer: drawer, handles: [], sheets: sheets, i: 0 };
        hop.appendChild(drawer);
        b.steps.forEach(function (s, n) {
          var li = el('li');
          var btn = el('button', 'cab-handle');
          btn.type = 'button';
          btn.style.setProperty('--n', String(n));      // 把手依次推入的错峰
          btn.appendChild(el('b', 'cab-n', s.n));
          btn.appendChild(el('span', 'cab-name', s.name));
          btn.addEventListener('click', function () { cabGo(cab, n); });
          li.appendChild(btn);
          handles.appendChild(li);
          cab.handles.push(btn);

          var sheet = el('article', 'cab-sheet');
          sheet.appendChild(el('p', 'cab-step', s.n + ' / ' + b.steps.length));
          sheet.appendChild(el('h4', 'cab-h', s.name));
          sheet.appendChild(el('p', 'cab-text', s.text));
          if (n === b.steps.length - 1) {
            // 最后一步带证据：日韩账号的公开页截图（去掉了就没有可核验的东西）
            var fig = el('figure', 'cab-fig');
            var si = el('img');
            si.src = asset(b.shot.src); si.alt = b.shot.alt;
            si.loading = 'lazy'; si.decoding = 'async';
            fig.appendChild(si);
            fig.appendChild(el('figcaption', 'pr-cap', b.shot.caption));
            sheet.appendChild(fig);
            var sa = el('a', 'link', b.shotLabel);
            sa.href = b.shotUrl; sa.target = '_blank'; sa.rel = 'noopener noreferrer';
            sheet.appendChild(sa);
          }
          sheets.push(sheet);
          drawer.appendChild(sheet);
        });
        body.appendChild(handles);
        body.appendChild(hop);
        blk.appendChild(body);
        indexEl.appendChild(blk);
        return;
      }

      if (b.kind === 'text') {
        /* 块 4：报纸版面，一次只掀开一版（见 stagePeel）*/
        var th = el('h3', 'blk-name');
        th.id = b.id + '-h';
        th.appendChild(document.createTextNode(b.name));
        th.appendChild(el('span', 'blk-count', b.count));
        blk.appendChild(th);
        blk.appendChild(buildViewer(b, b.items, 'peel'));
        var tail = el('div', 'art-meta-block');
        tail.setAttribute('data-rv', '');
        tail.appendChild(buildMeta([['目标', b.goal], ['我负责的', b.role], ['怎么实现的', b.how]]));
        if (b.note) tail.appendChild(el('p', 'blk-note', b.note));
        blk.appendChild(tail);
        indexEl.appendChild(blk);
        return;
      }

      if (b.kind === 'video') {
        /* 块 1：转轮。六条按播放降序，第一条是块里的峰值 */
        blk.appendChild(buildHead(b));
        blk.appendChild(buildViewer(b, [b.lead].concat(b.items), 'ring'));
        indexEl.appendChild(blk);
        return;
      }

      if (b.kind === 'poster') {
        /* 块 2：翻书。7 张竖版海报，一次只见一页 */
        blk.appendChild(buildHead(b, true));
        blk.appendChild(buildViewer(b, b.items, 'book'));
        var inCell = el('div', 'blk-meta--incell');
        inCell.appendChild(buildMeta([['目标', b.goal], ['我负责的', b.role], ['怎么实现的', b.how]]));
        if (b.note) inCell.appendChild(el('p', 'blk-note', b.note));
        blk.appendChild(inCell);
        indexEl.appendChild(blk);
        return;
      }
    });
  }

  /* ------------------------------------------------------------ 2 首屏 */
  var boxes = [];                                  // 四个真实数字的引用，用于只播一次的计数
  function renderHero() {
    // 主张句取代岗位名（岗位名退到次级行）
    document.getElementById('hero-claim').textContent = S.identity.claim;
    document.getElementById('hero-role-sub').textContent = S.identity.subline;

    // PEAK=hero 时 1.6M 从证据条里拿出来，单独升为首屏的巨数；其余三个（或四个）留在条里
    var peakProof = null, rest = [];
    S.proof.forEach(function (p) { if (p.peak) peakProof = p; else rest.push(p); });
    if (PEAK === 'works') rest = S.proof;

    var box = document.getElementById('hero-proof');
    rest.forEach(function (p) {
      var b = el('b', null, fmtProof(p, p.value));
      boxes.push({ el: b, to: p.value, fmt: function (v) { return fmtProof(p, v); } });
      var span = el('span');
      span.appendChild(b);
      span.appendChild(document.createTextNode(' ' + p.label));
      box.appendChild(span);
    });
    // 每个数字各自的出处与日期（content.js 的 source），挂在 title 上，不另起一行文字
    box.title = rest.map(function (p) { return p.label + '：' + p.source; }).join('\n');

    if (PEAK === 'hero' && peakProof) {
      var line = document.getElementById('hero-peak');
      var big = el('b', null, fmtProof(peakProof, peakProof.value));
      line.appendChild(big);
      line.appendChild(el('span', null, peakProof.label));
      line.hidden = false;
      line.title = peakProof.label + '：' + peakProof.source;
      boxes.push({ el: big, to: peakProof.value, fmt: function (v) { return fmtProof(peakProof, v); } });
    }
  }
  function fmtProof(p, v) {
    return (p.dec ? v.toFixed(p.dec) : num(Math.round(v))) + p.suffix;
  }

  /* ------------------------------------------------------------ 3 作品索引 */
  var indexEl = document.getElementById('index');
  var cards = [];
  var byId = {};

  function buildCard(item, i) {
    var card = el('article', 'card');
    card.id = item.dom;
    card.setAttribute('data-rv', '');
    card.style.setProperty('--i', String(i % 3));
    byId[item.id] = card;

    /* 媒体区：单张封面，或多帧静帧整条铺开 */
    var media = el('div', 'card-media');
    if (item.thumbs && item.thumbs.length) {
      // 多帧静帧：整条并排铺开，让“这是一组画面”直接看得出来（原来只能展开后看到）
      media.classList.add('card-media--strip');
      [item.media].concat(item.thumbs.map(function (t) { return t.src; })).forEach(function (src) {
        var im = el('img');
        im.src = asset(src); im.alt = item.title + ' 静帧';
        im.loading = 'lazy'; im.decoding = 'async';
        media.appendChild(im);
      });
    } else {
      var im = el('img');
      im.src = asset(item.media);
      im.alt = item.alt || '';
      im.loading = 'lazy';
      im.decoding = 'async';
      if (item.pos) im.style.objectPosition = item.pos;
      media.appendChild(im);
    }
    card.appendChild(media);

    /* 标题区：标题 → 我做了什么 → 数字 */
    var body = el('div', 'card-body');
    body.appendChild(el('h4', 'card-title', item.title));
    // 卡面一行“我做了什么”：把原本只能展开后看到的角色说明提到正面，
    // 这是这一版最重要的信息层级调整——默认态不再只有标题和播放量
    if (item.face) body.appendChild(el('p', 'card-face', item.face));
    body.appendChild(stats(el('p', 'card-meta'), item.meta));
    card.appendChild(body);

    /* 点击层：整张卡可点，语义在按钮上 */
    var btn = el('button', 'card-open');
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'd-' + item.id);
    btn.setAttribute('aria-label', '展开详情：' + item.title);
    btn.addEventListener('click', function () { openWork(card); });
    card.appendChild(btn);

    /* 详情：同一张卡里，展开时移到右栏 */
    card.appendChild(buildDetail(item));
    return card;
  }

  function buildDetail(item) {
    var box = el('div', 'card-detail');
    box.id = 'd-' + item.id;
    box.tabIndex = -1;

    var top = el('p', 'detail-top');
    top.appendChild(el('span', null, item.cat));
    top.appendChild(stats(el('span'), item.stats));
    var close = el('button', 'detail-close', '收起');
    close.type = 'button';
    close.addEventListener('click', function () { closeWork(true); });
    top.appendChild(close);
    box.appendChild(top);

    box.appendChild(el('p', 'detail-text', item.body));
    if (item.role) box.appendChild(el('p', 'detail-text', '我的角色：' + item.role));

    if (item.steps) {
      var ul = el('ul', 'detail-steps');
      item.steps.forEach(function (s) {
        var li = el('li');
        li.appendChild(el('b', null, s.name));
        li.appendChild(document.createTextNode(s.text));
        ul.appendChild(li);
      });
      box.appendChild(ul);
    }
    if (item.thumbs && item.thumbs.length) {
      var th = el('div', 'detail-thumbs');
      item.thumbs.forEach(function (t) {
        var im = el('img');
        im.src = asset(t.src); im.alt = t.alt || '';
        im.loading = 'lazy'; im.decoding = 'async';
        th.appendChild(im);
      });
      box.appendChild(th);
    }
    if (item.note) box.appendChild(el('p', 'detail-note', item.note));
    if (item.url) {
      var links = el('p', 'detail-links');
      var a = el('a', 'link', item.urlText);
      a.href = item.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      links.appendChild(a);
      box.appendChild(links);
    }
    return box;
  }

  function renderWorksLegacy() { /* 已被上面的分块版式取代 */ }

  /* ------------------------------------------------- 4 卡片展开：手写 FLIP */
  var openCard = null, flipTimer = 0, showTimer = 0, focusTimer = 0;

  function btnOf(card) { return card.querySelector('.card-open'); }

  function flip(mutate, dur) {
    if (INSTANT) { mutate(); return; }              // 减弱动效时不位移
    dur = dur || 700;
    var before = cards.map(function (c) { return c.getBoundingClientRect(); });
    mutate();
    var moved = [];
    cards.forEach(function (c, i) {
      var a = before[i], b = c.getBoundingClientRect();
      var dx = a.left - b.left, dy = a.top - b.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
      c.style.transition = 'none';
      c.style.transform = 'translate(' + dx.toFixed(2) + 'px,' + dy.toFixed(2) + 'px)';
      moved.push(c);
    });
    if (!moved.length) return;
    void indexEl.offsetHeight;                       // 强制回流，保证起始态已被应用
    moved.forEach(function (c) {
      c.style.transition = 'transform ' + dur + 'ms var(--ease-expo)';
      c.style.transform = '';
    });
    clearTimeout(flipTimer);
    flipTimer = setTimeout(function () {
      moved.forEach(function (c) { c.style.transition = ''; c.style.transform = ''; });
    }, dur + 90);
  }

  function openWork(card) {
    if (card === openCard) { closeWork(true); return; }
    var prev = openCard;
    openCard = card;
    alignTop(card);
    flip(function () {
      if (prev) {
        prev.classList.remove('is-open', 'is-shown');
        btnOf(prev).setAttribute('aria-expanded', 'false');
      }
      card.classList.add('is-open');
      btnOf(card).setAttribute('aria-expanded', 'true');
    });
    settle(card);
  }

  // 详情从卡片顶部开始展开：卡片被滚过头时必须先拉回顶端，否则用户点完什么都看不见
  function alignTop(card) {
    var top = card.getBoundingClientRect().top;
    var limit = 84;                                  // 顶栏 64 + 呼吸
    if (top < limit) window.scrollTo(0, Math.max(0, window.scrollY + top - limit));
  }

  // 第二级：详情自上而下揭开
  function settle(card) {
    clearTimeout(showTimer); clearTimeout(focusTimer);
    if (INSTANT) { card.classList.add('is-shown'); focusDetail(card); return; }
    showTimer = setTimeout(function () {
      if (openCard === card) card.classList.add('is-shown');
    }, 240);
    focusTimer = setTimeout(function () { focusDetail(card); }, 300);
  }

  // 展开后焦点进入详情区：Tab 能直接走到链接，Esc 随时可关
  function focusDetail(card) {
    if (openCard !== card) return;
    var d = card.querySelector('.card-detail');
    if (d) d.focus({ preventScroll: true });
  }

  function closeWork(focusBack) {
    var card = openCard;
    if (!card) return;
    openCard = null;
    clearTimeout(showTimer); clearTimeout(focusTimer);
    var btn = btnOf(card);
    btn.setAttribute('aria-expanded', 'false');
    card.classList.remove('is-shown');               // clip 先收回
    var collapse = function () {
      flip(function () { card.classList.remove('is-open'); }, 560);
      if (focusBack) {
        btn.focus({ preventScroll: true });
        setTimeout(function () {                       // 收起后卡片可能落到视口外
          var r = btn.getBoundingClientRect();
          var vh = window.innerHeight || 0;
          if (r.top < 80 || r.bottom > vh - 40) {
            btn.scrollIntoView({ block: 'center', behavior: INSTANT ? 'auto' : 'smooth' });
          }
        }, INSTANT ? 0 : 320);
      }
    };
    if (INSTANT) collapse(); else setTimeout(collapse, 200);
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openCard) { e.preventDefault(); closeWork(true); }
  });

  /* ------------------------------------------------------- 5 能力 / 经历 / 项目 */
  function renderCaps() {
    var caps = [
      { i: 0, href: '#' + B_VIDEO, stat: '短视频 ' + S.tiktok.works.length + ' 条 · Instagram ' + S.instagram.works.length + ' 件' },
      { i: 1, href: '#' + B_FLOW, stat: '日韩上线教学 ' + S.localization.count.value + ' 条' },
      { i: 2, href: '#' + B_TEXT, stat: '虎扑长文 ' + S.hupu.articles.length + ' 篇 · 单篇最高 ' + num(S.hupu.articles[0].views) + ' 阅读' },
      { i: 3, href: '#practice', stat: S.practice.rally.story[2].metric.value + ' 玩家 · 个人项目' }
    ];
    var box = document.getElementById('caps');
    caps.forEach(function (c, n) {
      var a = el('a', 'cap');
      a.href = c.href;
      a.setAttribute('data-rv', '');
      a.style.setProperty('--i', String(n % 3));
      var name = el('span', 'cap-name');
      name.appendChild(el('span', 'link', S.capabilities[c.i].name));
      a.appendChild(name);
      a.appendChild(el('span', 'cap-stat', c.stat));
      a.appendChild(el('span', 'cap-note', S.capabilities[c.i].summary));
      box.appendChild(a);
    });
  }

  function renderExps() {
    var box = document.getElementById('exps');
    S.experience.forEach(function (e, i) {
      var row = el('div', 'exp' + (i === 0 ? ' exp--now' : ''));
      row.setAttribute('data-rv', '');
      row.style.setProperty('--i', String(i % 3));
      row.appendChild(el('p', 'exp-when', e.period));
      var main = el('div');
      var co = el('h3', 'exp-co');
      co.appendChild(document.createTextNode(e.company));
      co.appendChild(el('span', 'exp-role', e.role));
      main.appendChild(co);
      var pts = el('p', 'exp-points');
      e.points.forEach(function (p) { pts.appendChild(el('span', null, p)); });
      main.appendChild(pts);
      row.appendChild(main);
      box.appendChild(row);
    });

    var edu = document.getElementById('edus');
    S.education.forEach(function (e, i) {
      var row = el('div', 'exp');
      row.setAttribute('data-rv', '');
      row.style.setProperty('--i', String(i % 3));
      row.appendChild(el('p', 'exp-when', e.period));
      var main = el('div');
      var co = el('h3', 'exp-co');
      co.appendChild(document.createTextNode(e.school));
      co.appendChild(el('span', 'exp-role', e.major));
      main.appendChild(co);
      row.appendChild(main);
      edu.appendChild(row);
    });
  }

  function renderPractice() {
    var r = S.practice.rally, d = S.practice.douyin;
    var box = document.getElementById('practice-body');

    var fig = el('figure', 'pr-fig');
    var im = el('img');
    im.src = asset(r.visual.src); im.alt = r.visual.alt;
    im.loading = 'lazy'; im.decoding = 'async';
    fig.appendChild(im);
    fig.appendChild(el('figcaption', 'pr-cap', r.visual.caption));
    box.appendChild(fig);

    var right = el('div');
    right.appendChild(el('h3', 'pr-h', r.heading));
    right.appendChild(el('p', 'pr-text', r.intro));
    right.appendChild(el('p', 'pr-text', r.story[0].text));

    var stat = el('p', 'pr-stat');
    stat.appendChild(document.createTextNode(r.story[2].text + ' '));
    stat.appendChild(el('b', null, r.story[2].metric.value + ' ' + r.story[2].metric.label));
    stat.appendChild(document.createTextNode(' · ' + r.story[2].source));
    right.appendChild(stat);

    var links = el('p', 'pr-links');
    [[r.play, '直接玩一局'], [r.code, '看源码']].forEach(function (x) {
      var a = el('a', 'link', x[1]);
      a.href = x[0]; a.target = '_blank'; a.rel = 'noopener noreferrer';
      links.appendChild(a);
    });
    right.appendChild(links);

    var other = el('p', 'pr-else');
    other.appendChild(document.createTextNode('另一个我：' + d.desc + ' '));
    var da = el('a', 'link', d.name);
    da.href = d.url; da.target = '_blank'; da.rel = 'noopener noreferrer';
    other.appendChild(da);
    right.appendChild(other);

    box.appendChild(right);
  }

  function renderSectionLeads() {
    [['lead-works', 'works'], ['lead-capability', 'capability'],
     ['lead-experience', 'experience'], ['lead-practice', 'practice']].forEach(function (m) {
      var node = document.getElementById(m[0]);
      if (node) node.textContent = S.sections[m[1]] || '';
    });
  }

  function renderContact() {
    var C = S.contact;
    document.getElementById('contact-lead').textContent = C.lead;
    var mail = document.getElementById('contact-mail');
    mail.href = 'mailto:' + C.email;
    mail.textContent = C.email;
    document.getElementById('contact-h').setAttribute('aria-label', '邮箱 ' + C.email);

    var ul = document.getElementById('contact-meta');
    function item(k, v, href, extra) {
      var li = el('li');
      li.appendChild(document.createTextNode(k));
      if (href) {
        var a = el('a', 'link', v);
        a.href = href;
        if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
        li.appendChild(a);
      } else {
        li.appendChild(el('span', null, v));
      }
      if (extra) li.appendChild(el('span', null, extra));
      ul.appendChild(li);
    }
    item('电话', C.phoneDisplay, 'tel:' + C.phone);
    item('GitHub', C.github, C.githubUrl);
    item('简历', C.resume.name.replace(/^周性运_/, '').replace(/\.pdf$/, ''), asset(C.resume.src), '· ' + C.resume.note);

    // 口径：日期全部来自 content.js 的 source / note 字段，不另写
    document.getElementById('contact-note').textContent =
      '数据口径 · ' + S.hupu.note.replace(/^阅读与回复数据 · /, '虎扑 ') + ' · ' + S.tiktok.note.replace(/^作品公开累计数据 · /, 'TikTok ');

    // 简历链接（顶栏 + 出现两处即可，不再增加）
    [].forEach.call(document.querySelectorAll('[data-cv]'), function (a) {
      a.href = asset(C.resume.src);
      a.setAttribute('download', C.resume.name);
    });
  }

  /* ------------------------------------------------------------ 6 入场与计数 */
  var rvIO = null;
  function observeReveals() {
    var targets = [].slice.call(document.querySelectorAll('[data-rv]'));
    // flat=1 直接给终态；减弱动效时仍走观察器（CSS 只保留不透明度）
    if (FLAT) { targets.forEach(function (t) { t.classList.add('in'); }); return; }
    if (!('IntersectionObserver' in window)) { targets.forEach(function (t) { t.classList.add('in'); }); return; }
    rvIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        rvIO.unobserve(e.target);                    // 只播一次
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
    targets.forEach(function (t) { rvIO.observe(t); });
  }

  function countTo(rec) {
    var to = rec.to, fmt = rec.fmt, dur = 800, t0 = 0;
    var guard = setTimeout(function () { rec.el.textContent = fmt(to); }, dur + 300);
    function step(now) {
      if (!t0) t0 = now;
      var p = Math.min(1, (now - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      rec.el.textContent = fmt(to * e);
      if (p < 1) requestAnimationFrame(step);
      else { clearTimeout(guard); rec.el.textContent = fmt(to); }
    }
    requestAnimationFrame(step);
  }

  /* ------------------------------------------------------------ 7 顶栏与滚动 */
  function initBar() {
    var bar = document.getElementById('bar');
    var links = [].slice.call(bar.querySelectorAll('[data-nav]'));
    var secs = { works: 'works', experience: 'experience', contact: 'contact' };
    var order = ['works', 'experience', 'contact'];
    var on = null, current = null, ticking = false;

    function sync() {
      var y = window.scrollY || window.pageYOffset || 0;
      var show = y > (window.innerHeight || 800) * 0.62;
      if (show !== on) { on = show; bar.classList.toggle('is-on', show); }

      var mid = y + (window.innerHeight || 800) * 0.4, found = '';
      order.forEach(function (id) {
        var s = document.getElementById(secs[id]);
        if (s && s.offsetTop <= mid) found = id;
      });
      if (found !== current) {
        current = found;
        links.forEach(function (a) {
          if (a.getAttribute('data-nav') === found) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      }
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; sync(); });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    sync();
  }

  /* ------------------------------------------------------------ 8 启动 */
  function init() {
    renderHero();
    renderWorks();
    renderCaps();
    renderExps();
    renderPractice();
    renderSectionLeads();
    document.addEventListener('keydown', viewerKeys);
    renderContact();
    observeReveals();
    initBar();

    var figure = window.createFigure(document.getElementById('figure'), {
      static: INSTANT,
      prefix: '../'
    });
    window.__figure = figure;                       // 自检钩子：读转角、看是否静止

    function boot() {
      document.body.classList.add('loaded');
      if (figure) figure.begin();
      if (!INSTANT) setTimeout(function () { boxes.forEach(countTo); }, 900);
    }
    // flat=1 之外都先等一帧，保证初始态已被渲染，入场过渡才会真的播放
    if (FLAT) boot();
    else requestAnimationFrame(function () { requestAnimationFrame(boot); });
  }

  /* 自检钩子：只读 + 少量可控操作，供无头浏览器截图脚本使用 */
  window.__page = {
    open: function (id) { var c = byId[id]; if (c) openWork(c); },
    close: function () { closeWork(true); },
    finish: function () { boxes.forEach(function (b) { b.el.textContent = b.fmt(b.to); }); },
    revealAll: function () { [].forEach.call(document.querySelectorAll('[data-rv]'), function (t) { t.classList.add('in'); }); },
    get state() {
      return {
        open: openCard ? openCard.id : null,
        count: cards.length, flat: FLAT, reduce: REDUCE,
        proof: boxes.map(function (b) { return b.el.textContent; }),
        cards: cards.map(function (c) {
          var r = c.getBoundingClientRect();
          return { id: c.id, x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) };
        })
      };
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
