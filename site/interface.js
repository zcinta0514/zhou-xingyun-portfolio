/* 界面微交互：保留原生链接与 details 语义，只为操作过程补上轻量反馈。 */
(function () {
  'use strict';
  window.initInterfaceMotion = function (options) {
    var flat = !!(options && options.flat);
    var reduce = matchMedia('(prefers-reduced-motion: reduce)');
    var fine = matchMedia('(hover: hover) and (pointer: fine)');
    var records = [], magnetic = [];
    var ease = 'cubic-bezier(.22,1,.36,1)';
    var quiet = function () { return flat || reduce.matches; };

    /* 导航的线在各文字下方移动，链接自身和点击范围不移动。 */
    var nav = document.querySelector('.bar-nav');
    var header = document.getElementById('bar');
    var menuButton = document.querySelector('.mobile-menu');
    var mobile = matchMedia('(max-width: 1024px)');
    function menu(open, restoreFocus) {
      open = mobile.matches && open;
      header.classList.toggle('menu-open', open);
      menuButton.setAttribute('aria-expanded', String(open));
      nav.inert = mobile.matches && !open;
      if (restoreFocus) menuButton.focus({preventScroll:true});
    }
    menuButton.addEventListener('click', function () { menu(menuButton.getAttribute('aria-expanded') !== 'true', false); });
    document.addEventListener('pointerdown', function (event) {
      if (mobile.matches && !header.contains(event.target)) menu(false, false);
    }, true);
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && header.classList.contains('menu-open')) { event.preventDefault(); menu(false, true); }
    });
    header.addEventListener('click', function (event) {
      var link = event.target.closest('a');
      if (!link || !mobile.matches) return;
      menu(false, false);
      if (link.hash) requestAnimationFrame(function () {
        var target = document.getElementById(link.hash.slice(1));
        if (target) { if (!target.hasAttribute('tabindex')) target.tabIndex = -1; target.focus({preventScroll:true}); }
      });
    });
    function menuMode() { menu(false, mobile.matches && nav.contains(document.activeElement)); }
    if (mobile.addEventListener) mobile.addEventListener('change', menuMode);
    else mobile.addListener(menuMode);
    menuMode();
    var line = document.createElement('span');
    line.className = 'ui-nav-line'; line.setAttribute('aria-hidden', 'true');
    nav.appendChild(line);
    var hover = null;
    function navPosition() {
      if (mobile.matches) { line.style.opacity = '0'; return; }
      var focused = nav.contains(document.activeElement) ? document.activeElement.closest('a') : null;
      var target = hover || focused || nav.querySelector('[aria-current="true"]');
      if (!target) { line.style.opacity = '0'; return; }
      var a = target.getBoundingClientRect(), b = nav.getBoundingClientRect();
      line.style.transform = 'translateX(' + (a.left - b.left) + 'px) scaleX(' + a.width + ')';
      line.style.opacity = '1';
    }
    nav.addEventListener('pointerover', function (e) { hover = e.target.closest('a'); navPosition(); });
    nav.addEventListener('pointerleave', function () { hover = null; navPosition(); });
    nav.addEventListener('focusin', navPosition);
    nav.addEventListener('focusout', function () { requestAnimationFrame(navPosition); });
    var observer = new MutationObserver(navPosition);
    observer.observe(nav, {subtree:true, attributes:true, attributeFilter:['aria-current']});
    window.addEventListener('resize', navPosition, {passive:true});
    if (document.fonts) document.fonts.ready.then(navPosition);

    /* 分类目录只在作品章停靠，随阅读位置标出当前类别，不改变原生滚动。 */
    var works = document.getElementById('works');
    var workLinks = Array.from(document.querySelectorAll('.works-index a'));
    var blocks = workLinks.map(function (link) { return document.querySelector(link.getAttribute('href')); });
    var workIndex = document.querySelector('.works-index');
    var workCurrent = null, workFrame = 0;
    function workPosition() {
      workFrame = 0;
      var section = works.getBoundingClientRect(), selected = null;
      var readingLine = header.getBoundingClientRect().bottom + workIndex.offsetHeight + 24;
      if (section.top < innerHeight && section.bottom > readingLine) {
        selected = workLinks[0];
        blocks.forEach(function (block, i) { if (block.getBoundingClientRect().top <= readingLine) selected = workLinks[i]; });
      }
      if (selected === workCurrent) return;
      workCurrent = selected;
      workLinks.forEach(function (link) {
        if (link === selected) link.setAttribute('aria-current','true');
        else link.removeAttribute('aria-current');
      });
    }
    function scheduleWork() { if (!workFrame) workFrame = requestAnimationFrame(workPosition); }
    window.addEventListener('scroll', scheduleWork, {passive:true});
    window.addEventListener('resize', scheduleWork, {passive:true});
    document.addEventListener('toggle', scheduleWork, true);
    workPosition();

    /* 主行动文字最多跟手 3px；不采用参考站的全局磁场和常驻动画循环。 */
    document.querySelectorAll('.hero-entry,.pr-launch').forEach(function (link) {
      var content = document.createElement('span'); content.className = 'ui-magnetic-content';
      while (link.firstChild) content.appendChild(link.firstChild);
      link.appendChild(content); magnetic.push(content);
      function rest() { content.style.setProperty('--mag-x', '0px'); content.style.setProperty('--mag-y', '0px'); }
      link.addEventListener('pointermove', function (event) {
        if (quiet() || !fine.matches || event.pointerType !== 'mouse') return;
        var r = link.getBoundingClientRect();
        content.style.setProperty('--mag-x', Math.max(-3,Math.min(3,(event.clientX-r.left-r.width/2)*.06)).toFixed(2)+'px');
        content.style.setProperty('--mag-y', Math.max(-2,Math.min(2,(event.clientY-r.top-r.height/2)*.09)).toFixed(2)+'px');
      });
      link.addEventListener('pointerleave', rest);
      link.addEventListener('blur', rest);
    });

    /* 展开时仅一个 details 改变高度，结束后立即还原 auto，支持反向与连续点击。 */
    document.querySelectorAll('.work-notes,.pr-making').forEach(function (details) {
      var summary = details.querySelector(':scope > summary');
      if (!summary) return;
      var body = document.createElement('div'); body.className = 'ui-disclosure';
      Array.from(details.childNodes).forEach(function (child) { if (child !== summary) body.appendChild(child); });
      details.appendChild(body);
      var record = {details:details, summary:summary, body:body, desired:details.open, animation:null, frame:0, timer:0, serial:0};
      records.push(record);
      function semantics() {
        summary.setAttribute('aria-expanded', String(record.desired));
        details.classList.toggle('ui-expanded', record.desired);
        body.inert = !record.desired;
      }
      function finish() {
        if (record.frame) cancelAnimationFrame(record.frame); record.frame = 0;
        clearTimeout(record.timer); record.timer = 0;
        var animation = record.animation; record.animation = null;
        details.open = record.desired;
        details.style.height = ''; details.style.overflow = '';
        if (animation) { animation.onfinish = null; animation.cancel(); }
        semantics();
        if (window.__scrollMotion) window.__scrollMotion.refresh();
      }
      record.finish = finish;
      function toggle() {
        var start = details.getBoundingClientRect().height;
        var serial = ++record.serial;
        record.desired = !record.desired;
        if (record.frame) cancelAnimationFrame(record.frame);
        clearTimeout(record.timer);
        if (record.animation) { record.animation.onfinish = null; record.animation.cancel(); record.animation = null; }
        // 固定当前高度再打开原生内容，等下一帧测量实际内容，不把旧的闭合高度当终点。
        details.style.height = start + 'px'; details.style.overflow = 'hidden'; details.open = true;
        semantics();
        if (quiet() || !details.animate) { finish(); return; }
        record.frame = requestAnimationFrame(function () {
          record.frame = 0;
          if (serial !== record.serial) return;
          var style = getComputedStyle(details);
          var closed = summary.getBoundingClientRect().height + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth) + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
          var end = closed + (record.desired ? body.getBoundingClientRect().height : 0);
          record.animation = details.animate([{height:start+'px'}, {height:end+'px'}], {duration:280, easing:ease, fill:'forwards'});
          record.animation.onfinish = finish;
          // 后台标签的完成事件可能推迟，状态仍需在本次操作后确定收敛。
          record.timer = setTimeout(function () { if (serial === record.serial) finish(); }, 360);
        });
      }
      summary.addEventListener('click', function (event) { event.preventDefault(); toggle(); });
      body.addEventListener('focusin', function () { if ((record.animation || record.frame) && record.desired) finish(); });
      details.addEventListener('toggle', function () {
        if (!record.animation && !record.frame) { record.desired = details.open; semantics(); }
      });
      semantics();
    });

    function motionChanged() {
      if (!quiet()) return;
      records.forEach(function (record) { if (record.animation || record.frame) record.finish(); });
      magnetic.forEach(function (node) { node.style.setProperty('--mag-x','0px'); node.style.setProperty('--mag-y','0px'); });
    }
    if (reduce.addEventListener) reduce.addEventListener('change', motionChanged);
    else reduce.addListener(motionChanged);
    navPosition();
    return {get info() { return {quiet:quiet(), disclosures:records.map(function (record) { return {open:record.details.open, desired:record.desired, animating:!!record.animation || !!record.frame}; })}; }};
  };
}());
