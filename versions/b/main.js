/* ============================================================
   方向 B · 沉浸叙事（电影式连续世界）
   - 整页共用一层手写 canvas 粒子场：指针位置 + 滚动速度共同驱动它
   - 打钉论证段与峰值都由滚动进度驱动（Motion.pinProgress，不劫持滚动）
   - 文案与数字全部来自 window.SITE，本文件只负责排版与编排
   - 降级：窄屏 / ≤4 核大幅减粒子；reduced-motion 与 ?flat=1 完全不跑动画
   ============================================================ */
(function () {
  'use strict';

  var S = window.SITE;
  var Motion = window.Motion;
  if (!S || !Motion) return;

  var asset = window.asset || function (p) { return p; };
  var flat = Motion.flat;                 // ?flat=1 或 reduced-motion
  var reduce = Motion.reduced || flat;

  /* ── SITE 里没有收录、也不含任何数据的静态小标题（沿用现有站点的原文） ── */
  var COPY = {
    background: '我是什么来头',
    abilities: '我能捣鼓些什么',
    works: '看看我做过的',
    practice: '我还在折腾这些',
    worksAll: '作品全集'
  };
  /* ── 纯界面标签，不含数据 ── */
  var UI = {
    mail: '邮箱', phone: '手机', github: 'GitHub', resume: '简历', case: '查看对应案例',
    original: '查看原视频', play: '开始试玩', code: 'GitHub 源码', account: '打开账号主页',
    localizationAccount: '查看日本区 YouTube 账号', duties: '我在这条线上具体负责什么', top: '回到开头',
    eventJump: '查看这段经历',
    nav: [['经历', '#background'], ['能力', '#abilities'], ['作品', '#works'], ['实践', '#practice'], ['联系', '#contact']]
  };
  /* SITE.capabilities.jump 与 hupu.event.jump 用的是旧站点的锚点，这里映射到本版章节 id */
  var JUMP_FIX = { '#experience': '#background' };
  function jump(h) { return JUMP_FIX[h] || h; }

  /* ── 作品图片的原始像素尺寸（直接取自文件，用于 width/height 属性，避免 CLS） ── */
  var DIMS = {
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
    'assets/library/palette-a.png': [720, 1280],
    'assets/library/youtube-account.png': [1897, 949],
    'assets/rally-gameplay-v1.png': [844, 390]
  };

  /* ══════════ 工具 ══════════ */

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  /* 数字压缩：与现有站点同一套口径（1.6M / 103.7K / 2,829），不新增任何数值 */
  function nf(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e4) return (n / 1e3).toFixed(1) + 'K';
    return n.toLocaleString('en-US');
  }
  function img(src, alt, cls, lazy) {
    var d = DIMS[src] || [0, 0];
    return '<img src="' + esc(asset(src)) + '" alt="' + esc(alt || '') + '"'
      + (d[0] ? ' width="' + d[0] + '" height="' + d[1] + '"' : '')
      + (cls ? ' class="' + cls + '"' : '')
      + (lazy ? ' loading="lazy" decoding="async"' : '') + '>';
  }
  function $ (s, r) { return (r || document).querySelector(s); }
  function all(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  var sec = {
    home: $('#home'), act: $('#act'), peak: $('#peak'), journey: $('#background'),
    ab: $('#abilities'), works: $('#works'), practice: $('#practice'), contact: $('#contact')
  };

  /* ══════════ 1. 首屏：名字逐字从粒子场里浮出 ══════════ */

  function renderHome() {
    var p = S.proof.slice(0, 3);          // 首屏三个数字，第四个留给账号实践
    var chars = '';
    for (var i = 0; i < S.identity.name.length; i++) {
      chars += '<span class="ch" style="--i:' + i + '">' + esc(S.identity.name[i]) + '</span>';
    }
    sec.home.innerHTML =
      '<div class="hero-inner scrim-c">' +
        '<h1 class="hero-name" id="home-title" aria-label="' + esc(S.identity.name) + '">' + chars + '</h1>' +
        '<p class="hero-role">' + esc(S.identity.title) +
          '<span class="hero-en">' + esc(S.identity.en) + '</span></p>' +
        '<p class="hero-line">' + esc(S.identity.oneLine) + '</p>' +
        '<ul class="proof">' + p.map(function (o) {
          return '<li><b data-count="' + o.value + '" data-dec="' + o.dec + '" data-suffix="' + esc(o.suffix) + '">0</b>'
            + '<span>' + esc(o.label) + '</span></li>';
        }).join('') + '</ul>' +
        '<p class="proof-src">' + p.map(function (o) { return esc(o.source); }).join(' · ') + '</p>' +
        '<p class="hero-cta">' +
          '<a class="btn" href="#works">' + COPY.worksAll + '</a>' +
          '<a class="quiet" href="mailto:' + esc(S.contact.email) + '">' + esc(S.contact.email) + '</a>' +
        '</p>' +
      '</div>';
    sec.home.setAttribute('aria-labelledby', 'home-title');
  }

  /* ══════════ 2. 打钉论证段：三段依次亮起 ══════════ */

  /* 七步流程：前六步取自 SITE.tiktok.duties（其中 03 / 04 各拆成两步，
     措辞仍来自该条原文），第七步是 SITE 里的「AI 协同与工作流」，
     它横跨前六步，所以单独成一行。 */
  var FLOW = [
    { name: '找选题', from: 0 },
    { name: '写创意和脚本', from: 1 },
    { name: '制作素材', from: 2 },
    { name: '审核成片', from: 2 },
    { name: '标题与发布', from: 3 },
    { name: '记录与复盘', from: 3 }
  ];

  function renderAct() {
    var T = S.tiktok, W = T.works.filter(function (w) { return w.id === T.lead; })[0] || T.works[0];
    var why = W.why.split('。');            // 「为什么能跑出 1.6M」的三个因素直接取自原文
    var factors = [W.cat].concat(why[1] ? why[1].split('，') : [])
      .map(function (f) { return f.replace(/[。，。]+$/, ''); });

    var flow = FLOW.map(function (f) {
      return '<li data-duty="' + f.from + '">' + esc(f.name) + '</li>';
    }).join('');

    sec.act.innerHTML =
      '<div class="act-stage">' +
        '<div class="act-panel">' +
          '<div class="act-step" data-step="0"><div class="act-inner">' +
            '<p class="act-k">' + esc(W.id) + ' · ' + esc(W.cat) + '</p>' +
            '<h2 class="act-h">一条视频跑出 ' + nf(W.views) + ' 播放，靠的是三件事同时对上</h2>' +
            '<ul class="act-factors">' + factors.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' +
            '<div class="act-metrics">' +
              '<div><b>' + nf(W.views) + '</b><span>播放</span></div>' +
              '<div><b>' + nf(W.likes) + '</b><span>点赞</span></div>' +
              '<div><b>' + W.rate + '%</b><span>互动率</span></div>' +
            '</div>' +
            '<p class="act-note">' + esc(why[0]) + '。' + esc(T.note) + '</p>' +
          '</div></div>' +
          '<div class="act-step" data-step="1"><div class="act-inner">' +
            '<p class="act-k">内容流程</p>' +
            '<h2 class="act-h">从选题到复盘，一共七步</h2>' +
            '<ul class="flow">' + flow +
              '<li class="flow-layer"><b>' + esc(T.duties[4].name) + '</b>' +
              '<span>' + esc(T.duties[4].text) + '</span></li>' +
            '</ul>' +
          '</div></div>' +
          '<div class="act-step" data-step="2"><div class="act-inner">' +
            '<p class="act-k">' + esc(S.practice.rally.label) + '</p>' +
            '<h2 class="act-h">然后我把这套流程交给 AI 跑了一遍</h2>' +
            '<p class="act-body">' + esc(S.practice.rally.heading) + '。' + esc(S.practice.rally.intro) + '</p>' +
            '<div class="act-metrics">' +
              '<div><b>' + esc(S.practice.rally.story[2].metric.value) + '</b>' +
              '<span>' + esc(S.practice.rally.story[2].metric.label) + '</span></div>' +
            '</div>' +
            '<p class="act-note">' + esc(S.practice.rally.story[2].source) + '</p>' +
            '<p class="act-links">' +
              '<a class="quiet" href="' + esc(S.practice.rally.play) + '" target="_blank" rel="noopener noreferrer">' + UI.play + '</a>' +
              '<a class="quiet" href="' + esc(S.practice.rally.code) + '" target="_blank" rel="noopener noreferrer">' + UI.code + '</a>' +
            '</p>' +
          '</div></div>' +
        '</div>' +
        '<div class="act-rail" aria-hidden="true"><i></i><i></i><i></i></div>' +
      '</div>';
  }

  /* ══════════ 3. 峰值：粒子收拢成环 → 计数 → 图从小框展开 ══════════ */

  function renderPeak() {
    var P = S.proof[0];
    var W = S.tiktok.works.filter(function (w) { return w.id === S.tiktok.lead; })[0] || S.tiktok.works[0];
    var why = W.why.split('。');
    sec.peak.innerHTML =
      '<div class="peak-stage">' +
        '<div class="peak-num" id="peak-num-box" aria-hidden="true">' +
          /* 先写最终值：静止态（reduced-motion / ?flat=1 / 无 JS）直接就是对的，
             滚动驱动时第一帧就会把它覆盖成 0 再数上去 */
          '<b id="peak-num">' + P.value.toFixed(P.dec) + esc(P.suffix) + '</b><span>' + esc(P.label) + '</span>' +
        '</div>' +
        '<figure class="peak-stack">' +
          '<div class="peak-fig" id="peak-fig">' +
            img('assets/works_tt5_03.png', W.title + ' 视频画面') +
          '</div>' +
          '<figcaption class="peak-cap" id="peak-cap">' +
            '<p class="peak-title">' + esc(W.title) + '</p>' +
            '<p class="peak-cat">' + esc(W.id) + ' · ' + esc(W.cat) + ' · ' + esc(P.source) + '</p>' +
            '<div class="peak-detail">' +
              '<div class="wk-facts">' +
                '<span><b>' + nf(W.views) + '</b> 播放</span>' +
                '<span><b>' + nf(W.likes) + '</b> 点赞</span>' +
                '<span><b>' + W.rate + '%</b> 互动率</span>' +
              '</div>' +
              '<p>' + esc(why[1] || W.why) + '。</p>' +
              '<a class="quiet" href="' + esc(W.url) + '" target="_blank" rel="noopener noreferrer">' + UI.original + '</a>' +
            '</div>' +
          '</figcaption>' +
        '</figure>' +
      '</div>';
  }

  /* ══════════ 4. 经历：教育 + 三段实习，横向轨道 ══════════ */

  function renderJourney() {
    var edu = S.education.map(function (e) {
      return '<li class="j-panel j-edu"><em>' + esc(e.level) + '</em><b>' + esc(e.period) + '</b>'
        + '<strong>' + esc(e.school) + '</strong><span>' + esc(e.major) + '</span></li>';
    }).join('');
    var job = S.experience.map(function (e) {
      return '<li class="j-panel j-job"><b>' + esc(e.period) + '</b>'
        + '<strong>' + esc(e.company) + '</strong><span>' + esc(e.role) + '</span>'
        + '<ul>' + e.points.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul></li>';
    }).join('');
    sec.journey.innerHTML =
      '<div class="journey-stage">' +
        '<div class="journey-head" data-reveal="up">' +
          '<h2 class="wipe"><span id="background-title">' + COPY.background + '</span></h2>' +
          '<div class="journey-about">' + S.identity.about.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div>' +
          '<div class="journey-foot">' +
            '<div class="journey-bar" aria-hidden="true"><i id="journey-bar"></i></div>' +
            '<p class="journey-count">教育 ×' + S.education.length + ' · 实习 ×' + S.experience.length + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="journey-window" data-reveal="fade">' +
          '<ol class="journey-track" id="journey-track">' + edu + job + '</ol>' +
        '</div>' +
      '</div>';
    sec.journey.setAttribute('aria-labelledby', 'background-title');
  }

  /* ══════════ 5. 能力：四个方向，随滚动依次点亮 ══════════ */

  function renderAbilities() {
    sec.ab.innerHTML =
      '<div class="abilities-head" data-reveal="up">' +
        '<h2 class="wipe"><span id="abilities-title">' + COPY.abilities + '</span></h2>' +
      '</div>' +
      '<ol class="ab-list">' + S.capabilities.map(function (c) {
        return '<li class="ability">' +
          '<div>' +
            '<h3 class="a-name">' + esc(c.name) + '</h3>' +
            '<p class="a-short">' + esc(c.short) + '</p>' +
            '<p class="a-summary">' + esc(c.summary) + '</p>' +
            '<ul class="a-ev">' + c.evidence.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul>' +
          '</div>' +
          '<div class="a-side"><a class="quiet" href="' + esc(jump(c.jump)) + '">' + UI.case + '</a></div>' +
          '<span class="a-mark" aria-hidden="true"></span>' +
        '</li>';
      }).join('') + '</ol>';
    sec.ab.setAttribute('aria-labelledby', 'abilities-title');
  }

  /* ══════════ 6. 作品全集：信息区，压紧节奏 ══════════ */

  function renderWorks() {
    var T = S.tiktok, IG = S.instagram, L = S.localization, H = S.hupu;

    var ttRows = T.works.map(function (w) {
      return '<li class="wk-row' + (w.id === T.lead ? ' is-peak' : '') + '">' +
        '<div class="wk-thumb">' + img(w.src, w.title + ' 视频静帧', '', true) + '</div>' +
        '<div class="wk-txt">' +
          '<p class="wk-tag"><b>' + esc(w.id) + '</b> · ' + esc(w.cat) + '</p>' +
          '<h4 class="wk-title"><a href="' + esc(w.url) + '" target="_blank" rel="noopener noreferrer">' + esc(w.title) + '</a></h4>' +
          '<p class="wk-why">' + esc(w.why) + '</p>' +
        '</div>' +
        '<div class="wk-metrics">' +
          '<div><b>' + nf(w.views) + '</b><span>播放</span></div>' +
          '<div><b>' + nf(w.likes) + '</b><span>点赞</span></div>' +
          '<div><b>' + w.rate + '%</b><span>互动率</span></div>' +
        '</div>' +
      '</li>';
    }).join('');

    var ttDuties = T.duties.map(function (d) {
      return '<li><em>' + esc(d.n) + '</em><div><b>' + esc(d.name) + '</b><span>' + esc(d.text) + '</span></div></li>';
    }).join('');

    var igItems = IG.works.map(function (w) {
      var m = w.metrics.map(function (x) { return '<span><b>' + esc(x.value) + '</b> ' + esc(x.label) + '</span>'; }).join('');
      var strip = w.images.map(function (im) {
        return '<div class="wk-thumb">' + img(im.src, im.alt, '', true) + '</div>';
      }).join('');
      return '<li class="wk-item">' +
        '<div class="wk-strip">' + strip + '</div>' +
        '<div class="wk-txt">' +
          '<p class="wk-tag">' + esc(w.cat) + (w.images.length > 1 ? ' · ' + w.images.length + ' 帧' : '') + '</p>' +
          '<h4 class="wk-title">' + esc(w.title) + '</h4>' +
          '<p class="wk-why">' + esc(w.desc) + '</p>' +
          '<p class="wk-why">' + esc(w.role) + '</p>' +
          '<div class="wk-facts">' + m + '<a class="wk-link" href="' + esc(w.url) + '" target="_blank" rel="noopener noreferrer">' + UI.original + '</a></div>' +
        '</div>' +
      '</li>';
    }).join('');

    var lSteps = L.steps.map(function (s) {
      return '<li><b>' + esc(s.n) + '</b><div><h4>' + esc(s.name) + '</h4><p>' + esc(s.text) + '</p></div></li>';
    }).join('');

    var hupu = H.articles.map(function (a) {
      return '<article class="wk-art">' +
        '<div class="wk-art-head">' +
          '<h4><a href="' + esc(a.url) + '" target="_blank" rel="noopener noreferrer">' + esc(a.title) + '</a></h4>' +
          '<div class="wk-facts"><span><b>' + a.views.toLocaleString('en-US') + '</b> 阅读</span>' +
          '<span><b>' + a.replies + '</b> 回复</span><span>' + esc(a.cat) + '</span></div>' +
        '</div>' +
        '<p>' + esc(a.desc) + '</p>' +
      '</article>';
    }).join('');

    /* 口径与出处集中在结尾一处，避免逐条重复 */
    var credits = [];
    IG.works.forEach(function (w) { if (credits.indexOf(w.credit) < 0) credits.push(w.credit); });
    var notes = '<p class="wk-notes-title">数据口径与出处</p>' +
      [T.note, T.account.followersNote, IG.note, IG.note2, L.countNote, H.note]
      .concat(credits).map(function (n) { return '<p>' + esc(n) + '</p>'; }).join('');

    sec.works.innerHTML =
      '<div class="works-wrap">' +
        '<div class="works-head" data-reveal="up">' +
          /* 全页唯一一条 eyebrow，且本身是信息（作品数量） */
          '<p class="works-tally">TikTok ' + T.works.length + ' 条 · Instagram ' + IG.works.length + ' 项 · ' +
            '日韩教学内容 · 虎扑 ' + H.articles.length + ' 篇</p>' +
          '<h2 class="wipe"><span id="works-title">' + COPY.works + '</span></h2>' +
        '</div>' +

        '<section class="wk-block" id="works-tiktok" aria-labelledby="wk-tt">' +
          '<div class="wk-head" data-reveal="up">' +
            '<h3 id="wk-tt">' + esc(T.heading) + '</h3>' +
            '<p class="wk-brief">' + esc(T.brief) + '</p>' +
            '<ul class="chips">' + T.scope.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>' +
            '<p class="wk-acct">' + esc(T.account.name) + ' · <b>' + esc(T.account.followers) + '</b> 粉丝</p>' +
          '</div>' +
          '<ol class="wk-list">' + ttRows + '</ol>' +
          '<details class="wk-duties"><summary>' + UI.duties + '</summary><ol>' + ttDuties + '</ol></details>' +
        '</section>' +

        '<section class="wk-block" id="works-instagram" aria-labelledby="wk-ig">' +
          '<div class="wk-head" data-reveal="up">' +
            '<h3 id="wk-ig">' + esc(IG.heading) + '</h3>' +
            '<p class="wk-brief">' + esc(IG.brief) + '</p>' +
            '<ul class="chips">' + IG.tags.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>' +
          '</div>' +
          '<ol class="wk-grid">' + igItems + '</ol>' +
        '</section>' +

        '<section class="wk-block" id="works-localization" aria-labelledby="wk-loc">' +
          '<div class="wk-head" data-reveal="up">' +
            '<h3 id="wk-loc">' + esc(L.heading) + '</h3>' +
            '<p class="wk-brief">' + esc(L.brief) + '</p>' +
            '<div class="wk-facts"><span><b>' + esc(L.count.value) + '</b> ' + esc(L.count.label) + '</span></div>' +
            '<p class="wk-credit">' + esc(L.credit) + '</p>' +
            '<a class="quiet" href="' + esc(L.accountUrl) + '" target="_blank" rel="noopener noreferrer">' + UI.localizationAccount + '</a>' +
          '</div>' +
          '<div class="wk-grid">' +
            '<figure class="wk-shot" data-reveal="clip" data-watch="#works-localization">' +
              img(L.capture.src, L.capture.alt, '', true) +
              '<figcaption>' + esc(L.capture.caption) + '</figcaption>' +
            '</figure>' +
            '<ol class="wk-steps">' + lSteps + '</ol>' +
          '</div>' +
        '</section>' +

        '<section class="wk-block" id="works-hupu" aria-labelledby="wk-hp">' +
          '<div class="wk-head" data-reveal="up">' +
            '<h3 id="wk-hp">' + esc(H.heading) + '</h3>' +
            '<p class="wk-brief">' + esc(H.brief) + '</p>' +
            '<ul class="chips">' + H.tags.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>' +
            '<p class="wk-credit">' + esc(H.role) + '</p>' +
          '</div>' +
          '<div class="wk-grid">' + hupu + '</div>' +
          '<aside class="wk-art">' +
            '<p class="wk-tag">' + esc(H.event.label) + '</p>' +
            '<h4>' + esc(H.event.title) + '</h4>' +
            '<p>' + esc(H.event.text) + '</p>' +
            '<p><a class="wk-link" href="' + esc(jump(H.event.jump)) + '">' + UI.eventJump + '</a></p>' +
          '</aside>' +
        '</section>' +

        '<div class="wk-notes">' + notes + '</div>' +
      '</div>';
    sec.works.setAttribute('aria-labelledby', 'works-title');
  }

  /* ══════════ 7. 账号实践：抖音「詹库侠」+ 开拍 RALLY ══════════ */

  function renderPractice() {
    var D = S.practice.douyin, R = S.practice.rally;
    var story = R.story.map(function (s) {
      var metric = s.metric
        ? '<p class="pr-metric"><b>' + esc(s.metric.value) + '</b><span>' + esc(s.metric.label) + '</span></p>'
          + '<p class="pr-src">' + esc(s.source) + '</p>'
        : '';
      return '<li><em>' + esc(s.n) + '</em><h4>' + esc(s.name) + '</h4><p>' + esc(s.text) + '</p>' + metric + '</li>';
    }).join('');

    sec.practice.innerHTML =
      '<div class="practice-wrap">' +
        '<div class="practice-head" data-reveal="up">' +
          '<h2 class="wipe"><span id="practice-title">' + COPY.practice + '</span></h2>' +
        '</div>' +
        '<article class="pr-douyin" id="practice-douyin" data-reveal="up">' +
          '<div>' +
            '<p class="pr-label">' + esc(D.label) + '</p>' +
            '<h3>' + esc(D.name) + '</h3>' +
            '<p>' + esc(D.desc) + '</p>' +
            '<ul class="chips">' + D.tags.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
          '</div>' +
          '<a class="btn" href="' + esc(D.url) + '" target="_blank" rel="noopener noreferrer">' + UI.account + '</a>' +
        '</article>' +

        '<article class="pr-rally" id="practice-rally" data-reveal="up">' +
          '<div>' +
            '<p class="pr-label">' + esc(R.label) + '</p>' +
            '<h3>' + esc(R.heading) + '</h3>' +
            '<p class="pr-intro">' + esc(R.intro) + '</p>' +
            '<div class="pr-actions">' +
              '<a class="btn" href="' + esc(R.play) + '" target="_blank" rel="noopener noreferrer">' + UI.play + '</a>' +
              '<a class="quiet" href="' + esc(R.code) + '" target="_blank" rel="noopener noreferrer">' + UI.code + '</a>' +
            '</div>' +
          '</div>' +
          '<figure class="pr-visual" data-reveal="clip" data-watch="#practice">' +
            img(R.visual.src, R.visual.alt, '', true) +
            '<figcaption>' + esc(R.visual.caption) + '</figcaption>' +
          '</figure>' +
        '</article>' +
        '<ol class="pr-story">' + story + '</ol>' +
      '</div>';
    sec.practice.setAttribute('aria-labelledby', 'practice-title');
  }

  /* ══════════ 8. 联系：邮箱是主角，结尾收住 ══════════ */

  function renderContact() {
    var C = S.contact, edu = S.education[0];
    sec.contact.innerHTML =
      '<div class="contact-inner">' +
        '<div data-reveal="up">' +
          '<h2 class="wipe"><span id="contact-title">' + esc(C.heading) + '</span></h2>' +
          '<p class="ct-lead">' + esc(C.lead) + '</p>' +
        '</div>' +
        '<a class="ct-mail" href="mailto:' + esc(C.email) + '">' +
          '<small>' + UI.mail + '</small>' +
          '<strong>' + esc(C.email) + '</strong>' +
        '</a>' +
        '<div class="ct-row">' +
          '<div><small>' + UI.phone + '</small>' +
            '<a class="ct-val" href="tel:+86' + esc(C.phone) + '">' + esc(C.phoneDisplay) + '</a></div>' +
          '<div><small>' + UI.github + '</small>' +
            '<a class="ct-val" href="' + esc(C.githubUrl) + '" target="_blank" rel="noopener noreferrer">@' + esc(C.github) + '</a></div>' +
          '<div><small>' + UI.resume + '</small>' +
            '<a class="ct-val" href="' + esc(asset(C.resume.src)) + '" download="' + esc(C.resume.name) + '">' + esc(C.resume.name) + '</a>' +
            '<span class="ct-note">' + esc(C.resume.note) + '</span></div>' +
        '</div>' +
        '<p class="ct-end">' +
          '<span>' + esc(S.identity.name) + ' · ' + esc(S.identity.cohort) + ' · ' + esc(edu.school) + '</span>' +
          '<a href="#home">' + UI.top + '</a>' +
        '</p>' +
      '</div>';
    sec.contact.setAttribute('aria-labelledby', 'contact-title');
  }

  /* ══════════ 9. 顶栏 ══════════ */

  function renderTop() {
    $('#top-name').innerHTML = esc(S.identity.name) + '<span>' + esc(S.identity.title) + '</span>';
    $('#top-nav').innerHTML = UI.nav.map(function (n) {
      return '<a href="' + n[1] + '">' + n[0] + '</a>';
    }).join('') + '<a class="is-mail" href="mailto:' + esc(S.contact.email) + '">' + UI.mail + '</a>';
  }

  /* ══════════ 10. 粒子场（手写 canvas 2D） ══════════ */
  /* 设计要点：
     · 底层永远是一圈缓慢转动的尘埃（不是满屏噪点）：每个粒子有一个
       环上的目标位置，用很松的弹簧拉过去，再叠一层廉价的流场噪声。
     · 指针位置：局部排斥 + 提亮，世界整体向指针方向轻微倾斜。
     · 滚动速度（Motion.velocity）：抬高粒子速度、亮度，并把环向外推。
     · 峰值行程把 springK 拉高、环半径收小 → 尘埃收拢成一个清晰的环。
     · 只有 6 个 alpha 桶，每帧按桶一次性 fill，600 个粒子的填充次数从 600 降到 6。 */

  function initField() {
    var cv = $('#field');
    var host = $('#world');
    var ctx = cv.getContext('2d', { alpha: true });
    if (!ctx) return null;

    var TAU = Math.PI * 2;
    var small = matchMedia('(max-width:760px)').matches;
    var lowCore = (navigator.hardwareConcurrency || 8) <= 4;
    var lite = small || lowCore;

    var W = 0, H = 0, DPR = 1, N = 0;
    var X, Y, VX, VY, RD, AN, PH, RF, WG, BIN;
    var cx = 0, cy = 0, R0 = 0, t = 0, last = 0;
    var px = .5, py = .44, tpx = .5, tpy = .44;      // 指针（目标 / 缓动后）
    var converge = 0, wantConverge = 0, energy = 0;

    var BINS = 6;
    var ALPHA = [.13, .18, .26, .36, .5, .66];
    var COLOR = ALPHA.map(function (a) { return 'rgba(146,239,171,' + a + ')'; });

    function resize() {
      DPR = Math.min(2, window.devicePixelRatio || 1);
      W = window.innerWidth; H = window.innerHeight;
      // 像素预算保护：大屏 + 高 DPR 时降 DPR，仍然不超过 2
      var budget = 3.4e6;
      if (W * H * DPR * DPR > budget) DPR = Math.max(1, Math.sqrt(budget / (W * H)));
      cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      cx = W * .5; cy = H * .46; R0 = Math.min(W, H) * .38;
    }

    function seed() {
      var area = W * H;
      N = Math.round(Math.min(720, Math.max(150, area / 2000)));
      if (lite) N = Math.round(N * (small ? .3 : .42));   // 窄屏 / 低端机：粒子数大幅减少
      X = new Float32Array(N); Y = new Float32Array(N);
      VX = new Float32Array(N); VY = new Float32Array(N);
      RD = new Float32Array(N); AN = new Float32Array(N);
      PH = new Float32Array(N); RF = new Float32Array(N);
      WG = new Float32Array(N); BIN = new Uint8Array(N);
      for (var i = 0; i < N; i++) {
        var stray = Math.random() < .28;                  // 近三成散点，撑开空间深度
        var a = Math.random() * TAU;
        var r = R0 * (stray ? .55 + Math.random() * .75 : .84 + Math.random() * .3);
        X[i] = cx + Math.cos(a) * r;
        Y[i] = cy + Math.sin(a) * r * .64;
        VX[i] = 0; VY[i] = 0;
        RD[i] = stray ? .5 + Math.random() * .9 : .7 + Math.random() * 1.7;
        AN[i] = a; PH[i] = Math.random() * TAU; RF[i] = r / R0;
        WG[i] = stray ? .5 : 1;
        BIN[i] = (Math.random() * 3) | 0;
      }
    }

    function paint(now, animate) {
      var dt = Math.min(48, last ? now - last : 16) / 16.67;
      last = now;
      if (animate) t += dt * .016;

      converge += (wantConverge - converge) * (animate ? .09 * dt : 1);
      var vel = animate ? Math.min(1, Motion.velocity() / 24) : 0;
      energy += (vel - energy) * .12;
      px += (tpx - px) * .06; py += (tpy - py) * .06;

      var ox = cx + (px - .5) * W * .07;                  // 世界向指针方向轻微倾斜
      var oy = cy + (py - .44) * H * .07;
      var mx = px * W, my = py * H;
      var pull = 180 + energy * 60;

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';

      for (var i = 0; i < N; i++) {
        // 环上的目标点：慢速自转 + 呼吸
        var ang = AN[i] + (animate ? t * .05 : 0);
        var rr = R0 * RF[i] * (1 - .13 * converge) * (1 + .07 * Math.sin(PH[i] + t * .45));
        var tx = ox + Math.cos(ang) * rr;
        var ty = oy + Math.sin(ang) * rr * .64;
        var k = (.0016 + .008 * converge) * WG[i] * dt;

        if (animate) {
          VX[i] += (tx - X[i]) * k;
          VY[i] += (ty - Y[i]) * k;
          var f = Math.sin((X[i] + Y[i]) * .0016 + t * .5);
          VX[i] += Math.cos(f * 3.1) * .05 * (.5 + energy * 2);
          VY[i] += Math.sin(f * 3.1) * .05 * (.5 + energy * 2);
        } else {
          X[i] = tx; Y[i] = ty; VX[i] = 0; VY[i] = 0;
        }

        // 指针：近距离排斥 + 提亮
        var dx = X[i] - mx, dy = Y[i] - my;
        var d2 = dx * dx + dy * dy;
        var near = 0;
        if (d2 < pull * pull) {
          var d = Math.sqrt(d2) || 1;
          near = 1 - d / pull;
          if (animate) { VX[i] += dx / d * near * .5; VY[i] += dy / d * near * .5; }
        }

        if (animate) {
          VX[i] *= .945; VY[i] *= .945;                    // 阻尼，保证不发散
          X[i] += VX[i] * dt; Y[i] += VY[i] * dt;
        }

        var b = BIN[i];
        if (near > .5) b += 2; else if (near > .2) b += 1;
        if (energy > .3) b += 1;
        BIN[i] = b > 5 ? 5 : b;
      }

      // 环收拢时的细线，让「环」这个形状读得出来
      if (converge > .12) {
        ctx.beginPath();
        ctx.ellipse(ox, oy, R0 * (1 - .13 * converge) * .99, R0 * (1 - .13 * converge) * .64, 0, 0, TAU);
        ctx.strokeStyle = 'rgba(146,239,171,' + (.09 * converge).toFixed(3) + ')';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 按 alpha 桶批量填充：一次 fill 画一批同亮度的粒子
      var r, j;
      for (var b2 = 0; b2 < BINS; b2++) {
        var open = false;
        for (j = 0; j < N; j++) {
          if (BIN[j] !== b2) continue;
          r = RD[j] * (1 + Math.min(1, RD[j] / 2) * energy * .4);
          if (!open) { ctx.beginPath(); open = true; }
          ctx.moveTo(X[j] + r, Y[j]);
          ctx.arc(X[j], Y[j], r, 0, TAU);
        }
        if (open) { ctx.fillStyle = COLOR[b2]; ctx.fill(); }
      }

      // 中心的一点光源 + 指针处的一点柔光
      var g = ctx.createRadialGradient(ox, oy, 0, ox, oy, Math.min(W, H) * .55);
      g.addColorStop(0, 'rgba(146,239,171,' + (.035 + energy * .05 + converge * .04).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(146,239,171,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      if (animate) {
        var pg = ctx.createRadialGradient(mx, my, 0, mx, my, 190);
        pg.addColorStop(0, 'rgba(146,239,171,.05)');
        pg.addColorStop(1, 'rgba(146,239,171,0)');
        ctx.fillStyle = pg;
        ctx.fillRect(mx - 190, my - 190, 380, 380);
      }
      ctx.globalCompositeOperation = 'source-over';
      return true;
    }

    resize(); seed();
    paint(performance.now(), false);      // 先铺一张静态底，避免首帧空白

    if (reduce) return { setConverge: function () {}, refresh: function () {} };

    // 循环绑定在沉浸区哨兵上：滚过峰值就停，回到首屏再续
    Motion.loopWhileVisible(host, function (now) { return paint(now, true); });

    var mm = matchMedia('(pointer:coarse)');
    if (!mm.matches) {
      window.addEventListener('pointermove', function (e) {
        tpx = e.clientX / window.innerWidth;
        tpy = e.clientY / window.innerHeight;
      }, { passive: true });
    }

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { resize(); seed(); paint(performance.now(), true); }, 180);
    });

    // reduced-motion 在运行中被打开：立刻停手，落成一张静态底
    Motion.onChange(function (on) { if (on) paint(performance.now(), false); });

    return {
      setConverge: function (v) { wantConverge = v; },
      refresh: function () { resize(); seed(); }
    };
  }

  /* ══════════ 11. 滚动驱动：打钉 / 峰值 / 轨道 / 点亮 / 画面明度 ══════════ */
  /* 所有 rect 读取集中在同一帧的前半段，写样式在后半段，避免读写交错抖动布局 */

  function initScroll(field) {
    var act = sec.act, peak = sec.peak, journey = sec.journey;
    var cv = $('#field'), shade = $('#field-shade');
    var track = $('#journey-track'), jbar = $('#journey-bar');
    var steps = all('.act-step', act), ticks = all('.act-rail i', act);
    var rows = all('.ability');
    var P0 = S.proof[0];
    var numEl = $('#peak-num'), figEl = $('#peak-fig'), capEl = $('#peak-cap'), boxEl = $('#peak-num-box');
    var stageEl = $('.peak-stage', peak), stackEl = $('.peak-stack', peak);

    var lastAct = -1, lastAb = -1, lastNum = '', lastFig = -1, lastCap = -1,
        lastNumOp = -1, lastOp = -1, lastShade = -1, lastJbar = -1, lastFigOp = -1;
    var trackMax = 0, rowTops = [], wide = false, pinned = false;
    var offX = 0, offY = 0;
    var ROUND = function (v) { return Math.round(v * 1000) / 1000; };

    /* 量一下图框的布局中心相对舞台中心的偏移：展开时把这个偏移线性收掉，
       小框就从 1.6M 的中心处长出来，而不是从数字旁边冒出来。 */
    function measurePeak() {
      if (!stageEl || !figEl) return;
      offX = (stackEl.offsetLeft + figEl.offsetLeft + figEl.offsetWidth / 2) - stageEl.clientWidth / 2;
      offY = (stackEl.offsetTop + figEl.offsetTop + figEl.offsetHeight / 2) - stageEl.clientHeight / 2;
    }

    function measure() {
      wide = matchMedia('(min-width:901px)').matches;
      // 窄屏下峰值段不再打钉（CSS 也把图框压到最终态），这时不写任何行内变换
      pinned = matchMedia('(min-width:761px)').matches;
      if (track && wide) trackMax = Math.max(0, track.scrollWidth - track.parentNode.clientWidth);
      var y = window.scrollY;
      rowTops = rows.map(function (r) { return r.getBoundingClientRect().top + y; });
      measurePeak();
    }

    function setAct(idx) {
      lastAct = idx;
      // 窄屏与静止态下三段是纵向展开的，全部可见，就不动 Tab 顺序
      var stacked = stackedLayout();
      steps.forEach(function (s, i) {
        var on = i === idx;
        s.classList.toggle('on', on);
        // 隐藏的步骤不参与 Tab 顺序，但文字仍留在无障碍树里供线性阅读
        all('a,button', s).forEach(function (f) {
          if (on || stacked) f.removeAttribute('tabindex');
          else f.setAttribute('tabindex', '-1');
        });
      });
      ticks.forEach(function (k, i) { k.classList.toggle('on', i <= idx); });
    }

    /* 静止态（reduced-motion / flat）与窄屏下，打钉舞台与峰值都退成纵向静态排版 */
    function stackedLayout() { return reduce || !pinned; }

    function onScroll() {
      /* ── 读 ── */
      var actP = Motion.pinProgress(act);
      var peakP = Motion.pinProgress(peak);
      var jP = (wide && !reduce) ? Motion.pinProgress(journey) : (flat ? 1 : 0);
      var probe = window.scrollY + window.innerHeight * .52;
      var abIdx = -1;
      for (var i = 0; i < rowTops.length; i++) if (rowTops[i] < probe) abIdx = i;

      /* ── 写 ── */
      if (!reduce) {
        var idx = actP >= 2 / 3 ? 2 : actP >= 1 / 3 ? 1 : 0;
        if (!stackedLayout() && idx !== lastAct) setAct(idx);
      }

      if (track && wide && !reduce) track.style.transform = 'translate3d(' + (-jP * trackMax).toFixed(1) + 'px,0,0)';
      if (jbar && lastJbar !== ROUND(jP)) { lastJbar = ROUND(jP); jbar.style.transform = 'scaleX(' + lastJbar + ')'; }

      if (abIdx !== lastAb) {
        lastAb = abIdx;
        rows.forEach(function (r, i) {
          r.classList.toggle('on', i === abIdx);
          r.classList.toggle('past', i < abIdx);
        });
      }

      // 峰值：计数 + 图框展开 + 说明浮现（全部由滚动行程驱动，不用定时器）
      // 节奏：0→0.30 计数收束 · 0.30→0.52 定住 · 0.52→0.70 数字退场
      //       0.34→0.98 图框从小框展到全高 · 0.80→0.96 说明浮现
      if (numEl && !reduce && pinned) {
        var cp = clamp01(peakP / .3);
        var txt = (P0.value * (1 - Math.pow(1 - cp, 3))).toFixed(P0.dec) + P0.suffix;
        if (txt !== lastNum) { numEl.textContent = txt; lastNum = txt; }
        var nop = ROUND(clamp01(1 - (peakP - .52) / .18));
        if (nop !== lastNumOp) {
          lastNumOp = nop;
          numEl.style.opacity = nop;
          boxEl.style.transform = 'translateY(' + (-38 * (1 - nop)).toFixed(1) + 'px)';
        }
        var fp = ROUND(clamp01((peakP - .34) / .64));
        if (fp !== lastFig) {
          lastFig = fp;
          var e = 1 - Math.pow(1 - fp, 2);
          var ins = (46 - 46 * e).toFixed(1);
          var k = 1 - e;
          figEl.style.transform = 'translate3d(' + (-offX * k).toFixed(1) + 'px,' + (-offY * k).toFixed(1) + 'px,0) scale('
            + (0.78 + 0.22 * e).toFixed(3) + ')';
          figEl.style.clipPath = 'inset(' + ins + '% ' + ins + '% round 14px)';
        }
        // 图框先隐着，等 1.6M 数完再从小框里显出来
        var fop = ROUND(clamp01((peakP - .3) / .1));
        if (fop !== lastFigOp) { lastFigOp = fop; figEl.style.opacity = fop; }
        var cop = ROUND(clamp01((peakP - .8) / .16));
        if (cop !== lastCap) { lastCap = cop; capEl.style.opacity = cop; }
      }

      // 画面明度：过了峰值之后粒子退到背景里，信息区保持可读
      var fade = clamp01((peakP - .55) / .4);
      if (field) field.setConverge(clamp01(peakP / .34));
      var op = ROUND(reduce ? .76 : .92 - .58 * fade), sh = ROUND(.62 + .2 * fade);
      if (op !== lastOp) { lastOp = op; cv.style.opacity = op; }
      if (sh !== lastShade) { lastShade = sh; shade.style.opacity = sh; }
    }

    measure();                       // 先量一次几何，再接线，保证首帧写出的偏移是对的
    Motion.onScroll(onScroll);
    window.addEventListener('resize', function () { measure(); }, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    window.addEventListener('load', measure);
    // 打钉舞台的初始状态：静止态下三段全部展开并保持可聚焦
    if (reduce) { steps.forEach(function (s) { s.classList.add('on'); }); lastAct = 0; }
    else setAct(0);
  }

  /* ══════════ 12. 启动 ══════════ */

  renderTop();
  renderHome();
  renderAct();
  renderPeak();
  renderJourney();
  renderAbilities();
  renderWorks();
  renderPractice();
  renderContact();

  if (flat) all('details').forEach(function (d) { d.open = true; });

  var field = initField();
  initScroll(field);

  // 首屏：给一帧时间让字体就位，再让名字逐字浮出
  var home = sec.home;
  if (reduce) home.classList.add('in');
  else requestAnimationFrame(function () { requestAnimationFrame(function () { home.classList.add('in'); }); });

  // 自动接线揭示与计数（内容由本文件注入，所以必须显式调用一次）
  Motion.reveal();
  Motion.countAll();
  Motion.requestTick();
}());
