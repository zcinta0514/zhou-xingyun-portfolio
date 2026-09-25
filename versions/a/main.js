/* ============================================================
   方向 A · main.js
   职责：把 window.SITE 里的唯一事实来源渲染成页面，并接上四条动效主线。
   本文件不产生任何内容：所有文案、数字、图片、链接都来自 content.js。
   动效只用 shared/motion.js 的原语（reveal / count / onScroll / observeOnce）。
   ============================================================ */
(function () {
  'use strict';

  var S = window.SITE;
  var M = window.Motion;
  if (!S || !M) return;

  var A = window.asset || function (p) { return p; };
  var doc = document;

  /* ── 工具 ── */
  function $(sel, root) { return (root || doc).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || doc).querySelectorAll(sel)); }
  function put(node, value) { if (node) node.textContent = value == null ? '' : String(value); }
  function tag(name, cls, text) {
    var n = doc.createElement(name);
    if (cls) n.className = cls;
    if (text != null) n.textContent = String(text);
    return n;
  }
  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }
  /* 错峰：30–80ms，用 --d 注入；不改 base.css 里的过渡简写 */
  function stagger(nodes, base, step) {
    nodes.forEach(function (n, i) { n.style.setProperty('--d', (base + i * step) + 'ms'); });
  }
  /* 千分位。只是把 SITE 里的原始数字换个写法，不做四舍五入 */
  function plain(n) { return Number(n).toLocaleString('en-US'); }
  /* 百万级才缩写，且沿用 content.js 里 1.6M / 19.6K 的既有口径 */
  function biggable(views) {
    if (views >= 1000000) return { to: views / 1000000, dec: 1, suffix: 'M' };
    return { to: views, dec: 0, suffix: '' };
  }

  /* 图片固有尺寸（工程元信息，不是内容数据）：写进 width/height 属性，
     避免任何情况下出现 CLS。视觉尺寸一律由 CSS 的 aspect-ratio 控制。 */
  var DIMS = {
    'assets/hero_profile_soft-v1.png': [1086, 1448],
    'assets/profile-id-original-v1.jpg': [1773, 2364],
    'assets/rally-gameplay-v1.png': [844, 390],
    'assets/works_tt2_dog_v1.png': [720, 1280],
    'assets/works_tt5_03.png': [576, 1024],
    'assets/works_tt6_plane_v1.png': [576, 1024],
    'assets/library/TT1-cover.png': [576, 1024],
    'assets/library/TT3-cover.png': [720, 1280],
    'assets/library/TT4-cover.png': [720, 1280],
    'assets/library/poster_predict.png': [780, 980],
    'assets/library/poster_championship.png': [780, 980],
    'assets/library/guess_griffin.png': [600, 760],
    'assets/library/guess_iverson.png': [600, 760],
    'assets/library/guess_edwards.png': [600, 760],
    'assets/library/call-a.png': [720, 1280],
    'assets/library/call-b.png': [720, 1280],
    'assets/library/call-c.png': [720, 1280],
    'assets/library/palette-a.png': [720, 1280],
    'assets/library/palette-b.png': [720, 1280],
    'assets/library/palette-c.png': [720, 1280],
    'assets/library/youtube-account.png': [1897, 949]
  };
  function setImg(img, src, alt) {
    if (!img) return img;
    var d = DIMS[src];
    if (d) { img.width = d[0]; img.height = d[1]; }
    img.src = A(src);
    img.alt = alt == null ? '' : alt;
    return img;
  }

  var TT = S.tiktok.works;
  var LEAD = TT.filter(function (w) { return w.id === S.tiktok.lead; })[0] || TT[0];
  /* 平坦模式（?flat=1 或 reduced-motion）：跳过会留下中间态的动画 */
  var instant = M.flat && !M.reduced;

  /* ============================================================
     ① 首屏
     ============================================================ */
  put($('#hero-name'), S.identity.name);
  put($('#hero-en'), S.identity.en);
  put($('#hero-title'), S.identity.title);
  put($('#hero-line'), S.identity.oneLine);

  var portrait = $('#portrait-img');
  setImg(portrait, S.identity.portrait, S.identity.name);

  var resumeLink = $('#hero-resume');
  if (resumeLink) {
    resumeLink.href = A(S.contact.resume.src);
    resumeLink.download = S.contact.resume.name;
    resumeLink.title = S.contact.resume.note;
  }

  /* 证据条：四个真实数字，从 0 滚上去；出处按条挂在下面 */
  var proofRoot = $('#proof');
  if (proofRoot) {
    S.proof.forEach(function (p, i) {
      var li = tag('li');
      var b = tag('b', 'num');
      b.setAttribute('data-count', p.value);
      b.setAttribute('data-dec', p.dec);
      if (p.suffix) b.setAttribute('data-suffix', p.suffix);
      b.textContent = '0';
      li.appendChild(b);
      li.appendChild(tag('span', null, p.label));
      li.appendChild(tag('small', null, p.source));
      li.setAttribute('data-reveal', 'up');
      li.style.setProperty('--d', (i * 45 + 60) + 'ms');
      proofRoot.appendChild(li);
    });
  }
  stagger($$('.hero-copy > *'), 0, 70);

  /* ============================================================
     ② 静默：只有一行数据口径，其余什么都不发生
     ============================================================ */
  put($('#silence-line'), S.tiktok.note);

  /* ============================================================
     ③ 峰值
     ============================================================ */
  put($('#peak-meta'), LEAD.cat + ' · ' + S.tiktok.account.name);
  put($('#peak-title-text'), LEAD.title);
  put($('#peak-why'), LEAD.why);

  var peakImg = $('#peak-img');
  setImg(peakImg, LEAD.src, LEAD.title);

  var peakStats = $('#peak-stats');
  if (peakStats) {
    [
      { label: '点赞', value: plain(LEAD.likes) },
      { label: '互动率', value: LEAD.rate + '%' },
      { label: '账号粉丝', value: S.tiktok.account.followers }
    ].forEach(function (s) {
      var li = tag('li');
      li.appendChild(tag('b', 'num', s.value));
      li.appendChild(tag('span', null, s.label));
      peakStats.appendChild(li);
    });
  }

  var peakFlow = $('#peak-flow');
  if (peakFlow) {
    S.tiktok.duties.forEach(function (d) {
      var li = tag('li');
      li.appendChild(tag('em', null, d.n));
      li.appendChild(tag('span', null, d.name));
      peakFlow.appendChild(li);
    });
  }

  var peakLink = $('#peak-link');
  if (peakLink) {
    peakLink.href = LEAD.url;
    peakLink.textContent = S.tiktok.account.name;
    peakLink.title = S.tiktok.account.followersNote;
  }

  /* 峰值触发：外层不被裁切，负责观察；内层被 clip-path 裁切，只接收状态 */
  var peakTrigger = $('#peak-trigger');
  var peak = $('#peak');
  var peakNum = $('#peak-num');
  var big = biggable(LEAD.views);

  function openPeak() {
    if (!peakTrigger) return;
    peakTrigger.classList.add('in');
    /* 被裁切的元素等不到自己的回调（clip-path 让 IO 判定 0 面积），在这里统一放行 */
    $$('[data-reveal],.wipe', peak).forEach(function (n) { n.classList.add('is-in'); });
    if (peakNum) {
      window.setTimeout(function () {
        M.count(peakNum, { to: big.to, dec: big.dec, suffix: big.suffix, dur: 1700 });
      }, instant ? 0 : 280);
    }
  }
  if (peakTrigger) M.observeOnce(peakTrigger, openPeak, { margin: '0px 0px -10% 0px', threshold: 0.04 });

  /* ============================================================
     ④ 经历：教育两张卡 + 三段实习时间线
     ============================================================ */
  var eduCol = $('#edu-col');
  if (eduCol) {
    S.education.forEach(function (e, i) {
      var card = tag('div', 'edu');
      card.setAttribute('data-reveal', 'up');
      card.style.setProperty('--d', (i * 60) + 'ms');
      card.appendChild(tag('b', null, e.period));
      card.appendChild(tag('strong', null, e.school));
      card.appendChild(tag('span', null, e.major));
      card.appendChild(tag('em', null, e.level));
      eduCol.appendChild(card);
    });
  }

  var expList = $('#exp-list');
  if (expList) {
    S.experience.forEach(function (j, i) {
      var li = tag('li', 'tl-item');
      li.setAttribute('data-reveal', 'up');
      li.style.setProperty('--d', (i * 60) + 'ms');
      li.appendChild(tag('b', 'tl-period', j.period));
      li.appendChild(tag('h3', null, j.company));
      li.appendChild(tag('p', 'tl-role', j.role));
      var ul = tag('ul', 'tl-points');
      j.points.forEach(function (p) { ul.appendChild(tag('li', null, p)); });
      li.appendChild(ul);
      expList.appendChild(li);
    });
  }

  /* ============================================================
     ⑤ 能力 ←→ 证据
     选中一个能力，右侧给出它的说明、证据标签与对应作品的跳转
     ============================================================ */
  var capTabs = $('#cap-tabs');
  var capPanels = $('#cap-panels');
  /* 跳转链接的文字直接用目标章节自己的标题，不再自造文案 */
  var JUMP_TEXT = {};
  JUMP_TEXT['#works-tiktok'] = S.tiktok.heading;
  JUMP_TEXT['#works-localization'] = S.localization.heading;
  JUMP_TEXT['#works-hupu'] = S.hupu.heading;
  JUMP_TEXT['#practice-rally'] = S.practice.rally.heading;

  if (capTabs && capPanels) {
    var tabs = [];
    var panels = [];

    S.capabilities.forEach(function (c, i) {
      var t = tag('button', 'cap-tab');
      t.type = 'button';
      t.id = 'cap-tab-' + c.id;
      t.setAttribute('role', 'tab');
      t.setAttribute('aria-controls', 'cap-panel-' + c.id);
      t.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      t.tabIndex = i === 0 ? 0 : -1;
      t.appendChild(tag('i', null, c.index));
      var box = tag('span');
      box.appendChild(tag('b', null, c.name));
      box.appendChild(tag('span', null, c.short));
      t.appendChild(box);
      capTabs.appendChild(t);
      tabs.push(t);

      var p = tag('div', 'cap-panel');
      p.id = 'cap-panel-' + c.id;
      p.setAttribute('role', 'tabpanel');
      p.setAttribute('aria-labelledby', t.id);
      p.tabIndex = 0;
      if (i !== 0) p.hidden = true;
      p.appendChild(tag('small', null, c.index + ' · ' + c.name));
      p.appendChild(tag('h3', null, c.short));
      p.appendChild(tag('p', null, c.summary));
      var ev = tag('ul', 'cap-evidence');
      c.evidence.forEach(function (e) { ev.appendChild(tag('li', null, e)); });
      p.appendChild(ev);
      var jump = tag('a', 'cap-jump');
      jump.href = c.jump;
      jump.appendChild(tag('em', null, c.index));
      jump.appendChild(tag('span', null, JUMP_TEXT[c.jump] || c.jump));
      p.appendChild(jump);
      capPanels.appendChild(p);
      panels.push(p);
    });

    function activate(idx, focus) {
      tabs.forEach(function (t, i) {
        var on = i === idx;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        if (panels[i]) panels[i].hidden = !on;
      });
      if (focus && tabs[idx]) tabs[idx].focus();
    }

    capTabs.addEventListener('click', function (e) {
      var idx = tabs.indexOf(e.target.closest('.cap-tab'));
      if (idx > -1) activate(idx, false);
    });
    capTabs.addEventListener('keydown', function (e) {
      var idx = tabs.indexOf(doc.activeElement);
      if (idx < 0) return;
      var next = null;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      if (next == null) return;
      e.preventDefault();
      activate(next, true);
    });
  }

  /* ============================================================
     ⑥-1 更多作品 · TikTok 其余五条
     ============================================================ */
  put($('#works-index'), [S.tiktok.heading, S.instagram.heading, S.localization.heading, S.hupu.heading].join(' · '));
  put($('#tt-title span'), S.tiktok.heading);
  put($('#tt-brief'), S.tiktok.brief);
  put($('#tt-note'), S.tiktok.note);

  var ttScope = $('#tt-scope');
  if (ttScope) S.tiktok.scope.forEach(function (s) { ttScope.appendChild(tag('li', null, s)); });

  var ttList = $('#tt-list');
  if (ttList) {
    TT.filter(function (w) { return w.id !== LEAD.id; }).forEach(function (w) {
      var li = tag('li', 'tt-row');
      var a = tag('a');
      a.href = w.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';

      var thumb = tag('span', 'tt-thumb');
      var thumbImg = tag('img');
      setImg(thumbImg, w.src, '');   /* 与同一行的标题重复，按装饰处理 */
      thumbImg.loading = 'lazy';
      thumbImg.decoding = 'async';
      thumb.appendChild(thumbImg);
      a.appendChild(thumb);

      var main = tag('span', 'tt-main');
      main.appendChild(tag('b', null, w.id));
      main.appendChild(tag('strong', null, w.title));
      main.appendChild(tag('small', null, w.cat));
      a.appendChild(main);

      [[plain(w.views), '播放'], [plain(w.likes), '点赞'], [w.rate + '%', '互动率']].forEach(function (pair) {
        var stat = tag('span', 'tt-stat');
        stat.appendChild(tag('b', 'num', pair[0]));
        stat.appendChild(tag('small', null, pair[1]));
        a.appendChild(stat);
      });

      var arrow = tag('span', 'tt-arrow', '↗');
      arrow.setAttribute('aria-hidden', 'true');
      a.appendChild(arrow);

      li.appendChild(a);
      ttList.appendChild(li);
    });
  }

  var duties = $('#tt-duties');
  if (duties) {
    duties.appendChild(tag('h4', null, '工作流程'));
    var ol = tag('ol', 'duties-list');
    S.tiktok.duties.forEach(function (d) {
      var li = tag('li');
      li.appendChild(tag('em', null, d.n));
      li.appendChild(tag('b', null, d.name));
      li.appendChild(tag('p', null, d.text));
      ol.appendChild(li);
    });
    duties.appendChild(ol);
  }

  /* ============================================================
     ⑥-2 Instagram 画廊 + View Transitions 共享元素过渡
     ============================================================ */
  var IG = S.instagram.works;
  var igImg = $('#ig-main-img');
  var igThumbs = $('#ig-thumbs');
  var igSteps = $('#ig-steps');
  var igLink = $('#ig-link');
  var igMetrics = $('#ig-metrics');
  var igBusy = false;
  var igCur = 0;
  var igIdx = 0;

  put($('#ig-title span'), S.instagram.heading);
  put($('#ig-brief'), S.instagram.brief);
  put($('#ig-note'), [S.instagram.note, S.instagram.note2].filter(Boolean).join(' · '));
  var igTags = $('#ig-tags');
  if (igTags) S.instagram.tags.forEach(function (t) { igTags.appendChild(tag('li', null, t)); });

  function paintIg() {
    var w = IG[igCur];
    var im = w.images[Math.min(igIdx, w.images.length - 1)];
    if (igImg) {
      setImg(igImg, im.src, im.alt);   /* alt 一律用 content.js 里的 */
      igImg.loading = 'eager';
    }
    put($('#ig-cat'), w.cat);
    put($('#ig-work-title'), w.title);
    put($('#ig-desc'), w.desc);
    put($('#ig-role'), w.role);
    put($('#ig-credit-text'), w.credit);
    if (igMetrics) {
      clear(igMetrics);
      w.metrics.forEach(function (m) {
        var li = tag('li');
        li.appendChild(tag('b', 'num', m.value));
        li.appendChild(tag('span', null, m.label));
        igMetrics.appendChild(li);
      });
    }
    if (igLink) {
      igLink.href = w.url;
      igLink.textContent = 'Instagram ↗';
      igLink.setAttribute('aria-label', w.title + ' · Instagram');
    }
    if (igSteps) {
      clear(igSteps);
      if (w.images.length > 1) {
        var prev = tag('button', null, '←');
        prev.type = 'button';
        prev.setAttribute('aria-label', '上一张');
        var next = tag('button', null, '→');
        next.type = 'button';
        next.setAttribute('aria-label', '下一张');
        prev.addEventListener('click', function () { stepIg(-1); });
        next.addEventListener('click', function () { stepIg(1); });
        igSteps.appendChild(prev);
        igSteps.appendChild(tag('span', 'num', (igIdx + 1) + ' / ' + w.images.length));
        igSteps.appendChild(next);
      }
    }
    $$('.ig-thumb', igThumbs).forEach(function (b, i) {
      b.setAttribute('aria-pressed', i === igCur ? 'true' : 'false');
    });
  }

  function stepIg(dir) {
    var w = IG[igCur];
    igIdx = (igIdx + dir + w.images.length) % w.images.length;
    switchIg(function () { paintIg(); });
  }

  /* 降级路径：没有 View Transitions，或用户要求更少动效时，只做不透明度切换 */
  function switchIg(apply) {
    if (!igImg || instant) { apply(); return; }
    igImg.classList.add('is-out');
    window.setTimeout(function () {
      apply();
      requestAnimationFrame(function () { igImg.classList.remove('is-out'); });
    }, 170);
  }

  function selectIg(i, btn) {
    if (igBusy) return;
    igCur = i;
    igIdx = 0;
    var thumbImg = btn ? $('img', btn) : null;
    var canMorph = thumbImg && !instant && !M.reduced && typeof doc.startViewTransition === 'function';
    if (!canMorph) { switchIg(function () { paintIg(); }); return; }

    /* 共享元素：旧快照里名字挂在缩略图上，新快照里交给主图，浏览器负责把它长过去 */
    igBusy = true;
    thumbImg.style.viewTransitionName = 'ig-share';
    var vt = doc.startViewTransition(function () {
      paintIg();
      thumbImg.style.viewTransitionName = '';
      igImg.style.viewTransitionName = 'ig-share';
    });
    function release() {
      igBusy = false;
      if (igImg) igImg.style.viewTransitionName = '';
      if (thumbImg) thumbImg.style.viewTransitionName = '';
    }
    if (vt.finished && vt.finished.then) vt.finished.then(release, release);
    else window.setTimeout(release, 700);
  }

  if (igThumbs) {
    IG.forEach(function (w, i) {
      var b = tag('button', 'ig-thumb');
      b.type = 'button';
      b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      b.setAttribute('aria-label', w.title);
      var img = tag('img');
      setImg(img, w.images[0].src, '');
      img.loading = 'lazy';
      img.decoding = 'async';
      b.appendChild(img);
      b.appendChild(tag('span', null, w.title));
      b.addEventListener('click', function () { selectIg(i, b); });
      igThumbs.appendChild(b);
    });
    paintIg();
    /* 预热首图，保证切换与共享元素过渡时图像已经解码 */
    window.addEventListener('load', function () {
      IG.forEach(function (w, i) {
        w.images.forEach(function (im) {
          if (i === 0 && im === w.images[0]) return;
          var pre = new Image();
          pre.decoding = 'async';
          pre.src = A(im.src);
        });
      });
    });
  }

  /* ============================================================
     ⑥-3 日韩上线教学内容
     ============================================================ */
  put($('#loc-title span'), S.localization.heading);
  put($('#loc-brief'), S.localization.brief);
  put($('#loc-credit'), S.localization.credit);
  put($('#loc-note'), S.localization.countNote);
  var locImg = $('#loc-img');
  setImg(locImg, S.localization.capture.src, S.localization.capture.alt);
  put($('#loc-caption'), S.localization.capture.caption);
  var locLink = $('#loc-link');
  if (locLink) {
    locLink.href = S.localization.accountUrl;
    locLink.textContent = S.localization.accountLabel + ' ↗';
  }
  var locCount = $('#loc-count');
  if (locCount) {
    locCount.appendChild(tag('b', 'num', S.localization.count.value));
    locCount.appendChild(tag('span', null, S.localization.count.label));
  }
  var locSteps = $('#loc-steps');
  if (locSteps) {
    S.localization.steps.forEach(function (s) {
      var li = tag('li');
      li.appendChild(tag('em', null, s.n));
      var box = tag('div');
      box.appendChild(tag('h4', null, s.name));
      box.appendChild(tag('p', null, s.text));
      li.appendChild(box);
      locSteps.appendChild(li);
    });
  }

  /* ============================================================
     ⑥-4 虎扑
     ============================================================ */
  put($('#hupu-title span'), S.hupu.heading);
  put($('#hupu-brief'), S.hupu.brief);
  put($('#hupu-note'), S.hupu.note);
  var hupuTags = $('#hupu-tags');
  if (hupuTags) S.hupu.tags.forEach(function (t) { hupuTags.appendChild(tag('li', null, t)); });
  var hupuRole = $('#hupu-role');
  if (hupuRole) {
    hupuRole.appendChild(tag('b', null, '我的工作'));
    hupuRole.appendChild(doc.createTextNode(S.hupu.role));
  }
  var hupuList = $('#hupu-list');
  if (hupuList) {
    S.hupu.articles.forEach(function (a, i) {
      var li = tag('li', 'hupu-item');
      li.setAttribute('data-reveal', 'up');
      li.style.setProperty('--d', (i * 60) + 'ms');
      var body = tag('div');
      body.appendChild(tag('span', 'hupu-cat', a.cat));
      var h4 = tag('h4');
      var link = tag('a', null, a.title);
      link.href = a.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.appendChild(doc.createTextNode(' ↗'));
      h4.appendChild(link);
      body.appendChild(h4);
      body.appendChild(tag('p', null, a.desc));
      var figs = tag('div', 'hupu-figs');
      [[plain(a.views), '阅读'], [plain(a.replies), '回复']].forEach(function (pair) {
        var cell = tag('div');
        cell.appendChild(tag('b', 'num', pair[0]));
        cell.appendChild(tag('span', null, pair[1]));
        figs.appendChild(cell);
      });
      li.appendChild(body);
      li.appendChild(figs);
      hupuList.appendChild(li);
    });
  }
  var hupuEvent = $('#hupu-event');
  if (hupuEvent) {
    var head = tag('header');
    head.appendChild(tag('span', null, S.hupu.event.label));
    var h4 = tag('h4');
    var link = tag('a', null, S.hupu.event.title);
    link.href = S.hupu.event.jump;
    h4.appendChild(link);
    head.appendChild(h4);
    hupuEvent.appendChild(head);
    hupuEvent.appendChild(tag('p', null, S.hupu.event.text));
  }

  /* ============================================================
     ⑦ 账号实践
     ============================================================ */
  var douyin = $('#douyin');
  if (douyin) {
    var d = S.practice.douyin;
    var dBody = tag('div');
    dBody.appendChild(tag('span', 'unit-label', d.label));
    dBody.appendChild(tag('h3', null, d.name));
    dBody.appendChild(tag('p', null, d.desc));
    var dTags = tag('ul', 'tags');
    d.tags.forEach(function (t) { dTags.appendChild(tag('li', null, t)); });
    dBody.appendChild(dTags);
    douyin.appendChild(dBody);
    var dLink = tag('a', 'btn douyin-link', '抖音 ↗');
    dLink.href = d.url;
    dLink.target = '_blank';
    dLink.rel = 'noopener noreferrer';
    dLink.setAttribute('aria-label', d.name + ' · 抖音');
    douyin.appendChild(dLink);
  }

  var R = S.practice.rally;
  put($('#rally-title-text'), R.heading);
  put($('#rally-intro'), R.intro);
  put($('#rally-caption'), R.visual.caption);
  var rallyImg = $('#rally-img');
  setImg(rallyImg, R.visual.src, R.visual.alt);
  var rallyPlay = $('#rally-play');
  if (rallyPlay) rallyPlay.href = R.play;
  var rallyCode = $('#rally-code');
  if (rallyCode) rallyCode.href = R.code;

  var rallyStory = $('#rally-story');
  if (rallyStory) {
    R.story.forEach(function (s, i) {
      var li = tag('li');
      li.setAttribute('data-reveal', 'up');
      li.style.setProperty('--d', (i * 70) + 'ms');
      li.appendChild(tag('em', null, s.n));
      li.appendChild(tag('h4', null, s.name));
      if (s.metric) {
        var m = tag('p', 'rally-metric');
        m.appendChild(tag('b', 'num', s.metric.value));
        m.appendChild(tag('span', null, s.metric.label));
        li.appendChild(m);
      }
      li.appendChild(tag('p', null, s.text));
      if (s.source) li.appendChild(tag('small', null, s.source));
      rallyStory.appendChild(li);
    });
  }

  /* ============================================================
     ⑧ 联系：邮箱做主角
     ============================================================ */
  put($('#contact-heading'), S.contact.heading);
  put($('#contact-lead'), S.contact.lead);
  var mail = $('#contact-email');
  if (mail) {
    mail.href = 'mailto:' + S.contact.email;
    put($('#contact-email-text'), S.contact.email);
  }
  var phone = $('#contact-phone');
  if (phone) {
    phone.href = 'tel:+86' + S.contact.phone;
    put($('b', phone), S.contact.phoneDisplay);
  }
  var gh = $('#contact-github');
  if (gh) {
    gh.href = S.contact.githubUrl;
    put($('b', gh), '@' + S.contact.github);
  }
  var rl = $('#contact-resume');
  if (rl) {
    rl.href = A(S.contact.resume.src);
    rl.download = S.contact.resume.name;
    put($('b', rl), S.contact.resume.name);
    put($('small', rl), S.contact.resume.note);
  }
  put($('#contact-name'), S.identity.name + ' · ' + S.identity.en);
  put($('#contact-cohort'), S.identity.cohort);

  /* ============================================================
     进度条：章节进度，不做数字计数器，逐帧只改 transform
     ============================================================ */
  var fill = $('#sprog-fill');
  if (fill) {
    M.onScroll(function () {
      var max = doc.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      fill.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    });
  }

  /* ============================================================
     接线：内容是在 DOMContentLoaded 之前同步插入的，
     motion.js 的 boot 会统一扫描一遍；若它已经跑过，这里补一次。
     ============================================================ */
  if (doc.readyState !== 'loading') M.reveal();
}());
