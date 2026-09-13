(function () {
    var root = document.getElementById('portfolio');
    var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    var reduceMotion = motionQuery.matches;
    motionQuery.addEventListener('change', function(event){ reduceMotion = event.matches; });
    var rail = root.querySelector('.wb-rail');
    var marks = Array.prototype.slice.call(root.querySelectorAll('.wb-mark'));
    var states = marks.map(function () { return { value: 0, velocity: 0, target: 0 }; });
    var pointerY = 0;
    var insideRail = false;
    var nearest = -1;
    var lastTime = performance.now();

    function cosineLens(distance, range) {
      if (distance >= range) return 0;
      return (1 + Math.cos(Math.PI * distance / range)) / 2;
    }

    function updateRailTargets() {
      if (!insideRail) {
        states.forEach(function (state) { state.target = 0; });
        nearest = -1;
      } else {
        var bestDistance = Infinity;
        marks.forEach(function (mark, index) {
          var rect = mark.getBoundingClientRect();
          var distance = Math.abs(pointerY - (rect.top + rect.height / 2));
          states[index].target = cosineLens(distance, 140);
          if (distance < bestDistance) { bestDistance = distance; nearest = index; }
        });
        if (bestDistance > 34) nearest = -1;
      }
      marks.forEach(function (mark, index) { mark.classList.toggle('is-nearest', index === nearest); });
    }

    function renderRail() {
      marks.forEach(function (mark, index) {
        var value = Math.max(0, Math.min(1.05, states[index].value));
        var base = mark.getAttribute('aria-current') === 'page' ? 37 : 22;
        var length = base + (128 - base) * value;
        mark.style.setProperty('--wb-line-length', length.toFixed(2) + 'px');
        mark.style.setProperty('--wb-line-height', (1.2 + 1.2 * value).toFixed(2) + 'px');
        mark.style.setProperty('--wb-line-opacity', Math.min(1, .5 + .48 * value).toFixed(3));
        mark.style.setProperty('--wb-glow', Math.min(1, value).toFixed(3));
      });
    }

    function tick(now) {
      var dt = Math.min(.032, Math.max(.008, (now - lastTime) / 1000));
      lastTime = now;
      states.forEach(function (state) {
        if (reduceMotion) { state.value = state.target; state.velocity = 0; return; }
        var acceleration = 218 * (state.target - state.value) - 25 * state.velocity;
        state.velocity += acceleration * dt;
        state.value += state.velocity * dt;
      });
      renderRail();
      window.requestAnimationFrame(tick);
    }

    rail.addEventListener('pointerenter', function () { insideRail = true; });
    rail.addEventListener('pointermove', function (event) {
      if (event.pointerType === 'touch') return;
      insideRail = true;
      pointerY = event.clientY;
      updateRailTargets();
    });
    rail.addEventListener('pointerleave', function () { insideRail = false; updateRailTargets(); });

    marks.forEach(function (mark, index) {
      mark.addEventListener('focus', function () {
        insideRail = false;
        states.forEach(function (state, stateIndex) { state.target = cosineLens(Math.abs(stateIndex - index) * 46, 138); });
        nearest = index;
        marks.forEach(function (item, itemIndex) { item.classList.toggle('is-nearest', itemIndex === index); });
      });
      mark.addEventListener('blur', function () { states.forEach(function (state) { state.target = 0; }); nearest = -1; marks.forEach(function (item) { item.classList.remove('is-nearest'); }); });
    });

    renderRail();
    window.requestAnimationFrame(tick);
  }());
