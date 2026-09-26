/* ==========================================================================
   周性运 · 个人作品集首页
   --------------------------------------------------------------------------
   数据：全部读 versions/shared/content.js（全站唯一事实来源），
        本文件只做呈现与派生计算，不写死任何数字。
   呈现：按事实组织首屏、作品、经历与个人项目；手势在 viewers.js / cabinet.js。
   入场：观察不被裁切的 [data-rv] 元素，每个只播一次。
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
  var INSTANT = FLAT || REDUCE;   // 静态降级，不做计数与人物跟随
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
      role: '', // 每件作品的职责随翻页显示，不把某一件的团队归属套给整个板块
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

  /* 四台装置使用真实素材直接操作，面板只显示内容与不可点击的进度。 */
  var viewers = {};
  var indexEl = document.getElementById('index');
  function buildViewer(block, items, kind) {
    var node = window.createWorkViewer(block, items, kind, {el:el, asset:asset, stats:stats, instant:INSTANT});
    viewers[block.id] = node;
    return node;
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

        blk.appendChild(window.createWorkCabinet(b, {el:el, asset:asset, instant:INSTANT}));
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
        var tail = el('details', 'work-notes');
        tail.appendChild(el('summary', null, '长文创作的背景与分工'));
        var articleNotes = el('div', 'work-context');
        articleNotes.appendChild(buildMeta([['目标', b.goal], ['我负责的', b.role], ['怎么实现的', b.how]]));
        tail.appendChild(articleNotes);
        blk.appendChild(tail);
        if (b.note) blk.appendChild(el('p', 'blk-note', b.note));
        indexEl.appendChild(blk);
        return;
      }

      if (b.kind === 'video') {
        /* 块 1：转轮。六条按播放降序，第一条是块里的峰值 */
        blk.appendChild(buildHead(b, true));
        blk.appendChild(buildViewer(b, [b.lead].concat(b.items), 'ring'));
        var process = el('details', 'work-notes');
        process.appendChild(el('summary', null, '创作过程与我的职责'));
        var notes = el('div', 'work-notes-body');
        notes.appendChild(buildMeta([['目标', b.goal], ['我负责的', b.role]]));
        notes.appendChild(buildSteps(b.how));
        process.appendChild(notes);
        blk.appendChild(process);
        if (b.note) blk.appendChild(el('p', 'blk-note', b.note));
        indexEl.appendChild(blk);
        return;
      }

      if (b.kind === 'poster') {
        /* 块 2：翻书。7 张竖版海报，一次只见一页 */
        blk.appendChild(buildHead(b, true));
        blk.appendChild(buildViewer(b, b.items, 'book'));
        var inCell = el('details', 'work-notes');
        inCell.appendChild(el('summary', null, '视觉创意的内容背景'));
        var posterNotes = el('div', 'work-context');
        posterNotes.appendChild(buildMeta([['目标', b.goal], ['怎么实现的', b.how]]));
        inCell.appendChild(posterNotes);
        blk.appendChild(inCell);
        if (b.note) blk.appendChild(el('p', 'blk-note', b.note));
        indexEl.appendChild(blk);
        return;
      }
    });
  }

  /* ------------------------------------------------------------ 2 首屏 */
  var boxes = [];                                  // 四个真实数字的引用，用于只播一次的计数
  function renderHero() {
    var wordmark = document.getElementById('name-art');
    function showWordmark() {
      if (!wordmark.naturalWidth) return;
      document.getElementById('hero-name').classList.add('has-name-art');
      document.getElementById('home').classList.add('has-calligraphy');
    }
    if (wordmark.complete) showWordmark();
    else wordmark.addEventListener('load', showWordmark, {once:true});
    document.getElementById('hero-claim').textContent = S.identity.claim;
    document.getElementById('hero-role-sub').textContent = S.identity.title + ' · ' + S.identity.cohort;
    var box = document.getElementById('hero-proof');
    var labels = ['TikTok · 单条视频', '虎扑 · 单篇长文', '开拍 RALLY · 个人项目', 'TikTok · 账号历史记录'];
    var targets = ['#' + B_VIDEO, '#' + B_TEXT, '#practice', '#' + B_VIDEO];
    S.proof.forEach(function (p, i) {
      var a = el('a', 'proof-item' + (p.peak ? ' proof-item--primary' : ''));
      a.href = targets[i]; a.title = p.label + '：' + p.source;
      var b = el('b', null, fmtProof(p, p.value));
      boxes.push({ el:b, to:p.value, fmt:function (v) { return fmtProof(p, v); } });
      var value = el('span', 'proof-value'); value.appendChild(b);
      value.appendChild(el('span', 'proof-unit', i === 0 ? '播放' : i === 1 ? '阅读' : i === 2 ? '玩家' : '粉丝'));
      a.appendChild(el('span', 'proof-context', labels[i]));
      a.appendChild(value);
      box.appendChild(a);
    });
  }
  function fmtProof(p, v) {
    return (p.dec ? v.toFixed(p.dec) : num(Math.round(v))) + p.suffix;
  }

  function renderAbout() {
    var box = document.getElementById('about-copy');
    S.identity.about.forEach(function (paragraph, index) {
      box.appendChild(el('p', index === 0 ? 'about-lead' : '', paragraph));
    });
  }

  /* ------------------------------------------------------- 5 能力 / 经历 / 项目 */
  function renderCaps() {
    var box = document.getElementById('caps');
    S.capabilities.forEach(function (c) {
      var a = el('a', 'cap'); a.href = c.id === 'ai' ? '#practice' : c.jump;
      a.title = c.summary;
      a.appendChild(el('span', 'cap-name', c.name));
      a.appendChild(el('span', 'cap-short', c.short));
      a.appendChild(el('span', 'cap-arrow', '↗'));
      box.appendChild(a);
    });
  }

  function renderExps() {
    var box = document.getElementById('exps');
    S.experience.forEach(function (e, i) {
      var row = el('article', 'exp' + (i === 0 ? ' exp--recent' : ''));
      row.setAttribute('data-rv', '');
      row.style.setProperty('--i', String(i % 3));
      row.appendChild(el('p', 'exp-when', e.period));
      var main = el('div', 'exp-main');
      main.appendChild(el('h3', 'exp-co', e.company));
      main.appendChild(el('p', 'exp-role', e.role));
      var pts = el('ul', 'exp-points');
      e.points.forEach(function (point) { pts.appendChild(el('li', null, point)); });
      main.appendChild(pts);
      var evidence = e.company === '网易'
        ? [[B_VIDEO, '短视频作品'], [B_POSTER, '视觉创意'], [B_FLOW, '日韩内容协作']]
        : e.company === '虎扑' ? [[B_TEXT, '长文作品']] : [];
      if (evidence.length) {
        var refs = el('p', 'exp-evidence');
        evidence.forEach(function (entry) {
          var a = el('a', 'link', entry[1] + ' ↗'); a.href = '#' + entry[0]; refs.appendChild(a);
        });
        main.appendChild(refs);
      }
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
    var play = el('a', 'pr-play');
    play.href = r.play; play.target = '_blank'; play.rel = 'noopener noreferrer';
    play.setAttribute('aria-label', '打开开拍 RALLY 羽毛球小游戏');
    var im = el('img'); im.src = asset(r.visual.src); im.alt = r.visual.alt;
    im.width = 844; im.height = 390; im.loading = 'lazy'; im.decoding = 'async';
    play.appendChild(im);
    play.appendChild(el('span', 'pr-play-label', '打开游戏 ↗'));
    fig.appendChild(play);
    var caption = el('figcaption', 'pr-cap');
    caption.appendChild(el('span', null, r.visual.caption));
    var github = el('a', 'link', '查看源码 ↗');
    github.href = r.code; github.target = '_blank'; github.rel = 'noopener noreferrer';
    caption.appendChild(github); fig.appendChild(caption);
    var intro = el('div', 'pr-intro');
    intro.appendChild(el('h3', 'pr-h', r.heading));
    intro.appendChild(el('p', 'pr-text', r.intro));
    var result = el('p', 'pr-result');
    result.appendChild(el('b', null, r.story[2].metric.value));
    result.appendChild(el('span', null, r.story[2].metric.label));
    intro.appendChild(result);
    intro.appendChild(el('p', 'pr-source', r.story[2].text + ' ' + r.story[2].source));
    var making = el('details', 'pr-making');
    making.appendChild(el('summary', null, r.story[1].name));
    making.appendChild(el('p', 'pr-text', r.story[1].text));
    intro.appendChild(making);
    var a = el('a', 'link pr-launch', '直接玩一局 ↗');
    a.href = r.play; a.target = '_blank'; a.rel = 'noopener noreferrer'; intro.appendChild(a);
    box.appendChild(intro); box.appendChild(fig);
    var other = document.getElementById('personal-account');
    var name = el('a', 'personal-account-name', d.name + ' ↗');
    name.href = d.url; name.target = '_blank'; name.rel = 'noopener noreferrer';
    other.appendChild(el('span', 'personal-account-label', d.label));
    other.appendChild(name); other.appendChild(el('p', null, d.desc));
  }

  function renderSectionLeads() {
    document.getElementById('lead-works').textContent = '短视频、视觉创意、内容协作与长文。这里有我的分工、实现方式，以及作品的公开数据。';
    document.getElementById('lead-experience').textContent = S.sections.experience;
    document.getElementById('lead-practice').textContent = S.sections.practice;
  }

  function renderContact() {
    var C = S.contact;
    document.getElementById('contact-lead').textContent = C.lead;
    var mail = document.getElementById('contact-mail');
    mail.href = 'mailto:' + C.email;
    mail.textContent = C.email;
    document.getElementById('contact-h').setAttribute('aria-label', '邮箱 ' + C.email);
    var copy = document.getElementById('copy-mail');
    var status = document.getElementById('copy-status');
    copy.addEventListener('click', async function () {
      try {
        if (!navigator.clipboard) throw new Error('剪贴板不可用');
        await navigator.clipboard.writeText(C.email);
        status.textContent = '邮箱已复制';
        copy.textContent = '已复制';
      } catch (error) {
        copy.textContent = '复制邮箱';
        var range = document.createRange(); range.selectNodeContents(mail);
        var selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
        status.textContent = '邮箱已选中，可手动复制';
      }
    });


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
    var secs = { about:'about', works: 'works', experience: 'experience', practice:'practice', contact: 'contact' };
    var order = ['about', 'works', 'experience', 'practice', 'contact'];
    var on = null, current = null, ticking = false;

    function sync() {
      var y = window.scrollY || window.pageYOffset || 0;
      var show = y > 36;
      if (show !== on) { on = show; bar.classList.toggle('is-on', show); }

      var mid = y + (window.innerHeight || 800) * 0.4, found = '';
      order.forEach(function (id) {
        var s = document.getElementById(secs[id]);
        if (s && s.getBoundingClientRect().top + y <= mid) found = id;
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
    renderAbout();
    renderWorks();
    renderCaps();
    renderExps();
    renderPractice();
    renderSectionLeads();
    renderContact();
    if (window.initInterfaceMotion) window.__interfaceMotion = window.initInterfaceMotion({flat:FLAT});
    if (window.initScrollMotion) window.__scrollMotion = window.initScrollMotion({flat:FLAT});
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
    finish: function () { boxes.forEach(function (b) { b.el.textContent = b.fmt(b.to); }); },
    revealAll: function () { [].forEach.call(document.querySelectorAll('[data-rv]'), function (t) { t.classList.add('in'); }); },
    get state() {
      return {
        count: TT_ALL.length + IG.length + HP.length, flat: FLAT, reduce: REDUCE,
        viewers: Object.keys(viewers).map(function (id) { return viewers[id].viewerState; }),
        proof: boxes.map(function (b) { return b.el.textContent; })
      };
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
