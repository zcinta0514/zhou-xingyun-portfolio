/* 内容规划：可横向抽阅的工作档案夹。只依赖现有内容，不改写事实。 */
(function () {
  'use strict';

  var serial = 0;
  var clamp = function (n, a, b) { return Math.max(a, Math.min(b, n)); };
  var mix = function (a, b, t) { return a + (b - a) * t; };

  window.createWorkCabinet = function (block, options) {
    var el = options.el;
    var asset = options.asset;
    var steps = block.steps || [];
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    var root = el('div', 'blk-body work-cabinet');
    var stage = el('div', 'wc-stage');
    var files = [];
    var active = 0;
    var width = 0;
    var spine = 42;
    var paperWidth = 0;
    var drag = null;
    var suppressClick = false;
    var ignoreTimer = 0;
    var instance = 'work-files-' + (++serial);

    root.setAttribute('data-rv', '');
    root.setAttribute('role', 'region');
    root.setAttribute('aria-label', block.name + '，工作档案');
    root.classList.toggle('wc-instant', !!options.instant);
    stage.setAttribute('aria-label', '工作档案夹，可拖动纸页或选择文字夹签');

    var heading = el('div', 'wc-heading');
    heading.appendChild(el('span', 'wc-heading-title', '工作档案'));
    heading.appendChild(el('span', 'wc-heading-note', '从选题到成片'));
    root.appendChild(heading);
    root.appendChild(stage);
    var hint = el('p', 'wc-hint', '左右拖动纸页，或点击夹签抽出');
    hint.id = instance + '-hint';
    root.appendChild(hint);
    var status = el('p', 'wc-sr');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    root.appendChild(status);

    steps.forEach(function (step, index) {
      var file = el('article', 'wc-file');
      file.style.setProperty('--file-tone', String(index));
      file.style.zIndex = String(index + 1);
      var tab = el('button', 'wc-tab');
      tab.type = 'button';
      tab.dataset.file = String(index);
      tab.id = instance + '-tab-' + index;
      tab.setAttribute('aria-controls', instance + '-body-' + index);
      tab.setAttribute('aria-describedby', hint.id);
      tab.appendChild(el('span', 'wc-tab-dot'));
      tab.appendChild(el('span', 'wc-tab-name', step.name));
      file.appendChild(tab);

      var body = el('div', 'wc-body');
      body.id = instance + '-body-' + index;
      body.setAttribute('role', 'region');
      body.setAttribute('aria-labelledby', tab.id);
      body.appendChild(el('span', 'wc-paper-mark', '内容规划 / 工作记录'));
      body.appendChild(el('h4', 'wc-title', step.name));
      body.appendChild(el('p', 'wc-text', step.text));
      if (index === steps.length - 1 && block.shot) {
        var figure = el('figure', 'wc-evidence');
        var image = el('img');
        image.src = asset(block.shot.src);
        image.alt = block.shot.alt || '';
        image.loading = 'lazy';
        image.decoding = 'async';
        image.addEventListener('load', function () { layout(true); });
        figure.appendChild(image);
        figure.appendChild(el('figcaption', 'wc-caption', block.shot.caption));
        body.appendChild(figure);
        if (block.shotUrl) {
          var link = el('a', 'link wc-source', block.shotLabel);
          link.href = block.shotUrl;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          body.appendChild(link);
        }
      }
      file.appendChild(body);
      stage.appendChild(file);
      files.push({ file: file, tab: tab, body: body });
      tab.addEventListener('click', function (event) {
        if (suppressClick) { event.preventDefault(); return; }
        select(index, false);
      });
    });

    // 每只夹子的左侧是真正露出的纸脊；展开时，相邻纸夹彼此滑入下方。
    function position(index, selected) {
      return index * spine + (paperWidth - spine) * clamp(index - selected, 0, 1);
    }

    function paint(from, to, progress, rubber) {
      files.forEach(function (entry, index) {
        var x = mix(position(index, from), position(index, to), progress) + (rubber || 0);
        var y = mix(Math.abs(index - from), Math.abs(index - to), progress) * 6;
        var opacity = mix(index === from ? 1 : 0, index === to ? 1 : 0, progress);
        entry.file.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0)';
        entry.body.style.opacity = String(opacity);
        entry.body.style.visibility = opacity > 0.001 ? 'visible' : 'hidden';
      });
    }

    function semantics() {
      files.forEach(function (entry, index) {
        var selected = index === active;
        entry.file.classList.toggle('is-open', selected);
        entry.tab.setAttribute('aria-expanded', String(selected));
        entry.body.inert = !selected;
        entry.body.setAttribute('aria-hidden', String(!selected));
        // inert 在当前浏览器直接生效；tabindex 同时防止旧浏览器访问折叠夹内链接。
        entry.body.querySelectorAll('a, button, input, select, textarea, [tabindex]').forEach(function (node) {
          if (!selected) {
            if (!node.hasAttribute('data-wc-tabindex')) {
              node.setAttribute('data-wc-tabindex', node.getAttribute('tabindex') || '');
            }
            node.setAttribute('tabindex', '-1');
          } else if (node.hasAttribute('data-wc-tabindex')) {
            var previous = node.getAttribute('data-wc-tabindex');
            if (previous) node.setAttribute('tabindex', previous);
            else node.removeAttribute('tabindex');
            node.removeAttribute('data-wc-tabindex');
          }
        });
      });
    }

    function select(index, focus) {
      if (!files.length) return;
      active = clamp(index, 0, files.length - 1);
      root.classList.remove('is-grabbing');
      semantics();
      paint(active, active, 0, 0);
      status.textContent = '已展开：' + steps[active].name;
      if (focus) files[active].tab.focus({ preventScroll: true });
    }

    function layout(force) {
      var nextWidth = stage.clientWidth;
      if (!nextWidth || (!force && Math.abs(nextWidth - width) < 0.5)) return;
      if (drag) finish(false);
      width = nextWidth;
      spine = width < 380 ? 36 : 42;
      paperWidth = Math.max(180, width - (files.length - 1) * spine);
      root.style.setProperty('--wc-spine', spine + 'px');
      files.forEach(function (entry) { entry.file.style.width = paperWidth + 'px'; });
      // 用最厚一份档案决定柜子的高度；切换时全页不会上下跳动。
      var height = 312;
      files.forEach(function (entry) { height = Math.max(height, entry.body.scrollHeight); });
      stage.style.height = (height + 16) + 'px';
      paint(active, active, 0, 0);
    }

    function finish(commit) {
      if (!drag) return;
      var previous = drag;
      drag = null;
      if (previous.moved) {
        suppressClick = true;
        window.clearTimeout(ignoreTimer);
        ignoreTimer = window.setTimeout(function () { suppressClick = false; }, 350);
      }
      if (stage.hasPointerCapture(previous.id)) stage.releasePointerCapture(previous.id);
      select(commit ? previous.target : previous.start, false);
    }

    stage.addEventListener('pointerdown', function (event) {
      if (drag || event.button !== 0 || event.isPrimary === false || event.target.closest('a')) return;
      // 完成拖动后的抑制只用于那一次合成点击，不影响下一次独立点击。
      suppressClick = false;
      window.clearTimeout(ignoreTimer);
      var tag = event.target.closest('.wc-tab');
      drag = {
        id: event.pointerId, start: active, target: active,
        hit: tag ? Number(tag.dataset.file) : active, isTab: !!tag,
        x: event.clientX, y: event.clientY,
        lastX: event.clientX, lastTime: event.timeStamp,
        velocity: 0, moved: false, progress: 0
      };
      stage.setPointerCapture(event.pointerId);
    });

    stage.addEventListener('pointermove', function (event) {
      if (!drag || event.pointerId !== drag.id) return;
      var dx = event.clientX - drag.x;
      var dy = event.clientY - drag.y;
      if (!drag.moved && Math.abs(dx) < 6) return;
      if (!drag.moved && Math.abs(dy) > Math.abs(dx) * 1.2) return;
      event.preventDefault();
      if (!drag.moved) {
        drag.moved = true;
        root.classList.add('is-grabbing');
        window.getSelection().removeAllRanges();
      }
      var elapsed = event.timeStamp - drag.lastTime;
      if (elapsed > 0) drag.velocity = (event.clientX - drag.lastX) / elapsed;
      drag.lastX = event.clientX;
      drag.lastTime = event.timeStamp;
      var direction;
      if (drag.hit !== drag.start) {
        drag.target = drag.hit;
        direction = drag.target > drag.start ? -1 : 1;
      } else {
        direction = dx < 0 ? -1 : 1;
        drag.target = clamp(drag.start - direction, 0, files.length - 1);
      }
      var distance = Math.max(140, paperWidth - spine);
      drag.progress = clamp(dx * direction / distance, 0, 1);
      if (drag.target === drag.start) {
        drag.progress = 0;
        paint(drag.start, drag.start, 0, clamp(dx * 0.08, -12, 12));
      } else {
        paint(drag.start, drag.target, drag.progress, 0);
      }
    });

    stage.addEventListener('pointerup', function (event) {
      if (!drag || event.pointerId !== drag.id) return;
      // 捕获指针会将原生 click 的目标改为柜体，短按夹签在此明确完成。
      if (!drag.moved) {
        var clicked = drag.isTab ? drag.hit : drag.start;
        finish(false);
        select(clicked, false);
        return;
      }
      var direction = drag.target > drag.start ? -1 : 1;
      var recent = event.timeStamp - drag.lastTime < 90;
      var flick = recent && drag.velocity * direction > 0.45 && drag.progress > 0.035;
      finish(drag.moved && (drag.progress >= 0.22 || flick));
    });
    stage.addEventListener('pointercancel', function () { finish(false); });
    stage.addEventListener('lostpointercapture', function () { finish(false); });
    stage.addEventListener('dragstart', function (event) { event.preventDefault(); });
    stage.addEventListener('click', function (event) {
      if (suppressClick) { event.preventDefault(); event.stopPropagation(); }
    }, true);
    window.addEventListener('blur', function () { finish(false); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) finish(false); });
    window.addEventListener('keydown', function (event) {
      // 鼠标抓住纸面时，焦点可能已回到 body；Esc 仍须取消本次拖动。
      if (event.key === 'Escape' && drag) { event.preventDefault(); finish(false); }
    });

    root.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        if (drag) { event.preventDefault(); finish(false); }
        return;
      }
      // 外链上的方向键不被装置接管；夹签保留原生 Enter / 空格点击。
      if (!event.target.closest('.wc-tab')) return;
      var target = Number(event.target.closest('.wc-tab').dataset.file);
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') target++;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') target--;
      else if (event.key === 'Home') target = 0;
      else if (event.key === 'End') target = files.length - 1;
      else return;
      event.preventDefault();
      if (drag) finish(false);
      select(target, true);
    });

    function motionPreference() { root.classList.toggle('wc-reduced', reduced.matches); }
    motionPreference();
    if (reduced.addEventListener) reduced.addEventListener('change', motionPreference);
    if (window.ResizeObserver) new ResizeObserver(function () { layout(false); }).observe(stage);
    else window.addEventListener('resize', function () { layout(false); });
    select(0, false);
    window.requestAnimationFrame(function () { layout(true); });
    return root;
  };
}());
