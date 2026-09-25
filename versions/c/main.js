/* ============================================================
   方向 C · 证据仪表盘 —— 渲染与交互
   数据全部来自 ../shared/content.js 的 window.SITE：
   本文件不写死任何数字，所有数值都从 SITE 读取或用它的字段现算。
   图表为手写 SVG（无第三方图表库）。
   ============================================================ */
(function () {
  'use strict';

  var S = window.SITE;
  if (!S) return;
  var asset = window.asset || function (p) { return p; };
  var SVGNS = 'http://www.w3.org/2000/svg';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function int(n) { return Number(n).toLocaleString('en-US'); }
  function round1(v) { return (Math.round(v * 10) / 10).toFixed(1).replace(/\.0$/, ''); }
  function short(n) { return n >= 1e6 ? round1(n / 1e6) + 'M' : (n >= 1e3 ? round1(n / 1e3) + 'K' : String(n)); }
  function svgEl(tag, attrs, text) {
    var e = document.createElementNS(SVGNS, tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }

  /* ────────────────────────────────────────────
     现算的派生数字：页面文案里出现的每个数都从这里来
     ──────────────────────────────────────────── */
  var works = S.tiktok.works.slice().sort(function (a, b) { return a.views - b.views; });   // 图表与表格共用升序
  var byId = {};
  works.forEach(function (w) { byId[w.id] = w; });
  var leadWork = byId[S.tiktok.lead] || works[works.length - 1];
  var avgRate = works.reduce(function (s, w) { return s + w.rate; }, 0) / works.length;     // 六条互动率均值
  var topRate = works.reduce(function (a, b) { return b.rate > a.rate ? b : a; });
  var lowRate = works.reduce(function (a, b) { return b.rate < a.rate ? b : a; });
  var lowViews = works[0], highViews = works[works.length - 1];
  var tiktokById = function (id) { return byId[id]; };
  var hupu = S.hupu.articles;
  var hupuBase = Math.max.apply(null, hupu.map(function (a) { return a.views; }));
  var instaWithMetrics = S.instagram.works.filter(function (w) { return w.metrics && w.metrics.length; });
  var numOf = function (v) { return parseInt(String(v).replace(/[^\d]/g, ''), 10); };
  var instaTop = instaWithMetrics.reduce(function (a, b) { return numOf(b.metrics[0].value) > numOf(a.metrics[0].value) ? b : a; });

  var NUM = {
    'works-count': function () { return String(works.length); },
    'hupu-count': function () { return String(hupu.length); },
    'avg-rate': function () { return avgRate.toFixed(1) + '%'; },
    'low-rate': function () { return lowRate.rate.toFixed(1) + '%'; },
    'low-rate-id': function () { return lowRate.id; },
    'tt6-id': function () { return tiktokById('TT6').id; },
    'tt2-id': function () { return tiktokById('TT2').id; },
    'tt4-id': function () { return tiktokById('TT4').id; },
    'top-rate-id': function () { return topRate.id; },
    'top-rate-views': function () { return short(topRate.views); },
    'top-rate': function () { return topRate.rate.toFixed(1) + '%'; },
    'views-spread': function () { return Math.round(highViews.views / lowViews.views) + ' 倍'; },
    'rate-spread': function () { return (topRate.rate / lowRate.rate).toFixed(1) + ' 倍'; },
    'tt6-tt2-views': function () { return (tiktokById('TT6').views / tiktokById('TT2').views).toFixed(1) + ' 倍'; },
    'tt6-views': function () { return short(tiktokById('TT6').views); },
    'tt2-views': function () { return short(tiktokById('TT2').views); },
    'tt2-rate': function () { return tiktokById('TT2').rate.toFixed(1) + '%'; },
    'tt6-rate': function () { return tiktokById('TT6').rate.toFixed(1) + '%'; },
    'tt4-rate': function () { return tiktokById('TT4').rate.toFixed(1) + '%'; },
    'hupu-views-first': function () { return int(hupu[0].views); },
    'hupu-views-ratio': function () { return Math.round(hupu[1].views / hupu[0].views * 100) + '%'; },
    'hupu-replies-ratio': function () { return Math.round(hupu[1].replies / hupu[0].replies * 100) + '%'; },
    'insta-count': function () { return String(S.instagram.works.length); },
    'insta-metrics-count': function () { return String(instaWithMetrics.length); },
    'local-count': function () { return S.localization.count.value; },
  };

  /* ────────────────────────────────────────────
     01 首屏账本：SITE.proof 的四个数字
     ──────────────────────────────────────────── */
  var ledger = $('#ledger');
  if (ledger) {
    S.proof.forEach(function (p) {
      var li = document.createElement('li');
      li.setAttribute('data-reveal', 'up');
      li.innerHTML =
        '<span class="v" data-count="' + p.value + '" data-dec="' + p.dec + '"' +
        ' data-suffix="' + esc(p.suffix) + '">0</span>' +
        '<span class="l">' + esc(p.label) + '</span>' +
        '<span class="s">' + esc(p.source) + '</span>';
      ledger.appendChild(li);
    });
  }

  /* ────────────────────────────────────────────
     02 峰值：六条作品的「播放量 × 互动率」散点图
     ──────────────────────────────────────────── */
  var plot = $('.plot');
  var chart = $('#chart');
  var detail = $('#detail');
  var pointNodes = [];
  var rowNodes = [];

  if (plot && chart) {
    var VB_W = 1080, VB_H = 430;
    var M = { t: 34, r: 40, b: 76, l: 78 };
    var iw = VB_W - M.l - M.r;
    var ih = VB_H - M.t - M.b;
    var xMin = Math.log10(3000), xMax = Math.log10(3000000);   // 3K → 3M，三个十倍
    var yMax = 7.5;
    var X = function (v) { return M.l + (Math.log10(v) - xMin) / (xMax - xMin) * iw; };
    var Y = function (v) { return M.t + ih - (v / yMax) * ih; };

    var svg = svgEl('svg', {
      viewBox: '0 0 ' + VB_W + ' ' + VB_H,
      role: 'img',
      'aria-label': '六条 TikTok 作品的播放量与互动率散点图：横轴为播放量对数刻度，纵轴为互动率。' +
        '互动率最高的是 ' + topRate.id + '（' + topRate.rate.toFixed(1) + '%），最低的是 ' + lowRate.id +
        '（' + lowRate.rate.toFixed(1) + '%），六条均值 ' + avgRate.toFixed(1) + '%。完整数值见下方数据表。',
    });

    /* 网格、刻度、轴标题 */
    var grid = svgEl('g', { class: 'g-grid' });
    for (var v = 0; v <= 7; v++) {
      grid.appendChild(svgEl('line', { x1: M.l, x2: M.l + iw, y1: Y(v), y2: Y(v) }));
      grid.appendChild(svgEl('text', { class: 'tick', x: M.l - 12, y: Y(v) + 4, 'text-anchor': 'end' }, v + '%'));
    }
    [5000, 10000, 50000, 100000, 500000, 1000000, 3000000].forEach(function (t) {
      var tx = X(t);
      grid.appendChild(svgEl('line', { x1: tx, x2: tx, y1: M.t, y2: M.t + ih }));
      grid.appendChild(svgEl('text', {
        class: 'tick', x: tx, y: M.t + ih + 22,
        'text-anchor': Math.abs(tx - (M.l + iw)) < 2 ? 'end' : 'middle',
      }, short(t)));
    });
    grid.appendChild(svgEl('line', { class: 'spine', x1: M.l, x2: M.l + iw, y1: M.t + ih, y2: M.t + ih }));
    grid.appendChild(svgEl('line', { class: 'spine', x1: M.l, x2: M.l, y1: M.t, y2: M.t + ih }));
    svg.appendChild(grid);

    svg.appendChild(svgEl('text', { class: 'axis-title', x: 0, y: M.t - 16 }, '互动率（点赞 ÷ 播放）'));
    svg.appendChild(svgEl('text', { class: 'axis-title', x: M.l, y: VB_H - 10 }, '播放量（对数刻度 · 相邻两格相差 10 倍）'));

    /* 平均互动率参考线 */
    svg.appendChild(svgEl('line', { class: 'avg-line', x1: M.l, x2: M.l + iw, y1: Y(avgRate), y2: Y(avgRate) }));
    svg.appendChild(svgEl('text', {
      class: 'avg-label', x: M.l + iw, y: Y(avgRate) - 10, 'text-anchor': 'end',
    }, '六条均值 ' + avgRate.toFixed(1) + '%'));

    /* 数据点：每个点都可 Tab 聚焦、可 Enter 选中 */
    var pts = svgEl('g', { class: 'pts' });
    works.forEach(function (w, i) {
      var cx = X(w.views), cy = Y(w.rate);
      var isHero = w.id === S.tiktok.lead;
      var r = isHero ? 12 : 9;
      var right = cx < M.l + iw - 150;
      var g = svgEl('g', {
        class: 'pt' + (isHero ? ' is-hero' : ''),
        tabindex: '0',
        role: 'button',
        'aria-pressed': 'false',
        'aria-label': '选择作品 ' + w.id + ' ' + w.title + '，题材 ' + w.cat +
          '，播放 ' + int(w.views) + '，点赞 ' + int(w.likes) +
          '，互动率 ' + w.rate.toFixed(1) + '%（六条均值 ' + avgRate.toFixed(1) + '%）',
      });
      g.dataset.id = w.id;
      g.style.setProperty('--d', (i * 70) + 'ms');            // 逐个推入的错峰延迟
      g.appendChild(svgEl('circle', { class: 'pt-ring', cx: cx, cy: cy, r: r + 7 }));
      g.appendChild(svgEl('circle', { class: 'pt-hit', cx: cx, cy: cy, r: 26 }));
      g.appendChild(svgEl('circle', { class: 'pt-dot', cx: cx, cy: cy, r: r }));
      g.appendChild(svgEl('text', {
        class: 'pt-label', x: right ? cx + r + 9 : cx - r - 9, y: cy + 4,
        'text-anchor': right ? 'start' : 'end',
      }, w.id + ' ' + w.rate.toFixed(1) + '%'));
      pts.appendChild(g);
      pointNodes.push({ g: g, w: w });
    });
    svg.appendChild(pts);
    chart.appendChild(svg);

    /* 窄屏时图表会在卡片内横向滚动：
       滚动区域要能用键盘进入，所以在确实可滚动时才给它 tabindex。 */
    function syncChartScroll() {
      if (chart.scrollWidth > chart.clientWidth + 4) {
        chart.setAttribute('tabindex', '0');
        chart.setAttribute('role', 'group');
        chart.setAttribute('aria-label', '可横向滚动的图表区域：播放量与互动率散点图');
      } else {
        chart.removeAttribute('tabindex');
        chart.removeAttribute('role');
        chart.removeAttribute('aria-label');
      }
    }
    syncChartScroll();
    addEventListener('resize', syncChartScroll, { passive: true });

    /* 详情面板：结构建一次，之后只换内容（默认就是 SITE.tiktok.lead，不留空态） */
    detail.innerHTML =
      '<img id="dt-img" src="" alt="" width="112" height="199" decoding="async">' +
      '<div aria-live="polite">' +
        '<h3 id="dt-title"></h3>' +
        '<p class="cat" id="dt-cat"></p>' +
        '<dl>' +
          '<div><dt>播放量</dt><dd class="mono" id="dt-views"></dd></div>' +
          '<div><dt>点赞量</dt><dd class="mono" id="dt-likes"></dd></div>' +
          '<div><dt>互动率</dt><dd class="mono" id="dt-rate"></dd></div>' +
        '</dl>' +
        '<p class="delta mono" id="dt-delta"></p>' +
        '<p class="why" id="dt-why"></p>' +
        '<p class="go"><a id="dt-link" href="#" target="_blank" rel="noopener noreferrer">查看原视频 ↗</a></p>' +
      '</div>';

    /* 图旁的真实数据表：屏幕阅读器可读，也能反向选中图上的点 */
    var tableWrap = $('#table');
    if (tableWrap) {
      var rows = works.map(function (w) {
        return '<tr data-id="' + w.id + '">' +
          '<td><button type="button" class="pick" data-pick="' + w.id + '" aria-pressed="false"' +
          ' aria-label="在图上选中 ' + esc(w.title) + '">' + w.id + '</button></td>' +
          '<th scope="row">' + esc(w.title) + '</th>' +
          '<td>' + esc(w.cat) + '</td>' +
          '<td class="n">' + int(w.views) + '</td>' +
          '<td class="n">' + int(w.likes) + '</td>' +
          '<td class="n">' + w.rate.toFixed(1) + '%</td>' +
        '</tr>';
      }).join('');
      tableWrap.innerHTML =
        '<div class="table-scroll"><table>' +
        '<caption>' + S.tiktok.note + ' 按播放量升序；第一列可在图上选中这条作品。</caption>' +
        '<thead><tr><th scope="col">编号</th><th scope="col">作品</th><th scope="col">题材</th>' +
        '<th scope="col" class="n">播放量</th><th scope="col" class="n">点赞量</th>' +
        '<th scope="col" class="n">互动率</th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table></div>';
      rowNodes = $$('tbody tr', tableWrap);
    }

    var dtImg = $('#dt-img'), dtTitle = $('#dt-title'), dtCat = $('#dt-cat');
    var dtViews = $('#dt-views'), dtLikes = $('#dt-likes'), dtRate = $('#dt-rate');
    var dtDelta = $('#dt-delta'), dtWhy = $('#dt-why'), dtLink = $('#dt-link');
    var pinned = leadWork.id;
    var current = '';

    function show(id) {
      var w = byId[id];
      if (!w || id === current) return;
      current = id;
      dtImg.src = asset(w.src);
      dtImg.alt = w.title + ' 视频静帧';
      dtTitle.textContent = w.title;
      dtCat.textContent = w.id + ' · ' + w.cat;
      dtViews.textContent = int(w.views);
      dtLikes.textContent = int(w.likes);
      dtRate.textContent = w.rate.toFixed(1) + '%';
      var d = w.rate - avgRate;
      dtDelta.textContent = (d >= 0 ? '高于' : '低于') + '六条均值 ' + Math.abs(d).toFixed(1) + ' 个百分点';
      dtWhy.textContent = w.why;
      dtLink.href = w.url;
      dtLink.setAttribute('aria-label', '打开原视频：' + w.title);
      pointNodes.forEach(function (p) {
        var on = p.w.id === id;
        p.g.classList.toggle('is-on', on);
        p.g.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      rowNodes.forEach(function (tr) { tr.classList.toggle('is-on', tr.dataset.id === id); });
      $$('[data-pick]', tableWrap || document).forEach(function (b) {
        b.setAttribute('aria-pressed', b.dataset.pick === id ? 'true' : 'false');
      });
    }

    function dim(on) { plot.classList.toggle('is-dimmed', on); }

    show(pinned);

    pointNodes.forEach(function (p, i) {
      p.g.addEventListener('mouseenter', function () { show(p.w.id); dim(true); });
      p.g.addEventListener('mouseleave', function () { dim(false); show(pinned); });
      p.g.addEventListener('focus', function () { show(p.w.id); dim(true); });
      p.g.addEventListener('blur', function () { dim(false); show(pinned); });
      p.g.addEventListener('click', function () { pinned = p.w.id; show(p.w.id); });
      p.g.addEventListener('keydown', function (ev) {
        var k = ev.key;
        if (k === 'Enter' || k === ' ' || k === 'Spacebar') {
          ev.preventDefault();
          pinned = p.w.id; show(p.w.id);
        } else if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowUp') {
          ev.preventDefault();
          var n = (k === 'ArrowRight' || k === 'ArrowDown') ? (i + 1) % pointNodes.length
            : (i - 1 + pointNodes.length) % pointNodes.length;
          pointNodes[n].g.focus();
        } else if (k === 'Home') { ev.preventDefault(); pointNodes[0].g.focus(); }
        else if (k === 'End') { ev.preventDefault(); pointNodes[pointNodes.length - 1].g.focus(); }
      });
    });

    /* 表格里的按钮反向选中图上的点（键盘回车触发时把焦点也带过去） */
    $$('[data-pick]', tableWrap || document).forEach(function (b) {
      b.addEventListener('click', function (ev) {
        var id = b.dataset.pick;
        pinned = id; show(id);
        if (ev.detail === 0) {
          var node = pointNodes.filter(function (p) { return p.w.id === id; })[0];
          if (node) node.g.focus();
        }
      });
    });
  }

  /* ────────────────────────────────────────────
     04 工作方法：SITE.tiktok.duties 五步
     ──────────────────────────────────────────── */
  var flow = $('#flow');
  if (flow) {
    S.tiktok.duties.forEach(function (d, i) {
      var li = document.createElement('li');
      li.className = 'flow-step' + (i === S.tiktok.duties.length - 1 ? ' is-last' : '');
      li.style.transitionDelay = (i * 80) + 'ms';   // 流程不参与 hover 联动，过渡延迟无副作用
      li.innerHTML = '<i class="node" aria-hidden="true"></i>' +
        '<p class="n">' + esc(d.n) + '</p>' +
        '<h3>' + esc(d.name) + '</h3>' +
        '<p>' + esc(d.text) + '</p>';
      flow.appendChild(li);
    });
  }

  /* ────────────────────────────────────────────
     05 其他证据：虎扑两篇（条宽按真实比例）+ 日韩 + Instagram
     ──────────────────────────────────────────── */
  var bars = $('#bars');
  if (bars) {
    hupu.forEach(function (a) {
      var row = document.createElement('div');
      row.className = 'bar-row';
      row.innerHTML =
        '<p class="bar-title">' + esc(a.title) + '<small>' + a.n + ' · ' + esc(a.cat) + ' · bbs.hupu.com</small></p>' +
        '<p class="bar-num">' + int(a.views) + '<span>阅读量</span></p>' +
        '<p class="bar-num">' + int(a.replies) + '<span>回复量</span></p>' +
        '<div class="bar-track" aria-hidden="true"><span class="bar-fill" style="width:' +
        (a.views / hupuBase * 100).toFixed(2) + '%"></span></div>';
      bars.appendChild(row);
    });
  }

  var localSteps = $('#local-steps');
  if (localSteps) {
    S.localization.steps.forEach(function (s) {
      var li = document.createElement('li');
      li.innerHTML = '<span class="n">' + esc(s.n) + '</span><div><h4>' + esc(s.name) + '</h4><p>' + esc(s.text) + '</p></div>';
      localSteps.appendChild(li);
    });
  }

  var instaList = $('#insta-list');
  if (instaList) {
    S.instagram.works.forEach(function (w) {
      var likes = w.metrics && w.metrics[0] ? w.metrics[0].value : null;
      var comments = w.metrics && w.metrics[1] ? w.metrics[1].value : null;
      var row = document.createElement('div');
      row.className = 'insta-row';
      row.innerHTML =
        '<img src="' + asset(w.images[0].src) + '" alt="" width="52" height="52" loading="lazy">' +
        '<p class="t">' + esc(w.title) + '<small>' + esc(w.cat) + '</small></p>' +
        (likes ? '<p class="m">' + esc(likes) + '<i>点赞</i></p>' : '<p class="m none">未留存<i>点赞</i></p>') +
        (comments ? '<p class="m">' + esc(comments) + '<i>评论</i></p>' : '<p class="m none">未留存<i>评论</i></p>');
      instaList.appendChild(row);
    });
  }

  var instaTopFig = $('#insta-top');
  if (instaTopFig && instaTop) {
    instaTopFig.innerHTML =
      '<img src="' + asset(instaTop.images[0].src) + '" alt="' + esc(instaTop.images[0].alt) +
      '" width="780" height="980" loading="lazy">' +
      '<figcaption>' + esc(instaTop.title) + ' · ' + esc(instaTop.cat) +
      '<br>在留有公开点赞数的 ' + instaWithMetrics.length + ' 件里，这一件最高（' +
      esc(instaTop.metrics[0].value) + ' 赞）。' + esc(instaTop.credit) + '</figcaption>';
  }

  /* ────────────────────────────────────────────
     06 账号实践：抖音 + 开拍 RALLY
     ──────────────────────────────────────────── */
  var rally = $('#rally');
  if (rally) {
    var p = S.practice.rally;
    var step3 = p.story[p.story.length - 1];
    rally.innerHTML =
      '<div>' +
        '<p class="label">' + esc(p.label) + '</p>' +
        '<h3>' + esc(p.heading) + '</h3>' +
        '<p class="intro">' + esc(p.intro) + '</p>' +
        '<p class="metric"><b data-count="' + String(step3.metric.value).replace(/[^\d]/g, '') + '"' +
        ' data-suffix="+" data-group="0">0</b><span>' + esc(step3.metric.label) + ' · 上线近一周累计</span></p>' +
        '<p class="src">' + esc(step3.source) + '</p>' +
        '<p class="actions">' +
          '<a href="' + p.play + '" target="_blank" rel="noopener noreferrer">去试玩 ↗</a>' +
          '<a href="' + p.code + '" target="_blank" rel="noopener noreferrer">GitHub 源码 ↗</a>' +
        '</p>' +
      '</div>' +
      '<figure><img src="' + asset(p.visual.src) + '" alt="' + esc(p.visual.alt) +
        '" width="844" height="390" loading="lazy"><figcaption>' + esc(p.visual.caption) + '</figcaption></figure>' +
      '<div class="story">' +
        p.story.slice(0, -1).map(function (s) {
          return '<section><p class="n">' + esc(s.n) + '</p><h4>' + esc(s.name) + '</h4><p>' + esc(s.text) + '</p></section>';
        }).join('') +
        '<section><p class="n">' + esc(step3.n) + '</p><h4>' + esc(step3.name) + '</h4><p>' +
        esc(step3.text) + '</p></section>' +
      '</div>';
  }

  var douyin = $('#douyin');
  if (douyin) {
    var d = S.practice.douyin;
    douyin.innerHTML =
      '<p class="label">' + esc(d.label) + '</p>' +
      '<h3>' + esc(d.name) + '</h3>' +
      '<p>' + esc(d.desc) + '</p>' +
      '<p class="tags">' + d.tags.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</p>' +
      '<a class="link" href="' + d.url + '" target="_blank" rel="noopener noreferrer">查看账号主页 ↗</a>';
  }

  /* ────────────────────────────────────────────
     07 联系与口径
     ──────────────────────────────────────────── */
  var contact = $('#contact-rows');
  if (contact) {
    var c = S.contact;
    contact.innerHTML =
      '<div><dt>手机 / PHONE</dt><dd><a href="tel:+86' + c.phone + '">' + esc(c.phoneDisplay) + '</a></dd></div>' +
      '<div><dt>GitHub / CODE</dt><dd><a href="' + c.githubUrl + '" target="_blank" rel="noopener noreferrer">@' +
        esc(c.github) + ' ↗</a></dd></div>' +
      '<div><dt>简历 / RESUME</dt><dd><a href="' + asset(c.resume.src) + '" download="' + esc(c.resume.name) +
        '">下载 PDF</a><small>' + esc(c.resume.note) + '</small></dd></div>';
  }

  var prov = $('#provenance');
  if (prov) {
    prov.innerHTML =
      '<div><b>TikTok 口径</b>' + esc(S.tiktok.note) + '<br>账号 ' + esc(S.tiktok.account.followers) +
        ' 粉丝为 ' + esc(S.tiktok.account.followersNote.replace(/^账号粉丝为 /, '')) + '。</div>' +
      '<div><b>Instagram 口径</b>' + esc(S.instagram.note) + '<br>' + esc(S.instagram.note2) + '</div>' +
      '<div><b>虎扑口径</b>' + esc(S.hupu.note) + '<br>日韩教学内容：' + esc(S.localization.countNote) + '</div>' +
      '<div><b>本页算法</b>互动率 = 点赞 ÷ 播放量，由原始数字现算。<br>' +
        '数字全部取自本人留存记录，未做估算；图表为手写 SVG，无第三方库。</div>';
  }

  /* ────────────────────────────────────────────
     文案绑定：所有来自 SITE 的说明文字与日期，避免页面上出现第二份口径
     ──────────────────────────────────────────── */
  var TEXT = {
    '#topbar-role': S.identity.title + ' · ' + S.identity.cohort,
    '#hero-role': S.identity.title,
    '#hero-cohort': S.identity.en + ' · ' + S.identity.cohort + ' · 本科数学 / 硕士应用经济学',
    '#hero-one-line': S.identity.oneLine,
    '#hero-edu': S.education[0].school + ' ' + S.education[0].major + '，' +
      S.education[1].school + ' ' + S.education[1].major + '。',
    '#chart-src': S.tiktok.note,
    '#read-src-note': S.tiktok.note,
    '#hupu-src': S.hupu.note,
    '#hupu-role': '我的工作：' + S.hupu.role,
    '#hupu-event': S.hupu.event.label + ' · ' + S.hupu.event.title + ' —— ' + S.hupu.event.text,
    '#local-src': S.localization.countNote,
    '#local-label': S.localization.count.label,
    '#local-brief': S.localization.brief,
    '#local-credit': S.localization.credit,
    '#insta-src': S.instagram.note + ' / ' + S.instagram.note2,
    '#insta-brief': S.instagram.brief,
    '#contact-lead': S.contact.lead,
  };
  Object.keys(TEXT).forEach(function (sel) {
    var el = $(sel);
    if (el) el.textContent = TEXT[sel];
  });

  var instaTags = $('#insta-tags');
  if (instaTags) {
    instaTags.innerHTML = S.instagram.tags.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');
  }
  var localCapture = $('#local-capture');
  if (localCapture) {
    var cap = S.localization.capture;
    localCapture.innerHTML = '<img src="' + asset(cap.src) + '" alt="' + esc(cap.alt) +
      '" width="1897" height="949" loading="lazy"><figcaption>' + esc(cap.caption) +
      ' · <a class="credit-link" href="' + S.localization.accountUrl +
      '" target="_blank" rel="noopener noreferrer">' + esc(S.localization.accountLabel) + ' ↗</a></figcaption>';
  }
  $$('[data-email]').forEach(function (el) {
    el.textContent = S.contact.email;
    el.setAttribute('href', 'mailto:' + S.contact.email);
  });

  /* ────────────────────────────────────────────
     收尾：把文案里的占位数字换成现算值，再接线揭示与计数
     ──────────────────────────────────────────── */
  $$('[data-num]').forEach(function (el) {
    var f = NUM[el.getAttribute('data-num')];
    if (f) el.textContent = f();
  });

  var main = $('#main');
  if (window.Motion) {
    window.Motion.reveal(main || document);
    window.Motion.countAll(main || document);
  } else {
    (main || document).classList.add('is-in');
  }
}());
