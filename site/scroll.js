/* 原生滚动的视觉层。壳只负责测量，内部手势、链接和内容的 transform 均不接管。 */
(function () {
  'use strict';
  var active = null;
  var clamp = function (value) { return Math.max(0, Math.min(1, value)); };
  var progress = function (top, viewport, from, to) { return clamp((viewport * from - top) / (viewport * (from - to))); };

  window.initScrollMotion = function (options) {
    if (active) active.destroy();
    options = options || {};
    var html = document.documentElement;
    var flat = !!options.flat || html.classList.contains('flat') || /[?&]flat=1(?:&|$)/.test(location.search);
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    var compact = window.matchMedia('(max-width: 1024px), (pointer: coarse)');
    var destroyed = false, enabled = false, raf = 0, dirty = true;
    var updateCount = 0, measureCount = 0;
    var listeners = [], wrappers = [], created = [], scenes = [], headings = [], pointers = new Map();
    var resizeObserver = null, stateObserver = null;
    var bounds = { viewport:window.innerHeight || 800, height:0, heroTop:0, contactTop:0, expTop:0, expEnd:0, rows:[] };
    var last = { scroll:0, reading:0, hero:0, contact:1, experience:1 };
    var hero = document.getElementById('home');
    var bar = document.getElementById('bar');
    var experience = document.getElementById('exps');
    var contact = document.getElementById('contact');
    var contactContent = contact && contact.querySelector('.contact-in');
    var contactComplete = false;
    var media = null;

    function property(node, name, value) {
      if (node && node.style.getPropertyValue(name) !== value) node.style.setProperty(name, value);
    }
    function on(node, type, handler, options) {
      node.addEventListener(type, handler, options);
      listeners.push(function () { node.removeEventListener(type, handler, options); });
    }
    function listenMedia(query, handler) {
      if (query.addEventListener) on(query, 'change', handler);
      else { query.addListener(handler); listeners.push(function () { query.removeListener(handler); }); }
    }
    function wrap(node, shellClass, layerClass) {
      var shell = document.createElement('div'); shell.className = shellClass;
      node.parentNode.insertBefore(shell, node);
      var layer = shell;
      if (layerClass) { layer = document.createElement('div'); layer.className = layerClass; shell.appendChild(layer); }
      layer.appendChild(node); wrappers.push({shell:shell, original:node});
      return shell;
    }
    function sceneValue(scene, p) {
      scene.value = p;
      property(scene.shell, '--scene-y', ((1 - p) * 44).toFixed(3) + 'px');
      property(scene.shell, '--scene-scale', (.975 + .025 * p).toFixed(5));
    }
    function mediaValue(p) {
      if (!media) return;
      media.value = p;
      property(media.shell, '--media-inset', ((1 - p) * 8).toFixed(3) + '%');
      property(media.shell, '--media-scale', (1.055 - .055 * p).toFixed(5));
    }
    function addScene(node, owner, cabinet) {
      var shell = wrap(node, 'scroll-scene' + (cabinet ? ' scroll-scene--cabinet' : ''), 'scroll-art-layer');
      var scene = {shell:shell, owner:owner, top:0, value:1, complete:false, held:0};
      scenes.push(scene); sceneValue(scene, 1);
    }

    /* 构建即写终态；只有全部准备完成后才打开 root class，失败也不会藏内容。 */
    var nameMask = hero && hero.querySelector('.hero-name > .mask');
    if (nameMask) {
      var nameLayer = document.createElement('span'); nameLayer.className = 'scroll-name-layer';
      nameMask.parentNode.insertBefore(nameLayer, nameMask); nameLayer.appendChild(nameMask);
      wrappers.push({shell:nameLayer, original:nameMask});
    }
    property(hero, '--hero-name-y', '0px'); property(hero, '--hero-stage-y', '0px');
    document.querySelectorAll('.sec-h').forEach(function (node) {
      headings.push({node:node, top:0, value:1, revealed:false, hadRv:node.hasAttribute('data-rv'), rv:node.getAttribute('data-rv'), hadClass:node.classList.contains('scroll-heading')});
      node.removeAttribute('data-rv'); node.classList.add('scroll-heading', 'in');
      property(node, '--heading-reveal', '1');
    });
    document.querySelectorAll('.viewer').forEach(function (owner) {
      var surface = owner.querySelector('.v-surface');
      if (surface) addScene(surface, owner, false);
    });
    document.querySelectorAll('.work-cabinet').forEach(function (owner) { addScene(owner, owner, true); });
    var play = document.querySelector('.pr-play');
    if (play) { media = {shell:wrap(play, 'scroll-media-window'), original:play, top:0, value:1, complete:false}; mediaValue(1); }
    if (experience) {
      var track = document.createElement('span'); track.className = 'scroll-exp-track'; track.setAttribute('aria-hidden', 'true');
      var fill = document.createElement('span'); fill.className = 'scroll-exp-fill'; track.appendChild(fill);
      experience.insertBefore(track, experience.firstChild); created.push(track);
      property(experience, '--experience-track-top', '0px'); property(experience, '--experience-track-height', '0px');
      property(experience, '--experience-progress', '1');
    }
    property(contactContent, '--contact-y', '0px');
    if (bar) {
      var reading = document.createElement('span'); reading.className = 'scroll-reading-progress'; reading.setAttribute('aria-hidden', 'true');
      bar.appendChild(reading); created.push(reading); property(bar, '--reading-progress', '0');
    }

    /* 唯一的布局读取批次。offsetTop 用于本身仍有旧入场位移的经历行。 */
    function layoutTop(node) {
      var top = 0;
      for (var current = node; current; current = current.offsetParent) top += current.offsetTop;
      return top;
    }
    function measure(y) {
      var viewport = window.innerHeight || html.clientHeight || 800;
      var next = {
        viewport:viewport,
        height:Math.max(html.scrollHeight, document.body ? document.body.scrollHeight : 0),
        heroTop:hero ? hero.getBoundingClientRect().top + y : 0,
        contactTop:contact ? contact.getBoundingClientRect().top + y : 0,
        expTop:0, expEnd:0, rows:[], trackTop:0, trackHeight:0
      };
      headings.forEach(function (item) { item.top = item.node.getBoundingClientRect().top + y; });
      // viewer 本身仍可能在播旧的 16px 入场；offset 链不把祖先位移计入锚点。
      scenes.forEach(function (scene) { scene.top = layoutTop(scene.shell); });
      if (media) media.top = media.shell.getBoundingClientRect().top + y;
      if (experience) {
        var origin = layoutTop(experience);
        // 与现有经历圆点的中心对齐。容器和行都不随滚动 transform。
        experience.querySelectorAll(':scope > .exp').forEach(function (node) {
          next.rows.push({node:node, marker:layoutTop(node) + 40});
        });
        if (next.rows.length) {
          next.expTop = next.rows[0].marker;
          next.expEnd = next.rows[next.rows.length - 1].marker;
          next.trackTop = next.expTop - origin;
          next.trackHeight = Math.max(0, next.expEnd - next.expTop);
        }
      }
      bounds = next; dirty = false; measureCount++;
    }
    function busy(scene) {
      return scene.held > 0 || (scene.owner.dataset.state && scene.owner.dataset.state !== 'idle') ||
        scene.owner.classList.contains('is-grabbing') || scene.owner.classList.contains('is-held');
    }
    function staticValues() {
      property(hero, '--hero-name-y', '0px'); property(hero, '--hero-stage-y', '0px');
      headings.forEach(function (item) { item.value = 1; property(item.node, '--heading-reveal', '1'); });
      scenes.forEach(function (scene) { sceneValue(scene, 1); }); mediaValue(1);
      property(contactContent, '--contact-y', '0px'); property(experience, '--experience-progress', '1');
      property(bar, '--reading-progress', '0');
      if (experience) experience.querySelectorAll(':scope > .exp').forEach(function (row) { row.classList.add('is-reading'); });
      last.hero = 0; last.contact = 1; last.experience = 1; last.reading = 0;
    }
    function flush() {
      raf = 0;
      if (destroyed || document.hidden) return;
      var y = window.scrollY || window.pageYOffset || 0;
      if (dirty) measure(y);
      var viewport = bounds.viewport;
      // 计算只用上面测量的壳和缓存值，以下统一写样式，不再回读布局。
      var values = {
        hero:clamp((y - bounds.heroTop) / viewport),
        reading:clamp(y / Math.max(1, bounds.height - viewport)),
        contact:contactComplete ? 1 : progress(bounds.contactTop - y, viewport, .8, .35),
        experience:bounds.rows.length < 2 ? 1 : clamp((y + viewport * .55 - bounds.expTop) / (bounds.expEnd - bounds.expTop)),
        headings:headings.map(function (item) { return item.revealed ? 1 : progress(item.top - y, viewport, .95, .65); }),
        scenes:scenes.map(function (scene) {
          if (scene.complete) return 1;
          if (busy(scene)) return scene.value;
          var p = progress(scene.top - y, viewport, .94, .5);
          if (p >= 1) scene.complete = true;
          return p;
        }),
        media:media ? (media.complete ? 1 : progress(media.top - y, viewport, .94, .5)) : 1
      };
      property(experience, '--experience-track-top', (bounds.trackTop || 0).toFixed(2) + 'px');
      property(experience, '--experience-track-height', (bounds.trackHeight || 0).toFixed(2) + 'px');
      if (!enabled) { staticValues(); updateCount++; return; }
      property(hero, '--hero-name-y', (-48 * values.hero).toFixed(3) + 'px');
      property(hero, '--hero-stage-y', (80 * values.hero).toFixed(3) + 'px');
      headings.forEach(function (item, index) {
        item.value = values.headings[index]; property(item.node, '--heading-reveal', item.value.toFixed(5));
      });
      scenes.forEach(function (scene, index) { sceneValue(scene, values.scenes[index]); });
      if (media) { if (values.media >= 1) media.complete = true; mediaValue(values.media); }
      property(contactContent, '--contact-y', (38 * (1 - values.contact)).toFixed(3) + 'px');
      property(experience, '--experience-progress', values.experience.toFixed(5));
      bounds.rows.forEach(function (item) { item.node.classList.toggle('is-reading', item.marker <= y + viewport * .55); });
      property(bar, '--reading-progress', values.reading.toFixed(5));
      last = {scroll:y, reading:values.reading, hero:values.hero, contact:values.contact, experience:values.experience};
      updateCount++;
    }
    function schedule() {
      if (!destroyed && !document.hidden && !raf) raf = requestAnimationFrame(flush);
    }
    function refresh() { if (!destroyed) { dirty = true; schedule(); } }
    function motionMode() {
      if (destroyed) return;
      enabled = !flat && !reduced.matches && !compact.matches;
      html.classList.toggle('scroll-motion-on', enabled);
      if (!enabled) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0; staticValues();
      }
      refresh();
    }
    function matchingScene(target) {
      if (!target || !target.closest) return null;
      for (var i = 0; i < scenes.length; i++) {
        if (scenes[i].owner.contains(target)) return scenes[i];
      }
      return null;
    }
    function finishScene(scene) { if (scene) { scene.complete = true; sceneValue(scene, 1); } }
    function showTarget(target) {
      finishScene(matchingScene(target));
      if (media && media.shell.contains(target)) { media.complete = true; mediaValue(1); }
      if (contact && contact.contains(target)) { contactComplete = true; property(contactContent, '--contact-y', '0px'); }
      headings.forEach(function (item) {
        if (item.node.contains(target)) { item.revealed = true; item.value = 1; property(item.node, '--heading-reveal', '1'); }
      });
      // Tab 不能聚焦仍被旧揭示层隐藏的链接或按钮。
      for (var node = target; node && node !== document; node = node.parentElement) {
        if (node.hasAttribute && node.hasAttribute('data-rv')) node.classList.add('in');
      }
    }
    function releasePointer(event) {
      var scene = pointers.get(event.pointerId);
      if (!scene) return;
      scene.held = Math.max(0, scene.held - 1); pointers.delete(event.pointerId); schedule();
    }
    on(document, 'pointerdown', function (event) {
      // 在装置自己的 pointerdown 读取坐标之前归到终态，之后整次手势外层都保持不动。
      showTarget(event.target);
      var scene = matchingScene(event.target);
      if (scene && !pointers.has(event.pointerId)) { scene.held++; pointers.set(event.pointerId, scene); }
    }, {capture:true, passive:true});
    on(document, 'pointerup', releasePointer, true);
    on(document, 'pointercancel', releasePointer, true);
    on(document, 'lostpointercapture', releasePointer, true);
    on(document, 'focusin', function (event) { showTarget(event.target); schedule(); }, true);
    on(window, 'scroll', function () { if (enabled) schedule(); }, {passive:true});
    on(window, 'resize', refresh, {passive:true});
    on(window, 'pageshow', refresh);
    on(window, 'hashchange', refresh);
    on(document, 'toggle', refresh, true);
    on(document, 'load', function (event) { if (event.target.tagName === 'IMG') refresh(); }, true);
    on(document, 'visibilitychange', function () {
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0; pointers.clear(); scenes.forEach(function (scene) { scene.held = 0; });
      } else refresh();
    });
    on(window, 'blur', function () {
      pointers.clear(); scenes.forEach(function (scene) { scene.held = 0; }); schedule();
    });
    listenMedia(reduced, motionMode); listenMedia(compact, motionMode);
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(refresh);
      [document.body, hero, experience, contact].concat(scenes.map(function (scene) { return scene.shell; }), media ? [media.shell] : [])
        .forEach(function (node) { if (node) resizeObserver.observe(node); });
    }
    if (window.MutationObserver) {
      stateObserver = new MutationObserver(function () { if (enabled) schedule(); });
      scenes.forEach(function (scene) { stateObserver.observe(scene.owner, {attributes:true, attributeFilter:['data-state', 'class']}); });
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh, function () {});

    var controller = {
      refresh:refresh,
      destroy:function () {
        if (destroyed) return;
        destroyed = true; enabled = false;
        if (raf) cancelAnimationFrame(raf); raf = 0;
        listeners.forEach(function (remove) { remove(); });
        if (resizeObserver) resizeObserver.disconnect();
        if (stateObserver) stateObserver.disconnect();
        pointers.clear(); html.classList.remove('scroll-motion-on'); staticValues();
        headings.forEach(function (item) {
          if (item.hadRv) item.node.setAttribute('data-rv', item.rv || '');
          if (!item.hadClass) item.node.classList.remove('scroll-heading');
          item.node.classList.add('in');
        });
        wrappers.slice().reverse().forEach(function (entry) {
          if (entry.shell.parentNode) entry.shell.parentNode.replaceChild(entry.original, entry.shell);
        });
        created.forEach(function (node) { node.remove(); });
        if (active === controller) active = null;
      },
      get info() {
        return {
          enabled:enabled, flat:flat, reduced:reduced.matches, compact:compact.matches, destroyed:destroyed,
          pending:!!raf, updates:updateCount, measurements:measureCount,
          viewport:bounds.viewport, documentHeight:bounds.height, scroll:last.scroll,
          hero:last.hero, reading:last.reading, contact:last.contact, experience:last.experience,
          headings:headings.map(function (item) { return {id:item.node.id, top:item.top, progress:item.value}; }),
          scenes:scenes.map(function (scene) { var section = scene.owner.closest('.blk'); return {id:scene.owner.dataset.viewer || (section ? section.id : 'cabinet'), top:scene.top, progress:scene.value, complete:scene.complete, held:scene.held, busy:!!busy(scene)}; }),
          media:media ? {top:media.top, progress:media.value, complete:media.complete} : null
        };
      }
    };
    active = controller;
    motionMode();
    return controller;
  };
}());
