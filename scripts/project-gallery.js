const asText = value => typeof value === 'string' || typeof value === 'number' ? String(value) : '';

export function safeExternalUrl(value) {
  if (typeof value !== 'string' || /[\u0000-\u001f\u007f]/.test(value)) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

export function createGalleryState(data) {
  const seen = new Set();
  const items = (Array.isArray(data) ? data : []).filter(item => {
    if (!item || typeof item.id !== 'string' || !item.id.trim() || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  }).map(item => ({
    ...item,
    images: (Array.isArray(item.images) ? item.images : []).filter(image => image && typeof image.src === 'string' && image.src.trim()),
    metrics: (Array.isArray(item.metrics) ? item.metrics : []).filter(metric => metric && typeof metric === 'object'),
  }));
  return { items, selectedIndex: items.length ? 0 : -1, imageIndex: 0 };
}

export function selectGalleryItem(state, target) {
  const selectedIndex = typeof target === 'string' ? state.items.findIndex(item => item.id === target) : target;
  if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= state.items.length || selectedIndex === state.selectedIndex) return state;
  return { ...state, selectedIndex, imageIndex: 0 };
}

export function stepGalleryImage(state, direction) {
  const count = state.items[state.selectedIndex]?.images.length || 0;
  if (count < 2 || !Number.isInteger(direction)) return state;
  return { ...state, imageIndex: ((state.imageIndex + direction) % count + count) % count };
}

const mountedGalleries = new WeakMap();

function createImageRenderer(image) {
  const status = image.ownerDocument.createElement('span');
  status.className = 'project-gallery__image-status';
  status.setAttribute('role', 'status');
  status.hidden = true;
  image.parentElement.append(status);
  let currentTitle = '';
  let currentSource;
  const fail = () => {
    image.style.visibility = 'hidden';
    image.alt = `${currentTitle}（原图无法加载）`;
    status.textContent = `${currentTitle}：原图无法加载，请稍后重试。`;
    status.hidden = false;
  };
  image.addEventListener('error', fail);
  image.addEventListener('load', () => {
    if (!image.naturalWidth) return;
    status.hidden = true;
    image.style.visibility = '';
  });
  return (frame, title) => {
    currentTitle = asText(title);
    const source = frame?.src || null;
    image.alt = asText(frame?.alt) || currentTitle;
    if (currentSource === source && source) {
      if (!status.hidden) fail();
      return;
    }
    currentSource = source;
    status.hidden = true;
    image.style.visibility = '';
    if (!source) {
      image.removeAttribute('src');
      image.style.visibility = 'hidden';
      status.textContent = `${currentTitle}：暂未提供原图。`;
      status.hidden = false;
      return;
    }
    image.src = source;
    // A cached failed image may have completed before listeners were installed.
    if (image.complete && image.naturalWidth === 0) fail();
  };
}

function mountGallery(element, initialState) {
  const document = element.ownerDocument;
  const find = name => element.querySelector(`[data-gallery-${name}]`);
  const image = find('image');
  if (!image?.parentElement) return null;
  let state = initialState;
  let viewer = null;
  let opener = null;
  const imageRenderer = createImageRenderer(image);
  const selectors = [...element.querySelectorAll('[data-select-work]')];
  const steps = [...element.querySelectorAll('[data-image-step]')];
  const openers = [...element.querySelectorAll('[data-open-image]')];
  const textSlots = new Map(['title', 'category', 'description', 'role', 'credit', 'source'].map(name => [name, find(name)]));

  const setStepState = (buttons, count) => buttons.forEach(button => {
    button.hidden = count < 2;
    button.disabled = count < 2;
  });

  function render() {
    const item = state.items[state.selectedIndex];
    const frame = item.images[state.imageIndex];
    const count = item.images.length;
    const countText = `${count ? state.imageIndex + 1 : 0} / ${count}`;
    imageRenderer(frame, item.title);
    for (const [name, slot] of textSlots) if (slot) slot.textContent = asText(item[name]);
    const metrics = find('metrics');
    if (metrics) {
      metrics.replaceChildren(...item.metrics.map(metric => {
        const entry = document.createElement('div');
        const value = document.createElement('b');
        const label = document.createElement('span');
        value.textContent = asText(metric.value);
        label.textContent = asText(metric.label);
        entry.append(value, label);
        return entry;
      }));
    }
    const link = find('link');
    if (link) {
      const url = safeExternalUrl(item.url);
      link.hidden = !url;
      if (url) {
        link.href = url;
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
        link.removeAttribute('aria-disabled');
      } else {
        link.removeAttribute('href');
        link.setAttribute('aria-disabled', 'true');
      }
    }
    const counter = find('count');
    if (counter) counter.textContent = countText;
    selectors.forEach(button => button.setAttribute('aria-pressed', String(button.getAttribute('data-select-work') === item.id)));
    setStepState(steps, count);
    openers.forEach(button => {
      button.disabled = !frame;
      button.setAttribute('aria-label', `查看${asText(item.title)}原图`);
      button.setAttribute('aria-haspopup', 'dialog');
    });
    if (viewer) {
      viewer.title.textContent = asText(item.title);
      viewer.counter.textContent = countText;
      viewer.dialog.setAttribute('aria-label', `${asText(item.title)} · 原图浏览`);
      viewer.renderImage(frame, item.title);
      setStepState(viewer.steps, count);
    }
  }

  function select(target) {
    const next = selectGalleryItem(state, target);
    if (next === state) return;
    state = next;
    render();
  }

  function step(direction) {
    const next = stepGalleryImage(state, direction);
    if (next === state) return;
    state = next;
    render();
  }

  function createViewer() {
    const dialog = document.createElement('dialog');
    dialog.className = 'project-lightbox';
    const bar = document.createElement('div');
    bar.className = 'project-lightbox__bar';
    const title = document.createElement('span');
    const counter = document.createElement('span');
    counter.setAttribute('aria-live', 'polite');
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'project-lightbox__close';
    close.textContent = '关闭';
    close.setAttribute('aria-label', '关闭原图浏览');
    const viewerSteps = [-1, 1].map(direction => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'project-lightbox__step';
      button.textContent = direction < 0 ? '上一张' : '下一张';
      button.addEventListener('click', () => step(direction));
      return button;
    });
    const fullImage = document.createElement('img');
    fullImage.className = 'project-lightbox__image';
    fullImage.decoding = 'async';
    bar.append(title, counter, ...viewerSteps, close);
    dialog.append(bar, fullImage);
    document.body.append(dialog);
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        step(event.key === 'ArrowLeft' ? -1 : 1);
      }
    });
    // Native dialog handles Escape, focus containment, and background inertness.
    dialog.addEventListener('close', () => {
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    });
    return { dialog, title, counter, close, steps: viewerSteps, renderImage: createImageRenderer(fullImage) };
  }

  selectors.forEach(button => button.addEventListener('click', () => select(button.getAttribute('data-select-work'))));
  steps.forEach(button => button.addEventListener('click', () => step(Number(button.getAttribute('data-image-step')))));
  openers.forEach(button => button.addEventListener('click', event => {
    event.preventDefault();
    if (!state.items[state.selectedIndex].images.length) return;
    opener = button;
    if (!viewer) viewer = createViewer();
    render();
    if (!viewer.dialog.open) viewer.dialog.showModal();
    viewer.close.focus({ preventScroll: true });
  }));
  render();
  return { element, select, step };
}

export function initProjectGalleries(root = document) {
  const elements = root.matches?.('[data-project-gallery]') ? [root] : [...root.querySelectorAll('[data-project-gallery]')];
  const controllers = [];
  for (const element of elements) {
    if (mountedGalleries.has(element)) {
      controllers.push(mountedGalleries.get(element));
      continue;
    }
    try {
      const data = element.querySelector('script[type="application/json"][data-gallery-data]');
      const state = createGalleryState(JSON.parse(data?.textContent || 'null'));
      if (!state.items.length) continue;
      const controller = mountGallery(element, state);
      if (controller) {
        mountedGalleries.set(element, controller);
        controllers.push(controller);
      }
    } catch {
      // Preserve the rendered fallback and let independent galleries initialize.
      element.setAttribute('data-gallery-state', 'unavailable');
    }
  }
  return controllers;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initProjectGalleries(), { once: true });
  else initProjectGalleries();
}
