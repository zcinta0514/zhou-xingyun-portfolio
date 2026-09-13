(function () {
    var root = document.getElementById('works-b-focus-v2');
    if (!root) return;

    var viewer = root.querySelector('.wb-viewer');
    var mainCard = root.querySelector('.wb-main-card');
    var mainLink = root.querySelector('#wb-main-link');
    var mainPanel = root.querySelector('#wb-main-panel');
    var mainImage = root.querySelector('#wb-main-image');
    var mainCode = root.querySelector('#wb-main-code');
    var mainPlatform = root.querySelector('#wb-main-platform');
    var mainKicker = root.querySelector('#wb-main-kicker');
    var mainTitle = root.querySelector('#wb-main-title');
    var mainMetrics = root.querySelector('#wb-main-metrics');
    var mainSource = root.querySelector('#wb-main-source');
    var mainHint = root.querySelector('#wb-main-hint');
    var dock = root.querySelector('.wb-thumb-dock');
    var thumbs = Array.prototype.slice.call(root.querySelectorAll('.wb-thumb'));
    var works = JSON.parse(root.querySelector('#wb-work-data').textContent);
    var motionQuery = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    var reduceMotion = motionQuery && motionQuery.matches;
    var activeIndex = 1;
    var targetIndex = 1;
    var animationSerial = 0;
    // The anchor and its border stay fixed. Only these internal elements move.
    var animationParts = [
      { element: mainImage, delay: 0 },
      { element: mainCode, delay: 40 },
      { element: mainPlatform, delay: 40 },
      { element: mainKicker, delay: 40 },
      { element: mainTitle, delay: 40 },
      { element: mainMetrics, delay: 80 },
      { element: mainSource, delay: 80 }
    ];

    function cancelCardAnimations() {
      animationParts.forEach(function (part) {
        if (!part.element.getAnimations) return;
        part.element.getAnimations().forEach(function (animation) { animation.cancel(); });
      });
    }

    function renderMetrics(metrics) {
      var nodes = metrics.map(function (metric) {
        var cell = document.createElement('span');
        var value = document.createElement('b');
        var label = document.createElement('span');
        cell.className = 'wb-metric' + (metric.wide ? ' is-wide' : '');
        value.textContent = metric.value;
        label.textContent = metric.label;
        cell.append(value, label);
        return cell;
      });
      mainMetrics.replaceChildren.apply(mainMetrics, nodes);
    }

    function renderWork(index) {
      var work = works[index];
      var hasUrl = false;
      try {
        var url = new URL(work.url);
        hasUrl = url.protocol === 'https:' || url.protocol === 'http:';
      } catch (error) { /* No external action for an absent or invalid URL. */ }
      if (hasUrl) {
        mainLink.href = work.url;
        mainLink.setAttribute('target', '_blank');
        mainLink.setAttribute('rel', 'noopener noreferrer');
        mainLink.removeAttribute('aria-disabled');
        mainLink.tabIndex = 0;
      } else {
        mainLink.removeAttribute('href');
        mainLink.removeAttribute('target');
        mainLink.removeAttribute('rel');
        mainLink.setAttribute('aria-disabled', 'true');
        mainLink.tabIndex = -1;
      }
      mainHint.hidden = !hasUrl;
      mainLink.setAttribute('aria-label', (hasUrl ? '打开 TikTok 原视频：' : '作品：') + work.title);
      mainImage.src = work.src;
      mainImage.alt = work.alt;
      mainCode.textContent = work.id;
      mainPlatform.textContent = work.platform;
      mainKicker.textContent = work.kicker;
      mainTitle.textContent = work.title;
      mainSource.textContent = work.source;
      renderMetrics(work.metrics);
      viewer.dataset.activeIndex = String(index);
    }

    function syncThumbs(index) {
      thumbs.forEach(function (thumb, thumbIndex) {
        var selected = thumbIndex === index;
        thumb.setAttribute('aria-selected', selected ? 'true' : 'false');
        thumb.tabIndex = selected ? 0 : -1;
      });
      mainPanel.setAttribute('aria-labelledby', thumbs[index].id);
    }

    function selectWork(index, immediate) {
      if (!Number.isInteger(index) || index < 0 || index >= works.length) return;
      if (index === targetIndex && !immediate) return;
      var serial = ++animationSerial;
      var direction = index > activeIndex ? 1 : -1;
      targetIndex = index;
      syncThumbs(index);
      cancelCardAnimations();
      if (reduceMotion || immediate || index === activeIndex || !mainImage.animate) {
        renderWork(index);
        activeIndex = index;
        return;
      }
      var exits = animationParts.map(function (part) {
        return part.element.animate([
          { opacity: 1, transform: 'translateX(0)' },
          { opacity: 0, transform: 'translateX(' + (-16 * direction) + 'px)' }
        ], { duration: 110, easing: 'cubic-bezier(.4, 0, 1, 1)', fill: 'forwards' });
      });
      Promise.all(exits.map(function (animation) { return animation.finished; })).then(function () {
        if (serial !== animationSerial) return;
        renderWork(index);
        activeIndex = index;
        cancelCardAnimations();
        animationParts.forEach(function (part) {
          var entering = part.element.animate([
            { opacity: 0, transform: 'translateX(' + (18 * direction) + 'px)' },
            { opacity: 1, transform: 'translateX(0)' }
          ], { duration: 210, delay: part.delay, easing: 'cubic-bezier(.16, 1, .3, 1)', fill: 'backwards' });
          entering.finished.catch(function () {});
        });
      }).catch(function () {});
    }

    thumbs.forEach(function (thumb) {
      var index = Number(thumb.dataset.workIndex);
      thumb.addEventListener('pointerenter', function (event) {
        if (event.pointerType !== 'touch') selectWork(index, false);
      });
      thumb.addEventListener('focus', function () { selectWork(index, false); });
      // Tapping/activating a selector settles its link immediately.
      thumb.addEventListener('click', function () { selectWork(index, true); });
    });

    dock.addEventListener('keydown', function (event) {
      var currentIndex = thumbs.indexOf(document.activeElement);
      if (currentIndex < 0) return;
      var nextIndex = currentIndex;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % thumbs.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + thumbs.length) % thumbs.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = thumbs.length - 1;
      else return;
      event.preventDefault();
      thumbs[nextIndex].focus();
    });

    if (motionQuery && motionQuery.addEventListener) {
      motionQuery.addEventListener('change', function (event) {
        reduceMotion = event.matches;
        if (reduceMotion) selectWork(targetIndex, true);
      });
    }
    var narrowQuery = window.matchMedia && window.matchMedia('(max-width: 920px)');
    function syncOrientation() {
      dock.setAttribute('aria-orientation', narrowQuery && narrowQuery.matches ? 'horizontal' : 'vertical');
    }
    if (narrowQuery && narrowQuery.addEventListener) narrowQuery.addEventListener('change', syncOrientation);
    syncOrientation();
    renderWork(activeIndex);
    syncThumbs(activeIndex);

  }());
