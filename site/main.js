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
  var G_TT = 'works-tiktok', G_IG = 'works-instagram', G_LONG = 'works-long';

  function tiktokItems() {
    var list = S.tiktok.works.map(function (w) {
      return {
        id: 'tt-' + w.id, dom: 'work-' + w.id.toLowerCase(),
        title: w.title, cat: w.cat,
        media: w.src, alt: w.title + ' · 视频封面',
        meta: [[short(w.views), '播放'], [w.rate + '%', '互动']],
        stats: [[num(w.views), '播放'], [num(w.likes), '点赞'], [w.rate + '%', '互动率']],
        body: w.why,
        url: w.url, urlText: '在 TikTok 打开原帖',
        lead: w.id === S.tiktok.lead
      };
    });
    // 1.6M 那条是这一章的重点，排到第一位（内容不变，只调展示顺序）
    list.sort(function (a, b) { return (b.lead ? 1 : 0) - (a.lead ? 1 : 0); });
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
        title: w.title, cat: w.cat,
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

  function localizationItem() {
    var L = S.localization;
    return {
      id: 'loc', dom: 'work-localization',
      title: L.heading, cat: '日韩上线 · 教学内容',
      media: L.capture.src, alt: L.capture.alt, pos: '40% center',
      meta: [[L.count.value, L.count.label]],
      stats: [[L.count.value, L.count.label]],
      body: L.brief,
      steps: L.steps,
      note: L.credit + ' · ' + L.countNote,
      caption: L.capture.caption,
      url: L.accountUrl, urlText: L.accountLabel
    };
  }

  function hupuItems() {
    return S.hupu.articles.map(function (a) {
      return {
        id: 'hp-' + a.n, dom: 'work-hupu-' + a.n,
        text: true,
        title: a.title, cat: a.cat,
        meta: [[num(a.views), '阅读'], [num(a.replies), '回复']],
        stats: [[num(a.views), '阅读'], [num(a.replies), '回复']],
        body: a.desc,
        url: a.url, urlText: '在虎扑看原文'
      };
    });
  }

  var GROUPS = [
    { id: G_TT, name: S.tiktok.heading, count: S.tiktok.works.length + ' 条', items: tiktokItems() },
    { id: G_IG, name: S.instagram.heading, count: S.instagram.works.length + ' 件', items: instagramItems() },
    { id: G_LONG, name: S.localization.heading + ' · ' + S.hupu.heading, count: (S.hupu.articles.length + 1) + ' 件',
      items: [localizationItem()].concat(hupuItems()) }
  ];

  /* ------------------------------------------------------------ 2 首屏 */
  var boxes = [];                                  // 四个真实数字的引用，用于只播一次的计数
  function renderHero() {
    document.getElementById('hero-title').textContent = S.identity.title;
    document.getElementById('hero-role-sub').textContent =
      S.identity.cohort + ' · ' + S.education[0].major.split(' · ')[0] + '硕士 · ' +
      S.education[1].major.replace(' · ', '');

    var box = document.getElementById('hero-proof');
    S.proof.forEach(function (p) {
      var b = el('b', null, fmtProof(p, p.value));
      boxes.push({ el: b, to: p.value, fmt: function (v) { return fmtProof(p, v); } });
      var span = el('span');
      span.appendChild(b);
      span.appendChild(document.createTextNode(' ' + p.label));
      box.appendChild(span);
    });
    // 四个数字各自的出处与日期（content.js 的 source），挂在 title 上，不另起一行文字
    box.title = S.proof.map(function (p) { return p.label + '：' + p.source; }).join('\n');
  }
  function fmtProof(p, v) {
    return (p.dec ? v.toFixed(p.dec) : num(Math.round(v))) + p.suffix;
  }

  /* ------------------------------------------------------------ 3 作品索引 */
  var indexEl = document.getElementById('index');
  var cards = [];
  var byId = {};

  function buildCard(item, i) {
    var card = el('article', 'card' + (item.lead ? ' card--lead' : '') + (item.text ? ' card--text' : ''));
    card.id = item.dom;
    card.setAttribute('data-rv', '');
    card.style.setProperty('--i', String(i % 3));
    byId[item.id] = card;

    /* 媒体区：图片卡是图，纯文字卡是一小块铅字版面 */
    var media = el('div', 'card-media');
    if (item.text) {
      media.appendChild(el('p', 'tc-cat', item.cat));
      media.appendChild(el('h4', 'tc-title', item.title));
      media.appendChild(stats(el('p', 'tc-stat'), item.meta));
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

    /* 标题区 */
    if (!item.text) {
      var body = el('div', 'card-body');
      body.appendChild(el('h4', 'card-title', item.title));
      body.appendChild(stats(el('p', 'card-meta'), item.meta));
      card.appendChild(body);
    }

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

  function renderWorks() {
    GROUPS.forEach(function (g) {
      var label = el('div', 'glabel');
      label.id = g.id;
      label.appendChild(el('h3', null, g.name));
      label.appendChild(el('span', null, g.count));
      indexEl.appendChild(label);
      g.items.forEach(function (item, i) {
        var card = buildCard(item, i);
        cards.push(card);
        indexEl.appendChild(card);
      });
    });
  }

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
      { i: 0, href: '#' + G_TT, stat: '短视频 ' + S.tiktok.works.length + ' 条 · Instagram ' + S.instagram.works.length + ' 件' },
      { i: 1, href: '#' + G_LONG, stat: '日韩上线教学 ' + S.localization.count.value + ' 条' },
      { i: 2, href: '#work-hupu-01', stat: '虎扑长文 ' + S.hupu.articles.length + ' 篇 · 单篇最高 ' + num(S.hupu.articles[0].views) + ' 阅读' },
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
